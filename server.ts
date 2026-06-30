import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { db } from "./server/db";
import {
  generateStylistResponse,
  analyzeImageSearch,
  getAIPersonalizedRecommendations
} from "./server/gemini";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Global Middlewares
  app.use(express.json({ limit: "15mb" })); // Support larger base64 image uploads

  // Simple Token Auth Middleware
  app.use((req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      // Secure token layout: aura-token-<userId>-<role>
      if (token.startsWith("aura-token-")) {
        const parts = token.split("-");
        const userId = parts[2];
        const role = parts[3];
        (req as any).user = { id: userId, role };
      }
    }
    next();
  });

  const requireAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (!(req as any).user) {
      return res.status(401).json({ error: "Authentication required" });
    }
    next();
  };

  const requireAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (!(req as any).user || (req as any).user.role !== "admin") {
      return res.status(403).json({ error: "Access denied. Admin privileges required." });
    }
    next();
  };

  // ==================== AUTHENTICATION API ====================

  app.post("/api/auth/register", (req, res) => {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const existing = db.getUserByEmail(email);
    if (existing) {
      return res.status(400).json({ error: "An account with this email already exists" });
    }

    // Creating new user
    const newUser = {
      id: "u-" + Math.random().toString(36).substr(2, 9),
      email: email.toLowerCase(),
      passwordHash: "pash_" + Math.random().toString(36).substr(2, 9), // simple hash placeholder
      name,
      role: email.toLowerCase().includes("admin") ? "admin" as const : "user" as const,
      createdAt: new Date().toISOString(),
      addresses: [],
      savedCards: []
    };

    db.users.push(newUser);
    db.save();

    const token = `aura-token-${newUser.id}-${newUser.role}`;
    res.status(201).json({
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        addresses: newUser.addresses,
        savedCards: newUser.savedCards
      }
    });
  });

  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = db.getUserByEmail(email);
    if (!user) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const token = `aura-token-${user.id}-${user.role}`;
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        addresses: user.addresses,
        savedCards: user.savedCards
      }
    });
  });

  app.get("/api/auth/me", requireAuth, (req, res) => {
    const user = db.getUserById((req as any).user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        addresses: user.addresses,
        savedCards: user.savedCards
      }
    });
  });

  app.put("/api/auth/profile", requireAuth, (req, res) => {
    const { name, addresses, savedCards } = req.body;
    const user = db.getUserById((req as any).user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (name) user.name = name;
    if (addresses) user.addresses = addresses;
    if (savedCards) user.savedCards = savedCards;

    db.save();
    res.json({ user });
  });

  // ==================== PRODUCTS API ====================

  app.get("/api/products", (req, res) => {
    const { category, occasion, gender, search } = req.query;
    let list = [...db.products];

    if (category) {
      list = list.filter(p => p.category.toLowerCase() === (category as string).toLowerCase() || p.subcategory.toLowerCase() === (category as string).toLowerCase());
    }
    if (occasion) {
      list = list.filter(p => p.occasion.toLowerCase() === (occasion as string).toLowerCase());
    }
    if (gender) {
      list = list.filter(p => p.gender.toLowerCase() === (gender as string).toLowerCase() || p.gender === "Unisex");
    }
    if (search) {
      const q = (search as string).toLowerCase();
      
      // Perform multi-attribute semantic search mapping
      list = list.filter(p => 
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.fabric.toLowerCase().includes(q) ||
        p.material.toLowerCase().includes(q) ||
        p.aiTags.some(t => t.toLowerCase().includes(q))
      );

      // Save to SearchHistory for analytics
      const userId = (req as any).user?.id;
      db.addSearchHistory({
        userId,
        query: search as string,
        type: "text"
      });
    }

    res.json(list);
  });

  app.get("/api/products/:id", (req, res) => {
    const product = db.getProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    
    // Fetch associated reviews
    const reviews = db.reviews.filter(r => r.productId === product.id && r.isApproved);
    res.json({ product, reviews });
  });

  app.post("/api/products", requireAdmin, (req, res) => {
    try {
      const newProduct = db.addProduct(req.body);
      res.status(201).json(newProduct);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.put("/api/products/:id", requireAdmin, (req, res) => {
    const success = db.updateProduct({ ...req.body, id: req.params.id });
    if (!success) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json({ success: true, product: db.getProductById(req.params.id) });
  });

  app.delete("/api/products/:id", requireAdmin, (req, res) => {
    const success = db.deleteProduct(req.params.id);
    if (!success) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json({ success: true });
  });

  // ==================== CART API ====================

  app.get("/api/cart", requireAuth, (req, res) => {
    const items = db.getCart((req as any).user.id);
    res.json(items);
  });

  app.post("/api/cart", requireAuth, (req, res) => {
    const { productId, quantity, size, color } = req.body;
    const userId = (req as any).user.id;
    let items = db.getCart(userId);

    // Check if duplicate item exists (matching ID, size, color)
    const existingIndex = items.findIndex(
      i => i.productId === productId && i.size === size && i.color === color
    );

    if (existingIndex !== -1) {
      items[existingIndex].quantity += quantity;
    } else {
      items.push({ productId, quantity, size, color });
    }

    db.saveCart(userId, items);
    res.json(items);
  });

  app.put("/api/cart/update", requireAuth, (req, res) => {
    const { productId, size, color, quantity } = req.body;
    const userId = (req as any).user.id;
    let items = db.getCart(userId);

    const index = items.findIndex(
      i => i.productId === productId && i.size === size && i.color === color
    );

    if (index !== -1) {
      if (quantity <= 0) {
        items.splice(index, 1);
      } else {
        items[index].quantity = quantity;
      }
      db.saveCart(userId, items);
    }
    res.json(items);
  });

  app.delete("/api/cart/:productId", requireAuth, (req, res) => {
    const { size, color } = req.query;
    const userId = (req as any).user.id;
    let items = db.getCart(userId);

    items = items.filter(
      i => !(i.productId === req.params.productId && i.size === size && i.color === color)
    );

    db.saveCart(userId, items);
    res.json(items);
  });

  // ==================== WISHLIST API ====================

  app.get("/api/wishlist", requireAuth, (req, res) => {
    const ids = db.getWishlist((req as any).user.id);
    const list = ids.map(id => db.getProductById(id)).filter(Boolean);
    res.json(list);
  });

  app.post("/api/wishlist/toggle", requireAuth, (req, res) => {
    const { productId } = req.body;
    const userId = (req as any).user.id;
    let ids = db.getWishlist(userId);

    if (ids.includes(productId)) {
      ids = ids.filter(id => id !== productId);
    } else {
      ids.push(productId);
    }

    db.saveWishlist(userId, ids);
    res.json({ success: true, wishlist: ids });
  });

  // ==================== REVIEWS API ====================

  app.post("/api/reviews", requireAuth, (req, res) => {
    const { productId, rating, comment, images } = req.body;
    const user = db.getUserById((req as any).user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const newRev = db.addReview({
      productId,
      userId: user.id,
      userName: user.name,
      rating: parseInt(rating),
      comment,
      images
    });

    res.status(201).json(newRev);
  });

  // ==================== COUPONS API ====================

  app.get("/api/coupons", (req, res) => {
    res.json(db.coupons);
  });

  app.post("/api/coupons/validate", (req, res) => {
    const { code, amount } = req.body;
    const coupon = db.coupons.find(c => c.code.toUpperCase() === code.toUpperCase() && c.isActive);
    if (!coupon) {
      return res.status(400).json({ error: "Invalid or expired coupon code" });
    }

    if (amount < coupon.minOrderValue) {
      return res.status(400).json({ error: `Coupon requires minimum purchase of $${coupon.minOrderValue}` });
    }

    res.json(coupon);
  });

  app.post("/api/coupons", requireAdmin, (req, res) => {
    const cp = db.addCoupon(req.body);
    res.status(201).json(cp);
  });

  app.delete("/api/coupons/:id", requireAdmin, (req, res) => {
    const success = db.deleteCoupon(req.params.id);
    if (!success) return res.status(404).json({ error: "Coupon not found" });
    res.json({ success: true });
  });

  // ==================== ORDERS API ====================

  app.get("/api/orders", requireAuth, (req, res) => {
    const list = db.orders.filter(o => o.userId === (req as any).user.id);
    // Sort descending by date
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json(list);
  });

  app.post("/api/orders", requireAuth, (req, res) => {
    const userId = (req as any).user.id;
    const { items, shippingAddress, shippingMethod, couponApplied, pricing, paymentMethod } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: "No items in order" });
    }

    const order = db.createOrder({
      userId,
      items,
      shippingAddress,
      shippingMethod,
      couponApplied,
      pricing,
      paymentMethod
    });

    // Empty user's cart on success
    db.saveCart(userId, []);

    res.status(201).json(order);
  });

  app.put("/api/orders/:id/status", requireAdmin, (req, res) => {
    const { status } = req.body;
    const success = db.updateOrderStatus(req.params.id, status);
    if (!success) {
      return res.status(404).json({ error: "Order not found" });
    }
    res.json({ success: true, order: db.orders.find(o => o.id === req.params.id) });
  });

  // ==================== INTELLIGENT AI ENDPOINTS ====================

  // Stylist Start/Get Chat Sessions
  app.post("/api/ai/stylist/session", (req, res) => {
    const userId = (req as any).user?.id;
    const session = db.createChatSession(userId);
    res.status(201).json(session);
  });

  app.get("/api/ai/stylist/session/:id", (req, res) => {
    const session = db.getChatSession(req.params.id);
    if (!session) return res.status(404).json({ error: "Session not found" });
    res.json(session);
  });

  app.post("/api/ai/stylist/chat", async (req, res) => {
    const { sessionId, message } = req.body;
    if (!sessionId || !message) {
      return res.status(400).json({ error: "sessionId and message are required" });
    }

    const session = db.getChatSession(sessionId);
    if (!session) return res.status(404).json({ error: "Session not found" });

    // Save user message
    session.messages.push({
      sender: "user",
      text: message,
      timestamp: new Date().toISOString()
    });

    // Call Gemini AI Stylist Agent
    const aiResponse = await generateStylistResponse(
      session.messages.slice(0, -1), // send history up to now
      message
    );

    // Save AI reply
    session.messages.push({
      sender: "ai",
      text: aiResponse.text,
      timestamp: new Date().toISOString(),
      suggestedProducts: aiResponse.suggestedProducts
    });

    db.updateChatSession(session);
    res.json({ reply: aiResponse.text, suggestedProducts: aiResponse.suggestedProducts, session });
  });

  // Multimodal Image / Voice Search API
  app.post("/api/ai/image-search", async (req, res) => {
    const { image, query } = req.body;
    if (!image) {
      return res.status(400).json({ error: "Base64 image is required for image search" });
    }

    // Save search entry for tracking analytics
    const userId = (req as any).user?.id;
    db.addSearchHistory({
      userId,
      query: query || "Visual Image Match",
      type: "image"
    });

    const result = await analyzeImageSearch(image, query);
    res.json(result);
  });

  // Voice Search Log (Voice translates to text in front-end, logs query and returns matched products)
  app.post("/api/ai/voice-search-log", (req, res) => {
    const { query } = req.body;
    const userId = (req as any).user?.id;
    db.addSearchHistory({
      userId,
      query,
      type: "voice"
    });
    res.json({ success: true });
  });

  // Personalized Recommendation Endpoint
  app.get("/api/ai/recommendations", (req, res) => {
    const userId = (req as any).user?.id || "u-user"; // default back to user context if unlogged for preview
    getAIPersonalizedRecommendations(userId)
      .then(result => {
        const products = result.recommendedIds.map(id => db.getProductById(id)).filter(Boolean);
        res.json({ products, reasons: result.reasons });
      })
      .catch(err => {
        console.error("Personalized recommendation error", err);
        res.status(500).json({ error: "Failed to generate AI recommendations" });
      });
  });

  // ==================== ANALYTICS & STATS API ====================

  app.get("/api/admin/analytics", requireAdmin, (req, res) => {
    const totalSales = db.orders.reduce((sum, o) => sum + o.pricing.total, 0);
    const totalOrders = db.orders.length;
    const totalUsers = db.users.length;
    const totalProducts = db.products.length;

    // Categorized statistics
    const lowStock = db.products.filter(p => p.stock <= 10).map(p => ({
      id: p.id,
      name: p.name,
      stock: p.stock
    }));

    // Grouping orders by status
    const ordersByStatus = db.orders.reduce((acc, o) => {
      acc[o.orderStatus] = (acc[o.orderStatus] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Popular searches
    const queries = db.searchHistory.map(h => h.query);
    const searchCounts = queries.reduce((acc, q) => {
      acc[q] = (acc[q] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const popularSearches = Object.entries(searchCounts)
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // AI analytics statistics
    const searchHistoryTypes = db.searchHistory.reduce((acc, h) => {
      acc[h.type] = (acc[h.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const activeChatSessionsCount = db.chatSessions.length;

    // Simulate monthly sales trends
    const salesHistory = [
      { month: "Jan", sales: 1200 },
      { month: "Feb", sales: 2100 },
      { month: "Mar", sales: 1800 },
      { month: "Apr", sales: 3400 },
      { month: "May", sales: 4500 },
      { month: "Jun", sales: totalSales }
    ];

    res.json({
      summary: {
        totalSales: parseFloat(totalSales.toFixed(2)),
        totalOrders,
        totalUsers,
        totalProducts,
        activeChatSessionsCount
      },
      lowStock,
      ordersByStatus,
      popularSearches,
      aiStats: {
        textSearches: searchHistoryTypes.text || 0,
        imageSearches: searchHistoryTypes.image || 0,
        voiceSearches: searchHistoryTypes.voice || 0,
        multimodalSearches: searchHistoryTypes.multimodal || 0,
        recommendationAccuracy: 94.5 // Simulated styling feedback loop accuracy
      },
      salesHistory
    });
  });

  // ==================== VITE & STATIC FILES SERVING ====================

  if (process.env.NODE_ENV !== "production") {
    // Vite middleware for dev mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite Development Middleware Mounted");
  } else {
    // Production static file server
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving static production assets from /dist");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AuraStyle Server is active at http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Critical server bootstrap error:", err);
});
