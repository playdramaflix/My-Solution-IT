import React, { useState, useEffect } from 'react';
import { 
  auth, 
  db 
} from './lib/firebase';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged,
  signOut
} from 'firebase/auth';
import { 
  collection, 
  getDocs, 
  addDoc, 
  deleteDoc, 
  doc, 
  updateDoc, 
  query, 
  orderBy,
  onSnapshot,
  serverTimestamp,
  deleteField
} from 'firebase/firestore';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingBag, 
  LogOut, 
  Plus, 
  Trash2, 
  Edit, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  X,
  Search,
  ChevronRight,
  TrendingUp,
  Users,
  User as UserIcon,
  Mail,
  Phone,
  ShieldAlert,
  Settings,
  MessageSquare,
  Send,
  Star,
  Reply,
  CornerDownRight,
  Zap,
  Loader2,
  Save,
  Upload,
  Image as ImageIcon,
  Eye,
  ExternalLink,
  MessageCircle,
  PlusCircle,
  Heart,
  ShieldCheck,
  HelpCircle,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import emailjs from '@emailjs/browser';
import { Product, Order } from './types';
import { handleFirestoreError, OperationType } from './lib/firestoreUtils';
import { featuredProducts, bestSellers } from './data';
import { serverTimestamp as firestoreTimestamp } from 'firebase/firestore';

const ADMIN_EMAIL = 'imranhosine52@gmail.com';

export default function AdminPanel() {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'orders' | 'settings' | 'abandoned' | 'reviews' | 'admins' | 'services'>('dashboard');
  
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [abandonedCarts, setAbandonedCarts] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);
  const [servicePlans, setServicePlans] = useState<any[]>([]);
  const [emailSettings, setEmailSettings] = useState({
    serviceId: 'service_4jmdpjk',
    templateId: 'template_8q1laec',
    publicKey: 'cKTbuKI3xG3e6-tdF'
  });
  const [siteSettings, setSiteSettings] = useState({
    siteName: 'MY SOLUTION IT',
    siteSubtitle: 'Your Trusted Business Partner',
    logoUrl: '',
    bannerUrl: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=2070&auto=format&fit=crop',
    bannerTitle: 'Premium Tech Solutions',
    bannerDesc: 'Unlock premium features and services for your business at unbeatable prices.',
    whatsappNumber: '8801700000000'
  });
  
  // States for Modals
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Deletion confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState<{ 
    isOpen: boolean, 
    id: string, 
    type: string, 
    label: string,
    onConfirm: () => Promise<void>
  } | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Fetch Data when authenticated as admin
  useEffect(() => {
    if (user?.email === ADMIN_EMAIL) {
      const qProducts = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
      const unsubProducts = onSnapshot(qProducts, (snapshot) => {
        const prodData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Product[];
        setProducts(prodData);
      }, (err) => handleFirestoreError(err, OperationType.LIST, 'products'));

      const qOrders = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
      const unsubOrders = onSnapshot(qOrders, (snapshot) => {
        const ordData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Order[];
        setOrders(ordData);
      }, (err) => handleFirestoreError(err, OperationType.LIST, 'orders'));

      // Fetch Email Settings
      const unsubSettings = onSnapshot(doc(db, 'settings', 'emailjs'), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setEmailSettings({
            serviceId: data.serviceId || 'service_4jmdpjk',
            templateId: data.templateId || 'template_8q1laec',
            publicKey: data.publicKey || 'cKTbuKI3xG3e6-tdF'
          });
        }
      });

      // Fetch Site Settings
      const unsubSite = onSnapshot(doc(db, 'settings', 'site'), (docSnap) => {
        if (docSnap.exists()) {
          setSiteSettings(docSnap.data() as any);
        }
      });

      // Fetch Abandoned Carts
      const unsubAbandoned = onSnapshot(collection(db, 'abandoned_carts'), (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAbandonedCarts(data);
      });

      // Fetch Reviews
      const unsubReviews = onSnapshot(collection(db, 'reviews'), (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setReviews(data);
      });

      // Fetch Admins
      const unsubAdmins = onSnapshot(collection(db, 'admins'), (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAdmins(data);
      });

      const unsubServices = onSnapshot(query(collection(db, 'service_plans'), orderBy('order', 'asc')), (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setServicePlans(data);
      });

      return () => {
        unsubProducts();
        unsubOrders();
        unsubSettings();
        unsubSite();
        unsubAbandoned();
        unsubReviews();
        unsubAdmins();
        unsubServices();
      };
    }
  }, [user]);

  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
        console.log("Login popup was closed or cancelled.");
      } else {
        console.error("Login failed", error);
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => signOut(auth);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-transparent">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
    </div>
  );

  const isSuperAdmin = user?.email === ADMIN_EMAIL;
  const isAdmin = isSuperAdmin || admins.some(a => a.email === user?.email);

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          data-aos="zoom-in"
          className="bg-white p-10 rounded-[3rem] shadow-2xl shadow-gray-200 text-center max-w-sm w-full space-y-8"
        >
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-600">
            <LayoutDashboard className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Admin Portal</h1>
            <p className="text-gray-400 text-sm font-medium">Please sign in with administrator account to continue.</p>
          </div>
          {!user ? (
            <button 
              onClick={handleLogin}
              disabled={isLoggingIn}
              className="flex items-center justify-center gap-3 w-full py-4 bg-black text-white rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-gray-800 transition-all shadow-xl shadow-gray-200 disabled:opacity-50"
            >
              {isLoggingIn ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                "Sign In with Google"
              )}
            </button>
          ) : (
            <div className="space-y-4">
              <p className="text-red-500 font-bold text-xs uppercase underline">Access denied: {user.email}</p>
              <button onClick={handleLogout} className="text-[10px] font-black uppercase text-gray-400 hover:text-black">Sign Out</button>
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  const handleSeedData = async () => {
    if (products.length > 0) return;
    if (confirm('Initialize store with sample products?')) {
      try {
        const allInitial = [...featuredProducts, ...bestSellers];
        for (const p of allInitial) {
          const { id, ...dataWithoutId } = p as any; // Remove local numeric ID
          await addDoc(collection(db, 'products'), {
            ...dataWithoutId,
            createdAt: firestoreTimestamp()
          });
        }
        alert('Products seeded successfully!');
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, 'products');
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col">
      {/* Admin Top Bar (WordPress Style) */}
      <header className="h-14 bg-black text-gray-300 flex items-center justify-between px-4 sticky top-0 z-[60] shadow-md">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-white">
            <div className="w-6 h-6 bg-red-600 rounded flex items-center justify-center text-[10px] font-black tracking-tighter">ADMIN</div>
            <span className="text-sm font-black tracking-widest uppercase hidden sm:inline">My Solution IT</span>
          </div>
          
          <div className="h-4 w-[1px] bg-gray-800" />
          
          <nav className="flex items-center gap-4">
            <a 
              href="/" 
              target="_blank" 
              className="flex items-center gap-1.5 text-xs font-bold hover:text-white hover:bg-white/10 px-2.5 py-1.5 rounded-lg transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>View Site</span>
            </a>
            
            <button 
              onClick={() => { setActiveTab('products'); setIsProductModalOpen(true); setEditingProduct(null); }}
              className="flex items-center gap-1.5 text-xs font-bold hover:text-white hover:bg-white/10 px-2.5 py-1.5 rounded-lg transition-all"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>New Product</span>
            </button>

            <button 
              onClick={() => setActiveTab('reviews')}
              className="flex items-center gap-1.5 text-xs font-bold hover:text-white hover:bg-white/10 px-2.5 py-1.5 rounded-lg transition-all relative"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              {reviews.length > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-600 text-white text-[8px] flex items-center justify-center rounded-full font-black">
                  {reviews.length}
                </span>
              )}
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col items-end mr-2">
            <span className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Logged in as</span>
            <span className="text-xs font-bold text-white leading-tight">{user.email}</span>
          </div>
          
          <div className="h-8 w-8 rounded-full border-2 border-gray-800 p-0.5 overflow-hidden bg-gray-900 group relative cursor-pointer">
            <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}&background=random`} alt="" className="w-full h-full rounded-full object-cover" />
            
            <div className="absolute top-10 right-0 w-48 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 hidden group-hover:block transition-all z-[70]">
               <div className="px-3 py-2 border-b border-gray-50 mb-1">
                  <p className="text-xs font-black text-gray-900 truncate">{user.displayName}</p>
                  <p className="text-[10px] text-gray-400 font-medium truncate">{user.email}</p>
               </div>
               <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition-all"
               >
                 <LogOut className="w-3.5 h-3.5" />
                 Sign Out
               </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Sidebar */}
        <aside className="w-full md:w-64 bg-white border-r border-gray-100 flex-shrink-0 flex flex-col shadow-sm" data-aos="fade-right">
          <div className="p-6 flex-1 overflow-y-auto">
            <div className="mb-8 px-2">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Navigation</span>
            </div>
          
          <nav className="space-y-2">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
              { id: 'products', label: 'Products', icon: Package },
              { id: 'orders', label: 'Orders', icon: ShoppingBag },
              { id: 'services', label: 'Services', icon: Zap },
              { id: 'abandoned', label: 'Abandoned', icon: Trash2 },
              { id: 'reviews', label: 'Reviews', icon: MessageSquare },
              ...(isSuperAdmin ? [{ id: 'admins', label: 'Admins', icon: Users }] : []),
              { id: 'settings', label: 'Settings', icon: Settings },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${activeTab === tab.id ? 'bg-red-600 text-white shadow-lg shadow-red-100' : 'text-gray-400 hover:text-black hover:bg-gray-50'}`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
        
        <div className="p-6 border-t border-gray-50 bg-gray-50/30">
          <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest text-center">Version 2.4.0 • Built with ❤️</p>
        </div>
      </aside>

        {/* Right Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Main Content */}
          <main className="flex-1 p-6 md:p-8 overflow-y-auto bg-gray-50/50">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && <Dashboard orders={orders} products={products} />}
          {activeTab === 'services' && (
            <ServicesManagement 
              plans={servicePlans} 
              onDelete={(id, name) => {
                setDeleteConfirm({
                  isOpen: true,
                  id,
                  type: 'Plan',
                  label: name,
                  onConfirm: async () => {
                    await deleteDoc(doc(db, 'service_plans', id));
                  }
                });
              }}
            />
          )}
          {activeTab === 'products' && (
            <ProductsList 
              products={products} 
              onAdd={() => { setEditingProduct(null); setIsProductModalOpen(true); }}
              onEdit={(p) => { setEditingProduct(p); setIsProductModalOpen(true); }}
              onSeed={handleSeedData}
              onDelete={(id, title) => {
                setDeleteConfirm({
                  isOpen: true,
                  id,
                  type: 'Product',
                  label: title,
                  onConfirm: async () => {
                    await deleteDoc(doc(db, 'products', id));
                  }
                });
              }}
            />
          )}
          {activeTab === 'orders' && (
            <OrdersList 
              orders={orders} 
              products={products} 
              emailSettings={emailSettings} 
              onViewOrder={(order) => { setSelectedOrder(order); setIsOrderModalOpen(true); }}
            />
          )}
          {activeTab === 'abandoned' && <AbandonedCarts carts={abandonedCarts} />}
          {activeTab === 'reviews' && (
            <ReviewsList 
              reviews={reviews} 
              products={products} 
              onDelete={(id, customer) => {
                setDeleteConfirm({
                  isOpen: true,
                  id,
                  type: 'Review',
                  label: `from ${customer}`,
                  onConfirm: async () => {
                    await deleteDoc(doc(db, 'reviews', id));
                  }
                });
              }}
            />
          )}
          {activeTab === 'admins' && isSuperAdmin && (
            <AdminsManagement 
              admins={admins} 
              superAdminEmail={ADMIN_EMAIL} 
              currentUser={user} 
              onDelete={(id, email) => {
                setDeleteConfirm({
                  isOpen: true,
                  id,
                  type: 'Admin Access',
                  label: email,
                  onConfirm: async () => {
                    await deleteDoc(doc(db, 'admins', id));
                  }
                });
              }}
            />
          )}
          {activeTab === 'settings' && (
            <SettingsPanel 
                siteSettings={siteSettings} 
                emailSettings={emailSettings} 
            />
          )}
        </AnimatePresence>
          </main>

          {/* Admin Footer */}
          <footer className="h-10 bg-white border-t border-gray-100 flex items-center justify-between px-6 z-50 shadow-[0_-1px_3px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-bold text-gray-500 tracking-wider uppercase">System Status: <span className="text-gray-900">Online</span></span>
          </div>
          <div className="h-3 w-[1px] bg-gray-200 hidden sm:block" />
          <div className="hidden sm:flex items-center gap-2 text-gray-400">
            <Activity className="w-3 h-3" />
            <span className="text-[10px] font-bold tracking-tight">Latency: 24ms</span>
          </div>
          <div className="h-3 w-[1px] bg-gray-200 hidden md:block" />
          <div className="hidden md:flex items-center gap-2 text-gray-400">
            <ShieldCheck className="w-3 h-3 text-blue-500" />
            <span className="text-[10px] font-bold tracking-tight">Security: Encrypted</span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden lg:flex items-center gap-4">
            <a href="#" className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 hover:text-red-600 transition-colors">
              <HelpCircle className="w-3 h-3" />
              <span>Support</span>
            </a>
            <a href="#" className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 hover:text-red-600 transition-colors">
              <ExternalLink className="w-3 h-3" />
              <span>Documentation</span>
            </a>
          </div>
          <div className="h-3 w-[1px] bg-gray-200 hidden lg:block" />
          <div className="flex items-center gap-1 text-[10px] text-gray-400 font-bold tracking-tight">
            <span>© 2024</span>
            <span className="text-gray-900 font-black">MY SOLUTION IT</span>
            <span>•</span>
            <div className="flex items-center gap-1 text-red-600">
              <Heart className="w-2.5 h-2.5 fill-current" />
              <span>v2.4.0</span>
            </div>
          </div>
        </div>
          </footer>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog 
        isOpen={deleteConfirm?.isOpen || false}
        title={`Delete ${deleteConfirm?.type}?`}
        message={`Are you sure you want to delete ${deleteConfirm?.label}? This action cannot be undone.`}
        onConfirm={async () => {
          if (deleteConfirm?.onConfirm) {
            try {
              await deleteConfirm.onConfirm();
              setDeleteConfirm(null);
            } catch (err) {
              console.error("Delete failed:", err);
              alert("Failed to delete item.");
            }
          }
        }}
        onCancel={() => setDeleteConfirm(null)}
      />

      {/* Product Modal */}
      {isProductModalOpen && (
        <ProductModal 
          product={editingProduct} 
          onClose={() => setIsProductModalOpen(false)} 
        />
      )}

      {/* Order Modal */}
      {isOrderModalOpen && (
        <OrderModal 
          order={selectedOrder} 
          onClose={() => setIsOrderModalOpen(false)} 
        />
      )}
    </div>
  );
}

function AdminsManagement({ admins, superAdminEmail, currentUser, onDelete }: { admins: any[], superAdminEmail: string, currentUser: any, onDelete: (id: string, email: string) => void }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ email: '', level: 'Manager', name: '' });
  const [isAdding, setIsAdding] = useState(false);

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdmin.email.trim()) return;
    setIsAdding(true);
    try {
      // Use email as doc ID for easy lookup
      const { setDoc } = await import('firebase/firestore');
      await setDoc(doc(db, 'admins', newAdmin.email.toLowerCase()), {
        email: newAdmin.email.toLowerCase(),
        level: newAdmin.level,
        name: newAdmin.name,
        addedBy: currentUser.email,
        createdAt: firestoreTimestamp()
      });
      setNewAdmin({ email: '', level: 'Manager', name: '' });
      setIsModalOpen(false);
    } catch (err) {
      console.error("Error adding admin:", err);
      alert("Failed to add admin. Check permissions or network.");
    } finally {
      setIsAdding(false);
    }
  };

  const removeAdmin = async (id: string, email: string) => {
    onDelete(id, email);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Admin Management</h1>
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Manage administrative access and roles</p>
          </div>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-black text-white rounded-2xl font-bold uppercase tracking-widest text-[10px] hover:bg-red-600 transition-all shadow-lg"
        >
          <Plus className="w-4 h-4" /> Add New Admin
        </button>
      </div>

      <div className="grid gap-6">
        {/* Super Admin Static Card */}
        <div className="bg-white p-6 rounded-xl border-2 border-red-100 shadow-sm flex items-center justify-between group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center font-black">
              SA
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-gray-900 underline decoration-red-500 underline-offset-4 decoration-2">{superAdminEmail}</h3>
                <span className="text-[8px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-black uppercase tracking-widest">Master Admin</span>
              </div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Full System Control (Bootstrap)</p>
            </div>
          </div>
          <div className="hidden group-hover:block transition-all">
             <ShieldAlert className="w-5 h-5 text-red-200" />
          </div>
        </div>

        {/* Dynamic Admins List */}
        {admins.map((admin, index) => (
          <motion.div 
            key={admin.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center justify-between group hover:shadow-xl hover:border-blue-100 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 font-bold border border-gray-100 uppercase">
                {admin.name?.[0] || admin.email[0]}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-gray-900">{admin.email}</h3>
                  <span className={`text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest ${
                    admin.level === 'Super Admin' ? 'bg-red-50 text-red-600' : 
                    admin.level === 'Manager' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'
                  }`}>
                    {admin.level}
                  </span>
                </div>
                {admin.name && <p className="text-xs text-gray-400 font-medium">{admin.name}</p>}
                <p className="text-[8px] text-gray-300 font-bold uppercase tracking-tight mt-1">Added by: {admin.addedBy} • {admin.createdAt?.toDate().toLocaleDateString()}</p>
              </div>
            </div>
            <button 
              onClick={() => removeAdmin(admin.id, admin.email)}
              className="p-3 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all opacity-0 group-hover:opacity-100"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </motion.div>
        ))}

        {admins.length === 0 && (
          <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-[2.5rem] p-12 text-center">
            <p className="text-gray-400 text-sm font-medium">No additional admins found. Add one to help manage your business.</p>
          </div>
        )}
      </div>

      {/* Add Admin Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden p-8 space-y-8"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black tracking-tighter uppercase italic">Add New Admin</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-50 rounded-full transition-all">
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleAddAdmin} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 ml-1">Email Address (Google Login)</label>
                  <input 
                    required
                    type="email" 
                    value={newAdmin.email}
                    onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                    className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:border-red-600 focus:outline-none transition-all text-sm font-semibold"
                    placeholder="user@gmail.com"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 ml-1">Name (Optional)</label>
                  <input 
                    type="text" 
                    value={newAdmin.name}
                    onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
                    className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:border-red-600 focus:outline-none transition-all text-sm font-semibold"
                    placeholder="Admin Name"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 ml-1">Admin Level/Role</label>
                  <select 
                    value={newAdmin.level}
                    onChange={(e) => setNewAdmin({ ...newAdmin, level: e.target.value })}
                    className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:border-red-600 focus:outline-none transition-all text-sm font-bold"
                  >
                    <option value="Manager">Manager (Full Access)</option>
                    <option value="Editor">Editor (Product/Content Only)</option>
                    <option value="Super Admin">Super Admin (Can add other admins)</option>
                  </select>
                </div>

                <div className="pt-4">
                  <button 
                    disabled={isAdding}
                    type="submit"
                    className="w-full py-5 bg-black text-white rounded-[2rem] font-bold uppercase tracking-[0.3em] text-xs hover:bg-red-600 transition-all shadow-xl disabled:opacity-50"
                  >
                    {isAdding ? "Adding..." : "Grant Admin Access"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function Dashboard({ orders, products }: { orders: Order[], products: Product[] }) {
  const totalRev = orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + o.totalPrice, 0);
  const pendingOrders = orders.filter(o => o.status === 'pending').length;

  const stats = [
    { label: 'Total Revenue', value: `৳ ${totalRev.toLocaleString()}`, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-100' },
    { label: 'Total Orders', value: orders.length, icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Pending Orders', value: pendingOrders, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-100' },
    { label: 'Total Products', value: products.length, icon: Package, color: 'text-purple-600', bg: 'bg-purple-100' },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      <div className="flex items-center justify-between" data-aos="fade-down">
        <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
        <div className="text-xs font-semibold text-gray-400 bg-white px-4 py-2 rounded-xl border border-gray-100">Last updated: {new Date().toLocaleTimeString()}</div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} data-aos="fade-up" data-aos-delay={idx * 100} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4 hover:shadow-xl hover:-translate-y-1 transition-all">
            <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">{stat.label}</p>
              <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Recent Orders Preview */}
        <div className="bg-white p-8 rounded-xl border border-gray-100 shadow-sm space-y-6" data-aos="fade-up" data-aos-delay="400">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold tracking-tight">Recent Orders</h3>
            <button className="text-xs font-semibold text-red-600 hover:underline">View All</button>
          </div>
          <div className="space-y-4">
            {orders.slice(0, 5).map((order) => (
              <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-xs font-bold">{order.customerName[0]}</div>
                  <div>
                    <p className="text-sm font-semibold">{order.customerName}</p>
                    <p className="text-[10px] text-gray-400 font-medium tracking-tight">৳ {order.totalPrice} • {order.createdAt?.toDate?.()?.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) || 'Recently'}</p>
                  </div>
                </div>
                <StatusBadge status={order.status} />
              </div>
            ))}
          </div>
        </div>

        {/* Growth Mock Chart Area */}
        <div className="bg-black p-8 rounded-xl text-white flex flex-col justify-between" data-aos="fade-up" data-aos-delay="500">
          <div className="space-y-1">
            <h3 className="text-lg font-bold tracking-tight">Store Growth</h3>
            <p className="text-xs text-gray-400 font-medium">+12% more than last month</p>
          </div>
          <div className="h-40 flex items-end justify-between items-baseline gap-2 pt-8">
             {[40, 70, 50, 90, 60, 80, 100].map((h, i) => (
                <div key={i} data-aos="zoom-in-up" data-aos-delay={600 + (i * 50)} style={{ height: `${h}%` }} className="flex-1 bg-red-600 rounded-t-lg transition-all hover:bg-white cursor-pointer opacity-80" />
             ))}
          </div>
          <div className="flex justify-between mt-4">
             {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => <span key={`${d}-${i}`} className="text-[10px] font-bold">{d}</span>)}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ProductsList({ products, onAdd, onEdit, onSeed, onDelete }: { 
  products: Product[], 
  onAdd: () => void, 
  onEdit: (p: Product) => void,
  onSeed: () => void,
  onDelete: (id: string, title: string) => void
}) {
  const handleDelete = async (id: string, title: string) => {
    onDelete(id, title);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Products <span className="text-gray-300 ml-1 font-medium">({products.length})</span></h1>
        <div className="flex gap-3">
          {products.length === 0 && (
            <button 
              onClick={onSeed}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold uppercase tracking-widest text-[10px] hover:bg-black transition-all shadow-lg shadow-blue-100"
            >
              Initialize Data
            </button>
          )}
          <button 
            onClick={onAdd}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-2xl font-bold uppercase tracking-widest text-[10px] hover:bg-black transition-all shadow-lg shadow-red-100"
          >
            <Plus className="w-4 h-4" /> Add Product
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto" data-aos="fade-up">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-50">
                <th className="px-8 py-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-8 py-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-8 py-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-8 py-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-8 py-6 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {products.map((product, index) => (
                <tr key={product.id} className="hover:bg-gray-50/50 transition-all group" data-aos="fade-up" data-aos-delay={index * 50}>
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden flex-shrink-0">
                        <img src={product?.image || ''} alt="" className="w-full h-full object-cover" />
                      </div>
                      <span className="text-sm font-semibold truncate max-w-[200px]">{product?.title || 'Untitled Product'}</span>
                    </div>
                  </td>
                  <td className="px-8 py-4 text-xs text-gray-500 font-medium">{product.category}</td>
                  <td className="px-8 py-4 font-bold text-red-600 tracking-tight">{product.price}</td>
                  <td className="px-8 py-4">
                    <span className="px-3 py-1 bg-green-50 text-green-600 text-[10px] font-bold uppercase tracking-tight border border-green-100 rounded-full">In Stock</span>
                  </td>
                  <td className="px-8 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <a 
                        href={`/product/${product.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-white rounded-xl shadow-sm transition-all"
                        title="View Product"
                      >
                        <Eye className="w-4 h-4" />
                      </a>
                      <button 
                        onClick={() => onEdit(product)}
                        className="p-2 text-gray-400 hover:text-black hover:bg-white rounded-xl shadow-sm transition-all"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(product.id as any, product.title)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-white rounded-xl shadow-sm transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}

function OrdersList({ orders, products, emailSettings, onViewOrder }: { orders: Order[], products: Product[], emailSettings: any, onViewOrder: (order: Order) => void }) {
  const [isSendingEmail, setIsSendingEmail] = useState<string | null>(null);
  const [activeOrderTab, setActiveOrderTab] = useState<'pending' | 'sendAccess' | 'confirmed'>('pending');

  const pendingOrders = orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled');
  const sendAccessOrders = orders.filter(o => o.status === 'completed' && !o.deliveryEmailSent);
  const confirmedOrders = orders.filter(o => o.status === 'completed' && o.deliveryEmailSent);

  const displayOrders = activeOrderTab === 'pending' 
    ? pendingOrders 
    : activeOrderTab === 'sendAccess' 
      ? sendAccessOrders 
      : confirmedOrders;

  const sendDeliveryEmail = async (order: Order) => {
    if (!order.email) return;

    // Prepare product delivery details for the email body
    const deliveryDetailsBody = order.items.map(item => {
      const product = products.find(p => String(p.id) === String(item.productId));
      const link = product?.secretSource || "No link provided";
      const instructions = product?.secretInstructions || "Check documentation.";
      return `Product: ${item.title}\nAccess Link: ${link}\nInstructions: ${instructions}`;
    }).join('\n\n---\n\n');

    const subject = encodeURIComponent(`Order Completed: #${order.id?.slice(-6).toUpperCase()} - Access Your Products`);
    const body = encodeURIComponent(
      `Hello ${order.customerName},\n\n` +
      `Your order #${order.id?.toUpperCase()} has been completed successfully! Here are your product access details:\n\n` +
      `${deliveryDetailsBody}\n\n` +
      `Thank you for shopping with us!\n\n` +
      `Best regards,\n` +
      `Admin Team`
    );

    const mailtoUrl = `mailto:${order.email}?subject=${subject}&body=${body}`;

    try {
      // Direct redirect to email app
      window.location.href = mailtoUrl;

      // Update Firestore to mark as sent (or at least the attempt was made)
      await updateDoc(doc(db, 'orders', order.id!), { 
        deliveryEmailSent: true 
      });
    } catch (err) {
      console.error("Failed to update status after email attempt:", err);
      handleFirestoreError(err, OperationType.UPDATE, 'orders/' + order.id);
    }
  };

  const updateStatus = async (order: Order, status: Order['status']) => {
    try {
      await updateDoc(doc(db, 'orders', order.id!), { status });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'orders/' + order.id);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight">Orders</h1>
          <p className="text-sm text-gray-500 font-medium">Manage and track customer purchases</p>
        </div>
        <div className="flex flex-wrap gap-2 bg-gray-100/50 p-1 rounded-2xl border border-gray-100">
           <button 
             onClick={() => setActiveOrderTab('pending')}
             className={`px-4 md:px-6 py-2.5 rounded-xl text-[10px] md:text-xs font-black transition-all tracking-widest ${activeOrderTab === 'pending' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
           >
             PENDING ({pendingOrders.length})
           </button>
           <button 
             onClick={() => setActiveOrderTab('sendAccess')}
             className={`px-4 md:px-6 py-2.5 rounded-xl text-[10px] md:text-xs font-black transition-all tracking-widest ${activeOrderTab === 'sendAccess' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
           >
             SEND ACCESS ({sendAccessOrders.length})
           </button>
           <button 
             onClick={() => setActiveOrderTab('confirmed')}
             className={`px-4 md:px-6 py-2.5 rounded-xl text-[10px] md:text-xs font-black transition-all tracking-widest ${activeOrderTab === 'confirmed' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
           >
             CONFIRMED ({confirmedOrders.length})
           </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div 
          key={activeOrderTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="grid gap-6 max-h-[calc(100vh-280px)] overflow-y-auto pr-2 scrollbar-hide"
        >
          {displayOrders.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-[2.5rem] border border-dashed border-gray-200 p-20 text-center space-y-4"
            >
               <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
                  <ShoppingBag className="w-10 h-10 text-gray-200" />
               </div>
               <div>
                  <h3 className="text-lg font-bold text-gray-900">No {activeOrderTab} orders</h3>
                  <p className="text-sm text-gray-400">There are no orders in this category at the moment.</p>
               </div>
            </motion.div>
          ) : (
            displayOrders.map((order, index) => (
            <motion.div 
              key={order.id} 
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(index * 0.05, 0.3) }}
              className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-6 md:p-8 space-y-6"
            >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-50 pb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-red-600">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold tracking-tight">{order.customerName}</h3>
                      <button 
                        onClick={() => onViewOrder(order)}
                        className="p-1 px-2 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all"
                      >
                        Details
                      </button>
                    </div>
                    <p className="text-xs text-gray-400 font-medium">Order ID: #{order.id?.slice(-6).toUpperCase()}</p>
                  </div>
                </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={order.status} />
                <select 
                  value={order.status}
                  onChange={(e) => updateStatus(order, e.target.value as any)}
                  className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none hover:bg-white transition-all shadow-sm"
                >
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                {order.status === 'completed' && (
                  <button
                    disabled={isSendingEmail === order.id}
                    onClick={() => sendDeliveryEmail(order)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm ${order.deliveryEmailSent ? 'bg-green-50 text-green-600 border border-green-100 hover:bg-green-100' : 'bg-red-600 text-white hover:bg-red-700 shadow-red-100'}`}
                  >
                    {isSendingEmail === order.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Zap className="w-3 h-3" />
                    )}
                    {order.deliveryEmailSent ? 'Resend Access' : 'Send Access Link'}
                  </button>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Order Items</h4>
                <div className="space-y-3">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <p className="text-xs font-semibold text-gray-700 truncate max-w-[200px]">{item.title} <span className="text-red-500 ml-1">x{item.quantity}</span></p>
                      <span className="text-xs font-bold tracking-tight">{item.price}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-100">
                  <span className="text-sm font-bold tracking-tight">Total</span>
                  <span className="text-lg font-bold text-red-600 tracking-tight">৳ {order.totalPrice}</span>
                </div>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Customer Email</p>
                    <p className="text-xs font-semibold text-gray-700">{order.email}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Customer Phone</p>
                    <p className="text-xs font-semibold text-gray-700">{order.phone}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Payment Method</p>
                    <p className="text-xs font-bold uppercase text-blue-600">{order.paymentMethod}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Order Date & Time</p>
                    <p className="text-xs font-semibold text-gray-700">{order.createdAt?.toDate?.()?.toLocaleString('en-US', { hour12: true }) || 'Recently'}</p>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 space-y-3">
                   {order.senderNumber && (
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-blue-400 uppercase tracking-wider">Sender No:</span>
                        <span className="font-bold text-blue-700">{order.senderNumber}</span>
                      </div>
                   )}
                   {order.transactionId && (
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-blue-400 uppercase tracking-wider">TrxID:</span>
                        <span className="font-bold text-blue-700 uppercase">{order.transactionId}</span>
                      </div>
                   )}
                </div>
              </div>
            </div>
            </motion.div>
          ))
        )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

function StatusBadge({ status }: { status: Order['status'] }) {
  const configs = {
    pending: { label: 'Pending', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100', icon: Clock },
    processing: { label: 'Processing', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100', icon: AlertCircle },
    completed: { label: 'Completed', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100', icon: CheckCircle2 },
    cancelled: { label: 'Cancelled', color: 'text-gray-400', bg: 'bg-gray-50', border: 'border-gray-100', icon: X },
  };

  const config = configs[status];
  return (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${config.bg} ${config.color} border ${config.border}`}>
      <config.icon className="w-3 h-3" />
      <span className="text-[10px] font-bold uppercase tracking-wider">{config.label}</span>
    </div>
  );
}

function AbandonedCarts({ carts }: { carts: any[] }) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center">
                <Trash2 className="w-6 h-6" />
            </div>
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Abandoned Carts</h1>
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Potential customers who didn't checkout</p>
            </div>
        </div>
        <div className="bg-orange-50 text-orange-700 px-4 py-2 rounded-xl text-xs font-bold border border-orange-100">
            Total: {carts.length} Cart sessions
        </div>
      </div>

      <div className="grid gap-6">
        {carts.length === 0 ? (
            <div className="bg-white p-20 rounded-[3rem] border border-gray-100 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center">
                    <ShoppingBag className="w-10 h-10 text-gray-200" />
                </div>
                <p className="text-gray-400 font-medium">No abandoned carts tracked yet.</p>
            </div>
        ) : (
            carts.map((cart, index) => (
                <div key={cart.id} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6" data-aos="fade-up" data-aos-delay={index * 100}>
                    <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                                <Users className="w-5 h-5 text-gray-400" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 leading-tight">
                                    {cart.email ? cart.email : 'Visitor Session'}
                                </h3>
                                <div className="flex flex-wrap items-center gap-3 mt-1">
                                    <div className="flex items-center gap-1 text-[10px] text-gray-400 font-semibold uppercase">
                                        <Clock className="w-3 h-3" />
                                        {cart.updatedAt?.toDate().toLocaleString() || 'Active now'}
                                    </div>
                                    {cart.ip && (
                                        <div className="flex items-center gap-1 text-[10px] text-blue-500 font-bold uppercase bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">
                                            IP: {cart.ip}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="text-right w-full md:w-auto">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Estimated Total</p>
                            <p className="text-xl font-bold text-red-600 tracking-tight">৳ {cart.totalPrice?.toFixed(2) || '0.00'}</p>
                        </div>
                    </div>

                    <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                        {cart.items.map((item: any, idx: number) => (
                            <div key={idx} className="flex-shrink-0 flex items-center gap-3 bg-gray-50 p-3 rounded-2xl border border-gray-50 group">
                                <img src={item.image} alt="" className="w-12 h-12 rounded-xl object-cover border border-white shadow-sm" />
                                <div>
                                    <p className="text-xs font-bold text-gray-800 line-clamp-1 max-w-[120px]">{item.title}</p>
                                    <p className="text-[10px] font-semibold text-gray-400">Qty: {item.quantity}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))
        )}
      </div>
    </motion.div>
  );
}

function ReviewsList({ reviews, products, onDelete }: { reviews: any[], products: Product[], onDelete: (id: string, customer: string) => void }) {
  const [replyText, setReplyText] = useState<{ [key: string]: string }>({});
  const [isReplying, setIsReplying] = useState<string | null>(null);

  const handleDelete = async (reviewId: string, customer: string) => {
    onDelete(reviewId, customer);
  };

  const handleReply = async (reviewId: string) => {
    const text = replyText[reviewId];
    if (!text?.trim()) return;

    setIsReplying(reviewId);
    try {
      // Create a threaded reply as a new document
      const parentReview = reviews.find(r => r.id === reviewId);
      await addDoc(collection(db, 'reviews'), {
        productId: parentReview.productId,
        parentId: reviewId,
        comment: text.trim(),
        customerName: 'Admin',
        rating: 0,
        createdAt: serverTimestamp()
      });
      setReplyText({ ...replyText, [reviewId]: '' });
      setIsReplying(null);
    } catch (err) {
      console.error("Error replying to review:", err);
      setIsReplying(null);
    }
  };

  const RenderReview = ({ review, depth = 0 }: { review: any, depth?: number, key?: any }) => {
    const product = products.find(p => String(p.id) === review.productId);
    const childReplies = reviews.filter(r => r.parentId === review.id);
    const isLocalReplying = isReplying === review.id;

    return (
      <div className={`relative ${depth > 0 ? 'ml-8 md:ml-12 mt-2' : 'py-4 border-b border-gray-50 last:border-0'}`}>
        {/* Threading Line */}
        {depth > 0 && (
          <div className="absolute -left-6 top-0 bottom-0 w-px bg-gray-100">
            <div className="absolute top-4 left-0 w-6 h-px bg-gray-100" />
          </div>
        )}

        <div className="flex gap-3">
          <div className={`shrink-0 rounded-full flex items-center justify-center overflow-hidden border border-white shadow-sm ${depth > 0 ? 'w-6 h-6' : 'w-8 h-8'}`}>
            {review.customerPhoto ? (
              <img src={review.customerPhoto} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className={`w-full h-full flex items-center justify-center ${review.customerName === 'Admin' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                <UserIcon className={depth > 0 ? 'w-3 h-3' : 'w-4 h-4'} />
              </div>
            )}
          </div>

          <div className="flex-1 space-y-0.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h4 className="text-[12px] font-bold text-gray-900 leading-none">
                  {review.customerName}
                </h4>
                {review.customerName === 'Admin' && (
                  <span className="text-[7px] bg-red-600 text-white px-1 py-0.5 rounded-full font-black uppercase tracking-tighter">Official</span>
                )}
                <span className="text-[9px] text-gray-300 font-medium tracking-tight">
                  {review.createdAt?.toDate().toLocaleDateString()}
                </span>
              </div>
              <button 
                onClick={() => handleDelete(review.id, review.customerName)}
                className="opacity-0 group-hover/review:opacity-100 p-1 text-gray-300 hover:text-red-500 transition-all transition-opacity"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>

            {depth === 0 && (
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tight">
                Product: <span className="text-blue-500">{product?.title || 'Unknown'}</span>
              </p>
            )}

            {review.rating > 0 && (
              <div className="flex items-center gap-0.5 pb-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`w-2 h-2 ${i < review.rating ? 'fill-[#febb00] text-[#febb00]' : 'text-gray-100'}`} />
                ))}
              </div>
            )}

            <div className="group/review">
              <p className="text-[13px] text-gray-700 leading-snug font-normal">
                {review.comment}
              </p>

              <div className="flex items-center gap-3 pt-1">
                <button 
                  onClick={() => setIsReplying(isLocalReplying ? null : review.id)}
                  className={`text-[9px] font-black uppercase tracking-wider ${isLocalReplying ? 'text-red-600' : 'text-gray-400 hover:text-gray-900'}`}
                >
                  Reply
                </button>
              </div>
            </div>

            {isLocalReplying && (
              <div className="mt-2 flex gap-2">
                <input 
                  autoFocus
                  type="text" 
                  placeholder="Type official reply..."
                  value={replyText[review.id] || ''}
                  onChange={(e) => setReplyText({ ...replyText, [review.id]: e.target.value })}
                  className="flex-1 px-3 py-1.5 rounded-lg border border-gray-100 bg-gray-50 focus:bg-white text-[11px] outline-none"
                  onKeyDown={(e) => e.key === 'Enter' && handleReply(review.id)}
                />
                <button 
                  onClick={() => handleReply(review.id)}
                  disabled={!replyText[review.id]?.trim()}
                  className="px-3 py-1.5 bg-black text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-red-600 disabled:opacity-30 transition-all"
                >
                  Post
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Child Replies */}
        <div className="space-y-0.5">
          {childReplies.map(reply => (
            <RenderReview key={reply.id} review={reply} depth={depth + 1} />
          ))}
        </div>
      </div>
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
                <MessageSquare className="w-6 h-6" />
            </div>
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Threaded Reviews</h1>
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Manage conversations and replies</p>
            </div>
        </div>
        <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-xl text-xs font-bold border border-blue-100">
            {reviews.length} Total Messages
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        {reviews.length === 0 ? (
            <div className="bg-white p-20 rounded-[3rem] border border-gray-100 flex flex-col items-center justify-center text-center space-y-4" data-aos="zoom-in">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center">
                    <MessageSquare className="w-10 h-10 text-gray-200" />
                </div>
                <p className="text-gray-400 font-medium">No reviews found yet.</p>
            </div>
        ) : (
            reviews.filter(r => !r.parentId).map((review, index) => (
              <div key={review.id} data-aos="fade-up" data-aos-delay={index * 100}>
                <RenderReview review={review} />
              </div>
            ))
        )}
      </div>
    </motion.div>
  );
}

function SettingsPanel({ siteSettings, emailSettings }: { siteSettings: any, emailSettings: any }) {
  const [activeSubTab, setActiveSubTab] = useState<'site' | 'email'>('site');

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center">
            <Settings className="w-6 h-6" />
        </div>
        <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Settings</h1>
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Manage your website configuration</p>
        </div>
      </div>

      <div className="flex gap-2 bg-white p-2 rounded-2xl border border-gray-100 w-fit">
        <button 
          onClick={() => setActiveSubTab('site')}
          className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${activeSubTab === 'site' ? 'bg-black text-white' : 'text-gray-400 hover:text-black'}`}
        >
          Site Branding
        </button>
        <button 
          onClick={() => setActiveSubTab('email')}
          className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${activeSubTab === 'email' ? 'bg-black text-white' : 'text-gray-400 hover:text-black'}`}
        >
          Email Config
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeSubTab === 'site' ? (
          <SiteSettingsForm key="site" initialSettings={siteSettings} />
        ) : (
          <EmailSettings key="email" initialSettings={emailSettings} />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function SiteSettingsForm({ initialSettings }: { initialSettings: any, key?: string }) {
  const [settings, setSettings] = useState(initialSettings);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setSettings(initialSettings);
  }, [initialSettings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'settings', 'site'), {
        ...settings,
        updatedAt: firestoreTimestamp()
      }).catch(async (err) => {
          if (err.code === 'not-found') {
              const { setDoc } = await import('firebase/firestore');
              await setDoc(doc(db, 'settings', 'site'), {
                  ...settings,
                  updatedAt: firestoreTimestamp()
              });
          } else {
              throw err;
          }
      });
      alert('Site settings updated successfully!');
    } catch (err) {
      console.error('Failed to update site settings:', err);
      alert('Failed to update settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="max-w-4xl space-y-8"
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
        </div>
        <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Site Settings</h1>
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Customize name, logo and banner</p>
        </div>
      </div>

      <div className="bg-white p-8 md:p-10 rounded-[3rem] border border-gray-100 shadow-sm" data-aos="fade-up">
        <form onSubmit={handleSave} className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <h3 className="text-sm font-bold tracking-tight border-b border-gray-100 pb-2">Branding</h3>
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 ml-1">Site Name</label>
              <input 
                required
                type="text" 
                value={settings.siteName}
                onChange={(e) => setSettings({...settings, siteName: e.target.value})}
                className="w-full px-6 py-4 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:border-red-600 focus:outline-none transition-all text-sm font-semibold"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 ml-1">Subtitle / Tagline</label>
              <input 
                required
                type="text" 
                value={settings.siteSubtitle}
                onChange={(e) => setSettings({...settings, siteSubtitle: e.target.value})}
                className="w-full px-6 py-4 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:border-red-600 focus:outline-none transition-all text-sm font-semibold"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 ml-1">Logo URL (Optional)</label>
              <input 
                type="text" 
                value={settings.logoUrl}
                onChange={(e) => setSettings({...settings, logoUrl: e.target.value})}
                className="w-full px-6 py-4 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:border-red-600 focus:outline-none transition-all text-sm font-semibold"
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-green-600 ml-1">WhatsApp Number (Redirection)</label>
              <input 
                required
                type="text" 
                value={settings.whatsappNumber}
                onChange={(e) => setSettings({...settings, whatsappNumber: e.target.value})}
                className="w-full px-6 py-4 rounded-2xl border border-green-100 bg-green-50/20 focus:bg-white focus:border-red-600 focus:outline-none transition-all text-sm font-bold text-green-700"
                placeholder="88017XXXXXXXX"
              />
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-sm font-bold tracking-tight border-b border-gray-100 pb-2">Hero Banner</h3>
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 ml-1">Banner Image URL</label>
              <input 
                required
                type="text" 
                value={settings.bannerUrl}
                onChange={(e) => setSettings({...settings, bannerUrl: e.target.value})}
                className="w-full px-6 py-4 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:border-red-600 focus:outline-none transition-all text-sm font-semibold"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 ml-1">Banner Title</label>
              <input 
                required
                type="text" 
                value={settings.bannerTitle}
                onChange={(e) => setSettings({...settings, bannerTitle: e.target.value})}
                className="w-full px-6 py-4 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:border-red-600 focus:outline-none transition-all text-sm font-semibold"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 ml-1">Banner Description</label>
              <textarea 
                required
                rows={3}
                value={settings.bannerDesc}
                onChange={(e) => setSettings({...settings, bannerDesc: e.target.value})}
                className="w-full px-6 py-4 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:border-red-600 focus:outline-none transition-all text-sm font-semibold"
              />
            </div>
          </div>

          <div className="md:col-span-2 pt-4">
            <button 
                type="submit"
                disabled={isSaving}
                className="w-full py-5 bg-black text-white rounded-[2rem] font-bold uppercase tracking-[0.3em] text-xs hover:bg-gray-800 transition-all shadow-xl shadow-gray-100 disabled:opacity-50"
            >
                {isSaving ? "Saving..." : "Save Site Configuration"}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}

function EmailSettings({ initialSettings }: { initialSettings: any, key?: string }) {
  const [settings, setSettings] = useState(initialSettings);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setSettings(initialSettings);
  }, [initialSettings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'settings', 'emailjs'), {
        ...settings,
        updatedAt: firestoreTimestamp()
      }).catch(async (err) => {
          // If doc doesn't exist, create it
          if (err.code === 'not-found') {
              const { setDoc } = await import('firebase/firestore');
              await setDoc(doc(db, 'settings', 'emailjs'), {
                  ...settings,
                  updatedAt: firestoreTimestamp()
              });
          } else {
              throw err;
          }
      });
      alert('Email settings updated successfully!');
    } catch (err) {
      console.error('Failed to update email settings:', err);
      alert('Failed to update settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="max-w-2xl space-y-8"
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center">
            <Edit className="w-6 h-6" />
        </div>
        <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Email Config</h1>
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Manage EmailJS Service IDs</p>
        </div>
      </div>

      <div className="bg-white p-8 md:p-10 rounded-[3rem] border border-gray-100 shadow-sm">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 ml-1">Service ID</label>
            <input 
              required
              type="text" 
              value={settings.serviceId}
              onChange={(e) => setSettings({...settings, serviceId: e.target.value})}
              className="w-full px-6 py-4 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:border-red-600 focus:outline-none transition-all text-sm font-semibold"
              placeholder="e.g. service_xxxxxxx"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 ml-1">Template ID</label>
            <input 
              required
              type="text" 
              value={settings.templateId}
              onChange={(e) => setSettings({...settings, templateId: e.target.value})}
              className="w-full px-6 py-4 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:border-red-600 focus:outline-none transition-all text-sm font-semibold"
              placeholder="e.g. template_xxxxxxx"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 ml-1">Public Key</label>
            <input 
              required
              type="text" 
              value={settings.publicKey}
              onChange={(e) => setSettings({...settings, publicKey: e.target.value})}
              className="w-full px-6 py-4 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:border-red-600 focus:outline-none transition-all text-sm font-semibold"
              placeholder="e.g. xxxxxxxxxxxxxxxxx"
            />
          </div>

          <button 
            type="submit"
            disabled={isSaving}
            className="w-full py-5 bg-black text-white rounded-[2rem] font-bold uppercase tracking-[0.3em] text-xs hover:bg-gray-800 transition-all shadow-xl shadow-gray-100 disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Update Settings"}
          </button>
        </form>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-3xl p-6 flex items-start gap-4">
        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
            <h4 className="text-xs font-bold text-blue-800 tracking-tight">Need Help?</h4>
            <p className="text-xs font-medium text-blue-600 leading-relaxed italic">
                Get these IDs from your <a href="https://dashboard.emailjs.com/" target="_blank" rel="noopener noreferrer" className="underline font-bold">EmailJS Dashboard</a>. 
                Any changes made here will apply instantly to new checkout orders.
            </p>
        </div>
      </div>
    </motion.div>
  );
}

function ProductModal({ product, onClose }: { product: Product | null, onClose: () => void }) {
  const [formData, setFormData] = useState({
    title: product?.title || '',
    category: product?.category || 'Gameloft Store',
    price: product?.price || '৳ ',
    description: product?.description || '',
    image: product?.image || '',
    images: product?.images || [],
    rating: product?.rating || 5,
    discount: product?.discount || '',
    secretSource: product?.secretSource || '',
    secretInstructions: product?.secretInstructions || '',
  });

  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (files.length === 0) return;

    setIsUploading(true);
    let processedCount = 0;
    const newImages: string[] = [];

    files.forEach(file => {
      if (file.size > 2 * 1024 * 1024) {
        alert(`${file.name} is too large. Please select files smaller than 2MB.`);
        processedCount++;
        if (processedCount === files.length) setIsUploading(false);
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        newImages.push(result);
        processedCount++;
        
        if (processedCount === files.length) {
          const updatedImages = [...(formData.images || []), ...newImages];
          setFormData({ 
            ...formData, 
            images: updatedImages,
            image: formData.image || newImages[0] // Set first as primary if none exists
          });
          setIsUploading(false);
        }
      };
      reader.onerror = () => {
        alert(`Failed to read file: ${file.name}`);
        processedCount++;
        if (processedCount === files.length) setIsUploading(false);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    const updatedImages = [...(formData.images || [])];
    const removedImage = updatedImages[index];
    updatedImages.splice(index, 1);
    
    // If we removed the primary image, pick the next available one or clear it
    let newPrimary = formData.image;
    if (formData.image === removedImage) {
      newPrimary = updatedImages.length > 0 ? updatedImages[0] : '';
    }

    setFormData({ 
      ...formData, 
      images: updatedImages,
      image: newPrimary 
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (product) {
        await updateDoc(doc(db, 'products', product.id!.toString()), {
          ...formData
        });
      } else {
        await addDoc(collection(db, 'products'), {
          ...formData,
          createdAt: firestoreTimestamp()
        });
      }
      onClose();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'products');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden"
      >
        <div className="p-8 space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight">{product ? 'Edit Product' : 'Add New Product'}</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-50 rounded-full transition-all">
              <X className="w-6 h-6 text-gray-400" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 ml-1">Product Title</label>
                <input 
                  required
                  type="text" 
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:border-red-600 focus:outline-none transition-all text-sm font-medium"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 ml-1">Category</label>
                <select 
                   value={formData.category}
                   onChange={(e) => setFormData({...formData, category: e.target.value})}
                   className="w-full px-4 py-3 rounded-2xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:border-red-600 focus:outline-none transition-all text-sm font-medium"
                >
                  <option>Gameloft Store</option>
                  <option>Premium Accounts</option>
                  <option>Subscriptions</option>
                  <option>Gift Cards</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 ml-1">Price (৳)</label>
                <input 
                  required
                  type="text" 
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:border-red-600 focus:outline-none transition-all text-sm font-medium"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 ml-1">Rating (1-5)</label>
                  <input 
                    type="number" 
                    min="1" 
                    max="5"
                    value={formData.rating}
                    onChange={(e) => setFormData({...formData, rating: parseInt(e.target.value)})}
                    className="w-full px-4 py-3 rounded-2xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:border-red-600 focus:outline-none transition-all text-sm font-medium"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 ml-1">Discount (e.g. -70%)</label>
                  <input 
                    type="text" 
                    placeholder="-70%"
                    value={formData.discount}
                    onChange={(e) => setFormData({...formData, discount: e.target.value})}
                    className="w-full px-4 py-3 rounded-2xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:border-red-600 focus:outline-none transition-all text-sm font-medium"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 ml-1">Product Images Gallery</label>
                
                {/* Image Gallery Grid */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {formData.images?.map((img, idx) => (
                    <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden group border border-gray-100">
                      <img src={img} alt="" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button 
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="p-2 bg-red-600 text-white rounded-xl hover:scale-110 transition-transform shadow-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        {formData.image !== img && (
                          <button 
                            type="button"
                            onClick={() => setFormData({ ...formData, image: img })}
                            className="p-2 bg-white text-black rounded-xl hover:scale-110 transition-transform shadow-lg"
                          >
                            <ImageIcon className="w-4 h-4" />
                          </button>
                        )}
                        {formData.image === img && (
                          <span className="absolute top-2 right-2 bg-red-600 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">Main</span>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Upload Placeholder */}
                  <div 
                    className={`relative aspect-square rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-2 cursor-pointer ${isUploading ? 'border-gray-200 bg-gray-50' : 'border-gray-100 bg-gray-50/50 hover:bg-white hover:border-red-600'}`}
                    onClick={() => document.getElementById('product-image-upload')?.click()}
                  >
                    <div className="w-8 h-8 rounded-xl bg-white shadow-sm flex items-center justify-center text-gray-400">
                      {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    </div>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Add Image</p>
                  </div>
                </div>

                <input 
                  id="product-image-upload"
                  type="file" 
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 ml-1">Description</label>
                <textarea 
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:border-red-600 focus:outline-none transition-all text-sm font-medium resize-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-blue-500 ml-1">Secret Source/Link (Auto-Email)</label>
                <input 
                  type="text" 
                  value={formData.secretSource}
                  onChange={(e) => setFormData({...formData, secretSource: e.target.value})}
                  className="w-full px-4 py-3 rounded-2xl border border-blue-100 bg-blue-50/20 focus:bg-white focus:border-blue-600 focus:outline-none transition-all text-sm font-bold text-blue-700"
                  placeholder="https://gdrive.com/file..."
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-green-500 ml-1">Delivery Instructions (Auto-Email)</label>
                <textarea 
                  rows={3}
                  value={formData.secretInstructions}
                  onChange={(e) => setFormData({...formData, secretInstructions: e.target.value})}
                  className="w-full px-4 py-3 rounded-2xl border border-green-100 bg-green-50/20 focus:bg-white focus:border-green-600 focus:outline-none transition-all text-sm font-medium resize-none"
                  placeholder="Instructions for the user..."
                />
              </div>
            </div>

            <div className="md:col-span-2 pt-4">
              <button 
                type="submit"
                className="w-full py-5 bg-red-600 text-white rounded-[2rem] font-bold uppercase tracking-[0.2em] text-xs hover:bg-black transition-all shadow-xl shadow-red-100"
              >
                {product ? 'Save Changes' : 'Add Product'}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

function OrderModal({ order, onClose }: { order: Order | null, onClose: () => void }) {
  if (!order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
      >
        <div className="p-8 space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Order Details</h2>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Order ID: #{order.id?.toUpperCase()}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-50 rounded-full transition-all">
              <X className="w-6 h-6 text-gray-400" />
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-50 pb-2">Customer Information</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
                      <UserIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Name</p>
                      <p className="text-sm font-bold">{order.customerName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Email</p>
                      <p className="text-sm font-bold">{order.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Phone</p>
                      <p className="text-sm font-bold">{order.phone}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-50 pb-2">Payment Details</h4>
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-gray-400 font-bold uppercase">Method</span>
                    <span className="text-xs font-black uppercase tracking-widest text-red-600">{order.paymentMethod}</span>
                  </div>
                  {order.senderNumber && (
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-gray-400 font-bold uppercase">Sender #</span>
                      <span className="text-xs font-bold">{order.senderNumber}</span>
                    </div>
                  )}
                  {order.transactionId && (
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-gray-400 font-bold uppercase">TrxID</span>
                      <span className="text-xs font-bold">{order.transactionId}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-50 pb-2">Order Items</h4>
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-start bg-white border border-gray-50 p-4 rounded-2xl group hover:border-red-100 transition-colors">
                      <div className="flex-1 min-w-0 pr-4">
                        <p className="text-xs font-bold text-gray-900 group-hover:text-red-600 transition-colors">{item.title}</p>
                        <p className="text-[9px] text-gray-400 font-bold mt-1 uppercase tracking-widest">Qty: {item.quantity}</p>
                      </div>
                      <span className="text-xs font-black tracking-tight">{item.price}</span>
                    </div>
                  ))}
                </div>
                <div className="pt-4 border-t border-gray-50">
                   <div className="flex justify-between items-center">
                      <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Grand Total</span>
                      <span className="text-2xl font-black text-red-600 tracking-tighter">৳ {order.totalPrice}</span>
                   </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-50 pb-2">Metadata</h4>
                <div className="text-[9px] text-gray-400 font-bold space-y-1">
                  <p>Order Date: {order.createdAt?.toDate?.()?.toLocaleString() || 'N/A'}</p>
                  <p>Status: <span className="uppercase">{order.status}</span></p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4">
               <button 
                onClick={onClose}
                className="w-full py-4 bg-black text-white rounded-2xl font-bold uppercase tracking-[0.2em] text-[10px] hover:bg-gray-800 transition-all shadow-xl shadow-gray-100"
               >
                 Close Summary
               </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function ServicesManagement({ plans, onDelete }: { plans: any[], onDelete: (id: string, name: string) => void }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleEdit = (plan: any) => {
    setEditingId(plan.id);
    setEditForm(plan);
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleSave = async () => {
    if (!editingId) return;
    try {
      setLoading(true);
      const planRef = doc(db, 'service_plans', editingId);
      const { id, ...data } = editForm;
      await updateDoc(planRef, data);
      setEditingId(null);
      setMessage({ type: 'success', text: 'Plan updated successfully!' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Error updating plan' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    onDelete(id, name);
  };

  const handleAdd = async () => {
    const newPlan = {
      name: 'New Plan',
      id: `plan-${Date.now()}`,
      description: 'New service description',
      trial: '2 days trial',
      features: ['Feature 1'],
      color: 'bg-white',
      accent: 'text-purple-600',
      buttonClass: 'bg-purple-600 text-white',
      monthlyPriceOriginal: '1000',
      monthlyPrice: '500',
      yearlyPriceOriginal: '10000',
      yearlyPrice: '5000',
      badgeMonthly: '',
      badgeYearly: '',
      order: plans.length + 1
    };

    try {
      setLoading(true);
      await addDoc(collection(db, 'service_plans'), newPlan);
      setMessage({ type: 'success', text: 'New plan added!' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Error adding plan' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Service Plans</h1>
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Manage dynamic pricing plans</p>
          </div>
        </div>
        <button 
          onClick={handleAdd}
          className="flex items-center gap-2 bg-black text-white px-6 py-3 rounded-2xl font-bold uppercase tracking-widest text-[10px] hover:bg-red-600 transition-all shadow-lg"
        >
          <Plus className="w-4 h-4" /> Add New Plan
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-2xl flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
          <CheckCircle2 className="w-5 h-5" /> {message.text}
          <button onClick={() => setMessage(null)} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {plans.map((plan) => (
          <div key={plan.id} className="bg-white rounded-[2.5rem] shadow-sm p-8 border border-gray-100">
            {editingId === plan.id ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400 ml-1">Plan Name</label>
                    <input 
                      type="text" 
                      value={editForm.name} 
                      onChange={e => setEditForm({...editForm, name: e.target.value})}
                      className="w-full px-4 py-3 rounded-2xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:border-red-600 focus:outline-none transition-all text-sm font-semibold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400 ml-1">Slug (ID)</label>
                    <input 
                      type="text" 
                      value={editForm.id} 
                      onChange={e => setEditForm({...editForm, id: e.target.value})}
                      className="w-full px-4 py-3 rounded-2xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:border-red-600 focus:outline-none transition-all text-sm font-semibold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400 ml-1">Background Class</label>
                    <input 
                      type="text" 
                      value={editForm.color} 
                      onChange={e => setEditForm({...editForm, color: e.target.value})}
                      className="w-full px-4 py-3 rounded-2xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:border-red-600 focus:outline-none transition-all text-sm font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                   <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400 ml-1">Monthly Original</label>
                    <input 
                      type="text" 
                      value={editForm.monthlyPriceOriginal} 
                      onChange={e => setEditForm({...editForm, monthlyPriceOriginal: e.target.value})}
                      className="w-full px-4 py-3 rounded-2xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:border-red-600 focus:outline-none transition-all text-sm font-semibold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400 ml-1">Monthly Cost</label>
                    <input 
                      type="text" 
                      value={editForm.monthlyPrice} 
                      onChange={e => setEditForm({...editForm, monthlyPrice: e.target.value})}
                      className="w-full px-4 py-3 rounded-2xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:border-red-600 focus:outline-none transition-all text-sm font-semibold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400 ml-1">Yearly Original</label>
                    <input 
                      type="text" 
                      value={editForm.yearlyPriceOriginal} 
                      onChange={e => setEditForm({...editForm, yearlyPriceOriginal: e.target.value})}
                      className="w-full px-4 py-3 rounded-2xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:border-red-600 focus:outline-none transition-all text-sm font-semibold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400 ml-1">Yearly Cost</label>
                    <input 
                      type="text" 
                      value={editForm.yearlyPrice} 
                      onChange={e => setEditForm({...editForm, yearlyPrice: e.target.value})}
                      className="w-full px-4 py-3 rounded-2xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:border-red-600 focus:outline-none transition-all text-sm font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400 ml-1">Description</label>
                    <textarea 
                      value={editForm.description} 
                      onChange={e => setEditForm({...editForm, description: e.target.value})}
                      className="w-full px-4 py-3 rounded-2xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:border-red-600 focus:outline-none transition-all text-sm font-medium resize-none"
                      rows={2}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400 ml-1">Trial Text</label>
                    <input 
                      type="text" 
                      value={editForm.trial} 
                      onChange={e => setEditForm({...editForm, trial: e.target.value})}
                      className="w-full px-4 py-3 rounded-2xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:border-red-600 focus:outline-none transition-all text-sm font-semibold"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400 ml-1">Features (One per line)</label>
                  <textarea 
                    value={editForm.features?.join('\n')} 
                    onChange={e => setEditForm({...editForm, features: e.target.value.split('\n')})}
                    className="w-full px-4 py-3 rounded-2xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:border-red-600 focus:outline-none transition-all text-sm font-medium h-32"
                  />
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button onClick={handleCancel} className="px-8 py-3 rounded-2xl font-bold text-gray-400 uppercase tracking-widest text-[10px] hover:text-black transition-all">Cancel</button>
                  <button onClick={handleSave} className="flex items-center gap-2 px-8 py-3 bg-black text-white rounded-2xl font-bold uppercase tracking-widest text-[10px] hover:bg-red-600 transition-all shadow-lg">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Plan
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col md:flex-row justify-between gap-8 group">
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-3">
                    <h3 className="text-2xl font-black tracking-tighter uppercase">{plan.name}</h3>
                    <div className="flex gap-2">
                       {plan.badgeMonthly && <span className="text-[8px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-black uppercase tracking-widest">{plan.badgeMonthly}</span>}
                       {plan.badgeYearly && <span className="text-[8px] bg-green-50 text-green-600 px-2 py-0.5 rounded-full font-black uppercase tracking-widest">{plan.badgeYearly}</span>}
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 font-medium leading-relaxed max-w-2xl">{plan.description}</p>
                  
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                      <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-1">Monthly</p>
                      <p className="text-lg font-black text-red-600">৳ {plan.monthlyPrice}</p>
                      <p className="text-[9px] text-gray-400 line-through">৳ {plan.monthlyPriceOriginal}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                      <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-1">Yearly</p>
                      <p className="text-lg font-black text-blue-600">৳ {plan.yearlyPrice}</p>
                      <p className="text-[9px] text-gray-400 line-through">৳ {plan.yearlyPriceOriginal}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                      <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-1">Features</p>
                      <p className="text-lg font-black">{plan.features.length} Items</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                      <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-1">Trial</p>
                      <p className="text-xs font-bold truncate">{plan.trial}</p>
                    </div>
                  </div>
                </div>
                <div className="flex md:flex-col gap-3 justify-center">
                  <button onClick={() => handleEdit(plan)} className="p-4 bg-gray-50 hover:bg-black hover:text-white rounded-[1.5rem] transition-all border border-gray-100 shadow-sm"><Edit className="w-5 h-5"/></button>
                  <button onClick={() => handleDelete(plan.id, plan.name)} className="p-4 bg-gray-50 hover:bg-red-500 hover:text-white rounded-[1.5rem] transition-all border border-gray-100 shadow-sm text-gray-400"><Trash2 className="w-5 h-5"/></button>
                </div>
              </div>
            )}
          </div>
        ))}
        {plans.length === 0 && (
          <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-gray-100">
            <Zap className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No service plans found.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function ConfirmDialog({ 
  isOpen, 
  title, 
  message, 
  onConfirm, 
  onCancel, 
  isLoading 
}: { 
  isOpen: boolean, 
  title: string, 
  message: string, 
  onConfirm: () => void, 
  onCancel: () => void,
  isLoading?: boolean
}) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden p-8 text-center space-y-6"
      >
        <div className="w-20 h-20 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto">
          <Trash2 className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black tracking-tight text-gray-900">{title}</h2>
          <p className="text-gray-500 text-sm font-medium">{message}</p>
        </div>
        <div className="flex flex-col gap-3 pt-2">
          <button 
            onClick={onConfirm}
            disabled={isLoading}
            className="w-full py-4 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-black transition-all shadow-xl shadow-red-100 disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Yes, Delete Permanently"}
          </button>
          <button 
            disabled={isLoading}
            onClick={onCancel}
            className="w-full py-4 bg-gray-50 text-gray-400 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:text-black transition-all"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </div>
  );
}
