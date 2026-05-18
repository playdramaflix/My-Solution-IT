import { Product } from './types';

export const featuredProducts: Product[] = [
  {
    id: 1,
    title: "IDM (Internet Download Manager) Full Version",
    category: "Digital Products",
    price: "৳ 200.00",
    image: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=2070&auto=format&fit=crop",
    description: "Experience blazing fast downloads with IDM. The industry leading download manager for windows.",
    stockStatus: 'In Stock',
    sku: "IDM-001",
    tags: ["Utility", "Software", "Windows"]
  },
  {
    id: 2,
    title: "Canva Pro Official Premium Subscription",
    category: "Digital Products",
    price: "৳ 100.00",
    image: "https://images.unsplash.com/photo-1626785774573-4b799315345d?q=80&w=2071&auto=format&fit=crop",
    description: "Unlock all premium features of Canva and design like a pro. Perfect for social media and business graphics.",
    stockStatus: 'In Stock',
    sku: "CANVA-PRO-01",
    tags: ["Design", "Subscription", "Creative"]
  },
  {
    id: 3,
    title: "Canva Pro Premium Subscription",
    category: "Subscription",
    price: "৳ 50.00 – ৳ 100.00",
    rating: 5,
    image: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=2074&auto=format&fit=crop",
    description: "Flexible premium subscription plans for Canva. Choose the duration that fits your needs.",
    stockStatus: 'In Stock',
    sku: "CANVA-PRO-FLEX",
    tags: ["Design", "Subscription"]
  }
];

export const bestSellers: Product[] = [
  {
    id: 4,
    title: "Movieflix Mega Bundle Tools and Theme",
    category: "Bundle offers",
    price: "৳ 250.00 – ৳ 450.00",
    discount: "-70%",
    image: "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=2070&auto=format&fit=crop",
    description: "Get everything you need to start your movie streaming site with this mega bundle.",
    stockStatus: 'In Stock',
    sku: "MOVIE-BUNDLE",
    tags: ["Web", "Theme", "Bundle"]
  },
  {
    id: 5,
    title: "Binance Dollar Recharge Buy Sell and Top Up",
    category: "Subscription",
    price: "৳ 440.00 – ৳ 6,850.00",
    discount: "-67%",
    image: "https://images.unsplash.com/photo-1621416894569-0f39ed31d247?q=80&w=1974&auto=format&fit=crop",
    description: "Fast and secure Binance dollar recharge services. Buy, sell, and top up your wallet instantly.",
    stockStatus: 'In Stock',
    sku: "BINANCE-TOPUP",
    tags: ["Crypto", "Wallet", "Service"]
  },
  {
    id: 6,
    title: "Gopal Bhar & Nat-Boltu YouTube Upload Secret Course",
    category: "Popular Courses",
    price: "৳ 199.00",
    image: "https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?q=80&w=2074&auto=format&fit=crop",
    description: "Learn the secrets of successful YouTube uploads with this specialized course.",
    stockStatus: 'In Stock',
    sku: "YT-COURSE-01",
    tags: ["Education", "YouTube", "Marketing"]
  }
];

export const allProducts = [...featuredProducts, ...bestSellers];
