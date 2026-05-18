
import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { auth, db } from './lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingBag, 
  Package, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ChevronRight, 
  User as UserIcon,
  CreditCard,
  History,
  TrendingUp,
  Receipt,
  LogOut,
  Key,
  Mail,
  Settings
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Order } from './types';

export default function Profile() {
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u);
        fetchOrders(u.email!);
      } else {
        navigate('/');
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchOrders = async (email: string) => {
    try {
      // First try with server-side sorting (requires index)
      const q = query(
        collection(db, 'orders'),
        where('email', '==', email),
        orderBy('createdAt', 'desc')
      );
      
      let querySnapshot;
      try {
        querySnapshot = await getDocs(q);
      } catch (indexErr) {
        console.warn("Index might be missing, falling back to manual sort:", indexErr);
        // Fallback: fetch without order and sort in memory
        const fallbackQ = query(
          collection(db, 'orders'),
          where('email', '==', email)
        );
        querySnapshot = await getDocs(fallbackQ);
      }

      const ordersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];
      
      // Sort in memory if the server didn't already sort it (or as a double check)
      ordersData.sort((a, b) => {
        const timeA = a.createdAt?.toMillis?.() || 0;
        const timeB = b.createdAt?.toMillis?.() || 0;
        return timeB - timeA;
      });

      setOrders(ordersData);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const totalSpent = orders
    .filter(o => o.status !== 'cancelled')
    .reduce((sum, order) => sum + order.totalPrice, 0);

  const stats = [
    { label: 'Total Orders', value: orders.length, icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Total Spent', value: `৳ ${totalSpent}`, icon: CreditCard, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Purchased Items', value: orders.reduce((sum, o) => sum + o.items.length, 0), icon: Package, color: 'text-red-600', bg: 'bg-red-50' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] pb-20">
      {/* Header Profile Section */}
      <div className="bg-white border-b border-gray-100 pt-32 pb-12">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="relative">
                <div className="w-24 h-24 md:w-32 md-h-32 rounded-[2.5rem] bg-red-50 flex items-center justify-center overflow-hidden border-4 border-white shadow-xl shadow-gray-100">
                  {user?.photoURL ? (
                    <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon className="w-12 h-12 text-red-600" />
                  )}
                </div>
                <div className="absolute -bottom-2 -right-2 bg-green-500 w-6 h-6 rounded-full border-4 border-white"></div>
              </div>
              <div className="text-center md:text-left space-y-2">
                <h1 className="text-3xl font-black tracking-tight text-gray-900">{user?.displayName || 'Customer'}</h1>
                <p className="text-gray-400 font-bold tracking-widest text-xs">{user?.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link 
                to="/cart" 
                className="p-4 bg-gray-50 text-gray-600 rounded-[1.5rem] border border-gray-100 hover:bg-red-50 hover:text-red-600 transition-all group"
                title="Go to Cart"
              >
                <ShoppingBag className="w-6 h-6 group-hover:scale-110 transition-transform" />
              </Link>
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 px-6 py-4 bg-black text-white rounded-[1.5rem] font-black tracking-widest text-[10px] hover:bg-red-600 transition-all shadow-xl shadow-gray-100"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-12">
            {stats.map((stat, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white border border-gray-100 p-6 rounded-[2rem] flex items-center gap-4 hover:shadow-xl hover:shadow-gray-100 transition-all group"
              >
                <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-black tracking-widest mb-1">{stat.label}</p>
                  <p className="text-xl font-black tracking-tight">{stat.value}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 space-y-12">
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-gray-900">Order History</h2>
              <p className="text-xs text-gray-400 font-bold tracking-widest mt-1">Manage your recent purchases</p>
            </div>
            <History className="w-6 h-6 text-gray-300" />
          </div>

          {orders.length === 0 ? (
            <div className="bg-white border border-dashed border-gray-200 rounded-[3rem] p-20 text-center space-y-4">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">No orders yet</h3>
              <p className="text-sm text-gray-400">Time to start your shopping journey!</p>
              <Link to="/" className="inline-block px-8 py-4 bg-black text-white rounded-2xl text-xs font-black tracking-widest hover:bg-red-600 transition-all shadow-xl shadow-red-100">
                Browse Products
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order, idx) => (
              <motion.div 
                key={order.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white border border-gray-100 rounded-[2.5rem] overflow-hidden hover:shadow-xl hover:shadow-gray-100 transition-all group"
              >
                <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-red-600 relative overflow-hidden">
                       <Receipt className="w-7 h-7" />
                       <div className="absolute top-0 right-0 w-8 h-8 bg-black/5 -mr-4 -mt-4 rotate-45"></div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-black text-gray-900 tracking-tight">Order #{order.id?.slice(-8).toUpperCase()}</h4>
                        <StatusBadge status={order.status} />
                      </div>
                      <p className="text-[10px] text-gray-400 font-bold tracking-wider">
                        {order.createdAt?.toDate?.()?.toLocaleString() || 'Recent'}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 md:gap-12">
                     <div>
                        <p className="text-[9px] text-gray-400 font-black tracking-widest mb-1">Items</p>
                        <div className="flex -space-x-2">
                           {order.items.slice(0, 3).map((item, i) => (
                             <div key={i} className="w-8 h-8 rounded-full bg-white border border-gray-100 flex items-center justify-center text-[10px] font-bold shadow-sm">
                                {item.title.charAt(0)}
                             </div>
                           ))}
                           {order.items.length > 3 && (
                             <div className="w-8 h-8 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-400">
                                +{order.items.length - 3}
                             </div>
                           )}
                        </div>
                     </div>
                     <div>
                        <p className="text-[9px] text-gray-400 font-black tracking-widest mb-1">Payment</p>
                        <p className="text-xs font-black tracking-widest text-red-600">{order.paymentMethod}</p>
                     </div>
                     <div className="text-right">
                        <p className="text-[9px] text-gray-400 font-black tracking-widest mb-1">Total Amount</p>
                        <p className="text-xl font-black text-gray-900">৳ {order.totalPrice}</p>
                     </div>
                  </div>
                </div>

                {/* Expanded Details Section - Optional/Compact */}
                <div className="px-8 pb-8 pt-4 border-t border-gray-50 bg-gray-50/30">
                   <div className="space-y-3">
                      {order.items.map((item, i) => (
                        <div key={i} className="flex justify-between items-center bg-white p-3 rounded-xl border border-gray-50">
                           <span className="text-xs font-bold text-gray-600">{item.title} x{item.quantity}</span>
                           <span className="text-xs font-black">{item.price}</span>
                        </div>
                      ))}
                   </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  </div>
);
}

function StatusBadge({ status }: { status: string }) {
  const configs: Record<string, { label: string, icon: any, color: string, bg: string }> = {
    pending: { label: 'Pending', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    processing: { label: 'Processing', icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' },
    completed: { label: 'Completed', icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
    cancelled: { label: 'Cancelled', icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
  };

  const config = configs[status] || configs.pending;

  return (
    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${config.bg} ${config.color}`}>
      <config.icon className="w-3 h-3" />
      <span className="text-[10px] font-black tracking-widest">{config.label}</span>
    </div>
  );
}
