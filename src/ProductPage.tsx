import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ShoppingBag, 
  ShoppingCart,
  ChevronRight, 
  ChevronLeft,
  Star, 
  Truck,
  ShieldCheck,
  RotateCcw,
  CheckCircle2,
  User,
  MessageSquare,
  Send,
  Reply,
  CornerDownRight
} from 'lucide-react';
import { useCart } from './context/CartContext';
import { useProducts } from './context/ProductContext';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth } from './lib/firebase';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  serverTimestamp 
} from 'firebase/firestore';
import { 
    signInWithPopup, 
    GoogleAuthProvider,
    onAuthStateChanged,
    User as FirebaseUser
} from 'firebase/auth';

export default function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { products } = useProducts();
  const product = products.find(p => p.id === id || p.id === Number(id));
  
  const [quantity, setQuantity] = useState(1);
  const [showToast, setShowToast] = useState(false);
  const [activeTab, setActiveTab] = useState<'description' | 'additional' | 'reviews'>('description');
  
  // Auth State
  const [user, setUser] = useState<FirebaseUser | null>(null);

  // Reviews State
  const [reviews, setReviews] = useState<any[]>([]);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Simulation of multiple images if only one exists
  const galleryImages = product?.images && product.images.length > 0
    ? product.images
    : (product ? [
        product.image || "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2070&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2070&auto=format&fit=crop", 
        "https://images.unsplash.com/photo-1527694232296-1336bcacb553?q=80&w=2070&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=1638&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=2070&auto=format&fit=crop"
      ] : []);

  // Auto-sliding effect
  useEffect(() => {
    if (galleryImages.length <= 1) return;
    const interval = setInterval(() => {
      setActiveImageIndex((prev) => (prev + 1) % galleryImages.length);
    }, 5000); // Change image every 5 seconds
    return () => clearInterval(interval);
  }, [galleryImages.length]);

  const nextImage = () => {
    setActiveImageIndex((prev) => (prev + 1) % galleryImages.length);
  };

  const prevImage = () => {
    setActiveImageIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currUser) => {
      setUser(currUser);
    });
    return () => unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error("Login Error:", err);
    }
  };

  useEffect(() => {
    if (!product?.id) return;

    const q = query(
      collection(db, 'reviews'),
      where('productId', '==', String(product.id)),
      orderBy('createdAt', 'asc') // Changed to asc for logical threading
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setReviews(data);
    });

    return () => unsubscribe();
  }, [product?.id]);

  const handleSubmitReview = async (e: React.FormEvent, parentId: string | null = null) => {
    e.preventDefault();
    if (!user) {
        handleGoogleLogin();
        return;
    }

    const comment = parentId ? (e.target as any).comment.value : newComment;
    const rating = parentId ? 0 : newRating;

    if (!product?.id || !comment.trim()) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'reviews'), {
        productId: String(product.id),
        parentId: parentId,
        rating: rating,
        comment: comment.trim(),
        customerName: user.displayName || 'Anonymous User',
        customerEmail: user.email,
        customerPhoto: user.photoURL,
        createdAt: serverTimestamp()
      });
      if (!parentId) {
        setNewComment('');
        setNewRating(5);
      } else {
        setReplyTo(null);
      }
    } catch (error) {
      console.error("Error submitting review:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const ReviewItem = ({ review, depth = 0 }: { review: any, depth?: number, key?: any }) => {
    const replies = reviews.filter(r => r.parentId === review.id);
    const isReplying = replyTo === review.id;
    const [showReplies, setShowReplies] = useState(false);

    return (
      <motion.div 
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative group/item ${depth > 0 ? 'ml-8 md:ml-10 mt-2' : 'py-5 border-b border-gray-50 last:border-0'}`}
      >
        {/* Threading Line */}
        {depth > 0 && (
          <div className="absolute -left-6 top-0 bottom-0 w-px bg-gray-100">
            <div className="absolute top-4 left-0 w-6 h-px bg-gray-100" />
          </div>
        )}
        
        <div className="flex gap-3 md:gap-4">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className={`rounded-full flex items-center justify-center overflow-hidden border border-white shadow-sm ${depth > 0 ? 'w-6 h-6' : 'w-9 h-9'}`}>
              {review.customerPhoto ? (
                  <img src={review.customerPhoto} alt="" className="w-full h-full object-cover" />
              ) : (
                  <div className={`w-full h-full flex items-center justify-center ${depth > 0 ? 'bg-gray-50 text-gray-400' : 'bg-red-50 text-red-600'}`}>
                      <User className={depth > 0 ? 'w-3 h-3' : 'w-4 h-4'} />
                  </div>
              )}
            </div>
          </div>

          <div className="flex-1 space-y-1">
            {/* Header */}
            <div className="flex items-center gap-2">
              <h5 className="text-[12px] font-bold text-gray-900 tracking-tight">{review.customerName}</h5>
              <span className="text-[9px] text-gray-400 font-medium tracking-tight">
                {review.createdAt?.toDate().toLocaleDateString() || 'Recently'}
              </span>
              {review.customerEmail?.includes('admin') && (
                <span className="text-[8px] bg-gray-600 text-white px-1 py-0.5 rounded-full font-black uppercase tracking-tighter">Staff</span>
              )}
            </div>
            
            {/* Rating if applicable */}
            {review.rating > 0 && (
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`w-2 h-2 ${i < review.rating ? 'fill-[#febb00] text-[#febb00]' : 'text-gray-200'}`} />
                ))}
              </div>
            )}

            {/* Comment Text */}
            <p className="text-[13px] text-gray-700 leading-snug font-normal pr-4">
              {review.comment}
            </p>

            {/* Action Bar */}
            <div className="flex items-center gap-4 pt-1">
              <button 
                onClick={() => setReplyTo(isReplying ? null : review.id)}
                className={`flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider transition-all hover:text-gray-900 ${isReplying ? 'text-red-600' : 'text-gray-400'}`}
              >
                Reply
              </button>
            </div>

            {/* View Replies Toggle (TikTok Style) */}
            {replies.length > 0 && !showReplies && (
              <button 
                onClick={() => setShowReplies(true)}
                className="flex items-center gap-2 mt-2 text-[10px] font-bold text-gray-400 hover:text-red-600 transition-colors"
              >
                <div className="w-6 h-px bg-gray-200" />
                View {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
              </button>
            )}

            {/* Admin Legacy Response */}
            {review.reply && (
              <div className="mt-2 bg-gray-50 p-2 rounded-xl border border-gray-100 flex gap-2 max-w-sm">
                <div className="w-5 h-5 rounded-lg bg-red-600 flex items-center justify-center text-white flex-shrink-0">
                  <User className="w-3 h-3" />
                </div>
                <p className="text-[11px] text-gray-600 font-medium italic">"{review.reply}"</p>
              </div>
            )}

            {/* Reply Form */}
            <AnimatePresence>
              {isReplying && (
                <motion.div 
                  initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                  className="mt-2 max-w-lg"
                >
                  {!user ? (
                     <div className="bg-gray-900 text-white px-3 py-2 rounded-xl flex items-center justify-between gap-3">
                        <p className="text-[9px] font-bold uppercase tracking-widest">Sign in to reply</p>
                        <button onClick={handleGoogleLogin} className="px-3 py-1 bg-white text-gray-900 rounded-lg text-[8px] font-black uppercase tracking-widest">Sign In</button>
                     </div>
                  ) : (
                    <form onSubmit={(e) => handleSubmitReview(e, review.id)} className="space-y-2">
                       <input 
                        name="comment"
                        autoFocus
                        required
                        placeholder={`Reply to @${review.customerName.replace(/\s+/g, '').toLowerCase()}...`}
                        className="w-full px-2 py-1.5 text-[12px] border-b border-gray-100 focus:border-red-600 outline-none transition-all placeholder:text-gray-200"
                      />
                      <div className="flex justify-end gap-1">
                        <button type="button" onClick={() => setReplyTo(null)} className="px-2 py-1 text-[8px] font-bold text-gray-400 uppercase tracking-widest">Cancel</button>
                        <button type="submit" disabled={isSubmitting} className="px-4 py-1 bg-red-600 text-white rounded-full text-[8px] font-black uppercase tracking-widest shadow-sm">Post</button>
                      </div>
                    </form>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Replies List */}
            {showReplies && replies.length > 0 && (
              <div className="space-y-1">
                {replies.map((reply) => (
                  <ReviewItem key={reply.id} review={reply} depth={depth + 1} />
                ))}
                <button 
                  onClick={() => setShowReplies(false)}
                  className="text-[9px] font-bold text-red-600 uppercase tracking-widest mt-2 ml-8"
                >
                  Hide replies
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Product Not Found</h2>
          <Link to="/" className="text-blue-600 hover:underline">Back to Home</Link>
        </div>
      </div>
    );
  }

  const handleAddToCart = () => {
    addToCart(product, quantity);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleBuyNow = () => {
    addToCart(product, quantity);
    navigate('/checkout/' + product.id);
  };

  return (
    <div className="bg-transparent min-h-screen pb-20">
      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[60] bg-gray-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 min-w-[300px] border border-white/10 backdrop-blur-md"
          >
            <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-black uppercase tracking-widest text-green-400">Success</p>
              <p className="text-sm font-bold truncate max-w-[200px]">Added to your cart!</p>
            </div>
            <Link to="/cart" className="text-[10px] font-black uppercase text-white bg-white/10 px-4 py-2 rounded-lg hover:bg-white/20 transition-all tracking-widest">
              View Cart
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="max-w-5xl mx-auto px-2 sm:px-6 lg:px-8 pt-4 md:pt-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="space-y-4 md:space-y-8"
        >
          
          {/* PRODUCT GALLERY SECTION */}
          <motion.div 
            whileHover={{ y: -5, shadow: "0 20px 40px rgba(0,0,0,0.08)" }}
            className="bg-white rounded-xl p-3 md:p-8 border border-gray-100 shadow-sm relative group overflow-hidden transition-shadow"
            data-aos="zoom-in"
          >
             {/* Main Image View */}
             <div className="aspect-square md:aspect-video relative bg-gray-50 flex items-center justify-center overflow-hidden">
                {/* Background Blur to fill the card without cropping */}
                <AnimatePresence mode="wait">
                  <motion.img 
                    key={`bg-${activeImageIndex}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.3 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    src={galleryImages[activeImageIndex]} 
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover blur-3xl scale-110"
                    referrerPolicy="no-referrer"
                  />
                </AnimatePresence>

                <AnimatePresence mode="wait">
                  <motion.img 
                    key={activeImageIndex}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.5 }}
                    src={galleryImages[activeImageIndex]} 
                    alt={product.title} 
                    className="relative z-10 max-w-full max-h-full object-contain drop-shadow-2xl"
                    referrerPolicy="no-referrer"
                  />
                </AnimatePresence>
             </div>
             
             {/* Subtle overlay */}
             <div className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-black/5 to-transparent pointer-events-none" />

             {/* Navigation Arrows */}
             <div className="absolute inset-x-1 md:inset-x-8 top-1/2 -translate-y-1/2 flex justify-between pointer-events-none z-10">
                <button 
                  onClick={prevImage} 
                  className="w-8 h-8 md:w-16 md:h-16 flex items-center justify-center text-[#00c100] hover:scale-110 active:scale-90 transition-all pointer-events-auto"
                  title="Previous"
                >
                   <ChevronLeft className="w-6 h-6 md:w-14 md:h-14 stroke-[3px]" />
                </button>
                <button 
                  onClick={nextImage} 
                  className="w-8 h-8 md:w-16 md:h-16 flex items-center justify-center text-[#00c100] hover:scale-110 active:scale-90 transition-all pointer-events-auto"
                  title="Next"
                >
                   <ChevronRight className="w-6 h-6 md:w-14 md:h-14 stroke-[3px]" />
                </button>
             </div>

             {/* Pagination Dots */}
             <div className="flex justify-center gap-1.5 mt-3 md:mt-8">
                {galleryImages.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImageIndex(i)}
                    className={`transition-all duration-300 rounded-full ${activeImageIndex === i ? 'w-2.5 h-2.5 bg-[#00c100]' : 'w-1.5 h-1.5 bg-gray-200 hover:bg-gray-300'}`}
                  />
                ))}
             </div>
          </motion.div>

          {/* PRODUCT INFO SECTION */}
          <motion.div 
            whileHover={{ y: -5, shadow: "0 20px 40px rgba(0,0,0,0.08)" }}
            className="bg-white p-5 md:p-10 rounded-xl shadow-sm border border-gray-100 space-y-5 md:space-y-8 transition-shadow"
            data-aos="fade-up"
            data-aos-delay="300"
          >
            <div className="space-y-3 md:space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] bg-red-50 text-red-600 px-2.5 py-1 rounded-full">
                  {product.category}
                </span>
                <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] bg-[#00c100]/10 text-[#00c100] px-2.5 py-1 rounded-full">
                  {product.stockStatus}
                </span>
              </div>
              
              <h1 className="text-xl md:text-5xl font-black text-gray-900 leading-tight tracking-tight">
                {product.title}
              </h1>
              
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-3 h-3 md:w-4 md:h-4 ${i < (product.rating || 5) ? 'fill-[#febb00] text-[#febb00]' : 'text-gray-200'}`} />
                  ))}
                </div>
                <span className="text-[9px] md:text-xs text-gray-400 font-bold uppercase tracking-widest">{reviews.length} Verified Reviews</span>
              </div>

              <div className="flex items-baseline gap-2 pt-1">
                 <p className="text-2xl md:text-5xl font-black text-[#00c100] tracking-tighter">{product.price}</p>
                 {product.discount && (
                    <span className="text-xs md:text-lg text-gray-300 line-through font-bold">৳ 2,500</span>
                 )}
              </div>
            </div>

            <div className="space-y-2">
               <h3 className="text-[9px] md:text-xs font-black uppercase tracking-widest text-gray-900">Description</h3>
               <p className="text-[11px] md:text-sm text-gray-500 leading-relaxed font-medium bg-gray-50/50 p-4 md:p-6 rounded-xl md:rounded-2xl border border-gray-50">
                {product.description || "Experience high performance and reliability with this premium product. Designed for efficiency and built to last."}
              </p>
            </div>

            {/* Purchase Actions */}
            <div className="space-y-4 pt-2">
              <div className="flex flex-col md:flex-row gap-3">
                {/* Quantity Selector */}
                <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl md:rounded-2xl px-3 h-12 md:h-16 w-full md:w-auto transition-all justify-between md:justify-start">
                  <motion.button 
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.85 }}
                    onClick={() => setQuantity(Math.max(1, quantity - 1))} 
                    className="w-8 h-8 flex items-center justify-center text-xl font-bold text-gray-400 hover:text-gray-900"
                  >
                    -
                  </motion.button>
                  <input 
                    type="number" 
                    value={quantity} 
                    readOnly
                    className="w-10 bg-transparent text-center font-black text-xs md:text-sm [appearance:textfield]" 
                  />
                  <motion.button 
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.85 }}
                    onClick={() => setQuantity(quantity + 1)} 
                    className="w-8 h-8 flex items-center justify-center text-xl font-bold text-gray-400 hover:text-gray-900"
                  >
                    +
                  </motion.button>
                </div>
                
                {/* Main Action Buttons Side-by-Side on Mobile */}
                <div className="flex gap-2 flex-1">
                  <motion.button 
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleAddToCart}
                    className="flex-1 bg-[#0f172a] hover:bg-black text-white font-black h-12 md:h-16 rounded-xl md:rounded-2xl transition-all flex items-center justify-center gap-1.5 text-[9px] md:text-sm uppercase tracking-wider shadow-lg"
                  >
                    <ShoppingBag className="w-3.5 h-3.5 md:w-5 md:h-5" /> Add
                  </motion.button>
                  
                  <motion.button 
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleBuyNow}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-black h-12 md:h-16 rounded-xl md:rounded-2xl transition-all text-[9px] md:text-sm uppercase tracking-wider shadow-lg shadow-red-100"
                  >
                    Buy Now
                  </motion.button>
                </div>
              </div>

              {/* WhatsApp Contact Button */}
              <motion.a 
                whileHover={{ scale: 1.02, backgroundColor: "#128C7E" }}
                whileTap={{ scale: 0.98 }}
                href="https://wa.me/8801330049110" // Updated number
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-[#25D366] text-white font-black h-12 md:h-16 rounded-xl md:rounded-2xl transition-all flex items-center justify-center gap-3 text-[10px] md:text-sm uppercase tracking-widest shadow-lg shadow-green-100"
              >
                <div className="relative">
                  <MessageSquare className="w-4 h-4 md:w-5 md:h-5" />
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full animate-ping" />
                </div>
                Chat on WhatsApp
              </motion.a>
            </div>
          </motion.div>
        </motion.div>

        {/* Details Tabs */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          whileHover={{ y: -5, shadow: "0 20px 40px rgba(0,0,0,0.08)" }}
          transition={{ duration: 0.5 }}
          className="mt-12 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-shadow"
        >
          <div className="flex border-b border-gray-100 bg-gray-50/50 overflow-x-auto scrollbar-hide">
            {[
              { id: 'description', label: 'Description' },
              { id: 'additional', label: 'Info' },
              { id: 'reviews', label: `Reviews (${reviews.length})` }
            ].map((tab) => (
              <button 
                key={tab.id} 
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-3 md:px-6 md:py-4 text-xs md:text-sm font-bold uppercase tracking-wider border-r border-gray-100 whitespace-nowrap transition-all ${activeTab === tab.id ? 'bg-white text-red-600 border-b-2 border-b-red-600' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6 md:p-8">
            <AnimatePresence mode="wait">
              {activeTab === 'description' && (
                <motion.div 
                  key="desc"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="prose prose-sm max-w-none text-gray-600"
                >
                  <h4 className="text-gray-900 font-bold mb-4">Product Overview</h4>
                  <p>Our {product.title} is designed with the user in mind, providing exceptional value and performance. Whether you're a professional designer or a business owner, this product will help you achieve your goals more efficiently.</p>
                  <ul className="grid md:grid-cols-2 gap-4 mt-6">
                    {[
                      "High-quality digital delivery",
                      "24/7 technical support included",
                      "Multi-device compatibility",
                      "Regular updates and security patches",
                      "User-friendly interface",
                      "Best-in-class performance"
                    ].map((feat, i) => (
                      <li key={i} className="flex items-center gap-3 list-none m-0 p-0">
                        <CheckCircle2 className="w-4 h-4 text-[#00c100] shrink-0" />
                        <span className="text-sm font-medium">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}

              {activeTab === 'additional' && (
                <motion.div 
                  key="info"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-2 max-w-md gap-4">
                    <div className="text-xs font-bold text-gray-400 uppercase">Weight</div>
                    <div className="text-xs font-medium text-gray-900">0.5 kg</div>
                    <div className="text-xs font-bold text-gray-400 uppercase">Dimensions</div>
                    <div className="text-xs font-medium text-gray-900">10 × 10 × 10 cm</div>
                    <div className="text-xs font-bold text-gray-400 uppercase">Materials</div>
                    <div className="text-xs font-medium text-gray-900">Premium Digital Grade</div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'reviews' && (
                <motion.div 
                  key="reviews"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-12"
                >
                  {/* Reviews List */}
                  <div className="space-y-6">
                    <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                       Customer Reviews <span className="text-gray-300 font-medium">({reviews.length})</span>
                    </h4>
                    
                    {reviews.length === 0 ? (
                        <div className="bg-gray-50 rounded-2xl p-12 text-center space-y-3 border border-dashed border-gray-200">
                           <MessageSquare className="w-10 h-10 text-gray-300 mx-auto" />
                           <p className="text-gray-400 font-medium">No reviews yet. Be the first to review this product!</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                           {reviews.filter(r => !r.parentId).map((review) => (
                             <ReviewItem key={review.id} review={review} />
                           ))}
                        </div>
                    )}
                  </div>

                  {/* Review Form */}
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="relative group"
                  >
                    {/* Glow Effect Background */}
                    <div className="absolute -inset-1 bg-gradient-to-r from-red-600/20 to-orange-600/20 rounded-xl blur-xl opacity-25 group-hover:opacity-40 transition-opacity duration-500" />
                    
                    <div className="relative bg-white/80 backdrop-blur-xl rounded-xl p-8 md:p-10 border border-white shadow-2xl shadow-gray-200/50 space-y-8 overflow-hidden">
                      {/* Decorative Element */}
                      <div className="absolute top-0 right-0 -trany-1/2 translate-x-1/2 w-64 h-64 bg-red-50 rounded-full blur-3xl opacity-30" />
                      
                      <div className="relative space-y-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-50 text-red-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-2">
                          <MessageSquare className="w-3 h-3" /> Share Your Thoughts
                        </div>
                        <h4 className="text-2xl font-black text-gray-900 tracking-tight">Add a Review</h4>
                        
                        {user && (
                            <motion.div 
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              className="flex items-center gap-3 bg-gray-50 border border-gray-100 p-2 pr-4 rounded-2xl inline-flex group/user transition-all hover:bg-white hover:shadow-md"
                            >
                                <div className="relative">
                                  <img src={user.photoURL || ''} className="w-10 h-10 rounded-xl shadow-sm" alt="" />
                                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#00c100] border-2 border-white rounded-full" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase text-gray-400 leading-none mb-1">Signed in as</p>
                                    <p className="text-sm font-bold text-gray-900 leading-none">{user.displayName}</p>
                                </div>
                            </motion.div>
                        )}
                      </div>

                      {!user ? (
                        <div className="bg-gray-50/50 backdrop-blur-sm p-12 rounded-xl border border-dashed border-gray-200 text-center space-y-8">
                            <motion.div 
                              animate={{ y: [0, -10, 0] }} 
                              transition={{ repeat: Infinity, duration: 3 }}
                              className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto shadow-xl shadow-gray-200/50"
                            >
                                <ShoppingCart className="w-10 h-10 text-red-600" />
                            </motion.div>
                            <div className="max-w-xs mx-auto space-y-3">
                                <h5 className="text-xl font-black text-gray-900 uppercase tracking-tight">Join the Conversation</h5>
                                <p className="text-xs text-gray-400 font-bold leading-relaxed uppercase tracking-widest">Please sign in with Google to share your experience with this product.</p>
                            </div>
                            <button 
                                onClick={handleGoogleLogin}
                                className="group relative inline-flex items-center gap-3 px-10 py-5 bg-black text-white rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-[10px] hover:bg-red-600 transition-all shadow-2xl hover:shadow-red-500/25 active:scale-95 overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5 bg-white p-1 rounded-lg" alt="" />
                                Sign in with Google
                            </button>
                        </div>
                      ) : (
                        <form onSubmit={(e) => handleSubmitReview(e)} className="relative space-y-8">
                            <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 ml-1">Rating *</label>
                                <div className="flex gap-2 p-2.5 bg-gray-50 rounded-xl border border-gray-100 inline-flex">
                                    {[...Array(5)].map((_, i) => (
                                        <button 
                                            key={i}
                                            type="button"
                                            onClick={() => setNewRating(i + 1)}
                                            className="group/star relative p-0.5 transition-all hover:scale-110"
                                        >
                                            <Star className={`w-5 h-5 transition-all duration-300 ${i < newRating ? 'fill-[#febb00] text-[#febb00] drop-shadow-[0_0_4px_rgba(254,187,0,0.3)]' : 'text-gray-300 group-hover/star:text-gray-400'}`} />
                                            {i + 1 === newRating && (
                                              <motion.div 
                                                layoutId="star-active"
                                                className="absolute inset-0 bg-yellow-400/5 rounded-full blur-sm"
                                              />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 ml-1">Your Perspective *</label>
                                <div className="relative group/textarea">
                                    <div className="absolute -inset-0.5 bg-gradient-to-r from-red-600 to-orange-600 rounded-3xl opacity-0 group-focus-within/textarea:opacity-10 blur-sm transition-opacity" />
                                    <textarea 
                                        required
                                        rows={5}
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        placeholder={`Share your experience with ${product.title}...`}
                                        className="relative w-full px-8 py-6 rounded-3xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:border-red-600 focus:outline-none transition-all text-sm font-bold text-gray-900 shadow-sm placeholder:text-gray-300"
                                    />
                                </div>
                            </div>

                            <button 
                                type="submit"
                                disabled={isSubmitting}
                                className="group relative flex items-center justify-center gap-4 px-12 py-6 bg-black text-white rounded-[2rem] font-black uppercase tracking-[0.3em] text-[11px] hover:bg-black transition-all shadow-2xl hover:shadow-black/20 hover:scale-[1.02] active:scale-95 disabled:opacity-50 overflow-hidden"
                            >
                                {isSubmitting ? (
                                    <div className="flex items-center gap-3">
                                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                                      <span>Publishing...</span>
                                    </div>
                                ) : (
                                    <>
                                      <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-red-500 translate-x-full group-hover:translate-x-0 transition-transform duration-500" />
                                      <span className="relative flex items-center gap-3 font-black">
                                        <Send className="w-4 h-4" /> Post Review
                                      </span>
                                    </>
                                )}
                            </button>
                        </form>
                      )}
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Related Products */}
        <section className="mt-16 space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-xl md:text-2xl font-black text-gray-900 uppercase tracking-tighter">Related Products</h2>
            <div className="h-px flex-1 bg-gray-100 mx-8 hidden md:block" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
             {products.slice(0, 4).map((p, index) => p && (
                <motion.div
                  key={p.id}
                  whileHover={{ y: -5, shadow: "0 10px 20px rgba(0,0,0,0.05)" }}
                  className="transition-shadow"
                  data-aos="fade-up"
                  data-aos-delay={index * 100}
                >
                  <Link to={`/product/${p.id}`} className="block bg-white rounded-xl border border-gray-100 p-2 md:p-3 shadow-sm hover:shadow-md transition-all group">
                    <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 mb-3">
                      <img src={p.image || ''} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" data-aos="zoom-in" data-aos-delay={index * 100 + 200} />
                    </div>
                    <h3 className="text-[10px] md:text-xs font-bold text-gray-900 line-clamp-1">{p.title}</h3>
                    <p className="text-[#00c100] font-black text-xs mt-1">{p.price}</p>
                  </Link>
                </motion.div>
              ))}
          </div>
        </section>
      </main>
    </div>
  );
}
