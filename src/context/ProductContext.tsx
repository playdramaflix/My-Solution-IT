import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Product } from '../types';
import { featuredProducts, bestSellers } from '../data';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';

interface ProductContextType {
  products: Product[];
  loading: boolean;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const ProductProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    
    // Safety timeout: if Firestore doesn't respond in 4 seconds, show fallback
    const timeoutId = setTimeout(() => {
      if (isMounted && loading) {
        console.warn("Firestore responsive timeout - using fallback");
        setProducts([...featuredProducts, ...bestSellers]);
        setLoading(false);
      }
    }, 4000);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      clearTimeout(timeoutId);
      if (!isMounted) return;

      if (snapshot.empty) {
        setProducts([...featuredProducts, ...bestSellers]);
      } else {
        const prodData = snapshot.docs.map(doc => {
          const data = doc.data();
          return { 
            ...data,
            id: doc.id,
          } as Product;
        });
        // Merge Firestore products with local ones to show both
        setProducts([...prodData, ...featuredProducts, ...bestSellers]);
      }
      setLoading(false);
    }, (err) => {
      clearTimeout(timeoutId);
      if (!isMounted) return;
      console.warn("Firestore access error:", err.message);
      setProducts([...featuredProducts, ...bestSellers]);
      setLoading(false);
    });

    return () => {
      isMounted = false;
      unsubscribe();
      clearTimeout(timeoutId);
    };
  }, []);

  return (
    <ProductContext.Provider value={{ products, loading }}>
      {children}
    </ProductContext.Provider>
  );
};

export const useProducts = () => {
  const context = useContext(ProductContext);
  if (context === undefined) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  return context;
};
