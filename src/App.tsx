import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  Search, 
  ShoppingBag, 
  ChevronRight,
  ArrowRight,
  Star,
  CheckCircle2,
  Zap,
  User as UserIcon,
  Menu,
  X,
  Home,
  LayoutGrid,
  ShieldAlert,
  Facebook,
  Twitter,
  Instagram,
  Mail,
  Phone,
  MapPin
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './lib/firebase';
import { featuredProducts, bestSellers } from './data';
import ProductPage from './ProductPage';
import CheckoutPage from './CheckoutPage';
import AdminPanel from './AdminPanel';
import LoginPage from './LoginPage';
import CartPage from './CartPage';
import ServicesPage from './ServicesPage';
import Profile from './Profile';
import WhatsAppFloatingButton from './components/WhatsAppFloatingButton';
import { useCart } from './context/CartContext';
import { useProducts } from './context/ProductContext';
import { useSiteSettings } from './context/SiteContext';
import { motion, AnimatePresence } from 'motion/react';
import AOS from 'aos';
import 'aos/dist/aos.css';

function Header() {
  const { totalItems } = useCart();
  const { settings } = useSiteSettings();
  const [user, setUser] = useState<User | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        // Check if user is bootstrap admin or in admins collection
        const checkAdmin = async () => {
          if (u.email === 'imranhosine52@gmail.com') {
            setIsAdmin(true);
            return;
          }
          const { doc, getDoc } = await import('firebase/firestore');
          const { db } = await import('./lib/firebase');
          const docRef = doc(db, 'admins', u.email?.toLowerCase() || '');
          const docSnap = await getDoc(docRef);
          setIsAdmin(docSnap.exists());
        };
        checkAdmin();
      } else {
        setIsAdmin(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Close menu on navigation
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  const navLinks = [
    { label: 'Home', path: '/', icon: Home },
    ...(user ? [{ label: 'My Orders', path: '/profile', icon: ShoppingBag }] : []),
    { label: 'Products', path: '/', icon: LayoutGrid },
    { label: 'Services', path: '/services', icon: Zap },
    ...(isAdmin ? [{ label: 'Admin', path: '/admin', icon: ShieldAlert }] : []),
  ];

  return (
    <header className="bg-white sticky top-0 z-40 shadow-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 md:py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsMenuOpen(true)}
            className="p-1.5 hover:bg-gray-50 rounded-lg transition-colors md:hidden"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
          
          <Link to="/" className="flex items-center gap-2">
            {settings.logoUrl ? (
                <img src={settings.logoUrl} alt="Logo" className="w-8 h-8 object-contain" />
            ) : null}
            <div className="flex flex-col">
              <span className="text-lg md:text-2xl font-black italic tracking-tighter text-red-600 leading-none">
                {settings.siteName}
              </span>
              <span className="text-[7px] md:text-[9px] text-gray-500 font-bold uppercase tracking-widest leading-tight">{settings.siteSubtitle}</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center ml-8 gap-6">
            {navLinks.map((link) => (
              <Link 
                key={`${link.label}-${link.path}`} 
                to={link.path} 
                className={`text-[10px] font-black uppercase tracking-widest transition-colors ${location.pathname === link.path ? 'text-red-600 underline underline-offset-8' : 'text-gray-400 hover:text-black'}`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2 md:gap-5">
          <button className="hidden sm:block p-1.5 hover:bg-gray-50 rounded-full transition-colors">
            <Search className="w-5 h-5 text-gray-600" />
          </button>
          
          <Link to={user ? "/profile" : "/login"} className="flex items-center gap-2 group">
            {user ? (
               <div className="flex items-center gap-2 md:gap-3 bg-gray-50 p-1 md:pr-4 rounded-full border border-gray-100 group-hover:bg-red-50 transition-all">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="" className="w-6 h-6 md:w-8 md:h-8 rounded-full border border-white" />
                  ) : (
                    <div className="w-6 h-6 md:w-8 md:h-8 rounded-full border border-white bg-gray-200 flex items-center justify-center text-gray-400">
                      <UserIcon className="w-3 h-3 md:w-4 md:h-4" />
                    </div>
                  )}
                  <span className="hidden md:block text-[10px] font-black uppercase tracking-widest truncate max-w-[80px]">{user.displayName?.split(' ')[0]}</span>
               </div>
            ) : (
              <div className="flex items-center gap-2 bg-black text-white px-3 py-1.5 md:px-5 md:py-2.5 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-all shadow-lg shadow-gray-200">
                <UserIcon className="w-3 h-3 md:w-3.5 md:h-3.5" />
                <span>Login</span>
              </div>
            )}
          </Link>

          <Link to="/cart" className="relative group">
            <button className="p-2 md:p-2.5 bg-gray-50 hover:bg-red-50 rounded-full transition-all group-hover:scale-105">
              <ShoppingBag className="w-5 h-5 text-gray-600 group-hover:text-red-600 transition-colors" />
            </button>
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[8px] md:text-[10px] w-4 h-4 md:w-5 md:h-5 flex items-center justify-center rounded-full border-2 border-white font-black animate-in zoom-in duration-300">
                {totalItems}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 md:hidden"
            />
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-72 bg-white z-50 shadow-2xl md:hidden flex flex-col"
            >
              <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-xl font-black italic tracking-tighter text-red-600">MY SOLUTION</span>
                </div>
                <button onClick={() => setIsMenuOpen(false)} className="p-2 hover:bg-gray-50 rounded-xl">
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              <div className="p-6 space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-300 mb-4 px-2">Navigation</p>
                {navLinks.map((link) => (
                  <Link 
                    key={`mobile-${link.label}-${link.path}`}
                    to={link.path}
                    className={`flex items-center gap-4 p-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${location.pathname === link.path ? 'bg-red-600 text-white shadow-xl shadow-red-100' : 'text-gray-500 hover:bg-gray-50'}`}
                  >
                    <link.icon className="w-5 h-5" />
                    {link.label}
                  </Link>
                ))}
              </div>

              <div className="mt-auto p-6 border-t border-gray-50">
                {user ? (
                   <Link to="/profile" className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-all">
                      {user.photoURL ? (
                        <img src={user.photoURL} alt="" className="w-10 h-10 rounded-full border border-white shadow-sm" />
                      ) : (
                        <div className="w-10 h-10 rounded-full border border-white shadow-sm bg-gray-200 flex items-center justify-center text-gray-400">
                          <UserIcon className="w-5 h-5" />
                        </div>
                      )}
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest">{user.displayName}</p>
                        <p className="text-[8px] text-gray-400 font-bold uppercase truncate max-w-[120px]">{user.email}</p>
                      </div>
                   </Link>
                ) : (
                  <Link to="/login" className="flex items-center justify-center gap-2 w-full py-4 bg-black text-white rounded-2xl text-xs font-black uppercase tracking-widest">
                    <UserIcon className="w-4 h-4" /> Login Account
                  </Link>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}

function Footer() {
  const { settings } = useSiteSettings();
  return (
    <footer className="bg-[#0f172a] text-gray-300 pt-16 pb-8 border-t border-white/5 relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-red-600/10 blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand Column */}
          <div className="space-y-6">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex flex-col">
                <span className="text-2xl font-black italic tracking-tighter text-white">
                  {settings.siteName?.split(' ')[0]} <span className="text-red-500 font-black">{settings.siteName?.split(' ').slice(1).join(' ')}</span>
                </span>
                <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest leading-tight">Premium Digital Solutions</span>
              </div>
            </Link>
            <p className="text-sm leading-relaxed text-gray-400 max-w-sm">
              Your one-stop destination for premium website themes, custom design, and expert development services. We empower your business with cutting-edge digital products.
            </p>
            <div className="flex gap-4">
              {[Facebook, Twitter, Instagram].map((Icon, i) => (
                <button key={i} className="w-10 h-10 rounded-xl bg-white/5 hover:bg-red-600 hover:text-white flex items-center justify-center transition-all">
                  <Icon className="w-5 h-5" />
                </button>
              ))}
            </div>
          </div>

          {/* Services Column */}
          <div className="space-y-6">
            <h3 className="text-white font-black uppercase tracking-widest text-[10px]">What We Offer</h3>
            <ul className="space-y-4">
              {[
                'Premium Website Themes',
                'Custom Web Development',
                'Movie Site Customization',
                'PHP Scripts & Templates',
                'UI/UX Design Services'
              ].map((item) => (
                <li key={item}>
                  <Link to="/" className="text-sm hover:text-red-500 transition-colors flex items-center gap-2 group">
                    <ChevronRight className="w-3 h-3 text-red-500 group-hover:translate-x-1 transition-transform" />
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Column */}
          <div className="space-y-6">
            <h3 className="text-white font-black uppercase tracking-widest text-[10px]">Quick Links</h3>
            <ul className="space-y-4">
              {[
                { name: 'Browse All Products', path: '/' },
                { name: 'My Account', path: '/login' },
                { name: 'Admin Panel', path: '/admin' },
                { name: 'Privacy Policy', path: '/' },
                { name: 'Terms of Service', path: '/' }
              ].map((link) => (
                <li key={link.name}>
                  <Link to={link.path} className="text-sm hover:text-red-500 transition-colors flex items-center gap-2 group">
                    <ChevronRight className="w-3 h-3 text-red-500 group-hover:translate-x-1 transition-transform" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Column */}
          <div className="space-y-6">
            <h3 className="text-white font-black uppercase tracking-widest text-[10px]">Contact Info</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-red-500 shrink-0" />
                <span className="text-sm">Dhaka, Bangladesh - Digital Hub</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-red-500 shrink-0" />
                <span className="text-sm">imranhosine52@gmail.com</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-red-500 shrink-0" />
                <span className="text-sm">01330049110</span>
              </li>
            </ul>
            <div className="bg-white/5 p-4 rounded-2xl border border-white/5 mt-6">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Need Custom Work?</p>
              <Link to="/" className="text-xs font-black text-red-500 hover:underline">Get a Free Quote →</Link>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-500">
            © {new Date().getFullYear()} <span className="text-gray-400">{settings.siteName}</span>. Crafted for Digital Excellence.
          </p>
          <div className="flex gap-6 items-center">
             <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" alt="PayPal" className="h-4 opacity-50 hover:opacity-100 grayscale hover:grayscale-0 transition-all" />
             <img src="https://upload.wikimedia.org/wikipedia/commons/0/04/Visa.svg" alt="Visa" className="h-3 opacity-50 hover:opacity-100 grayscale hover:grayscale-0 transition-all" />
             <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-6 opacity-50 hover:opacity-100 grayscale hover:grayscale-0 transition-all" />
          </div>
        </div>
      </div>
    </footer>
  );
}

function HomePage() {
  const { products, loading } = useProducts();
  const { settings } = useSiteSettings();
  const [currentSlide, setCurrentSlide] = useState(0);

  // Split products for display (ensure both sections have content)
  const featuredCount = Math.ceil(products.length / 2);
  const featured = products.slice(0, featuredCount);
  const sellers = products.slice(featuredCount);

  // Slides are featured products or a fallback if none exist
  const heroSlides = featured.length > 0 ? featured.slice(0, 3) : [
    {
      id: 'default-1',
      title: settings.bannerTitle || 'Premium Tech Solutions',
      description: settings.bannerDesc || 'Unlock premium features and services for your business at unbeatable prices.',
      image: settings.bannerUrl || "https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=2070&auto=format&fit=crop",
      category: 'Official Store'
    }
  ];

  useEffect(() => {
    if (heroSlides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-10">
      {/* Hero Section - Animated Slider */}
      <section className="relative group" data-aos="zoom-in">
        <div className="rounded-xl overflow-hidden shadow-2xl shadow-blue-100 border border-gray-100 ring-4 ring-white relative h-[350px] md:h-[500px]">
          <AnimatePresence mode="wait">
            {heroSlides[currentSlide] && (
              <motion.div 
                key={currentSlide}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
                className="absolute inset-0"
              >
                <img 
                  src={heroSlides[currentSlide]?.image} 
                  alt={heroSlides[currentSlide]?.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent flex flex-col justify-center p-6 md:p-16">
                  <div className="space-y-3 md:space-y-4 max-w-xl">
                    <motion.span 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="inline-block bg-red-600 text-white text-[8px] md:text-[9px] font-black uppercase tracking-[0.3em] px-3 md:px-4 py-1 md:py-1.5 rounded-full"
                    >
                      {heroSlides[currentSlide]?.category || 'Featured'}
                    </motion.span>
                    
                    <motion.h1 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="text-3xl md:text-6xl font-black text-white uppercase tracking-tighter leading-tight text-shadow"
                    >
                      {heroSlides[currentSlide]?.title}
                    </motion.h1>
                    
                    <motion.p 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="text-gray-200 text-xs md:text-lg font-medium leading-relaxed max-w-md drop-shadow line-clamp-2"
                    >
                      {heroSlides[currentSlide]?.description}
                    </motion.p>
                    
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="pt-2 md:pt-4"
                    >
                      <Link 
                        to={heroSlides[currentSlide]?.id.toString().startsWith('default') ? "/products" : `/product/${heroSlides[currentSlide]?.id}`}
                        className="inline-flex items-center gap-2 bg-white hover:bg-red-600 hover:text-white text-black px-6 md:px-8 py-3 md:py-4 rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest transition-all shadow-xl"
                      >
                        Explore Now <ArrowRight className="w-4 h-4" />
                      </Link>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Slider Pagination Dots */}
          {heroSlides.length > 1 && (
            <div className="absolute bottom-6 right-6 md:bottom-8 md:right-8 flex gap-2">
              {heroSlides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className={`h-1.5 md:h-2 transition-all rounded-full ${currentSlide === idx ? 'w-6 md:w-8 bg-red-600' : 'w-1.5 md:w-2 bg-white/50 hover:bg-white'}`}
                />
              ))}
            </div>
          )}

          {/* Navigation Arrows */}
          {heroSlides.length > 1 && (
            <div className="hidden md:flex absolute inset-y-0 left-4 right-4 items-center justify-between pointer-events-none">
              <button 
                onClick={() => setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length)}
                className="p-3 rounded-2xl bg-black/20 backdrop-blur-md text-white hover:bg-white hover:text-black transition-all pointer-events-auto border border-white/10"
              >
                <ArrowRight className="w-5 h-5 rotate-180" />
              </button>
              <button 
                onClick={() => setCurrentSlide((prev) => (prev + 1) % heroSlides.length)}
                className="p-3 rounded-2xl bg-black/20 backdrop-blur-md text-white hover:bg-white hover:text-black transition-all pointer-events-auto border border-white/10"
              >
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Featured Products */}
      <section className="space-y-8">
        <div className="flex items-center justify-between border-b-4 border-gray-50 pb-4">
          <div className="flex flex-col">
            <h2 className="text-2xl font-black text-black uppercase tracking-tighter">Featured Products</h2>
            <div className="w-12 h-1 bg-red-600 mt-1"></div>
          </div>
          <button className="flex items-center gap-2 group px-6 py-2.5 bg-gray-50 hover:bg-black hover:text-white rounded-full text-[10px] font-black tracking-widest uppercase transition-all">
            Explore All <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-8">
          {featured.map((product, index) => (
            <motion.div 
              key={product.id}
              data-aos="fade-up"
              data-aos-delay={index * 100}
              className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-2xl hover:shadow-blue-100/50 transition-all group flex flex-col h-full"
            >
              <Link to={`/product/${product.id}`} className="block aspect-[16/10] overflow-hidden bg-gray-50 relative">
                 <img 
                   src={product.image} 
                   alt={product.title} 
                   className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                   referrerPolicy="no-referrer" 
                 />
                 <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-[9px] font-bold text-black uppercase tracking-widest shadow-sm">
                    Featured
                 </div>
              </Link>
              
              <div className="p-3 sm:p-6 flex flex-col items-center text-center flex-1 space-y-2 sm:space-y-4">
                <span className="text-[8px] sm:text-[10px] font-black text-[#1d63ed] uppercase tracking-[0.3em] bg-blue-50 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full">
                  {product.category}
                </span>
                
                <Link to={`/product/${product.id}`}>
                  <h3 className="text-xs sm:text-base font-bold text-gray-900 leading-tight group-hover:text-[#1d63ed] transition-colors line-clamp-1">
                    {product.title}
                  </h3>
                </Link>

                <div className="flex items-center gap-0.5 sm:gap-1">
                   {[...Array(5)].map((_, i) => (
                     <Star key={i} className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${i < (product.rating || 5) ? 'fill-[#febb00] text-[#febb00]' : 'text-gray-200'}`} />
                   ))}
                   <span className="text-[8px] sm:text-[10px] font-bold text-gray-400 ml-0.5 sm:ml-1">(12)</span>
                </div>
                
                <div className="pt-1 sm:pt-2 mt-auto w-full">
                   <p className="text-lg sm:text-2xl font-black text-black mb-2 sm:mb-4">{product.price}</p>
                   <Link 
                     to={`/product/${product.id}`}
                     className="w-full bg-[#0f172a] hover:bg-black text-white font-bold py-2.5 sm:py-3.5 rounded-lg sm:rounded-xl flex items-center justify-center gap-1 sm:gap-2 text-[8px] sm:text-[10px] transition-all tracking-widest uppercase shadow-xl group-active:scale-95"
                   >
                     Explore
                   </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Best Selling Product */}
      <section className="space-y-12 py-8">
        <div className="text-center space-y-2">
            <span className="text-red-600 text-[10px] font-black uppercase tracking-[0.4em]">Hot Picks</span>
            <h2 className="text-4xl font-black uppercase tracking-tighter">Best Selling Now</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
          {sellers.map((product, index) => (
            <motion.div 
              key={product.id}
              data-aos="fade-up"
              data-aos-delay={index * 100}
              className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all flex flex-col group h-full"
            >
              <Link to={`/product/${product.id}`} className="relative block aspect-square overflow-hidden bg-gray-50">
                {product.discount && (
                  <div className="absolute top-3 right-3 z-20 bg-red-600 text-white text-[10px] font-black w-10 h-10 flex items-center justify-center rounded-full shadow-lg">
                    {product.discount}
                  </div>
                )}
                <img 
                  src={product.image} 
                  alt={product.title} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                  referrerPolicy="no-referrer" 
                />
              </Link>
              
              <div className="p-3 sm:p-5 flex flex-col items-center flex-1 text-center space-y-2 sm:space-y-3">
                <Link to={`/product/${product.id}`} className="block">
                  <h3 className="text-[11px] sm:text-sm font-bold text-gray-900 group-hover:text-[#1d63ed] transition-colors line-clamp-2 min-h-[32px] sm:min-h-[40px] leading-tight">
                    {product.title}
                  </h3>
                </Link>
                
                <span className="inline-block bg-gray-50 text-gray-500 text-[8px] sm:text-[10px] font-bold px-2 sm:px-3 py-0.5 sm:py-1 rounded-lg">
                  {product.category || 'Digital Service'}
                </span>
                
                <div className="flex flex-col items-center pt-0.5 sm:pt-1">
                  <span className="text-gray-400 line-through text-[9px] sm:text-[11px] font-medium">৳ 2,000.00</span>
                  <span className="text-[#00c100] font-black text-sm sm:text-lg">
                    {product.price}
                  </span>
                </div>
                
                <Link 
                  to={`/product/${product.id}`}
                  className="w-full bg-[#1d63ed] hover:bg-[#154fc4] text-white font-bold py-2 sm:py-3 rounded-lg flex items-center justify-center gap-1 sm:gap-2 text-[9px] sm:text-xs transition-all mt-auto shadow-md shadow-blue-100 group-active:scale-95"
                >
                  <ShoppingBag className="w-3 h-3 sm:w-4 sm:h-4" /> Buy Now
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </main>
  );
}

export default function App() {
  const location = useLocation();
  useEffect(() => {
    AOS.init({
      duration: 1000,
      easing: 'ease-in-out',
      once: true,
      mirror: false
    });
  }, []);

  const isAdminPath = location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen bg-[#ece6ff] font-sans text-gray-800 relative overflow-x-hidden">
      {/* Decorative Background Elements (Intense Lavender Glow) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-20%] left-[-15%] w-[70%] h-[70%] rounded-full bg-purple-400/30 blur-[150px]" />
        <div className="absolute bottom-[-20%] right-[-15%] w-[70%] h-[70%] rounded-full bg-indigo-400/30 blur-[150px]" />
        <div className="absolute top-[25%] right-[-15%] w-[50%] h-[50%] rounded-full bg-violet-300/40 blur-[130px]" />
        <div className="absolute bottom-[25%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-300/30 blur-[110px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-br from-purple-100/20 via-transparent to-indigo-100/20 opacity-50" />
      </div>

      <div className="relative z-10">
        {!isAdminPath && <Header />}
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/product/:id" element={<ProductPage />} />
          <Route path="/checkout/:productId" element={<CheckoutPage />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/services" element={<ServicesPage />} />
        </Routes>
        {!isAdminPath && <Footer />}
        <WhatsAppFloatingButton />
      </div>
    </div>
  );
}

