import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product } from '../types';
import { doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface CartItem extends Product {
  quantity: number;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, quantity: number) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  setEmail: (email: string) => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [email, setEmailState] = useState(() => localStorage.getItem('visitor_email') || '');
  const [ip, setIp] = useState('');
  const [visitorId] = useState(() => {
    let id = localStorage.getItem('visitor_id');
    if (!id) {
      id = 'v_' + Math.random().toString(36).substring(2, 11) + Date.now();
      localStorage.setItem('visitor_id', id);
    }
    return id;
  });

  const setEmail = (newEmail: string) => {
    setEmailState(newEmail);
    localStorage.setItem('visitor_email', newEmail);
  };

  // Fetch IP address
  useEffect(() => {
    fetch('https://api.ipify.org?format=json')
      .then(res => res.json())
      .then(data => setIp(data.ip))
      .catch(err => console.warn("Could not fetch IP:", err));
  }, []);

  // Sync with Firestore whenever cart, email, or ip changes
  useEffect(() => {
    const syncAbandonedCart = async () => {
        const cartRef = doc(db, 'abandoned_carts', visitorId);
        
        if (cart.length === 0) {
            try {
                await deleteDoc(cartRef);
            } catch (err) {
                console.warn("Could not delete empty cart record", err);
            }
            return;
        }

        try {
            await setDoc(cartRef, {
                visitorId,
                email,
                ip,
                items: cart.map(item => ({
                    id: item.id,
                    title: item.title,
                    price: item.price,
                    quantity: item.quantity,
                    image: item.image
                })),
                totalPrice: cart.reduce((sum, item) => {
                    const priceStr = item.price.split('–')[0].replace(/,/g, '');
                    const priceValue = parseFloat(priceStr.replace(/[^0-9.]/g, '')) || 0;
                    return sum + priceValue * item.quantity;
                }, 0),
                updatedAt: serverTimestamp()
            });
        } catch (err) {
            console.error("Failed to sync abandoned cart:", err);
        }
    };

    const timeout = setTimeout(syncAbandonedCart, 1000); // Debounce sync
    return () => clearTimeout(timeout);
  }, [cart, visitorId, email, ip]);

  const addToCart = (product: Product, quantity: number) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [...prevCart, { ...product, quantity }];
    });
  };

  const removeFromCart = (productId: number) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prevCart =>
      prevCart.map(item =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => setCart([]);

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const totalPrice = cart.reduce((sum, item) => {
    // Handle ranges by taking the first price, remove commas, and extract number/decimal
    const priceStr = item.price.split('–')[0].replace(/,/g, '');
    const priceValue = parseFloat(priceStr.replace(/[^0-9.]/g, '')) || 0;
    return sum + priceValue * item.quantity;
  }, 0);

  return (
    <CartContext.Provider value={{ 
      cart, 
      addToCart, 
      removeFromCart, 
      updateQuantity, 
      clearCart, 
      setEmail,
      totalItems, 
      totalPrice 
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
