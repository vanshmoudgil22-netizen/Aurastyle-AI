import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { ProductCard } from "../components/ProductCard";
import { SkeletonList } from "../components/Skeleton";
import { Search, SlidersHorizontal, Grid, Tag, Compass, Sparkles, X } from "lucide-react";

export const Catalog: React.FC = () => {
  const { products, isLoadingProducts, loadProducts, selectProduct } = useApp();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedGender, setSelectedGender] = useState<string>("All");
  const [selectedOccasion, setSelectedOccasion] = useState<string>("All");
  const [filteredProducts, setFilteredProducts] = useState([...products]);
  const [showFilters, setShowFilters] = useState<boolean>(false);

  // Categories list
  const categories = ["All", "Apparel", "Footwear", "Accessories"];
  const genders = ["All", "Men", "Women", "Unisex"];
  const occasions = ["All", "Formal", "Casual", "Wedding", "Party"];

  // Filter application
  useEffect(() => {
    let result = [...products];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.fabric.toLowerCase().includes(q) ||
        p.material.toLowerCase().includes(q) ||
        p.aiTags.some(tag => tag.toLowerCase().includes(q))
      );
    }

    if (selectedCategory !== "All") {
      result = result.filter(p => p.category === selectedCategory || p.subcategory === selectedCategory);
    }

    if (selectedGender !== "All") {
      result = result.filter(p => p.gender === selectedGender || p.gender === "Unisex");
    }

    if (selectedOccasion !== "All") {
      result = result.filter(p => p.occasion === selectedOccasion);
    }

    setFilteredProducts(result);
  }, [products, searchQuery, selectedCategory, selectedGender, selectedOccasion]);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("All");
    setSelectedGender("All");
    setSelectedOccasion("All");
  };

  return (
    <div className="space-y-8 pb-16" id="catalog-page-container">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-5">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            The Aura Collection
          </h1>
          <p className="text-sm text-gray-400">
            Browse our exclusive tailored inventory of premium garments and accessories.
          </p>
        </div>

        {/* Dynamic Search Box */}
        <div className="relative max-w-md w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by keywords, fabrics (silk, wool, cashmere), or tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gold-500/50 transition-colors"
            id="catalog-search-input"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Grid Layout containing sidebar filters and cards */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Desktop Sidebar Filters */}
        <div className="hidden lg:block space-y-6" id="desktop-filters-sidebar">
          <div className="glass-panel p-5 rounded-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <span className="font-bold text-sm tracking-wide text-white flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-gold-400" />
                FILTERS
              </span>
              <button 
                onClick={clearFilters}
                className="text-[11px] text-gray-500 hover:text-gold-400 uppercase tracking-widest hover:underline cursor-pointer"
              >
                Reset All
              </button>
            </div>

            {/* Category Filter */}
            <div className="space-y-2">
              <span className="text-xs font-semibold tracking-wider text-gray-400 uppercase">Category</span>
              <div className="flex flex-col gap-1.5">
                {categories.map((c) => (
                  <button
                    key={c}
                    onClick={() => setSelectedCategory(c)}
                    className={`text-left px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                      selectedCategory === c 
                        ? "bg-gold-500/15 text-gold-400 border-l-2 border-gold-400 pl-4" 
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Gender Filter */}
            <div className="space-y-2">
              <span className="text-xs font-semibold tracking-wider text-gray-400 uppercase">Gender</span>
              <div className="flex flex-col gap-1.5">
                {genders.map((g) => (
                  <button
                    key={g}
                    onClick={() => setSelectedGender(g)}
                    className={`text-left px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                      selectedGender === g 
                        ? "bg-gold-500/15 text-gold-400 border-l-2 border-gold-400 pl-4" 
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {/* Occasion Filter */}
            <div className="space-y-2">
              <span className="text-xs font-semibold tracking-wider text-gray-400 uppercase">Occasion</span>
              <div className="flex flex-col gap-1.5">
                {occasions.map((o) => (
                  <button
                    key={o}
                    onClick={() => setSelectedOccasion(o)}
                    className={`text-left px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                      selectedOccasion === o 
                        ? "bg-gold-500/15 text-gold-400 border-l-2 border-gold-400 pl-4" 
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {o}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Filters Trigger Toggle Button */}
        <div className="lg:hidden flex items-center justify-between" id="mobile-filter-bar">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="glass-panel px-4 py-2.5 rounded-xl text-xs font-semibold text-white flex items-center gap-2 cursor-pointer"
            id="mobile-filter-toggle-btn"
          >
            <SlidersHorizontal className="w-4 h-4 text-gold-400" />
            {showFilters ? "Hide Filters" : "Show Filters"}
          </button>
          
          <span className="text-xs text-gray-400 font-mono">
            {filteredProducts.length} Items
          </span>
        </div>

        {/* Mobile Filters Overlay dropdown */}
        {showFilters && (
          <div className="lg:hidden glass-panel p-5 rounded-2xl space-y-4" id="mobile-filters-panel">
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider">Active Filters</span>
              <button onClick={clearFilters} className="text-xs text-gold-400 underline">Reset</button>
            </div>
            {/* Mobile Category */}
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Category</span>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {categories.map((c) => (
                  <button
                    key={c}
                    onClick={() => setSelectedCategory(c)}
                    className={`px-3 py-1 rounded-full text-xs ${
                      selectedCategory === c ? "bg-gold-500 text-black font-semibold" : "bg-white/5 text-gray-300"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
            {/* Mobile Gender */}
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Gender</span>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {genders.map((g) => (
                  <button
                    key={g}
                    onClick={() => setSelectedGender(g)}
                    className={`px-3 py-1 rounded-full text-xs ${
                      selectedGender === g ? "bg-gold-500 text-black font-semibold" : "bg-white/5 text-gray-300"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
            {/* Mobile Occasion */}
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Occasion</span>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {occasions.map((o) => (
                  <button
                    key={o}
                    onClick={() => setSelectedOccasion(o)}
                    className={`px-3 py-1 rounded-full text-xs ${
                      selectedOccasion === o ? "bg-gold-500 text-black font-semibold" : "bg-white/5 text-gray-300"
                    }`}
                  >
                    {o}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Product Cards Grid Area */}
        <div className="lg:col-span-3 space-y-6" id="products-catalog-grid">
          <div className="flex items-center justify-between text-xs text-gray-500 font-mono">
            <span>SHOWING {filteredProducts.length} OUT OF {products.length} ARTICLES</span>
            <span className="hidden lg:inline">CURRENCY: USD ($)</span>
          </div>

          {isLoadingProducts ? (
            <SkeletonList count={8} />
          ) : filteredProducts.length === 0 ? (
            <div className="glass-panel rounded-2xl p-12 text-center space-y-4" id="empty-catalog-state">
              <div className="bg-white/5 p-4 rounded-full w-fit mx-auto text-gray-400">
                <Compass className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white">No collections found</h3>
              <p className="text-sm text-gray-400 max-w-sm mx-auto">
                No articles match your specific active filter selection or keyword query. Let Aura help you.
              </p>
              <button
                onClick={clearFilters}
                className="bg-gold-500 hover:bg-gold-600 text-black px-5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {filteredProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
