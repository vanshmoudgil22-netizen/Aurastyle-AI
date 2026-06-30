import React from "react";
import { AppProvider, useApp } from "./context/AppContext";
import { Header } from "./components/Header";
import { Notifications } from "./components/Notifications";

// Pages Imports
import { Home } from "./pages/Home";
import { Catalog } from "./pages/Catalog";
import { AISearch } from "./pages/AISearch";
import { AIStylist } from "./pages/AIStylist";
import { ProductDetail } from "./pages/ProductDetail";
import { Cart } from "./pages/Cart";
import { Checkout } from "./pages/Checkout";
import { Orders } from "./pages/Orders";
import { Profile } from "./pages/Profile";
import { Admin } from "./pages/Admin";

// Icon for Wishlist view
import { Heart, Sparkles, AlertCircle } from "lucide-react";
import { ProductCard } from "./components/ProductCard";

const AppContent: React.FC = () => {
  const { currentTab, setTab, wishlist } = useApp();

  // Render the correct tab view based on current state
  const renderTabContent = () => {
    switch (currentTab) {
      case "home":
        return <Home />;
      case "products":
        return <Catalog />;
      case "search":
        return <AISearch />;
      case "stylist":
        return <AIStylist />;
      case "product-detail":
      case "detail":
        return <ProductDetail />;
      case "cart":
        return <Cart />;
      case "checkout":
        return <Checkout />;
      case "orders":
        return <Orders />;
      case "profile":
        return <Profile />;
      case "admin":
        return <Admin />;
      case "wishlist":
        return (
          <div className="space-y-8 pb-16" id="wishlist-page">
            <div className="border-b border-white/5 pb-5">
              <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-2">
                <Heart className="w-7 h-7 text-red-500 fill-red-500/10" />
                My Curated Wishlist
              </h1>
              <p className="text-sm text-gray-400">
                Your luxury items of interest. Ask our Stylist for matches!
              </p>
            </div>

            {wishlist.length === 0 ? (
              <div className="glass-panel p-16 text-center space-y-4 rounded-2xl" id="empty-wishlist">
                <Heart className="w-8 h-8 text-gray-500 mx-auto" />
                <h3 className="text-lg font-bold text-white">No items in wishlist yet</h3>
                <p className="text-sm text-gray-400 max-w-sm mx-auto">
                  Browse our wardrobe and tap the heart icon on items you love.
                </p>
                <button
                  onClick={() => setTab("products")}
                  className="bg-gold-500 hover:bg-gold-600 text-black px-6 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Browse Catalog
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6" id="wishlist-grid">
                {wishlist.map((prod) => (
                  <ProductCard key={prod.id} product={prod} />
                ))}
              </div>
            )}
          </div>
        );
      default:
        return <Home />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-gray-100 flex flex-col font-sans selection:bg-gold-500/30 selection:text-gold-400">
      {/* Navigation Header */}
      <Header />

      {/* Main Container Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-fade-in">
          {renderTabContent()}
        </div>
      </main>

      {/* Floating Notifications System */}
      <Notifications />

      {/* Mini footer */}
      <footer className="border-t border-white/5 py-6 bg-black/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <span>© 2026 AuraStyle Private Label. All Rights Reserved.</span>
          <div className="flex gap-4 font-mono">
            <span>SECURE ENCRYPTIONS ACTIVE</span>
            <span>•</span>
            <span className="text-gold-500/80">GEMINI AI INTEGRATIONS LIVE</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
