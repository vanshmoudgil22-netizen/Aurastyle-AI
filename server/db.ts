import fs from "fs";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "data.json");

// Define interfaces for our database structure
export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: "user" | "admin";
  createdAt: string;
  addresses: Address[];
  savedCards: SavedCard[];
}

export interface Address {
  id: string;
  name: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
}

export interface SavedCard {
  id: string;
  cardholderName: string;
  last4: string;
  expiryDate: string;
  brand: string;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  subcategory: string;
  price: number;
  discount: number; // percentage
  stock: number;
  sku: string;
  description: string;
  images: string[];
  sizes: string[];
  colors: string[];
  fabric: string;
  material: string;
  gender: "Men" | "Women" | "Unisex";
  occasion: "Formal" | "Casual" | "Wedding" | "Sports" | "Party";
  season: "Summer" | "Winter" | "All-Season" | "Spring/Autumn";
  rating: number;
  reviewsCount: number;
  aiTags: string[];
}

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  shippingAddress: Address;
  shippingMethod: string;
  couponApplied?: string;
  pricing: {
    subtotal: number;
    discount: number;
    tax: number;
    shipping: number;
    total: number;
  };
  paymentMethod: string;
  paymentStatus: "Pending" | "Paid" | "Refunded";
  orderStatus: "Processing" | "Shipped" | "Delivered" | "Cancelled";
  trackingNumber?: string;
  createdAt: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  brand: string;
  price: number;
  quantity: number;
  size: string;
  color: string;
  image: string;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  images?: string[];
  helpfulVotes: number;
  isApproved: boolean;
  createdAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: "percentage" | "fixed";
  value: number;
  minOrderValue: number;
  expiryDate: string;
  isActive: boolean;
}

export interface SearchHistoryEntry {
  id: string;
  userId?: string;
  query: string;
  type: "text" | "image" | "voice" | "multimodal";
  timestamp: string;
}

export interface ChatSession {
  id: string;
  userId?: string;
  messages: {
    sender: "user" | "ai";
    text: string;
    timestamp: string;
    suggestedProducts?: string[]; // Product IDs
  }[];
  createdAt: string;
}

export interface DatabaseSchema {
  users: User[];
  products: Product[];
  orders: Order[];
  reviews: Review[];
  coupons: Coupon[];
  searchHistory: SearchHistoryEntry[];
  chatSessions: ChatSession[];
  wishlists: Record<string, string[]>; // userId -> productIds[]
  carts: Record<string, CartItem[]>; // userId -> CartItem[]
}

export interface CartItem {
  productId: string;
  quantity: number;
  size: string;
  color: string;
}

// Initial seed data for the system
const INITIAL_PRODUCTS: Product[] = [
  {
    id: "p1",
    name: "Classic Premium Navy Blazer",
    brand: "Aura Menswear",
    category: "Apparel",
    subcategory: "Blazers",
    price: 189.99,
    discount: 10,
    stock: 25,
    sku: "AM-BLZ-NVY-01",
    description: "A timeless slim-fit navy blazer tailored from a high-quality wool blend. Featuring structured shoulders, notched lapels, and double-vented back. Ideal for interviews, business meetings, and semi-formal events.",
    images: ["https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&auto=format&fit=crop&q=80"],
    sizes: ["S", "M", "L", "XL"],
    colors: ["Navy Blue", "Slate Blue"],
    fabric: "Wool Blend",
    material: "70% Wool, 30% Polyester",
    gender: "Men",
    occasion: "Formal",
    season: "All-Season",
    rating: 4.8,
    reviewsCount: 12,
    aiTags: ["formal", "interview", "wedding", "blazer", "navy", "office", "elegant"]
  },
  {
    id: "p2",
    name: "Classic Denim Jacket in Deep Blue",
    brand: "Aura Denim Co.",
    category: "Apparel",
    subcategory: "Jackets",
    price: 79.99,
    discount: 15,
    stock: 40,
    sku: "AD-JKT-DBL-02",
    description: "A rugged, classic denim jacket crafted from organic cotton with a hint of stretch for active comfort. Features contrast stitching, chest button flap pockets, and side welt pockets.",
    images: ["https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=600&auto=format&fit=crop&q=80"],
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: ["Deep Blue", "Light Blue"],
    fabric: "Organic Denim",
    material: "98% Cotton, 2% Elastane",
    gender: "Unisex",
    occasion: "Casual",
    season: "Spring/Autumn",
    rating: 4.6,
    reviewsCount: 34,
    aiTags: ["denim", "jacket", "casual", "blue", "rugged", "outerwear", "streetwear"]
  },
  {
    id: "p3",
    name: "Midnight Black Tailored Denim Jacket",
    brand: "Aura Denim Co.",
    category: "Apparel",
    subcategory: "Jackets",
    price: 84.99,
    discount: 5,
    stock: 30,
    sku: "AD-JKT-BLK-03",
    description: "A sleek black denim jacket that offers an edgy modern look. Structured but soft, double-rinsed for comfort and featuring solid matte black hardware.",
    images: ["https://images.unsplash.com/photo-1551537482-f2075a1d41f2?w=600&auto=format&fit=crop&q=80"],
    sizes: ["S", "M", "L", "XL"],
    colors: ["Midnight Black"],
    fabric: "Premium Denim",
    material: "99% Cotton, 1% Spandex",
    gender: "Unisex",
    occasion: "Casual",
    season: "Spring/Autumn",
    rating: 4.9,
    reviewsCount: 18,
    aiTags: ["denim", "jacket", "casual", "black", "sleek", "outerwear", "edgy"]
  },
  {
    id: "p4",
    name: "Luxury Italian Leather Oxford Shoes",
    brand: "Sartorial Footwear",
    category: "Footwear",
    subcategory: "Formal Shoes",
    price: 249.99,
    discount: 0,
    stock: 15,
    sku: "SF-SHO-BRN-04",
    description: "Handcrafted in Italy from full-grain calfskin leather, these Oxford dress shoes offer unmatched comfort and sophisticated styling. Features a hand-burnished finish and reliable Goodyear welted sole.",
    images: ["https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=600&auto=format&fit=crop&q=80"],
    sizes: ["8", "9", "10", "11"],
    colors: ["Cognac Brown", "Classic Black"],
    fabric: "Full-Grain Leather",
    material: "100% Calfskin Leather",
    gender: "Men",
    occasion: "Formal",
    season: "All-Season",
    rating: 4.9,
    reviewsCount: 8,
    aiTags: ["formal", "oxford", "shoes", "leather", "brown", "interview", "wedding", "luxury"]
  },
  {
    id: "p5",
    name: "Minimalist Silk Tie and Pocket Square Set",
    brand: "Aura Sartorial",
    category: "Accessories",
    subcategory: "Ties",
    price: 39.99,
    discount: 0,
    stock: 50,
    sku: "AS-TIE-SLK-05",
    description: "A premium 100% mulberry silk tie paired with a matching pocket square. Features a subtle diagonal jacquard weave that catches light beautifully for high-profile formal occasions.",
    images: ["https://images.unsplash.com/photo-1589756823855-edd104866499?w=600&auto=format&fit=crop&q=80"],
    sizes: ["One-Size"],
    colors: ["Burgundy Wine", "Silver Gray", "Emerald Green"],
    fabric: "Jacquard Silk",
    material: "100% Mulberry Silk",
    gender: "Men",
    occasion: "Formal",
    season: "All-Season",
    rating: 4.7,
    reviewsCount: 15,
    aiTags: ["tie", "silk", "wedding", "formal", "burgundy", "accessory", "interview"]
  },
  {
    id: "p6",
    name: "Chronos Gold Edition Dress Watch",
    brand: "Aura Horology",
    category: "Accessories",
    subcategory: "Watches",
    price: 299.99,
    discount: 10,
    stock: 8,
    sku: "AH-WTC-GLD-06",
    description: "An elegant slim dress watch featuring an 18k gold-plated stainless steel case, sapphire crystal glass, and a black Italian genuine leather strap. Powered by an ultra-precise Swiss quartz movement.",
    images: ["https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=600&auto=format&fit=crop&q=80"],
    sizes: ["One-Size"],
    colors: ["Gold Case / Black Strap"],
    fabric: "Genuine Leather & Stainless Steel",
    material: "100% Leather, Gold Plated Steel",
    gender: "Unisex",
    occasion: "Wedding",
    season: "All-Season",
    rating: 4.9,
    reviewsCount: 6,
    aiTags: ["watch", "gold", "accessory", "wedding", "formal", "luxury", "leather"]
  },
  {
    id: "p7",
    name: "Classic Structured Cotton Dress Shirt",
    brand: "Aura Sartorial",
    category: "Apparel",
    subcategory: "Shirts",
    price: 59.99,
    discount: 10,
    stock: 35,
    sku: "AS-SHT-WHT-07",
    description: "A crisp white button-down dress shirt crafted from wrinkle-resistant Egyptian cotton. Tailored slim fit with robust double-button barrel cuffs and a modern semi-spread collar.",
    images: ["https://images.unsplash.com/photo-1620012253295-c05518e99309?w=600&auto=format&fit=crop&q=80"],
    sizes: ["S", "M", "L", "XL"],
    colors: ["Classic White", "Light Blue"],
    fabric: "Egyptian Cotton",
    material: "100% Egyptian Cotton",
    gender: "Men",
    occasion: "Formal",
    season: "All-Season",
    rating: 4.5,
    reviewsCount: 20,
    aiTags: ["shirt", "white", "formal", "interview", "office", "wedding", "cotton"]
  },
  {
    id: "p8",
    name: "Elegant Emerald Silk Evening Gown",
    brand: "Aura Couture",
    category: "Apparel",
    subcategory: "Dresses",
    price: 349.99,
    discount: 5,
    stock: 12,
    sku: "AC-DRS-EMR-08",
    description: "A spectacular floor-length evening gown crafted from flowing silk satin. Features a draped cowl neck, adjustable open back, and an elegant side thigh-high slit. Guaranteed to make an entrance.",
    images: ["https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&auto=format&fit=crop&q=80"],
    sizes: ["XS", "S", "M", "L"],
    colors: ["Emerald Green", "Crimson Red"],
    fabric: "Silk Satin",
    material: "95% Silk, 5% Spandex",
    gender: "Women",
    occasion: "Wedding",
    season: "All-Season",
    rating: 4.9,
    reviewsCount: 14,
    aiTags: ["dress", "gown", "wedding", "emerald", "silk", "evening", "glamour", "formal"]
  },
  {
    id: "p9",
    name: "Urban Minimalist Beige Trench Coat",
    brand: "Aura Outerwear",
    category: "Apparel",
    subcategory: "Coats",
    price: 159.99,
    discount: 15,
    stock: 18,
    sku: "AO-COT-BGE-09",
    description: "A refined double-breasted trench coat tailored in water-repellent heavy cotton-gabardine. Features storm flaps, adjustable waist belt, and signature cuff straps.",
    images: ["https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&auto=format&fit=crop&q=80"],
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: ["Classic Beige", "Midnight Navy"],
    fabric: "Cotton Gabardine",
    material: "100% Cotton",
    gender: "Women",
    occasion: "Casual",
    season: "Winter",
    rating: 4.7,
    reviewsCount: 25,
    aiTags: ["trench", "coat", "winter", "casual", "beige", "elegant", "outerwear"]
  },
  {
    id: "p10",
    name: "Luxe Cashmere Knit Turtleneck",
    brand: "Aura Knitwear",
    category: "Apparel",
    subcategory: "Sweaters",
    price: 129.99,
    discount: 10,
    stock: 22,
    sku: "AK-SWT-OAT-10",
    description: "Indulgently soft turtleneck sweater knitted from ethically sourced, premium 2-ply Mongolian cashmere. Features ribbed trim at collar, cuffs, and hem for an elegant drape.",
    images: ["https://images.unsplash.com/photo-1574164904299-3a102b110380?w=600&auto=format&fit=crop&q=80"],
    sizes: ["S", "M", "L"],
    colors: ["Oatmeal Heather", "Charcoal Gray"],
    fabric: "Mongolian Cashmere",
    material: "100% Cashmere",
    gender: "Women",
    occasion: "Casual",
    season: "Winter",
    rating: 4.8,
    reviewsCount: 19,
    aiTags: ["cashmere", "sweater", "turtleneck", "winter", "casual", "warm", "luxe"]
  },
  {
    id: "p11",
    name: "Retro Cloud Cushion Sneakers",
    brand: "Aura Footwear",
    category: "Footwear",
    subcategory: "Sneakers",
    price: 95.00,
    discount: 20,
    stock: 30,
    sku: "AF-SNK-WHT-11",
    description: "Chunky retro-style lifestyle sneakers engineered with an ultra-soft cloud cushion midsole. Breathable mesh panels with premium suede overlays offer superb urban comfort and dynamic aesthetics.",
    images: ["https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600&auto=format&fit=crop&q=80"],
    sizes: ["7", "8", "9", "10", "11"],
    colors: ["White / Cream", "Monochrome Slate"],
    fabric: "Mesh & Suede",
    material: "Leather overlays, Rubber sole",
    gender: "Unisex",
    occasion: "Casual",
    season: "Summer",
    rating: 4.4,
    reviewsCount: 42,
    aiTags: ["sneakers", "shoes", "casual", "sporty", "retro", "white", "cushion"]
  },
  {
    id: "p12",
    name: "Structured Crease Formal Pants",
    brand: "Aura Menswear",
    category: "Apparel",
    subcategory: "Pants",
    price: 69.99,
    discount: 5,
    stock: 28,
    sku: "AM-PNT-GRY-12",
    description: "These sharp flat-front formal trousers feature a crisp permanent crease, hook-and-bar waist closure, and an expandable elastic interior belt for comfort during corporate interviews or long workdays.",
    images: ["https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600&auto=format&fit=crop&q=80"],
    sizes: ["30", "32", "34", "36"],
    colors: ["Charcoal Gray", "Deep Black"],
    fabric: "Twill Blend",
    material: "65% Polyester, 35% Viscose",
    gender: "Men",
    occasion: "Formal",
    season: "All-Season",
    rating: 4.6,
    reviewsCount: 11,
    aiTags: ["pants", "trouser", "formal", "interview", "gray", "office", "tailored"]
  }
];

const INITIAL_COUPONS: Coupon[] = [
  {
    id: "c1",
    code: "AURA10",
    discountType: "percentage",
    value: 10,
    minOrderValue: 50,
    expiryDate: "2026-12-31",
    isActive: true
  },
  {
    id: "c2",
    code: "STYLIST25",
    discountType: "fixed",
    value: 25,
    minOrderValue: 150,
    expiryDate: "2026-12-31",
    isActive: true
  },
  {
    id: "c3",
    code: "FASHIONAI",
    discountType: "percentage",
    value: 20,
    minOrderValue: 100,
    expiryDate: "2026-12-31",
    isActive: true
  }
];

// In-Memory Database Controller with File Sync
class FileDB {
  private data: DatabaseSchema = {
    users: [],
    products: [],
    orders: [],
    reviews: [],
    coupons: [],
    searchHistory: [],
    chatSessions: [],
    wishlists: {},
    carts: {}
  };

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, "utf-8");
        this.data = JSON.parse(raw);
        // Ensure default structures are present
        if (!this.data.users) this.data.users = [];
        if (!this.data.products) this.data.products = [];
        if (!this.data.orders) this.data.orders = [];
        if (!this.data.reviews) this.data.reviews = [];
        if (!this.data.coupons) this.data.coupons = [];
        if (!this.data.searchHistory) this.data.searchHistory = [];
        if (!this.data.chatSessions) this.data.chatSessions = [];
        if (!this.data.wishlists) this.data.wishlists = {};
        if (!this.data.carts) this.data.carts = {};

        // Auto-seed items if empty
        if (this.data.products.length === 0) {
          this.data.products = INITIAL_PRODUCTS;
          this.save();
        }
        if (this.data.coupons.length === 0) {
          this.data.coupons = INITIAL_COUPONS;
          this.save();
        }
      } else {
        // Build seed database
        this.data = {
          users: [
            // Standard seed admin user
            {
              id: "u-admin",
              email: "admin@aurastyle.ai",
              passwordHash: "$2b$10$U26iQnU6j9jU9jU9jU9jUeUq5l0MvT2jXv2Y3m4X5Z6e7r8t9y1uK", // dummy hash for standard login
              name: "Elite Fashion Stylist Admin",
              role: "admin",
              createdAt: new Date().toISOString(),
              addresses: [],
              savedCards: []
            },
            // Standard user
            {
              id: "u-user",
              email: "user@aurastyle.ai",
              passwordHash: "$2b$10$U26iQnU6j9jU9jU9jU9jUeUq5l0MvT2jXv2Y3m4X5Z6e7r8t9y1uK",
              name: "Jane Doe",
              role: "user",
              createdAt: new Date().toISOString(),
              addresses: [
                {
                  id: "a-1",
                  name: "Home Address",
                  street: "123 Fashion Blvd, Suit 404",
                  city: "New York",
                  state: "NY",
                  zipCode: "10001",
                  country: "United States",
                  isDefault: true
                }
              ],
              savedCards: [
                {
                  id: "sc-1",
                  cardholderName: "Jane Doe",
                  last4: "4242",
                  expiryDate: "12/28",
                  brand: "Visa"
                }
              ]
            }
          ],
          products: INITIAL_PRODUCTS,
          orders: [
            {
              id: "ord-1",
              userId: "u-user",
              items: [
                {
                  productId: "p1",
                  name: "Classic Premium Navy Blazer",
                  brand: "Aura Menswear",
                  price: 170.99,
                  quantity: 1,
                  size: "M",
                  color: "Navy Blue",
                  image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&auto=format&fit=crop&q=80"
                }
              ],
              shippingAddress: {
                id: "a-1",
                name: "Home Address",
                street: "123 Fashion Blvd, Suit 404",
                city: "New York",
                state: "NY",
                zipCode: "10001",
                country: "United States",
                isDefault: true
              },
              shippingMethod: "Aura Express (Next Day)",
              couponApplied: "AURA10",
              pricing: {
                subtotal: 189.99,
                discount: 19.00,
                tax: 13.68,
                shipping: 10.00,
                total: 194.67
              },
              paymentMethod: "Stripe Card",
              paymentStatus: "Paid",
              orderStatus: "Shipped",
              trackingNumber: "TRK-AURA-834920",
              createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
            }
          ],
          reviews: [
            {
              id: "rev-1",
              productId: "p1",
              userId: "u-user",
              userName: "Jane Doe",
              rating: 5,
              comment: "Absolutely gorgeous custom tailoring and material! Felt so confident in my interview and got the job. Highly recommend styling it with formal gray pants.",
              helpfulVotes: 4,
              isApproved: true,
              createdAt: new Date().toISOString()
            }
          ],
          coupons: INITIAL_COUPONS,
          searchHistory: [],
          chatSessions: [],
          wishlists: {
            "u-user": ["p2", "p8"]
          },
          carts: {
            "u-user": [
              { productId: "p3", quantity: 1, size: "M", color: "Midnight Black" }
            ]
          }
        };
        this.save();
      }
    } catch (e) {
      console.error("Failed to load or initialize DB, using fallback memory state", e);
    }
  }

  public save() {
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.data, null, 2), "utf-8");
    } catch (e) {
      console.error("Failed to write state file to disk", e);
    }
  }

  // Schema Query API
  get users() { return this.data.users; }
  get products() { return this.data.products; }
  get orders() { return this.data.orders; }
  get reviews() { return this.data.reviews; }
  get coupons() { return this.data.coupons; }
  get searchHistory() { return this.data.searchHistory; }
  get chatSessions() { return this.data.chatSessions; }
  get wishlists() { return this.data.wishlists; }
  get carts() { return this.data.carts; }

  // Generic methods
  public getUserById(id: string): User | undefined {
    return this.data.users.find(u => u.id === id);
  }

  public getUserByEmail(email: string): User | undefined {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  public getProductById(id: string): Product | undefined {
    return this.data.products.find(p => p.id === id);
  }

  public getCart(userId: string): CartItem[] {
    return this.data.carts[userId] || [];
  }

  public saveCart(userId: string, items: CartItem[]) {
    this.data.carts[userId] = items;
    this.save();
  }

  public getWishlist(userId: string): string[] {
    return this.data.wishlists[userId] || [];
  }

  public saveWishlist(userId: string, productIds: string[]) {
    this.data.wishlists[userId] = productIds;
    this.save();
  }

  public addSearchHistory(entry: Omit<SearchHistoryEntry, "id" | "timestamp">) {
    const entryWithId: SearchHistoryEntry = {
      ...entry,
      id: "sh-" + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString()
    };
    this.data.searchHistory.push(entryWithId);
    this.save();
    return entryWithId;
  }

  public createChatSession(userId?: string): ChatSession {
    const session: ChatSession = {
      id: "chat-" + Math.random().toString(36).substr(2, 9),
      userId,
      messages: [
        {
          sender: "ai",
          text: "Hello! I am Aura, your personal AI Fashion Stylist. Tell me what occasion you're preparing for (a wedding, a job interview, a weekend getaway), and I'll curate the perfect ensemble for you!",
          timestamp: new Date().toISOString()
        }
      ],
      createdAt: new Date().toISOString()
    };
    this.data.chatSessions.push(session);
    this.save();
    return session;
  }

  public getChatSession(id: string): ChatSession | undefined {
    return this.data.chatSessions.find(s => s.id === id);
  }

  public updateChatSession(session: ChatSession) {
    const index = this.data.chatSessions.findIndex(s => s.id === session.id);
    if (index !== -1) {
      this.data.chatSessions[index] = session;
      this.save();
    }
  }

  public createOrder(order: Omit<Order, "id" | "createdAt" | "orderStatus" | "paymentStatus"> & { id?: string }): Order {
    const newOrder: Order = {
      ...order,
      id: order.id || "ord-" + Math.random().toString(36).substr(2, 9),
      orderStatus: "Processing",
      paymentStatus: order.paymentMethod === "Cash on Delivery" ? "Pending" : "Paid",
      createdAt: new Date().toISOString()
    };
    this.data.orders.push(newOrder);
    
    // Deduct stock
    for (const item of newOrder.items) {
      const prod = this.getProductById(item.productId);
      if (prod) {
        prod.stock = Math.max(0, prod.stock - item.quantity);
      }
    }
    
    this.save();
    return newOrder;
  }

  public addReview(review: Omit<Review, "id" | "createdAt" | "helpfulVotes" | "isApproved">): Review {
    const newReview: Review = {
      ...review,
      id: "rev-" + Math.random().toString(36).substr(2, 9),
      helpfulVotes: 0,
      isApproved: true, // Auto approve for interactive experience
      createdAt: new Date().toISOString()
    };
    this.data.reviews.push(newReview);
    
    // Update product rating
    const prod = this.getProductById(review.productId);
    if (prod) {
      const prodReviews = this.data.reviews.filter(r => r.productId === review.productId);
      const totalRating = prodReviews.reduce((sum, r) => sum + r.rating, 0);
      prod.rating = parseFloat((totalRating / prodReviews.length).toFixed(1));
      prod.reviewsCount = prodReviews.length;
    }
    
    this.save();
    return newReview;
  }

  public addProduct(product: Omit<Product, "id" | "rating" | "reviewsCount">): Product {
    const newProduct: Product = {
      ...product,
      id: "p" + (this.data.products.length + 1),
      rating: 5.0,
      reviewsCount: 0
    };
    this.data.products.push(newProduct);
    this.save();
    return newProduct;
  }

  public updateProduct(product: Product): boolean {
    const index = this.data.products.findIndex(p => p.id === product.id);
    if (index !== -1) {
      this.data.products[index] = product;
      this.save();
      return true;
    }
    return false;
  }

  public deleteProduct(id: string): boolean {
    const originalLen = this.data.products.length;
    this.data.products = this.data.products.filter(p => p.id !== id);
    if (this.data.products.length < originalLen) {
      this.save();
      return true;
    }
    return false;
  }

  public updateOrderStatus(id: string, status: Order["orderStatus"]): boolean {
    const order = this.data.orders.find(o => o.id === id);
    if (order) {
      order.orderStatus = status;
      this.save();
      return true;
    }
    return false;
  }

  public addCoupon(coupon: Omit<Coupon, "id" | "isActive">): Coupon {
    const newCoupon: Coupon = {
      ...coupon,
      id: "c-" + Math.random().toString(36).substr(2, 9),
      isActive: true
    };
    this.data.coupons.push(newCoupon);
    this.save();
    return newCoupon;
  }

  public toggleCoupon(id: string): boolean {
    const cp = this.data.coupons.find(c => c.id === id);
    if (cp) {
      cp.isActive = !cp.isActive;
      this.save();
      return true;
    }
    return false;
  }

  public deleteCoupon(id: string): boolean {
    const orig = this.data.coupons.length;
    this.data.coupons = this.data.coupons.filter(c => c.id !== id);
    if (this.data.coupons.length < orig) {
      this.save();
      return true;
    }
    return false;
  }
}

export const db = new FileDB();
