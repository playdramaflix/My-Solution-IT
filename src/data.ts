import { Product } from './types';

export const featuredProducts: Product[] = [
  {
    id: 1,
    title: "Premium White Royal Cotton Panjabi",
    category: "Royal Collection",
    price: "৳ 4,500.00",
    image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=2080&auto=format&fit=crop",
    description: "Exquisite white cotton Panjabi with intricate embroidery on the collar and cuffs. Perfect for special occasions.",
    stockStatus: 'In Stock',
    sku: "LUX-WH-001",
    tags: ["Cotton", "Handmade"],
    discount: "10%"
  },
  {
    id: 2,
    title: "Royal Navy Embroidered Panjabi",
    category: "Signature Series",
    price: "৳ 5,800.00",
    image: "https://images.unsplash.com/photo-1597983073493-88cd35cf93b0?q=80&w=2070&auto=format&fit=crop",
    description: "Deep navy blue Panjabi with golden hand embroidery for a majestic look.",
    stockStatus: 'In Stock',
    sku: "SIG-NV-002",
    tags: ["Navy", "Golden Embroidery"],
    discount: "15%"
  },
  {
    id: 3,
    title: "Imperial Saffron Silk Panjabi",
    category: "Royal Collection",
    price: "৳ 6,800.00",
    image: "https://images.unsplash.com/photo-1621508654686-809f23efdaba?q=80&w=2070&auto=format&fit=crop",
    description: "Luxurious pure silk Panjabi in a vibrant saffron hue. Breathable and elegant.",
    stockStatus: 'In Stock',
    sku: "LUX-SF-003",
    tags: ["Silk", "Saffron"]
  },
  {
    id: 4,
    title: "Midnight Onyx Premium Panjabi",
    category: "Signature Series",
    price: "৳ 7,200.00",
    image: "https://images.unsplash.com/photo-1627254504242-ce0574100787?q=80&w=2070&auto=format&fit=crop",
    description: "Sleek black Panjabi with matte finish and minimal silver detailing.",
    stockStatus: 'In Stock',
    sku: "SIG-BLK-004",
    tags: ["Black", "Minimal"],
    discount: "5%"
  },
  {
    id: 5,
    title: "Maroon Wedding Heritage Edition",
    category: "Heritage Collection",
    price: "৳ 8,500.00",
    image: "https://images.unsplash.com/photo-1598808503744-44cd27361a99?q=80&w=2070&auto=format&fit=crop",
    description: "Rich maroon festive Panjabi, heavy work on neckline. Ideal for weddings.",
    stockStatus: 'In Stock',
    sku: "HER-MAR-005",
    tags: ["Wedding", "Maroon"]
  }
];

export const bestSellers: Product[] = [
  {
    id: 6,
    title: "Emerald Green Artisanal Panjabi",
    category: "Royal Collection",
    price: "৳ 4,200.00",
    image: "https://images.unsplash.com/photo-1621508654157-194fd89d2d8e?q=80&w=2070&auto=format&fit=crop",
    description: "Deep emerald green cotton blend Panjabi for a fresh and bold look.",
    stockStatus: 'In Stock',
    sku: "LUX-GRN-006",
    tags: ["Green", "Cotton Blend"]
  },
  {
    id: 7,
    title: "Platinum Grey Classic Kurta",
    category: "Heritage Collection",
    price: "৳ 3,800.00",
    image: "https://images.unsplash.com/photo-1594938374182-f89340058862?q=80&w=2071&auto=format&fit=crop",
    description: "Sophisticated grey kurta for regular elegance and office events.",
    stockStatus: 'In Stock',
    sku: "HER-GRY-007",
    tags: ["Grey", "Classy"]
  },
  {
    id: 8,
    title: "Sky Blue Casual Linen Panjabi",
    category: "Signature Series",
    price: "৳ 3,500.00",
    image: "https://images.unsplash.com/photo-1632148757143-67c4ecda2e03?q=80&w=1974&auto=format&fit=crop",
    description: "Light and airy sky blue linen Panjabi for summer comfort.",
    stockStatus: 'In Stock',
    sku: "SIG-SKY-008",
    tags: ["Summer", "Linen"]
  },
  {
    id: 9,
    title: "Sandstone Earthy Texture Panjabi",
    category: "Royal Collection",
    price: "৳ 4,900.00",
    image: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=2070&auto=format&fit=crop",
    description: "Natural earthy toned Panjabi with a unique textured weave.",
    stockStatus: 'In Stock',
    sku: "LUX-SAN-009",
    tags: ["Textured", "Modern"]
  },
  {
    id: 10,
    title: "Charcoal Grey Silk Blend Kurta",
    category: "Signature Series",
    price: "৳ 5,500.00",
    image: "https://images.unsplash.com/photo-1626785774573-4b799315345d?q=80&w=2071&auto=format&fit=crop",
    description: "Premium charcoal grey kurta with silk shine, perfect for evening gatherings.",
    stockStatus: 'In Stock',
    sku: "SIG-CHA-010",
    tags: ["Silk Blend", "Evening"]
  }
];

export const allProducts = [...featuredProducts, ...bestSellers];
