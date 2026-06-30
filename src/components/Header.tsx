import React from "react";
import { useApp } from "../context/AppContext";
import { Sparkles, Heart, ShoppingBag, User as UserIcon, Settings, Compass, Search, MessageSquare } from "lucide-react";

export const Header: React.FC = () => {
  const { currentTab, setTab, cart, wishlist, user } = useApp();

  const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-white/5 backdrop-blur-md px-6 py-4 flex items-center justify-between" id="app-header">
      {/* Brand Logo */}
      <button 
        onClick={() => setTab("home")} 
        className="flex items-center gap-2 cursor-pointer group"
        id="logo-button"
      >
        <div className="bg-gradient-to-tr from-gold-600 to-gold-400 p-1.5 rounded-lg text-black group-hover:scale-110 transition-transform duration-300">
          <Sparkles className="w-5 h-5 fill-black/10" />
        </div>
        <span className="font-sans font-bold text-lg tracking-wider text-white uppercase group-hover:text-gold-400 transition-colors duration-300">
          Aura<span className="font-light text-gold-400">Style</span>
        </span>
      </button>

      {/* Main Navigation Tabs */}
      <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400" id="navigation-bar">
        <button
          onClick={() => setTab("home")}
          className={`cursor-pointer hover:text-white transition-colors py-1 relative ${
            currentTab === "home" ? "text-white" : ""
          }`}
        >
          Explore
          {currentTab === "home" && (
            <span className="absolute bottom-0 left-0 w-full h-[2px] bg-gold-400 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setTab("products")}
          className={`cursor-pointer hover:text-white transition-colors py-1 relative ${
            currentTab === "products" || currentTab === "product-detail" ? "text-white" : ""
          }`}
        >
          Catalog
          {(currentTab === "products" || currentTab === "product-detail") && (
            <span className="absolute bottom-0 left-0 w-full h-[2px] bg-gold-400 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setTab("search")}
          className={`cursor-pointer hover:text-gold-400 text-gold-300 flex items-center gap-1.5 py-1 relative ${
            currentTab === "search" ? "text-gold-400" : ""
          }`}
        >
          <Search className="w-4 h-4" />
          AI Search
          {currentTab === "search" && (
            <span className="absolute bottom-0 left-0 w-full h-[2px] bg-gold-400 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setTab("stylist")}
          className={`cursor-pointer hover:text-white flex items-center gap-1.5 py-1 relative ${
            currentTab === "stylist" ? "text-white" : ""
          }`}
        >
          <MessageSquare className="w-4 h-4 text-gold-400" />
          AI Stylist
          {currentTab === "stylist" && (
            <span className="absolute bottom-0 left-0 w-full h-[2px] bg-gold-400 rounded-full" />
          )}
        </button>
      </nav>

      {/* Action Icons Panel */}
      <div className="flex items-center gap-4" id="action-panel">
        {/* Wishlist Link */}
        <button
          onClick={() => setTab("wishlist")}
          className={`relative p-2 text-gray-400 hover:text-white transition-colors cursor-pointer rounded-lg hover:bg-white/5 ${
            currentTab === "wishlist" ? "text-white bg-white/5" : ""
          }`}
          aria-label="Wishlist"
          id="wishlist-header-btn"
        >
          <Heart className="w-5 h-5" />
          {wishlist.length > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          )}
        </button>

        {/* Shopping Cart Link */}
        <button
          onClick={() => setTab("cart")}
          className={`relative p-2 text-gray-400 hover:text-white transition-colors cursor-pointer rounded-lg hover:bg-white/5 ${
            currentTab === "cart" ? "text-white bg-white/5" : ""
          }`}
          aria-label="Cart"
          id="cart-header-btn"
        >
          <ShoppingBag className="w-5 h-5" />
          {totalCartItems > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-gold-500 text-[10px] font-bold text-black border border-[#0b0f19]">
              {totalCartItems}
            </span>
          )}
        </button>

        {/* Admin Link (Only for admins) */}
        {user?.role === "admin" && (
          <button
            onClick={() => setTab("admin")}
            className={`p-2 text-gold-400 hover:text-white transition-colors cursor-pointer rounded-lg hover:bg-white/5 ${
              currentTab === "admin" ? "text-white bg-white/5" : ""
            }`}
            title="Admin Dashboard"
            id="admin-header-btn"
          >
            <Settings className="w-5 h-5" />
          </button>
        )}

        {/* User Account Portal Link */}
        <button
          onClick={() => setTab("profile")}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 hover:border-gold-400/50 transition-colors cursor-pointer text-sm font-medium ${
            currentTab === "profile" ? "text-gold-400 border-gold-400/30 bg-gold-400/5" : "text-gray-300"
          }`}
          id="profile-header-btn"
        >
          <UserIcon className="w-4 h-4" />
          <span className="hidden sm:inline max-w-[80px] truncate">
            {user ? user.name.split(" ")[0] : "Sign In"}
          </span>
        </button>
      </div>
    </header>
  );
};
