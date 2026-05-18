import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, ChevronDown, MessageSquare, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getServicePlans, ServicePlan } from './lib/services';

const ServicesPage: React.FC = () => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [plans, setPlans] = useState<ServicePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [whatsapp, setWhatsapp] = useState("8801700000000");
  const navigate = useNavigate();

  const handleCreateWebsite = (plan: ServicePlan) => {
    const phoneNumber = whatsapp.replace(/\D/g, ''); 
    const price = billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
    const cycleText = billingCycle === 'monthly' ? 'মাসিক' : 'বাৎসরিক';
    
    const message = `হ্যালো, আমি আপনাদের "${plan.name}" প্ল্যানটি (${cycleText} সাবস্ক্রিপশন, মূল্য: ৳${price}) নিতে আগ্রহী। দয়া করে পরবর্তী ধাপগুলো জানান।`;
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
  };

  const DEFAULT_PLANS: ServicePlan[] = [
    {
      name: 'স্টার্টার প্যাকেজ',
      id: 'starter',
      monthlyPriceOriginal: '৮০০',
      monthlyPrice: '৪৪৯',
      yearlyPriceOriginal: '৯,৬০০',
      yearlyPrice: '৪,৯৯৯',
      description: 'ডেভেলপার বা Domain হোস্টিং ছাড়াই, ৫ মিনিটে প্রফেশনাল ওয়েবসাইট তৈরি।',
      trial: '২ দিনের ফ্রি ট্রায়াল',
      features: [
        'জাভাস্ক্রিপ্ট-ভিত্তিক মোবাইল ফ্রেন্ডলি ওয়েবসাইট',
        'সুপার ফাস্ট ও সিকিউর ওয়েবসাইট',
        'রিপোর্টিং সেলস ড্যাশবোর্ড',
        'বিক্রয় রিপোর্টিং ড্যাশবোর্ড',
        'অ্যাডভান্সড প্রোডাক্ট ম্যানেজমেন্ট',
        'সম্পূর্ণ অর্ডার ম্যানেজমেন্ট',
        'অটো কুরিয়ার ম্যানেজমেন্ট',
        'ফ্রড চেকিং সিস্টেম',
        'মাল্টিপল ইনভয়েস অপশন',
        'আনলিমিটেড ল্যান্ডিং পেজ'
      ],
      color: 'bg-white',
      accent: 'text-purple-600',
      buttonClass: 'bg-purple-600 hover:bg-purple-700 text-white',
      badgeMonthly: '',
      badgeYearly: 'সেভ ২০%',
      order: 1
    },
    {
      name: 'প্রিমিয়াম প্যাকেজ',
      id: 'premium',
      monthlyPriceOriginal: '২,০০০',
      monthlyPrice: '১,২৯৯',
      yearlyPriceOriginal: '২৪,০০০',
      yearlyPrice: '১২,৯৯৯',
      description: 'ডেভেলপার বা Domain হোস্টিং ছাড়াই, ৫ মিনিটে প্রফেশনাল ওয়েবসাইট তৈরি।',
      trial: '২ দিনের ফ্রি ট্রায়াল',
      features: [
        'জাভাস্ক্রিপ্ট-ভিত্তিক মোবাইল ফ্রেন্ডলি ওয়েবসাইট',
        'সুপার ফাস্ট ও সিকিউর ওয়েবসাইট',
        'ইজি চেক আউট সিস্টেম',
        'রিপোর্টিং সেলস ড্যাশবোর্ড',
        'অ্যাডভান্সড প্রোডাক্ট ম্যানেজমেন্ট',
        'সম্পূর্ণ অর্ডার ম্যানেজমেন্ট',
        'অটো কুরিয়ার ম্যানেজমেন্ট',
        'ফ্রড চেকিং সিস্টেম',
        'মাল্টিপল ইনভয়েস অপশন',
        'আনলিমিটেড ল্যান্ডিং পেজ'
      ],
      color: 'bg-purple-600',
      accent: 'text-white',
      buttonClass: 'bg-white hover:bg-gray-100 text-purple-600',
      badgeMonthly: 'সেরা মূল্য',
      badgeYearly: 'সেরা ভ্যালু (সেভ ১৫%)',
      order: 2
    },
    {
      name: 'লাইট প্যাকেজ',
      id: 'lite',
      monthlyPriceOriginal: '১,২০০',
      monthlyPrice: '৬৯৯',
      yearlyPriceOriginal: '১৪,৪০০',
      yearlyPrice: '৬,৯৯৯',
      description: 'ডেভেলপার বা Domain হোস্টিং ছাড়াই, ৫ মিনিটে প্রফেশনাল ওয়েবসাইট তৈরি।',
      trial: '২ দিনের ফ্রি ট্রায়াল',
      features: [
        'জাভাস্ক্রিপ্ট-ভিত্তিক মোবাইল ফ্রেন্ডলি ওয়েবসাইট',
        'সুপার ফাস্ট ও সিকিউর ওয়েবসাইট',
        'রিপোর্টিং সেলস ড্যাশবোর্ড',
        'বিক্রয় রিপোর্টিং ড্যাশবোর্ড',
        'অ্যাডভান্সড প্রোডাক্ট ম্যানেজমেন্ট',
        'সম্পূর্ণ অর্ডার ম্যানেজমেন্ট',
        'অটো কুরিয়ার ম্যানেজমেন্ট',
        'ফ্রড চেকিং সিস্টেম',
        'মাল্টিপল ইনভয়েস অপশন',
        'আনলিমিটেড ল্যান্ডিং পেজ'
      ],
      color: 'bg-white',
      accent: 'text-purple-600',
      buttonClass: 'bg-purple-600 hover:bg-purple-700 text-white',
      badgeMonthly: '',
      badgeYearly: 'সেভ ১৭%',
      order: 3
    }
  ];

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const { getSiteSettings } = await import('./lib/services');
        const [plansData, settings] = await Promise.all([
          getServicePlans(),
          getSiteSettings()
        ]);
        
        if (plansData.length > 0) {
          setPlans(plansData);
        } else {
          setPlans(DEFAULT_PLANS);
        }

        if (settings?.whatsappNumber) {
          setWhatsapp(settings.whatsappNumber);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setPlans(DEFAULT_PLANS);
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f0ff] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f0ff] py-12 px-4 md:px-0 relative overflow-hidden">
      {/* Background Decorative Elements - Matching requested image */}
      <div className="absolute -bottom-24 -left-24 w-[500px] h-[500px] pointer-events-none opacity-20">
        <div className="w-full h-full rounded-full border border-purple-400/30 flex items-center justify-center">
          <div className="w-[90%] h-[90%] rounded-full border border-purple-400/30 flex items-center justify-center">
            <div className="w-[80%] h-[80%] rounded-full border border-purple-400/30 flex items-center justify-center">
              <div className="w-[70%] h-[70%] rounded-full border border-purple-400/30 flex items-center justify-center">
                <div className="w-[60%] h-[60%] rounded-full border border-purple-400/30 flex items-center justify-center">
                  <div className="w-[50%] h-[50%] rounded-full border border-purple-400/30 flex items-center justify-center">
                    <div className="w-[40%] h-[40%] rounded-full border border-purple-400/30" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="absolute top-0 right-0 w-full h-[300px] bg-gradient-to-b from-white/40 to-transparent -z-10" />

      <div className="max-w-7xl mx-auto flex flex-col items-center relative z-10">
        {/* Billing Toggle */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 inline-flex bg-gray-200 p-1 rounded-full border border-gray-300 relative"
        >
          <button 
            onClick={() => setBillingCycle('monthly')}
            className={`px-8 py-2.5 rounded-full text-sm font-bold transition-all relative z-10 ${
              billingCycle === 'monthly' ? 'text-purple-600' : 'text-gray-500'
            }`}
          >
            মাসিক সাবস্ক্রিপশন
            {billingCycle === 'monthly' && (
              <motion.div 
                layoutId="activeCycle"
                className="absolute inset-0 bg-white rounded-full shadow-md -z-10"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
          </button>
          <button 
            onClick={() => setBillingCycle('yearly')}
            className={`px-8 py-2.5 rounded-full text-sm font-bold transition-all relative z-10 ${
              billingCycle === 'yearly' ? 'text-purple-600' : 'text-gray-500'
            }`}
          >
            বাৎসরিক সাবস্ক্রিপশন
            {billingCycle === 'yearly' && (
              <motion.div 
                layoutId="activeCycle"
                className="absolute inset-0 bg-white rounded-full shadow-md -z-10"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
          </button>
        </motion.div>

        {/* Pricing Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-6xl px-4">
          {plans.map((plan, idx) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
              whileHover={{ y: -10 }}
              className={`relative rounded-xl p-8 shadow-xl ${plan.color} ${
                plan.id === 'premium' ? 'md:scale-105 z-10 border-4 border-purple-400' : 'border border-gray-100'
              } flex flex-col transition-shadow duration-300 hover:shadow-2xl`}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={billingCycle}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                >
                  {((billingCycle === 'monthly' && plan.badgeMonthly) || (billingCycle === 'yearly' && plan.badgeYearly)) && (
                    <div className="absolute top-4 right-4 bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase shadow-lg">
                      {billingCycle === 'monthly' ? plan.badgeMonthly : plan.badgeYearly}
                    </div>
                  )}
                  
                  <div className={`text-center mb-8 ${plan.id === 'premium' ? 'text-white' : 'text-gray-900'}`}>
                    <h3 className="text-xl font-bold mb-4">{plan.name}</h3>
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <span className="text-lg line-through opacity-50">
                        ৳{billingCycle === 'monthly' ? plan.monthlyPriceOriginal : plan.yearlyPriceOriginal}
                      </span>
                      <span className="text-4xl font-black tracking-tighter">
                        ৳{billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice}
                      </span>
                      <span className="text-sm font-medium opacity-70">/ {billingCycle === 'monthly' ? 'মাস' : 'বছর'}</span>
                    </div>
                    <p className="text-xs opacity-80 leading-relaxed max-w-[200px] mx-auto font-medium">
                      {plan.description}
                    </p>
                  </div>
                </motion.div>
              </AnimatePresence>

              <div className="flex flex-col gap-4 mb-8">
                <button 
                  onClick={() => handleCreateWebsite(plan)}
                  className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all shadow-md active:scale-95 ${plan.buttonClass}`}
                >
                  এখনই ওয়েবসাইট তৈরি করুন
                </button>
                <p className={`text-center text-[10px] font-bold opacity-60 ${plan.id === 'premium' ? 'text-white' : 'text-gray-500'}`}>
                  {plan.trial}
                </p>
              </div>

              <div className="space-y-4">
                <h4 className={`text-[11px] font-bold uppercase tracking-wider text-center mb-4 ${plan.id === 'premium' ? 'text-white' : 'text-gray-900'}`}>
                  আমাদের থেকে ওয়েবসাইট নিলে যা যা পাবেন
                </h4>
                {plan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className={`mt-0.5 rounded-full p-0.5 ${plan.id === 'premium' ? 'bg-white' : 'bg-purple-600'}`}>
                      <Check className={`w-3 h-3 ${plan.id === 'premium' ? 'text-purple-600' : 'text-white'}`} strokeWidth={4} />
                    </div>
                    <span className={`text-xs font-medium ${plan.id === 'premium' ? 'text-white' : 'text-gray-600'}`}>
                      {feature}
                    </span>
                  </div>
                ))}
              </div>

              <div className={`mt-8 pt-6 border-t ${plan.id === 'premium' ? 'border-purple-500' : 'border-gray-100'} text-center`}>
                <button className={`inline-flex items-center gap-2 text-[11px] font-bold uppercase ${plan.id === 'premium' ? 'text-white/80' : 'text-gray-400'}`}>
                  সব ফিচার দেখুন <span className="opacity-50">. আরও ৩টি</span> <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Floating Chat Icon */}
        <div className="fixed bottom-8 right-8">
          <button className="w-16 h-16 bg-purple-600 text-white rounded-full flex items-center justify-center shadow-2xl transition-transform hover:scale-110 active:scale-95">
            <MessageSquare className="w-8 h-8" fill="white" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServicesPage;
