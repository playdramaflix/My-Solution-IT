import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface SiteSettings {
  siteName: string;
  siteSubtitle: string;
  logoUrl: string;
  bannerUrl: string;
  bannerTitle: string;
  bannerDesc: string;
}

interface SiteContextType {
  settings: SiteSettings;
  loading: boolean;
}

const defaultSettings: SiteSettings = {
  siteName: 'MY SOLUTION IT',
  siteSubtitle: 'Your Trusted Business Partner',
  logoUrl: '',
  bannerUrl: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=2070&auto=format&fit=crop',
  bannerTitle: 'Premium Tech Solutions',
  bannerDesc: 'Unlock premium features and services for your business at unbeatable prices.'
};

const SiteContext = createContext<SiteContextType | undefined>(undefined);

export const SiteProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'site'), (docSnap) => {
      if (docSnap.exists()) {
        setSettings(docSnap.data() as SiteSettings);
      }
      setLoading(false);
    }, (err) => {
      console.warn("Site settings error:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <SiteContext.Provider value={{ settings, loading }}>
      {children}
    </SiteContext.Provider>
  );
};

export const useSiteSettings = () => {
  const context = useContext(SiteContext);
  if (context === undefined) {
    throw new Error('useSiteSettings must be used within a SiteProvider');
  }
  return context;
};
