import React, { createContext, useContext, useState, useEffect } from "react";
import { User, Product, CartItem, Order, ChatMessage, ChatSession, Coupon } from "../types";

// Define context state types
interface AppContextType {
  user: User | null;
  token: string | null;
  products: Product[];
  cart: (CartItem & { product?: Product })[];
  wishlist: Product[];
  currentTab: string;
  selectedProductId: string | null;
  chatSession: ChatSession | null;
  isChatLoading: boolean;
  notifications: NotificationItem[];
  isLoadingProducts: boolean;
  activeOrderToTrack: Order | null;
  
  // Handlers
  setTab: (tab: string) => void;
  login: (email: string, pass: string) => Promise<boolean>;
  register: (name: string, email: string) => Promise<boolean>;
  logout: () => void;
  loadProducts: () => Promise<void>;
  addToCart: (productId: string, qty: number, size: string, color: string) => Promise<void>;
  removeFromCart: (productId: string, size: string, color: string) => Promise<void>;
  updateCartQty: (productId: string, size: string, color: string, qty: number) => Promise<void>;
  toggleWishlist: (productId: string) => Promise<void>;
  startStylistSession: () => Promise<void>;
  sendStylistMessage: (text: string) => Promise<void>;
  placeOrder: (orderData: any) => Promise<Order | null>;
  addNotification: (text: string, type?: "success" | "info" | "warning") => void;
  removeNotification: (id: string) => void;
  selectProduct: (id: string) => void;
  trackOrder: (order: Order) => void;
}

export interface NotificationItem {
  id: string;
  text: string;
  type: "success" | "info" | "warning";
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<(CartItem & { product?: Product })[]>([]);
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [currentTab, setCurrentTab] = useState<string>("home");
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [chatSession, setChatSession] = useState<ChatSession | null>(null);
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState<boolean>(false);
  const [activeOrderToTrack, setActiveOrderToTrack] = useState<Order | null>(null);

  // Load token and user from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem("aura_token");
    if (storedToken) {
      setToken(storedToken);
      fetchMe(storedToken);
    }
    loadProducts();
  }, []);

  // Fetch logged in user details
  const fetchMe = async (authToken: string) => {
    try {
      const res = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        fetchCartAndWishlist(authToken);
      } else {
        logout();
      }
    } catch (err) {
      console.error("Fetch me failed", err);
    }
  };

  // Fetch current user cart & wishlist
  const fetchCartAndWishlist = async (authToken: string) => {
    try {
      const cartRes = await fetch("/api/cart", {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      const wishlistRes = await fetch("/api/wishlist", {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      if (cartRes.ok) {
        const cartItems: CartItem[] = await cartRes.json();
        syncCartWithProducts(cartItems);
      }
      if (wishlistRes.ok) {
        const wishlistData: Product[] = await wishlistRes.json();
        setWishlist(wishlistData);
      }
    } catch (err) {
      console.error("Failed to sync cart/wishlist", err);
    }
  };

  // Map raw cart items to include full Product details
  const syncCartWithProducts = (cartItems: CartItem[]) => {
    const enriched = cartItems.map(item => {
      const prod = products.find(p => p.id === item.productId);
      return { ...item, product: prod };
    });
    setCart(enriched);
  };

  // Trigger sync of cart after products are loaded
  useEffect(() => {
    if (products.length > 0 && token) {
      fetchCartAndWishlist(token);
    }
  }, [products]);

  // Load all products in catalog
  const loadProducts = async () => {
    setIsLoadingProducts(true);
    try {
      const res = await fetch("/api/products");
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (err) {
      console.error("Load products error", err);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  // Authentication Handlers
  const login = async (email: string, pass: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: pass })
      });
      if (res.ok) {
        const data = await res.json();
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem("aura_token", data.token);
        addNotification(`Welcome back, ${data.user.name}!`, "success");
        fetchCartAndWishlist(data.token);
        return true;
      } else {
        const data = await res.json();
        addNotification(data.error || "Login failed", "warning");
        return false;
      }
    } catch (err) {
      addNotification("Network error during login", "warning");
      return false;
    }
  };

  const register = async (name: string, email: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password: "secure_password" })
      });
      if (res.ok) {
        const data = await res.json();
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem("aura_token", data.token);
        addNotification(`Account created! Welcome, ${data.user.name}.`, "success");
        fetchCartAndWishlist(data.token);
        return true;
      } else {
        const data = await res.json();
        addNotification(data.error || "Registration failed", "warning");
        return false;
      }
    } catch (err) {
      addNotification("Network error during registration", "warning");
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setCart([]);
    setWishlist([]);
    setChatSession(null);
    localStorage.removeItem("aura_token");
    addNotification("Logged out successfully.", "info");
    setCurrentTab("home");
  };

  // Cart operations
  const addToCart = async (productId: string, qty: number, size: string, color: string) => {
    if (!token) {
      addNotification("Please login to manage your shopping cart.", "info");
      setCurrentTab("profile");
      return;
    }
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ productId, quantity: qty, size, color })
      });
      if (res.ok) {
        const data: CartItem[] = await res.json();
        syncCartWithProducts(data);
        const prod = products.find(p => p.id === productId);
        addNotification(`Added ${prod?.name} to Cart.`, "success");
      }
    } catch (err) {
      addNotification("Failed to add item to cart.", "warning");
    }
  };

  const removeFromCart = async (productId: string, size: string, color: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/cart/${productId}?size=${size}&color=${color}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data: CartItem[] = await res.json();
        syncCartWithProducts(data);
        addNotification("Item removed from cart.", "info");
      }
    } catch (err) {
      addNotification("Failed to remove item from cart.", "warning");
    }
  };

  const updateCartQty = async (productId: string, size: string, color: string, qty: number) => {
    if (!token) return;
    try {
      const res = await fetch("/api/cart/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ productId, size, color, quantity: qty })
      });
      if (res.ok) {
        const data: CartItem[] = await res.json();
        syncCartWithProducts(data);
      }
    } catch (err) {
      console.error("Update cart error", err);
    }
  };

  // Wishlist toggle
  const toggleWishlist = async (productId: string) => {
    if (!token) {
      addNotification("Please login to manage your wishlist.", "info");
      setCurrentTab("profile");
      return;
    }
    try {
      const res = await fetch("/api/wishlist/toggle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ productId })
      });
      if (res.ok) {
        const data = await res.json();
        // Reload full wishlist
        const wlRes = await fetch("/api/wishlist", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (wlRes.ok) {
          const wlData: Product[] = await wlRes.json();
          setWishlist(wlData);
        }
        
        const inWL = data.wishlist.includes(productId);
        addNotification(
          inWL ? "Product saved to Wishlist." : "Product removed from Wishlist.",
          "success"
        );
      }
    } catch (err) {
      addNotification("Failed to update wishlist.", "warning");
    }
  };

  // Stylist Chat handlers
  const startStylistSession = async () => {
    setIsChatLoading(true);
    try {
      const headers: HeadersInit = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/ai/stylist/session", {
        method: "POST",
        headers
      });
      if (res.ok) {
        const session: ChatSession = await res.json();
        setChatSession(session);
      }
    } catch (err) {
      console.error("Start stylist session error", err);
    } finally {
      setIsChatLoading(false);
    }
  };

  const sendStylistMessage = async (text: string) => {
    if (!chatSession) return;
    setIsChatLoading(true);

    // Optimistically add user's message
    const updatedMessages: ChatMessage[] = [
      ...chatSession.messages,
      { sender: "user", text, timestamp: new Date().toISOString() }
    ];
    setChatSession({ ...chatSession, messages: updatedMessages });

    try {
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/ai/stylist/chat", {
        method: "POST",
        headers,
        body: JSON.stringify({ sessionId: chatSession.id, message: text })
      });

      if (res.ok) {
        const data = await res.json();
        setChatSession(data.session);
      } else {
        // Fallback if API fails
        const fallbackReply = "I am experiencing a network issue reviewing my collections. Please try your request again.";
        setChatSession({
          ...chatSession,
          messages: [
            ...updatedMessages,
            { sender: "ai", text: fallbackReply, timestamp: new Date().toISOString() }
          ]
        });
      }
    } catch (err) {
      console.error("Chat error", err);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Order Placement
  const placeOrder = async (orderData: any): Promise<Order | null> => {
    if (!token) return null;
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(orderData)
      });
      if (res.ok) {
        const order: Order = await res.json();
        addNotification("Order placed successfully! Aura is tailing your shipping details.", "success");
        fetchCartAndWishlist(token);
        return order;
      } else {
        const err = await res.json();
        addNotification(err.error || "Failed to place order.", "warning");
        return null;
      }
    } catch (err) {
      addNotification("Order placement network error.", "warning");
      return null;
    }
  };

  // Notification triggers
  const addNotification = (text: string, type: "success" | "info" | "warning" = "info") => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { id, text, type }]);
    setTimeout(() => {
      removeNotification(id);
    }, 5000);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Nav routing helpers
  const setTab = (tab: string) => {
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const selectProduct = (id: string) => {
    setSelectedProductId(id);
    setTab("product-detail");
  };

  const trackOrder = (order: Order) => {
    setActiveOrderToTrack(order);
    setTab("track-order");
  };

  return (
    <AppContext.Provider
      value={{
        user,
        token,
        products,
        cart,
        wishlist,
        currentTab,
        selectedProductId,
        chatSession,
        isChatLoading,
        notifications,
        isLoadingProducts,
        activeOrderToTrack,
        
        setTab,
        login,
        register,
        logout,
        loadProducts,
        addToCart,
        removeFromCart,
        updateCartQty,
        toggleWishlist,
        startStylistSession,
        sendStylistMessage,
        placeOrder,
        addNotification,
        removeNotification,
        selectProduct,
        trackOrder
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};
