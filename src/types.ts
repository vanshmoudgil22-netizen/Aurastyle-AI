export interface User {
  id: string;
  email: string;
  name: string;
  role: "user" | "admin";
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
  discount: number;
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

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
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

export interface CartItem {
  productId: string;
  quantity: number;
  size: string;
  color: string;
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

export interface ChatMessage {
  sender: "user" | "ai";
  text: string;
  timestamp: string;
  suggestedProducts?: string[];
}

export interface ChatSession {
  id: string;
  userId?: string;
  messages: ChatMessage[];
  createdAt: string;
}

export interface AnalyticsData {
  summary: {
    totalSales: number;
    totalOrders: number;
    totalUsers: number;
    totalProducts: number;
    activeChatSessionsCount: number;
  };
  lowStock: {
    id: string;
    name: string;
    stock: number;
  }[];
  ordersByStatus: Record<string, number>;
  popularSearches: {
    query: string;
    count: number;
  }[];
  aiStats: {
    textSearches: number;
    imageSearches: number;
    voiceSearches: number;
    multimodalSearches: number;
    recommendationAccuracy: number;
  };
  salesHistory: {
    month: string;
    sales: number;
  }[];
}
