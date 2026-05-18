import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle } from 'lucide-react';
import { getSiteSettings } from '../lib/services';

const WhatsAppFloatingButton: React.FC = () => {
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settings = await getSiteSettings();
        if (settings?.whatsappNumber) {
          setWhatsappNumber(settings.whatsappNumber.replace(/\D/g, ''));
          setIsVisible(true);
        }
      } catch (error) {
        console.error('Error fetching WhatsApp setting:', error);
      }
    };
    fetchSettings();

    // Show after 2 seconds
    const timer = setTimeout(() => setIsVisible(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleClick = () => {
    const number = whatsappNumber || '8801700000000'; // Fallback
    const message = encodeURIComponent('হ্যালো, আমি আপনাদের সার্ভিস সম্পর্কে জানতে চাই।');
    window.open(`https://wa.me/${number}?text=${message}`, '_blank');
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999]">
      <motion.button
        initial={{ scale: 0, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={handleClick}
        className="bg-[#25D366] text-white p-4 rounded-full shadow-2xl flex items-center justify-center group relative"
        aria-label="Contact on WhatsApp"
      >
        <MessageCircle className="w-8 h-8" />
        
        {/* Tooltip */}
        <span className="absolute right-full mr-3 bg-white text-black text-xs font-bold px-3 py-2 rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-gray-100 italic">
          সরাসরি হোয়াটসঅ্যাপে চ্যাট করুন
        </span>

        {/* Pulse Effect */}
        <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-20 -z-10"></span>
      </motion.button>
    </div>
  );
};

export default WhatsAppFloatingButton;
