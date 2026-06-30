import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { Settings, BarChart3, Package, Truck, Tag, Plus, Trash2, Edit2, AlertCircle, TrendingUp, Sparkles, Check, X } from "lucide-react";

export const Admin: React.FC = () => {
  const { token, products, loadProducts, addNotification } = useApp();
  const [activeTab, setActiveTab] = useState<"analytics" | "inventory" | "orders" | "coupons">("analytics");
  
  // Analytics State
  const [analytics, setAnalytics] = useState<any>(null);
  const [isLoadingStats, setIsLoadingStats] = useState<boolean>(false);

  // Products CRUD State
  const [isEditingProduct, setIsEditingProduct] = useState<boolean>(false);
  const [productForm, setProductForm] = useState<any>({
    id: "",
    name: "",
    brand: "",
    category: "Apparel",
    subcategory: "",
    price: 99.99,
    discount: 0,
    stock: 20,
    sku: "",
    description: "",
    images: ["https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&auto=format&fit=crop&q=80"],
    sizes: ["S", "M", "L", "XL"],
    colors: ["Classic White", "Midnight Black"],
    fabric: "Premium Cotton",
    material: "100% Organic Cotton",
    gender: "Unisex",
    occasion: "Casual",
    season: "All-Season",
    aiTags: ["premium", "minimalist", "cotton"]
  });

  // Orders Fulfillment state
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [couponsList, setCouponsList] = useState<any[]>([]);

  // New Coupon form
  const [newCoupon, setNewCoupon] = useState({
    code: "",
    discountType: "percentage" as "percentage" | "fixed",
    value: 15,
    minOrderValue: 80,
    expiryDate: "2026-12-31"
  });

  useEffect(() => {
    if (token) {
      fetchAnalytics();
      fetchOrdersList();
      fetchCouponsList();
    }
  }, [token, activeTab]);

  const fetchAnalytics = async () => {
    setIsLoadingStats(true);
    try {
      const res = await fetch("/api/admin/analytics", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const fetchOrdersList = async () => {
    try {
      // Fetch all orders in db by parsing admin endpoint or orders simulation
      const res = await fetch("/api/orders", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAllOrders(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCouponsList = async () => {
    try {
      const res = await fetch("/api/coupons");
      if (res.ok) {
        const data = await res.json();
        setCouponsList(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Product CRUD Handlers
  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = isEditingProduct ? "PUT" : "POST";
    const url = isEditingProduct ? `/api/products/${productForm.id}` : "/api/products";

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(productForm)
      });

      if (res.ok) {
        addNotification(
          isEditingProduct ? "Garment updated successfully!" : "New premium garment seeded!",
          "success"
        );
        setIsEditingProduct(false);
        resetProductForm();
        loadProducts(); // Sync catalog global state
      } else {
        const err = await res.json();
        addNotification(err.error || "Action failed.", "warning");
      }
    } catch (err) {
      addNotification("Network error submitting product.", "warning");
    }
  };

  const handleEditInit = (prod: any) => {
    setProductForm(prod);
    setIsEditingProduct(true);
    // Scroll to form
    window.scrollTo({ top: 300, behavior: "smooth" });
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm("Are you sure you want to remove this garment from inventory?")) return;
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        addNotification("Garment removed from inventory.", "info");
        loadProducts();
      }
    } catch (err) {
      addNotification("Deletion failed.", "warning");
    }
  };

  const resetProductForm = () => {
    setIsEditingProduct(false);
    setProductForm({
      id: "",
      name: "",
      brand: "Aura Private Label",
      category: "Apparel",
      subcategory: "",
      price: 99.99,
      discount: 0,
      stock: 20,
      sku: "AS-SKU-" + Math.floor(1000 + Math.random() * 9000),
      description: "",
      images: ["https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&auto=format&fit=crop&q=80"],
      sizes: ["S", "M", "L", "XL"],
      colors: ["Midnight Black", "Classic White"],
      fabric: "Premium Cotton",
      material: "100% Organic Cotton",
      gender: "Unisex",
      occasion: "Casual",
      season: "All-Season",
      aiTags: ["premium", "cotton"]
    });
  };

  // Fulfillment status updater
  const handleUpdateOrderStatus = async (orderId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "Processing" ? "Shipped" : "Delivered";
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: nextStatus })
      });

      if (res.ok) {
        addNotification(`Order status adjusted to ${nextStatus}`, "success");
        fetchOrdersList();
      }
    } catch (err) {
      addNotification("Fulfillment update failed.", "warning");
    }
  };

  // Coupons creation
  const handleAddCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/coupons", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newCoupon)
      });
      if (res.ok) {
        addNotification(`Coupon ${newCoupon.code} created!`, "success");
        setNewCoupon({ code: "", discountType: "percentage", value: 15, minOrderValue: 80, expiryDate: "2026-12-31" });
        fetchCouponsList();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    try {
      const res = await fetch(`/api/coupons/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        addNotification("Coupon removed.", "info");
        fetchCouponsList();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8 pb-16" id="admin-suite-page">
      <div className="border-b border-white/5 pb-5">
        <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-2">
          <Settings className="w-7 h-7 text-gold-400" />
          Aura Administration Hub
        </h1>
        <p className="text-sm text-gray-400">
          Tailor product stocks, fulfill express orders, seed coupon codes, and monitor Gemini metrics.
        </p>
      </div>

      {/* Main Tab bar */}
      <div className="flex bg-white/5 p-1 rounded-xl max-w-lg" id="admin-tabs">
        <button
          onClick={() => setActiveTab("analytics")}
          className={`flex-1 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
            activeTab === "analytics" ? "bg-gold-500 text-black font-bold" : "text-gray-400 hover:text-white"
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5 inline mr-1" />
          Analytics
        </button>
        <button
          onClick={() => setActiveTab("inventory")}
          className={`flex-1 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
            activeTab === "inventory" ? "bg-gold-500 text-black font-bold" : "text-gray-400 hover:text-white"
          }`}
        >
          <Package className="w-3.5 h-3.5 inline mr-1" />
          Products
        </button>
        <button
          onClick={() => setActiveTab("orders")}
          className={`flex-1 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
            activeTab === "orders" ? "bg-gold-500 text-black font-bold" : "text-gray-400 hover:text-white"
          }`}
        >
          <Truck className="w-3.5 h-3.5 inline mr-1" />
          Fulfillments
        </button>
        <button
          onClick={() => setActiveTab("coupons")}
          className={`flex-1 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
            activeTab === "coupons" ? "bg-gold-500 text-black font-bold" : "text-gray-400 hover:text-white"
          }`}
        >
          <Tag className="w-3.5 h-3.5 inline mr-1" />
          Coupons
        </button>
      </div>

      {/* 1. ANALYTICS BLOCK */}
      {activeTab === "analytics" && (
        <div className="space-y-8 animate-fade-in" id="analytics-tab-panel">
          {isLoadingStats || !analytics ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-10 h-10 border-4 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-gray-400 font-mono text-xs">COLLECTING TAILORED ANALYTICS...</p>
            </div>
          ) : (
            <>
              {/* Summary Cards Row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-gray-400 font-mono">Gross Revenue</span>
                  <span className="text-2xl font-extrabold text-white font-mono block">${analytics.summary.totalSales.toFixed(2)}</span>
                  <span className="text-[10px] text-emerald-400">↑ 14% vs last week</span>
                </div>
                <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-gray-400 font-mono">Completed Orders</span>
                  <span className="text-2xl font-extrabold text-white font-mono block">{analytics.summary.totalOrders}</span>
                  <span className="text-[10px] text-gray-500">100% dispatch rate</span>
                </div>
                <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-gray-400 font-mono">Registered Customers</span>
                  <span className="text-2xl font-extrabold text-white font-mono block">{analytics.summary.totalUsers}</span>
                  <span className="text-[10px] text-emerald-400">↑ 3 new registrations</span>
                </div>
                <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-gray-400 font-mono">AI Chat Sessions</span>
                  <span className="text-2xl font-extrabold text-white font-mono block">{analytics.summary.activeChatSessionsCount}</span>
                  <span className="text-[10px] text-gold-400">Average response: 1.2s</span>
                </div>
              </div>

              {/* Graphic charts via Custom stunning vector SVGs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* SVG Area Chart: Revenue Trend */}
                <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-4">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-gold-400" />
                    Boutique Sales Trend (6 Months)
                  </h3>
                  <div className="h-64 relative flex items-end">
                    {/* SVG Area Frame */}
                    <svg className="w-full h-full" viewBox="0 0 500 200">
                      <defs>
                        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#b3a623" stopOpacity="0.4" />
                          <stop offset="100%" stopColor="#b3a623" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      {/* Lines & Grids */}
                      <line x1="10" y1="180" x2="490" y2="180" stroke="#1f2937" strokeWidth="1" />
                      <line x1="10" y1="100" x2="490" y2="100" stroke="#1f2937" strokeWidth="1" strokeDasharray="4" />
                      
                      {/* Trend path */}
                      <path
                        d="M 20 170 Q 100 150 180 160 T 340 110 T 480 50"
                        fill="none"
                        stroke="#b3a623"
                        strokeWidth="3.5"
                      />
                      <path
                        d="M 20 170 Q 100 150 180 160 T 340 110 T 480 50 L 480 180 L 20 180 Z"
                        fill="url(#chartGrad)"
                      />
                      {/* Dot highlight points */}
                      <circle cx="20" cy="170" r="4.5" fill="#b3a623" />
                      <circle cx="180" cy="160" r="4.5" fill="#b3a623" />
                      <circle cx="340" cy="110" r="4.5" fill="#b3a623" />
                      <circle cx="480" cy="50" r="5.5" fill="#fff" stroke="#b3a623" strokeWidth="3" />
                    </svg>
                    
                    {/* X labels */}
                    <div className="absolute bottom-0 left-0 w-full flex justify-between px-4 text-[9px] text-gray-500 font-mono">
                      <span>JAN</span>
                      <span>MAR</span>
                      <span>MAY</span>
                      <span>JUN (REVENUE: ${analytics.summary.totalSales})</span>
                    </div>
                  </div>
                </div>

                {/* SVG Bar Chart: AI Features Utility Usage statistics */}
                <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-4">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-gold-400" />
                    Gemini AI Features Utility Statistics
                  </h3>
                  <div className="space-y-4 pt-2">
                    {/* Text Semantic searches */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-300">Semantic Text Search</span>
                        <span className="font-mono font-bold text-white">{analytics.aiStats.textSearches} queries</span>
                      </div>
                      <div className="w-full h-2.5 bg-gray-900 rounded-full overflow-hidden">
                        <div className="h-full bg-gold-500 rounded-full" style={{ width: "85%" }} />
                      </div>
                    </div>

                    {/* Image / Vision Search */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-300">Multimodal Lens Images</span>
                        <span className="font-mono font-bold text-white">{analytics.aiStats.imageSearches} uploads</span>
                      </div>
                      <div className="w-full h-2.5 bg-gray-900 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: "45%" }} />
                      </div>
                    </div>

                    {/* Voice Dictation Search */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-300">Voice Dictations</span>
                        <span className="font-mono font-bold text-white">{analytics.aiStats.voiceSearches} triggers</span>
                      </div>
                      <div className="w-full h-2.5 bg-gray-900 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: "30%" }} />
                      </div>
                    </div>

                    {/* Recommendation Accuracy rating */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 text-xs">
                      <span className="text-gray-400">Styling Match Feedback Accuracy:</span>
                      <span className="font-bold text-gold-400 font-mono text-sm">{analytics.aiStats.recommendationAccuracy}% Match Rate</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Lower Section: Popular query keywords & Low stock alerts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Popular Keywords search queries */}
                <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-4">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Popular Semantic Search Queries</h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {analytics.popularSearches.length === 0 ? (
                      <p className="text-xs text-gray-500 text-center py-4">No logged queries yet.</p>
                    ) : (
                      analytics.popularSearches.map((sq: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center py-2 border-b border-white/5 text-xs">
                          <span className="text-gray-300 italic">"{sq.query}"</span>
                          <span className="bg-white/5 border border-white/10 px-2 py-0.5 rounded font-mono text-gray-400 font-bold">
                            {sq.count} hits
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Low stock alerts warning card */}
                <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-4">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 text-red-400">
                    <AlertCircle className="w-4 h-4" />
                    Low Stock Alerts (≤ 10 Units)
                  </h3>
                  <div className="space-y-3 max-h-48 overflow-y-auto">
                    {analytics.lowStock.length === 0 ? (
                      <div className="p-4 bg-emerald-500/10 border border-emerald-500/10 text-emerald-400 rounded-xl text-center text-xs">
                        All articles have healthy stocks (no shortages).
                      </div>
                    ) : (
                      analytics.lowStock.map((ls: any) => (
                        <div key={ls.id} className="flex justify-between items-center text-xs py-2 border-b border-white/5">
                          <span className="text-white truncate max-w-xs">{ls.name}</span>
                          <span className="font-mono font-bold text-red-400">
                            {ls.stock} units
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* 2. PRODUCTS INVENTORY BLOCK */}
      {activeTab === "inventory" && (
        <div className="space-y-8 animate-fade-in" id="inventory-tab-panel">
          {/* Create / Edit Form Card */}
          <div className="glass-panel p-6 rounded-2xl space-y-5">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/5 pb-3">
              {isEditingProduct ? `Edit Premium Garment: ${productForm.name}` : "Seed New Premium Garment"}
            </h3>

            <form onSubmit={handleProductSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-5 text-xs">
              <div>
                <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Product Title</label>
                <input
                  type="text"
                  required
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-gold-500"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Brand Name</label>
                <input
                  type="text"
                  required
                  value={productForm.brand}
                  onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-gold-500"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">SKU Code</label>
                <input
                  type="text"
                  required
                  value={productForm.sku}
                  onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-gold-500"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Price (USD)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={productForm.price}
                  onChange={(e) => setProductForm({ ...productForm, price: parseFloat(e.target.value) })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-gold-500"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Discount (%)</label>
                <input
                  type="number"
                  required
                  value={productForm.discount}
                  onChange={(e) => setProductForm({ ...productForm, discount: parseInt(e.target.value) })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-gold-500"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Stock Count</label>
                <input
                  type="number"
                  required
                  value={productForm.stock}
                  onChange={(e) => setProductForm({ ...productForm, stock: parseInt(e.target.value) })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-gold-500"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Category</label>
                <select
                  value={productForm.category}
                  onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                  className="w-full bg-[#111827] border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-gold-500"
                >
                  <option value="Apparel">Apparel</option>
                  <option value="Footwear">Footwear</option>
                  <option value="Accessories">Accessories</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Subcategory</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Blazers, Sneakers, Jackets"
                  value={productForm.subcategory}
                  onChange={(e) => setProductForm({ ...productForm, subcategory: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-gold-500"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Occasion</label>
                <select
                  value={productForm.occasion}
                  onChange={(e) => setProductForm({ ...productForm, occasion: e.target.value })}
                  className="w-full bg-[#111827] border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-gold-500"
                >
                  <option value="Formal">Formal</option>
                  <option value="Casual">Casual</option>
                  <option value="Wedding">Wedding</option>
                  <option value="Sports">Sports</option>
                  <option value="Party">Party</option>
                </select>
              </div>

              <div className="sm:col-span-3">
                <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Product Description</label>
                <textarea
                  rows={3}
                  required
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-gold-500"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Image URL Address</label>
                <input
                  type="text"
                  required
                  value={productForm.images[0]}
                  onChange={(e) => setProductForm({ ...productForm, images: [e.target.value] })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none"
                />
              </div>

              <div className="sm:col-span-3 flex justify-end gap-3 pt-2">
                {isEditingProduct && (
                  <button
                    type="button"
                    onClick={resetProductForm}
                    className="px-5 py-2.5 rounded-xl border border-white/10 text-xs font-semibold text-gray-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  className="bg-gold-500 hover:bg-gold-600 text-black px-6 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  {isEditingProduct ? "Update Garment Info" : "Seed Garment"}
                </button>
              </div>
            </form>
          </div>

          {/* Catalog grid lists with CRUD triggers */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Garments Inventory</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="inventory-list">
              {products.map((prod) => (
                <div key={prod.id} className="glass-panel p-4 rounded-xl flex gap-4 items-center relative group">
                  <div className="w-12 aspect-[4/5] rounded overflow-hidden bg-gray-950 shrink-0">
                    <img src={prod.images[0]} alt="thumbnail" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-bold text-xs text-white block truncate">{prod.name}</span>
                    <span className="text-[10px] text-gray-500 block font-mono">
                      Stock: <span className={prod.stock <= 5 ? "text-red-400 font-bold" : "text-white"}>{prod.stock} items</span>
                    </span>
                    <span className="text-[10px] text-gold-400 font-mono">${prod.price}</span>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEditInit(prod)}
                      className="p-1.5 rounded hover:bg-white/5 text-gray-400 hover:text-white cursor-pointer"
                      title="Edit item"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(prod.id)}
                      className="p-1.5 rounded hover:bg-white/5 text-gray-400 hover:text-red-400 cursor-pointer"
                      title="Delete item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. DISPATCH fulfillment TRACK tab */}
      {activeTab === "orders" && (
        <div className="space-y-6 animate-fade-in" id="fulfillments-tab-panel">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Dispatch Shipments Queue</h3>

          <div className="space-y-4">
            {allOrders.length === 0 ? (
              <div className="glass-panel p-8 text-center text-xs text-gray-500">
                No active orders require courier shipment currently.
              </div>
            ) : (
              allOrders.map((ord) => (
                <div key={ord.id} className="glass-panel p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6" id={`fulfill-${ord.id}`}>
                  <div className="space-y-1 flex-1">
                    <span className="font-bold text-xs text-white font-mono">#{ord.id}</span>
                    <p className="text-xs text-gray-400">
                      Purchased by: {ord.shippingAddress.name} • Settle Amount: ${ord.pricing.total.toFixed(2)}
                    </p>
                    <p className="text-[10px] text-gray-500 font-mono">
                      ITEMS: {ord.items.map((i: any) => `${i.name} (x${i.quantity})`).join(", ")}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase ${
                      ord.orderStatus === "Processing" ? "bg-blue-500/10 text-blue-400 border border-blue-500/15" :
                      ord.orderStatus === "Shipped" ? "bg-gold-500/15 text-gold-400 border border-gold-500/15" :
                      "bg-emerald-500/10 text-emerald-400"
                    }`}>
                      {ord.orderStatus}
                    </span>

                    {ord.orderStatus !== "Delivered" && (
                      <button
                        onClick={() => handleUpdateOrderStatus(ord.id, ord.orderStatus)}
                        className="bg-gold-500 hover:bg-gold-600 text-black text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                      >
                        Adjust to {ord.orderStatus === "Processing" ? "Shipped" : "Delivered"}
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 4. COUPON CONTROL tab */}
      {activeTab === "coupons" && (
        <div className="space-y-8 animate-fade-in" id="coupons-tab-panel">
          <div className="glass-panel p-6 rounded-2xl space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Generate Coupon Code</h3>
            
            <form onSubmit={handleAddCoupon} className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Coupon Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. EXTRA15"
                  value={newCoupon.code}
                  onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Deduction Value</label>
                <input
                  type="number"
                  required
                  value={newCoupon.value}
                  onChange={(e) => setNewCoupon({ ...newCoupon, value: parseInt(e.target.value) })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Min order threshold ($)</label>
                <input
                  type="number"
                  required
                  value={newCoupon.minOrderValue}
                  onChange={(e) => setNewCoupon({ ...newCoupon, minOrderValue: parseInt(e.target.value) })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full bg-gold-500 hover:bg-gold-600 text-black py-3 rounded-xl font-bold text-xs tracking-wide transition-colors cursor-pointer"
                >
                  Forge Coupon
                </button>
              </div>
            </form>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Active Promo Coupons</h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {couponsList.map((cp) => (
                <div key={cp.id} className="glass-panel p-4 rounded-xl flex items-center justify-between border border-white/5 relative overflow-hidden" id={`coupon-card-${cp.id}`}>
                  <div className="space-y-1">
                    <span className="font-bold text-sm text-white font-mono uppercase tracking-wide flex items-center gap-1">
                      <Tag className="w-4 h-4 text-gold-400" />
                      {cp.code}
                    </span>
                    <span className="text-[10px] text-gray-400 block font-mono">
                      DEDUCT: {cp.discountType === "percentage" ? `${cp.value}%` : `$${cp.value}`} off
                    </span>
                    <span className="text-[9px] text-gray-500 block font-mono">
                      Min Threshold: ${cp.minOrderValue} • Expires: {cp.expiryDate}
                    </span>
                  </div>

                  <button
                    onClick={() => handleDeleteCoupon(cp.id)}
                    className="text-gray-500 hover:text-red-400 p-2 rounded hover:bg-white/5 transition-all cursor-pointer"
                    title="Delete Coupon"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="absolute top-0 right-0 w-1.5 h-full bg-gold-500" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default Admin;
