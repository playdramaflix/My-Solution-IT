import { Link, useNavigate } from 'react-router-dom';
import { 
  Trash2, 
  Plus, 
  Minus, 
  ArrowRight, 
  ShoppingBag,
  ArrowLeft,
  ChevronRight
} from 'lucide-react';
import { useCart } from './context/CartContext';
import { motion, AnimatePresence } from 'motion/react';

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, totalPrice, totalItems } = useCart();
  const navigate = useNavigate();

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-12 rounded-xl shadow-xl shadow-gray-200/50 max-w-sm w-full space-y-8"
        >
          <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
            <ShoppingBag className="w-10 h-10 text-gray-300" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Your cart is empty</h2>
            <p className="text-gray-400 text-sm font-medium tracking-tight">Looks like you haven't added anything to your cart yet.</p>
          </div>
          <Link 
            to="/" 
            className="flex items-center justify-center gap-2 w-full py-4 bg-red-600 hover:bg-black text-white rounded-xl font-black uppercase tracking-widest text-xs transition-all shadow-lg shadow-red-100/50"
          >
            Start Shopping <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-12">
      {/* Breadcrumbs */}
      <div className="bg-white border-b border-gray-100" data-aos="fade-down">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
            <Link to="/" className="hover:text-red-600 transition-all">Home</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-gray-900">Your Shopping Cart</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          
          {/* Cart Items List */}
          <div className="lg:col-span-8 space-y-4" data-aos="fade-right">
            <div className="flex items-center justify-between px-2 mb-2">
              <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Your Cart <span className="text-gray-300 ml-1">({totalItems})</span></h1>
              <button 
                onClick={() => navigate('/')}
                className="text-[10px] font-bold uppercase text-red-600 hover:underline flex items-center gap-1"
              >
                <ArrowLeft className="w-3 h-3" /> Add More
              </button>
            </div>

            <div className="grid gap-4">
              <AnimatePresence mode='popLayout'>
                {cart.map((item) => (
                  <motion.div 
                    key={item.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white p-4 md:p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex md:items-center gap-4 md:gap-8 group"
                  >
                    {/* Product Image */}
                    <Link to={`/product/${item.id}`} className="w-24 h-24 md:w-32 md:h-32 rounded-2xl overflow-hidden bg-gray-50 flex-shrink-0 border border-gray-100 group-hover:border-red-100 transition-colors">
                      <img src={item?.image || ''} alt={item?.title || 'Product'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </Link>

                    {/* Product Info */}
                    <div className="flex-1 flex flex-col md:flex-row md:items-center gap-4 md:gap-8 min-w-0">
                      <div className="flex-1 space-y-1">
                        <Link to={`/product/${item.id}`} className="text-sm md:text-base font-black text-gray-900 line-clamp-1 hover:text-red-600 transition-colors uppercase tracking-tight">
                          {item.title}
                        </Link>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{item.category}</p>
                        <div className="flex items-center gap-4 pt-1">
                          <span className="text-lg font-black text-[#00c100] tracking-tighter">{item.price}</span>
                          <span className="text-[10px] line-through text-gray-300 font-bold">৳ {(parseFloat(item.price.split('–')[0].replace(/[^0-9.]/g, '')) + 500).toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-3">
                        <div className="flex items-center bg-gray-50 rounded-2xl border border-gray-100 p-1">
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="p-2 hover:bg-white rounded-lg text-gray-400 hover:text-red-600 transition-all shadow-sm"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-8 text-center font-black text-sm text-gray-900">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="p-2 hover:bg-white rounded-lg text-gray-400 hover:text-red-600 transition-all shadow-sm"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        
                        <button 
                          onClick={() => removeFromCart(item.id)}
                          className="p-3 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Cart Totals / Checkout Summary */}
          <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-6" data-aos="fade-left">
            <div className="bg-white p-6 md:p-8 rounded-xl border border-gray-100 shadow-sm space-y-6">
              <h2 className="text-xl font-black text-gray-900 uppercase tracking-tighter">Summary</h2>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Subtotal</span>
                  <span className="font-black text-gray-900">৳ {totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Shipping</span>
                  <span className="text-[#00c100] font-black uppercase text-[10px]">Free</span>
                </div>
                <div className="h-px bg-gray-50" />
                <div className="flex justify-between items-center pt-2">
                  <span className="text-lg font-black text-gray-900 uppercase tracking-tighter">Total</span>
                  <div className="text-right">
                    <p className="text-3xl font-black text-red-600 tracking-tighter">৳ {totalPrice.toFixed(2)}</p>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Inclusive of all taxes</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 space-y-3">
                <button 
                  onClick={() => navigate('/checkout/multi')} // Adjust checkout to handle full cart later if needed, but for now redirecting to first item or a generic checkout
                  className="w-full py-5 bg-red-600 hover:bg-black text-white rounded-xl font-black uppercase tracking-[0.2em] text-xs transition-all shadow-xl shadow-red-100 flex items-center justify-center gap-3 active:scale-95"
                >
                  Checkout Now <ArrowRight className="w-4 h-4" />
                </button>
                <div className="flex items-center justify-center gap-2 text-[8px] font-black text-gray-300 uppercase tracking-widest">
                   Safe & Secure Payment Only
                </div>
              </div>
            </div>

            {/* Promo Code Mock */}
            <div className="bg-gray-900 p-6 rounded-[2rem] text-white space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest">Have a promo code?</h3>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Code" 
                  className="bg-white/10 border border-white/10 rounded-xl px-4 py-2.5 text-xs w-full focus:outline-none focus:border-white/30"
                />
                <button className="bg-white text-gray-900 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase">Apply</button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
