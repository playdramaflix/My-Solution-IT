import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Product, Post } from '../types';
import { allProducts } from '../data';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';

interface ProductContextType {
  products: Product[];
  posts: Post[];
  loading: boolean;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const ProductProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const qPosts = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    
    // Safety timeout: if Firestore doesn't respond in 4 seconds, show fallback
    const timeoutId = setTimeout(() => {
      if (isMounted && loading) {
        console.warn("Firestore responsive timeout - using fallback");
        setProducts(allProducts);
        setLoading(false);
      }
    }, 4000);

    const unsubProducts = onSnapshot(q, (snapshot) => {
      clearTimeout(timeoutId);
      if (!isMounted) return;

      if (snapshot.empty) {
        setProducts(allProducts);
      } else {
        const prodData = snapshot.docs.map(doc => {
          const data = doc.data();
          return { 
            ...data,
            id: doc.id,
          } as Product;
        });
        // Show only Firestore products once populated so they are 100% editable
        setProducts(prodData);
      }
      setLoading(false);
    }, (err) => {
      clearTimeout(timeoutId);
      if (!isMounted) return;
      console.warn("Firestore products access error:", err.message);
      setProducts(allProducts);
      setLoading(false);
    });

    const unsubPosts = onSnapshot(qPosts, (snapshot) => {
      if (!isMounted) return;
      const postData = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as Post[];
      setPosts(postData);
    }, (err) => {
      console.warn("Firestore posts access error:", err.message);
    });

    return () => {
      isMounted = false;
      unsubProducts();
      unsubPosts();
      clearTimeout(timeoutId);
    };
  }, []);

  return (
    <ProductContext.Provider value={{ products, posts, loading }}>
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
