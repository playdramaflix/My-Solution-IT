export interface Product {
  id: number | string;
  title: string;
  category: string;
  price: string;
  image: string;
  images?: string[];
  rating?: number;
  discount?: string;
  description?: string;
  secretSource?: string;
  secretInstructions?: string;
  stockStatus?: 'In Stock' | 'Out of Stock';
  sku?: string;
  tags?: string[];
}

export interface Post {
  id?: string;
  title: string;
  content: string;
  image?: string;
  author?: string;
  category?: string;
  createdAt: any;
  status: 'published' | 'draft';
}

export interface Order {
  id?: string;
  customerName: string;
  email: string;
  phone: string;
  items: { productId: number | string; quantity: number; title: string; price: string }[];
  totalPrice: number;
  paymentMethod: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  senderNumber?: string;
  transactionId?: string;
  deliveryEmailSent?: boolean;
  createdAt: any;
}
