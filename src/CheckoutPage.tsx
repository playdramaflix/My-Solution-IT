import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ChevronRight, 
  ShieldCheck, 
  ShoppingBag, 
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Smartphone,
  Mail,
  User,
  Info,
  Copy,
  Check
} from 'lucide-react';
import { useCart } from './context/CartContext';
import { useProducts } from './context/ProductContext';
import { motion, AnimatePresence } from 'motion/react';
import { collection, addDoc, serverTimestamp, getDoc, doc, setDoc } from 'firebase/firestore';
import { db, auth } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { handleFirestoreError, OperationType } from './lib/firestoreUtils';
import emailjs from '@emailjs/browser';

export default function CheckoutPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { cart, totalPrice, clearCart, setEmail: setVisitorEmail } = useCart();
  const { products } = useProducts();
  
  // Determine if checking out a single product or the whole cart
  const checkoutProducts = productId && productId !== 'multi' 
    ? products.filter(p => p.id === productId || p.id === Number(productId))
    : cart;

  // Calculate price for single item vs multi item
  const getDisplayPrice = () => {
    if (productId && productId !== 'multi') {
      const product = checkoutProducts[0];
      if (!product) return '৳ 0.00';
      
      // Check if this item is in cart to get accurate quantity
      const cartItem = cart.find(item => item.id === product.id);
      const qty = cartItem ? cartItem.quantity : 1;
      
      const priceStr = product.price.split('–')[0].replace(/,/g, '');
      const priceValue = parseFloat(priceStr.replace(/[^0-9.]/g, '')) || 0;
      return `৳ ${(priceValue * qty).toFixed(2)}`;
    }
    return `৳ ${totalPrice.toFixed(2)}`;
  };

  const displayPrice = getDisplayPrice();

  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'bkash' | 'nagad' | null>(null);
  const [senderNumber, setSenderNumber] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [copiedField, setCopiedField] = useState<'number' | 'amount' | null>(null);

  // Pre-fill user info if logged in
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        if (!name) setName(user.displayName || '');
        if (!email) {
          setEmail(user.email || '');
          setVisitorEmail(user.email || '');
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const handleCopy = (text: string, field: 'number' | 'amount') => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Cached settings
  const [cachedSettings, setCachedSettings] = useState<any>(null);

  React.useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settingsSnap = await getDoc(doc(db, 'settings', 'emailjs'));
        if (settingsSnap.exists()) {
          setCachedSettings(settingsSnap.data());
        }
      } catch (err) {
        console.warn("Could not pre-fetch email settings", err);
      }
    };
    fetchSettings();
  }, []);

  const paymentNumbers = {
    bkash: "01330049110 (Personal)",
    nagad: "01330049110 (Personal)"
  };

  if (checkoutProducts.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
        <div className="text-center bg-white p-12 rounded-xl shadow-xl border border-gray-100 max-w-sm w-full">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
             <ShoppingBag className="w-10 h-10 text-gray-200" />
          </div>
          <h2 className="text-2xl font-black mb-4 tracking-tighter">No Items to checkout</h2>
          <Link to="/" className="inline-flex items-center gap-2 bg-red-600 text-white px-8 py-3 rounded-2xl font-bold tracking-widest text-[10px] hover:bg-black transition-all">Back to Home</Link>
        </div>
      </div>
    );
  }

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentMethod) return;

    setIsProcessing(true);
    
    try {
      const orderId = Math.random().toString(36).substring(2, 11).toUpperCase();

      const orderData = {
        customerName: name,
        email,
        phone,
        items: checkoutProducts.map(p => ({
          productId: p.id,
          title: p.title,
          price: p.price,
          quantity: cart.find(item => item.id === p.id)?.quantity || 1
        })),
        totalPrice: parseFloat(displayPrice.replace(/[^0-9.]/g, '')),
        paymentMethod,
        senderNumber: senderNumber || null,
        transactionId: transactionId || null,
        status: 'pending',
        createdAt: serverTimestamp()
      };

      // Direct write with custom ID
      await setDoc(doc(db, 'orders', orderId), orderData);

      // Transition to success screen
      setIsProcessing(false);
      setIsSuccess(true);
      
      // Always clear cart on successful checkout
      clearCart();

      // Send Email Notification in background
      const sendEmail = () => {
        const serviceId = cachedSettings?.serviceId || 'service_4jmdpjk';
        const templateId = cachedSettings?.templateId || 'template_8q1laec';
        const publicKey = cachedSettings?.publicKey || 'cKTbuKI3xG3e6-tdF';

        const emailParams = {
          email: 'imranhosine52@gmail.com',
          order_id: orderId,
          name: name,
          customer_email: email,
          customer_phone: phone,
          price: displayPrice,
          'cost.total': displayPrice,
          payment_method: paymentMethod,
          transaction_id: transactionId,
          sender_number: senderNumber,
          order_items: checkoutProducts.map(p => `${p.title} (x${cart.find(item => item.id === p.id)?.quantity || 1})`).join(', '),
        };

        if (serviceId && templateId && publicKey) {
          emailjs.send(serviceId, templateId, emailParams, publicKey)
            .catch(err => console.error('BG Email failed:', err));
        }
      };

      sendEmail();
      
    } catch (error) {
      setIsProcessing(false);
      console.error("Checkout Error:", error);
      handleFirestoreError(error, OperationType.WRITE, 'orders');
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-8 md:p-12 rounded-2xl shadow-2xl shadow-gray-200/50 text-center max-w-md w-full space-y-6 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-400 to-emerald-500" />
          
          <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center text-green-600 mx-auto border-4 border-white shadow-lg">
            <CheckCircle2 className="w-12 h-12" />
          </div>
          <div className="space-y-3">
            <h1 className="text-3xl font-black text-gray-900 leading-tight tracking-tighter">Order Placed!</h1>
            <p className="text-gray-500 text-sm leading-relaxed px-4">
              আপনার অর্ডারটি সফলভাবে গৃহিত হয়েছে। আমরা এখন আপনার পেমেন্ট তথ্য যাচাই করছি।
              <br/><br/>
              অনুগ্রহ করে <span className="font-black text-red-600 underline decoration-red-200 underline-offset-4 tracking-widest">৫-১০ মিনিট</span> অপেক্ষা করুন। আপনার ইমেইল (<span className="font-bold text-gray-900">{email}</span>) চেক করুন।
            </p>
          </div>
          
          <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100 space-y-3">
            <h4 className="text-[10px] font-black text-blue-600 tracking-widest flex items-center justify-center gap-2">
              <Info className="w-3 h-3" /> কোনো সমস্যা হলে যোগাযোগ করুন
            </h4>
            <div className="flex flex-col gap-2">
              <a href="tel:01330049110" className="text-sm font-bold text-gray-700 hover:text-blue-600 transition-colors">Call: 01330049110</a>
              <a href="https://wa.me/8801330049110" target="_blank" rel="noreferrer" className="text-sm font-bold text-green-600 hover:underline">WhatsApp: 01330049110</a>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-left">
            <p className="text-[10px] font-bold text-gray-400 mb-2">Order Summary</p>
            <div className="flex justify-between items-center text-sm">
              <span className="font-medium text-gray-700">{checkoutProducts.length} Product(s)</span>
              <span className="font-bold text-[#00c100]">{displayPrice}</span>
            </div>
          </div>

          <button 
            onClick={() => navigate('/')}
            className="w-full bg-black hover:bg-gray-800 text-white font-black py-4 rounded-2xl transition-all shadow-lg tracking-widest text-sm"
          >
            Go To Home
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-12 overflow-x-hidden">
      {/* Header for Checkout */}
      <div className="bg-white border-b border-gray-100 mb-8" data-aos="fade-down">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-red-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <h1 className="text-lg md:text-xl font-black tracking-tighter">Secure Checkout</h1>
          <ShieldCheck className="w-6 h-6 text-[#00c100]" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <form onSubmit={handlePlaceOrder} className="grid lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Customer & Payment Details */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Step 1: Customer Info */}
            <div className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-100 space-y-6" data-aos="fade-right">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm" data-aos="zoom-in" data-aos-delay="200">1</div>
                <h2 className="text-lg font-black tracking-tight">Customer Information</h2>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold tracking-widest text-gray-400 ml-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      required
                      type="text" 
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:border-red-600 focus:outline-none transition-all text-sm font-medium"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold tracking-widest text-gray-400 ml-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      required
                      type="email" 
                      placeholder="example@gmail.com"
                      value={email}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEmail(val);
                        setVisitorEmail(val);
                      }}
                      className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:border-red-600 focus:outline-none transition-all text-sm font-medium"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold tracking-widest text-gray-400 ml-1">Phone Number</label>
                <div className="relative">
                  <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    required
                    type="tel" 
                    placeholder="01XXXXXXXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:border-red-600 focus:outline-none transition-all text-sm font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Step 2: Payment Method */}
            <div className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-100 space-y-6" data-aos="fade-right" data-aos-delay="200">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold text-sm" data-aos="zoom-in" data-aos-delay="400">2</div>
                <h2 className="text-lg font-black tracking-tight">Payment Method</h2>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { id: 'bkash', label: 'bKash', color: '#E2136E', logo: 'https://www.logo.wine/a/logo/BKash/BKash-bKash-Logo.wine.svg', subtitle: 'Personal' },
                  { id: 'nagad', label: 'Nagad', color: '#F7941D', logo: 'https://www.logo.wine/a/logo/Nagad/Nagad-Logo.wine.svg', subtitle: 'Personal' }
                ].map((method, index) => (
                  <button 
                    key={method.id}
                    type="button"
                    data-aos="zoom-in"
                    data-aos-delay={index * 100 + 500}
                    onClick={() => setPaymentMethod(method.id as any)}
                    className={`relative p-5 rounded-xl border-2 transition-all text-center ${paymentMethod === method.id ? `border-[${method.color}] bg-[#fafafa] shadow-md` : 'border-gray-50 hover:border-gray-200 bg-white'}`}
                    style={{ borderColor: paymentMethod === method.id ? method.color : '' }}
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div 
                        className="w-20 h-16 rounded-xl flex items-center justify-center bg-white p-1"
                      >
                        <img src={method.logo} alt={method.label} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                      </div>
                      <div>
                        <p className="text-xs font-black tracking-tight">{method.label}</p>
                        <p className="text-[10px] text-gray-400 font-medium">{method.subtitle}</p>
                      </div>
                    </div>
                    {paymentMethod === method.id && (
                      <div className="absolute top-2 right-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500 fill-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {/* Manual Payment Verification UI */}
              {(paymentMethod === 'bkash' || paymentMethod === 'nagad') && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-blue-50/50 rounded-2xl border border-blue-100 overflow-hidden"
                >
                  <div className="bg-blue-600 px-4 py-2 flex items-center gap-2 text-white">
                    <Info className="w-4 h-4" />
                    <span className="text-[10px] font-bold tracking-widest">Payment Instructions</span>
                  </div>
                  <div className="p-6 space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-gray-400">Send Money To</span>
                        <div className="flex items-center gap-2">
                          <p className="text-xl font-black text-blue-700 tracking-tight">
                            {paymentMethod === 'bkash' ? paymentNumbers.bkash : paymentNumbers.nagad}
                          </p>
                          <button 
                            type="button"
                            onClick={() => handleCopy(paymentMethod === 'bkash' ? paymentNumbers.bkash.split(' ')[0] : paymentNumbers.nagad.split(' ')[0], 'number')}
                            className="p-1.5 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                            title="Copy Number"
                          >
                            {copiedField === 'number' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                      <div className="space-y-1 md:text-right">
                        <span className="text-[10px] font-bold text-gray-400">Amount</span>
                        <div className="flex items-center md:justify-end gap-2">
                          <p className="text-xl font-black text-green-600 tracking-tight">{displayPrice}</p>
                          <button 
                            type="button"
                            onClick={() => handleCopy(displayPrice.replace(/[৳\s,]/g, ''), 'amount')}
                            className="p-1.5 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                            title="Copy Amount"
                          >
                            {copiedField === 'amount' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="h-px bg-blue-100" />

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold tracking-widest text-gray-400 ml-1">Sender {paymentMethod} Number</label>
                        <input 
                          required
                          type="text" 
                          placeholder="Your Number"
                          value={senderNumber}
                          onChange={(e) => setSenderNumber(e.target.value)}
                          className="w-full px-4 py-3 rounded-lg border border-blue-100 bg-white focus:border-blue-500 focus:outline-none transition-all text-sm font-medium"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold tracking-widest text-gray-400 ml-1">Transaction ID (TrxID)</label>
                        <input 
                          required
                          type="text" 
                          placeholder="TrxID (e.g. 5K9L8Z)"
                          value={transactionId}
                          onChange={(e) => setTransactionId(e.target.value)}
                          className="w-full px-4 py-3 rounded-lg border border-blue-100 bg-white focus:border-blue-500 focus:outline-none transition-all text-sm font-medium"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          {/* Right Column: Order Summary */}
          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24" data-aos="fade-left">
            <div className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-100 space-y-6">
              <h2 className="text-lg font-black tracking-tight mb-4">Order Summary</h2>
              
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 scrollbar-hide">
                {checkoutProducts.map((p, idx) => (
                  <div key={idx} className="flex items-start gap-4 pb-4 border-b border-gray-100 last:border-0" data-aos="fade-left" data-aos-delay={idx * 100}>
                    <div className="w-16 h-16 rounded-xl overflow-hidden border border-gray-100 bg-gray-50 flex-shrink-0">
                      <img 
                        src={p?.image || ''} 
                        alt={p?.title || 'Product'} 
                        className="w-full h-full object-cover" 
                        data-aos="zoom-in" 
                        data-aos-delay={idx * 100 + 200} 
                      />
                    </div>
                    <div className="flex-1 space-y-0.5">
                      <h3 className="text-[11px] font-bold leading-tight line-clamp-2">{p.title}</h3>
                      <p className="text-[9px] text-gray-400 font-bold tracking-widest">{p.category}</p>
                      <p className="text-red-600 font-black text-xs">{p.price}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3 pt-6 border-t border-gray-100">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 font-medium tracking-tight">Subtotal</span>
                  <span className="font-bold text-gray-900">{displayPrice}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 font-medium tracking-tight">Vat / Tax</span>
                  <span className="font-bold text-gray-900">৳ 0.00</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                  <span className="text-lg font-black tracking-tighter">Total Payable</span>
                  <span className="text-2xl font-black text-[#00c100] tracking-tighter">{displayPrice}</span>
                </div>
              </div>

              <button 
                type="submit"
                disabled={isProcessing || !paymentMethod}
                data-aos="zoom-in"
                data-aos-delay="400"
                className="w-full bg-red-600 hover:bg-black text-white font-black py-4 rounded-xl transition-all shadow-xl shadow-red-100 flex items-center justify-center gap-2 tracking-widest disabled:bg-gray-100 disabled:text-gray-400 disabled:shadow-none"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> Processing...
                  </>
                ) : (
                  <>
                    Complete Payment <ShoppingBag className="w-5 h-5" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-2 text-[8px] font-black text-gray-400 tracking-[0.2em] pt-2">
                <ShieldCheck className="w-3 h-3" /> Encrypted & Secure Payment
              </div>
            </div>

            {/* Support Info */}
            <div className="bg-gray-100/50 p-6 rounded-xl border border-dashed border-gray-200">
              <h4 className="text-[10px] font-black text-gray-400 tracking-widest mb-2">Need Help?</h4>
              <p className="text-xs text-gray-500 leading-relaxed">
                If you encounter any issues during payment or haven't received your product within 30 minutes, please contact our support team.
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
