import React, { useState, useEffect } from 'react';
import { 
  auth 
} from './lib/firebase';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged,
  signOut,
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { 
  LogIn, 
  LogOut, 
  User as UserIcon, 
  ShieldCheck, 
  ShoppingBag,
  ArrowRight,
  Mail,
  Lock,
  UserPlus,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  
  // Manual Login Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
      navigate('/');
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
        console.log("Login popup was closed or cancelled.");
      } else {
        setError(error.message || "Google Login failed");
        console.error("Login failed", error);
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleManualAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    setError('');

    try {
      if (isSignUp) {
        if (!displayName) throw new Error("Please enter your name");
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      navigate('/');
    } catch (err: any) {
      console.error("Auth error", err);
      let msg = "Authentication failed. Please check your credentials.";
      if (err.code === 'auth/user-not-found') msg = "No user found with this email.";
      if (err.code === 'auth/wrong-password') msg = "Incorrect password.";
      if (err.code === 'auth/email-already-in-use') msg = "Email already registered.";
      if (err.code === 'auth/weak-password') msg = "Password should be at least 6 characters.";
      setError(err.message || msg);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => signOut(auth);

  if (loading) return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-600"></div>
    </div>
  );

  return (
    <div className="min-h-[90vh] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white p-8 md:p-12 rounded-xl shadow-2xl shadow-gray-100 text-center max-w-lg w-full space-y-8 border border-gray-50 relative overflow-hidden"
      >
        {/* Background Decor */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-red-50/50 rounded-full -mr-16 -mt-16 blur-2xl"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-50/50 rounded-full -ml-16 -mb-16 blur-2xl"></div>

        {!user ? (
          <>
            <div className="space-y-4 relative">
              <div className="w-20 h-20 bg-red-50 rounded-xl flex items-center justify-center mx-auto text-red-600 rotate-12 hover:rotate-0 transition-transform cursor-pointer mb-4">
                <UserIcon className="w-10 h-10" />
              </div>
              
              {/* Tab Selector */}
              <div className="flex p-1.5 bg-gray-50 rounded-xl border border-gray-100 mb-8 max-w-[280px] mx-auto">
                <button 
                  onClick={() => { setIsSignUp(false); setError(''); }}
                  className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all ${!isSignUp ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  Login
                </button>
                <button 
                  onClick={() => { setIsSignUp(true); setError(''); }}
                  className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all ${isSignUp ? 'bg-white text-red-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  Sign Up
                </button>
              </div>

              <div className="space-y-2">
                <h1 className="text-4xl font-black tracking-tighter text-gray-900 uppercase">
                  {isSignUp ? 'Join Us' : 'Welcome'}
                </h1>
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em]">
                  {isSignUp ? 'Create your premium account' : 'Authentication secured by Google'}
                </p>
              </div>
            </div>

            <form onSubmit={handleManualAuth} className="space-y-4 relative mt-8">
              {isSignUp && (
                <div className="relative group">
                  <UserIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-red-500 transition-colors" />
                  <input 
                    type="text" 
                    placeholder="Full Name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full pl-14 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500/50 transition-all"
                    required
                  />
                </div>
              )}
              
              <div className="relative group">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-red-500 transition-colors" />
                <input 
                  type="email" 
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-14 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500/50 transition-all"
                  required
                />
              </div>

              <div className="relative group">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-red-500 transition-colors" />
                <input 
                  type="password" 
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-14 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500/50 transition-all"
                  required
                />
              </div>

              <AnimatePresence>
                {error && (
                  <motion.p 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="text-red-500 text-[10px] font-black uppercase tracking-widest text-left pl-2"
                  >
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>

              <button 
                type="submit"
                disabled={isLoggingIn}
                className="w-full py-5 bg-red-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-red-700 hover:shadow-2xl hover:shadow-red-200 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {isLoggingIn ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    {isSignUp ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
                    {isSignUp ? 'Register Now' : 'Access Account'}
                  </>
                )}
              </button>
            </form>

            <div className="space-y-6 relative">
              <div className="relative">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
                <div className="relative flex justify-center text-[10px] uppercase font-black tracking-[0.3em] text-gray-300 bg-white px-6">Or continue with</div>
              </div>

              <button 
                onClick={handleGoogleLogin}
                disabled={isLoggingIn}
                className="flex items-center justify-center gap-4 w-full py-5 bg-white border-2 border-gray-50 text-gray-900 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-gray-50 hover:border-gray-100 transition-all shadow-sm group disabled:opacity-50"
              >
                <img src="https://www.google.com/favicon.ico" alt="" className="w-4 h-4" />
                Google Provider
              </button>

              <button 
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-red-600 transition-colors"
              >
                {isSignUp ? 'Already have an account? Login' : "Don't have an account? Sign Up"}
              </button>
            </div>
          </>
        ) : (
          <div className="space-y-8 relative">
            <div className="relative inline-block">
              <div className="w-28 h-28 rounded-xl overflow-hidden border-4 border-white shadow-2xl mx-auto">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-red-50 flex items-center justify-center text-red-600">
                    <UserIcon className="w-12 h-12" />
                  </div>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 bg-green-500 border-4 border-white w-8 h-8 rounded-full shadow-lg"></div>
            </div>
            
            <div className="space-y-2">
              <h2 className="text-3xl font-black tracking-tighter text-gray-900">{user.displayName || 'Customer'}</h2>
              <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em]">{user.email}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => navigate('/profile')} className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-3xl hover:bg-red-50 hover:text-red-600 transition-all group overflow-hidden relative">
                <div className="absolute top-0 right-0 w-8 h-8 bg-black/5 -mr-4 -mt-4 rotate-45"></div>
                <ShoppingBag className="w-8 h-8 mb-3 group-hover:scale-110 transition-transform" />
                <span className="text-[9px] font-black uppercase tracking-widest">Order History</span>
              </button>
              <button onClick={() => navigate('/cart')} className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-3xl hover:bg-blue-50 hover:text-blue-600 transition-all group overflow-hidden relative">
                <div className="absolute top-0 right-0 w-8 h-8 bg-black/5 -mr-4 -mt-4 rotate-45"></div>
                <ShieldCheck className="w-8 h-8 mb-3 group-hover:scale-110 transition-transform" />
                <span className="text-[9px] font-black uppercase tracking-widest">Cart Items</span>
              </button>
            </div>

            <button 
              onClick={handleLogout}
              className="flex items-center justify-center gap-3 w-full py-5 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-red-600 transition-all shadow-xl shadow-gray-200"
            >
              <LogOut className="w-4 h-4" /> End Session
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}

