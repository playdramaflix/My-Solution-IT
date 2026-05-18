import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from './firebase';

export interface ServicePlan {
  id: string;
  name: string;
  description: string;
  trial: string;
  features: string[];
  color: string;
  accent: string;
  buttonClass: string;
  monthlyPriceOriginal: string;
  monthlyPrice: string;
  yearlyPriceOriginal: string;
  yearlyPrice: string;
  badgeMonthly: string;
  badgeYearly: string;
  order: number;
}

export const getServicePlans = async (): Promise<ServicePlan[]> => {
  const plansRef = collection(db, 'service_plans');
  const q = query(plansRef, orderBy('order', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    ...doc.data(),
    id: doc.id
  } as ServicePlan));
};

export const getSiteSettings = async () => {
  const { doc, getDoc } = await import('firebase/firestore');
  const docRef = doc(db, 'settings', 'site');
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data();
  }
  return null;
};
