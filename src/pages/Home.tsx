import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { ProductCard } from "../components/ProductCard";
import { Sparkles, ArrowRight, TrendingUp, Compass, Calendar, Gift, ChevronRight } from "lucide-react";
import { motion } from "motion/react";

export const Home: React.FC = () => {
  const { products, setTab, selectProduct, user, token } = useApp();
  const [aiRecs, setAiRecs] = useState<any[]>([]);
  const [aiReasons, setAiReasons] = useState<Record<string, string>>({});
  const [isLoadingRecs, setIsLoadingRecs] = useState<boolean>(false);

  // Fetch AI recommendations
  useEffect(() => {
    fetchRecommendations();
  }, [user, products]);

  const fetchRecommendations = async () => {
    setIsLoadingRecs(true);
    try {
      const headers: HeadersInit = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/ai/recommendations", { headers });
      if (res.ok) {
        const data = await res.json();
        setAiRecs(data.products || []);
        setAiReasons(data.reasons || {});
      }
    } catch (err) {
      console.error("Failed to load home recommendations", err);
    } finally {
      setIsLoadingRecs(false);
    }
  };

  const trendingProducts = products.filter(p => p.rating >= 4.7).slice(0, 4);
  const summerProducts = products.filter(p => p.season === "Summer" || p.season === "All-Season").slice(0, 4);

  return (
    <div className="space-y-12 pb-16" id="home-page-container">
      {/* Hero Showcase Section */}
      <section className="relative rounded-3xl overflow-hidden glass-panel border border-white/10" id="hero-section">
        <div className="absolute inset-0 z-0 opacity-60">
          <img 
            src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1600&auto=format&fit=crop&q=80" 
            alt="Luxury Fashion Showcase"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover scale-105 filter blur-xs"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0b0f19] via-[#0b0f19]/80 to-transparent" />
        </div>

        <div className="relative z-10 px-8 py-20 md:py-32 md:px-12 max-w-2xl space-y-6">
          <div className="inline-flex items-center gap-2 bg-gold-400/10 border border-gold-400/20 px-3 py-1 rounded-full text-xs font-semibold text-gold-400">
            <Sparkles className="w-3.5 h-3.5" />
            AI-TAILORED LUXURY FASHION
          </div>

          <h1 className="text-4xl md:text-6xl font-sans font-bold text-white tracking-tight leading-none">
            Aura<span className="text-gold-400">Style</span>
          </h1>
          <p className="text-gray-300 text-lg leading-relaxed font-light">
            Step into the future of boutique styling. AuraStyle integrates Google Gemini AI to translate your words, voice, and images into pristine tailored coordinates.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <button
              onClick={() => setTab("search")}
              className="bg-gold-500 hover:bg-gold-600 text-black px-6 py-3 rounded-xl font-medium tracking-wide flex items-center justify-center gap-2 transition-all duration-300 transform hover:scale-105 cursor-pointer shadow-lg shadow-gold-500/10"
              id="hero-ai-search-btn"
            >
              Start AI Search
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setTab("stylist")}
              className="glass-panel hover:bg-white/10 text-white px-6 py-3 rounded-xl font-medium tracking-wide flex items-center justify-center gap-2 transition-colors cursor-pointer"
              id="hero-stylist-chat-btn"
            >
              Consult AI Stylist
            </button>
          </div>
        </div>
      </section>

      {/* AI Personalized Recommendations Section */}
      <section className="space-y-6" id="ai-recommendations-section">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-gold-400">
              <Sparkles className="w-4 h-4 fill-gold-400/20" />
              <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white">
                {user ? `Curated for You, ${user.name.split(" ")[0]}` : "Aura's Tailored Curations"}
              </h2>
            </div>
            <p className="text-sm text-gray-400">
              {user 
                ? "Gemini analyzed your browse and purchase history to forge these custom wardrobe pairings." 
                : "Sign in to activate full hyper-personalized recommendations tailored by Gemini."
              }
            </p>
          </div>
          {!user && (
            <button
              onClick={() => setTab("profile")}
              className="text-xs text-gold-400 hover:text-white font-semibold transition-colors flex items-center gap-1 hover:underline cursor-pointer"
            >
              Unlock Personalization <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {isLoadingRecs ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="glass-panel rounded-2xl h-[400px] animate-pulse shimmer-bg" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {aiRecs.slice(0, 4).map((p) => (
              <div key={p.id} className="flex flex-col h-full group" id={`recs-${p.id}`}>
                <ProductCard product={p} />
                
                {/* AI Justification bubble */}
                {aiReasons[p.id] && (
                  <div className="mt-3 p-3.5 rounded-xl bg-gold-400/5 border border-gold-400/15 text-xs text-gold-200 leading-relaxed italic relative before:content-[''] before:absolute before:-top-2 before:left-6 before:border-8 before:border-transparent before:border-b-gold-400/15">
                    <span className="font-semibold block text-[10px] uppercase tracking-wider text-gold-400 not-italic mb-1">
                      AURA STYLIST NOTE
                    </span>
                    "{aiReasons[p.id]}"
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Quick Interactive Styling Promo */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6" id="promos-section">
        {/* Promo 1 */}
        <div 
          onClick={() => setTab("search")}
          className="glass-panel p-6 rounded-2xl border border-white/5 hover:border-gold-500/20 transition-all duration-300 group cursor-pointer flex flex-col justify-between h-52 hover:scale-102"
        >
          <div className="space-y-3">
            <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl w-fit">
              <Compass className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white group-hover:text-gold-400 transition-colors">
              Multimodal Visual Search
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Upload an image of a garment or capture with your camera, then tell Aura how to customize it.
            </p>
          </div>
          <span className="text-xs font-semibold text-gold-400 flex items-center gap-1.5 group-hover:underline">
            Launch Lens <ChevronRight className="w-4 h-4" />
          </span>
        </div>

        {/* Promo 2 */}
        <div 
          onClick={() => setTab("stylist")}
          className="glass-panel p-6 rounded-2xl border border-white/5 hover:border-gold-500/20 transition-all duration-300 group cursor-pointer flex flex-col justify-between h-52 hover:scale-102"
        >
          <div className="space-y-3">
            <div className="p-3 bg-gold-400/10 text-gold-400 rounded-xl w-fit">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white group-hover:text-gold-400 transition-colors">
              Interactive Fitting Chat
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Preparing for a wedding or job interview? Chat in real-time with Aura to tailor the perfect coordinated look.
            </p>
          </div>
          <span className="text-xs font-semibold text-gold-400 flex items-center gap-1.5 group-hover:underline">
            Talk with Aura <ChevronRight className="w-4 h-4" />
          </span>
        </div>

        {/* Promo 3 */}
        <div 
          onClick={() => setTab("products")}
          className="glass-panel p-6 rounded-2xl border border-white/5 hover:border-gold-500/20 transition-all duration-300 group cursor-pointer flex flex-col justify-between h-52 hover:scale-102"
        >
          <div className="space-y-3">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl w-fit">
              <Gift className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white group-hover:text-gold-400 transition-colors">
              Exclusive Member Coupons
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Apply AI styling discount codes like <span className="font-mono text-gold-400 font-bold">FASHIONAI</span> at checkout to unlock savings.
            </p>
          </div>
          <span className="text-xs font-semibold text-gold-400 flex items-center gap-1.5 group-hover:underline">
            Explore Offers <ChevronRight className="w-4 h-4" />
          </span>
        </div>
      </section>

      {/* Trending Items Showcase Section */}
      <section className="space-y-6" id="trending-section">
        <div className="flex items-center gap-2 text-white border-b border-white/5 pb-2">
          <TrendingUp className="w-4 h-4 text-gold-400" />
          <h2 className="text-xl font-bold tracking-tight">Trending Collections</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {trendingProducts.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* Seasonal Spotlight Section */}
      <section className="space-y-6" id="seasonal-section">
        <div className="flex items-center justify-between border-b border-white/5 pb-2">
          <div className="flex items-center gap-2 text-white">
            <Calendar className="w-4 h-4 text-gold-400" />
            <h2 className="text-xl font-bold tracking-tight">Summer Spotlight</h2>
          </div>
          <button 
            onClick={() => setTab("products")} 
            className="text-xs text-gold-400 hover:text-white font-semibold flex items-center gap-1 cursor-pointer hover:underline"
          >
            View All <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {summerProducts.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    </div>
  );
};
