import React, { useState, useRef } from "react";
import { useApp } from "../context/AppContext";
import { ProductCard } from "../components/ProductCard";
import { Search, Mic, Camera, Sparkles, Upload, RotateCcw, Image as ImageIcon, Sliders, Check } from "lucide-react";

export const AISearch: React.FC = () => {
  const { products, selectProduct, addNotification } = useApp();
  const [activeMode, setActiveMode] = useState<"text" | "image" | "voice">("text");

  // Semantic search states
  const [semanticQuery, setSemanticQuery] = useState<string>("");
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [matchedProducts, setMatchedProducts] = useState<any[]>([]);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<string>("");

  // Image search states
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageModifier, setImageModifier] = useState<string>("");
  const [extractedFeatures, setExtractedFeatures] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Voice recognition states
  const [isListening, setIsListening] = useState<boolean>(false);
  const [voiceQuery, setVoiceQuery] = useState<string>("");
  const recognitionRef = useRef<any>(null);

  // Handle image upload and convert to base64
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setExtractedFeatures(null);
        setMatchedProducts([]);
        setAiAnalysisResult("");
      };
      reader.readAsDataURL(file);
    }
  };

  // Trigger multimodal image search API
  const handleImageSearch = async () => {
    if (!imagePreview) return;
    setIsSearching(true);
    try {
      const res = await fetch("/api/ai/image-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: imagePreview,
          query: imageModifier
        })
      });

      if (res.ok) {
        const data = await res.json();
        setExtractedFeatures(data.extractedFeatures || {});
        setAiAnalysisResult(data.explanation || "");
        
        // Map matched IDs to products
        const matched = (data.matchedProducts || [])
          .map((id: string) => products.find(p => p.id === id))
          .filter(Boolean);
        setMatchedProducts(matched);
        addNotification("Multimodal search completed!", "success");
      }
    } catch (err) {
      addNotification("Multimodal image analysis failed.", "warning");
    } finally {
      setIsSearching(false);
    }
  };

  // Run Semantic Text Search (hits /api/products?search=...)
  const runSemanticSearch = async (queryToSearch: string) => {
    const q = queryToSearch.trim();
    if (!q) return;

    setIsSearching(true);
    setAiAnalysisResult("");
    try {
      const res = await fetch(`/api/products?search=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setMatchedProducts(data);
        
        // Custom smart styling notes generated on the fly for text search queries
        if (data.length > 0) {
          setAiAnalysisResult(`I mapped your concept "${q}" and discovered ${data.length} premium pieces in our wardrobe that align with this specific occasion and fit.`);
        } else {
          setAiAnalysisResult(`I reviewed our wardrobe for "${q}" but couldn't find exact matches. Try searching for broader terms like "formal", "denim", "blazer", or "wool".`);
        }
      }
    } catch (err) {
      addNotification("Semantic search failed.", "warning");
    } finally {
      setIsSearching(false);
    }
  };

  // Start continuous browser Voice Recognition
  const startVoiceRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      addNotification("Speech Recognition is not supported on this browser version. Please type your query.", "warning");
      return;
    }

    try {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.lang = "en-US";
      rec.interimResults = false;

      rec.onstart = () => {
        setIsListening(true);
        setVoiceQuery("Listening... Speak now.");
      };

      rec.onerror = (e: any) => {
        console.error("Speech error", e);
        addNotification("Microphone permission or recognition failed.", "warning");
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setVoiceQuery(transcript);
        addNotification(`Voice Captured: "${transcript}"`, "success");
        
        // Log query and trigger search
        fetch("/api/ai/voice-search-log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: transcript })
        });
        
        runSemanticSearch(transcript);
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (err) {
      console.error(err);
      setIsListening(false);
    }
  };

  const stopVoiceRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const resetAll = () => {
    setSemanticQuery("");
    setMatchedProducts([]);
    setAiAnalysisResult("");
    setImagePreview(null);
    setImageModifier("");
    setExtractedFeatures(null);
    setVoiceQuery("");
  };

  return (
    <div className="space-y-8 pb-16" id="ai-search-page">
      {/* Dynamic Title */}
      <div className="border-b border-white/5 pb-5">
        <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-2">
          <Sparkles className="w-7 h-7 text-gold-400" />
          Aura Lens & Smart Search
        </h1>
        <p className="text-sm text-gray-400">
          Search the catalog with the power of Gemini. Tap image uploads, voice speech, or natural semantics.
        </p>
      </div>

      {/* Selector Tabs */}
      <div className="flex bg-white/5 p-1 rounded-xl max-w-md w-full" id="ai-search-tabs">
        <button
          onClick={() => { setActiveMode("text"); resetAll(); }}
          className={`flex-1 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
            activeMode === "text" ? "bg-gold-500 text-black shadow-lg" : "text-gray-400 hover:text-white"
          }`}
        >
          Semantic Text
        </button>
        <button
          onClick={() => { setActiveMode("image"); resetAll(); }}
          className={`flex-1 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
            activeMode === "image" ? "bg-gold-500 text-black shadow-lg" : "text-gray-400 hover:text-white"
          }`}
        >
          Image & Multimodal
        </button>
        <button
          onClick={() => { setActiveMode("voice"); resetAll(); }}
          className={`flex-1 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
            activeMode === "voice" ? "bg-gold-500 text-black shadow-lg" : "text-gray-400 hover:text-white"
          }`}
        >
          Voice Search
        </button>
      </div>

      {/* Main Core Workspaces */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Search controls segment */}
        <div className="lg:col-span-1 space-y-6">
          {/* 1. TEXT MODE */}
          {activeMode === "text" && (
            <div className="glass-panel p-6 rounded-2xl space-y-4" id="text-workspace">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Concept Search</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Describe the "vibe", occasion, or season you are shopping for. For example, <span className="text-gold-400 italic">"I need something formal and elegant for high-profile business interviews."</span>
              </p>
              <div className="space-y-3 pt-2">
                <input
                  type="text"
                  placeholder="e.g. formal clothing for board meetings"
                  value={semanticQuery}
                  onChange={(e) => setSemanticQuery(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-gold-500"
                />
                <button
                  onClick={() => runSemanticSearch(semanticQuery)}
                  disabled={isSearching || !semanticQuery.trim()}
                  className="w-full bg-gold-500 hover:bg-gold-600 text-black font-bold py-3 rounded-xl text-xs tracking-wide flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Search className="w-4 h-4" />
                  {isSearching ? "Consulting Aura Wardrobe..." : "Analyze Semantics"}
                </button>
              </div>
            </div>
          )}

          {/* 2. IMAGE / MULTIMODAL MODE */}
          {activeMode === "image" && (
            <div className="glass-panel p-6 rounded-2xl space-y-5" id="image-workspace">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Upload Design Inspiration</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Provide an image of a garment, pattern, or celebrity outfit, and ask Gemini to map matching items from our wardrobe.
              </p>

              {/* Upload Stage area */}
              {!imagePreview ? (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-white/15 rounded-2xl p-8 text-center hover:border-gold-500/50 transition-colors cursor-pointer space-y-3"
                >
                  <div className="p-3 bg-white/5 rounded-full w-fit mx-auto text-gray-400">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-white block">Drag & Drop Image</span>
                    <span className="text-[10px] text-gray-500 block">PNG, JPG, or WEBP up to 5MB</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-950 border border-white/10">
                    <img src={imagePreview} alt="Search template" className="w-full h-full object-cover" />
                    <button
                      onClick={() => setImagePreview(null)}
                      className="absolute top-3 right-3 p-1.5 rounded-full bg-black/60 text-white hover:bg-red-500 transition-colors"
                      title="Clear image"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Multimodal Modifier Prompt */}
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-gray-400 block">
                      AIPrompt Adjuster (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 'I need this jacket in black' or 'Suggest coordinates'"
                      value={imageModifier}
                      onChange={(e) => setImageModifier(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-gold-500"
                    />
                  </div>

                  <button
                    onClick={handleImageSearch}
                    disabled={isSearching}
                    className="w-full bg-gold-500 hover:bg-gold-600 text-black font-bold py-3 rounded-xl text-xs tracking-wide flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    {isSearching ? "AI Analyzing Text & Image..." : "Analyze Multimodal Lens"}
                  </button>
                </div>
              )}

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageSelect}
                accept="image/*"
                className="hidden"
              />
            </div>
          )}

          {/* 3. VOICE MODE */}
          {activeMode === "voice" && (
            <div className="glass-panel p-6 rounded-2xl text-center space-y-6" id="voice-workspace">
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Voice Assisted Search</h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Click the microphone button and describe what you are looking for in natural speech. Aura will instantly translate and query.
                </p>
              </div>

              {/* Pulsing micro button */}
              <div className="relative flex justify-center py-6">
                {isListening && (
                  <span className="absolute inset-auto w-24 h-24 bg-gold-500/10 rounded-full animate-ping" />
                )}
                <button
                  onClick={isListening ? stopVoiceRecognition : startVoiceRecognition}
                  className={`w-16 h-16 rounded-full flex items-center justify-center transition-all cursor-pointer relative z-10 ${
                    isListening 
                      ? "bg-red-500 text-white shadow-lg shadow-red-500/20 scale-105" 
                      : "bg-gold-500 text-black shadow-lg shadow-gold-500/10 hover:scale-105"
                  }`}
                  id="voice-mic-trigger-btn"
                >
                  <Mic className="w-6 h-6 animate-pulse" />
                </button>
              </div>

              {/* Speech Output transcript box */}
              {voiceQuery && (
                <div className="p-4 rounded-xl bg-white/5 border border-white/5 text-xs text-gray-300 italic">
                  "{voiceQuery}"
                </div>
              )}
            </div>
          )}
        </div>

        {/* Results grid panel */}
        <div className="lg:col-span-2 space-y-6" id="ai-search-results">
          {/* AI stylist feedback bubble if any */}
          {aiAnalysisResult && (
            <div className="glass-panel p-5 rounded-2xl border border-gold-500/15 bg-gold-500/5 space-y-2 animate-fade-in">
              <span className="text-[10px] uppercase font-bold tracking-widest text-gold-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 fill-gold-400/10" />
                Aura Wardrobe Analyst
              </span>
              <p className="text-xs text-gray-200 leading-relaxed italic">
                "{aiAnalysisResult}"
              </p>

              {/* Extra visual metadata attributes if Image Search */}
              {extractedFeatures && Object.keys(extractedFeatures).length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2 border-t border-white/5">
                  {extractedFeatures.category && (
                    <span className="px-2 py-0.5 bg-white/5 border border-white/5 rounded text-[10px] font-mono uppercase text-gray-300">
                      Category: {extractedFeatures.category}
                    </span>
                  )}
                  {extractedFeatures.colors && extractedFeatures.colors.map((c: string) => (
                    <span key={c} className="px-2 py-0.5 bg-white/5 border border-white/5 rounded text-[10px] font-mono uppercase text-gray-300 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c.toLowerCase() }} />
                      Color: {c}
                    </span>
                  ))}
                  {extractedFeatures.style && (
                    <span className="px-2 py-0.5 bg-white/5 border border-white/5 rounded text-[10px] font-mono uppercase text-gray-300">
                      Style: {extractedFeatures.style}
                    </span>
                  )}
                  {extractedFeatures.fabric && (
                    <span className="px-2 py-0.5 bg-white/5 border border-white/5 rounded text-[10px] font-mono uppercase text-gray-300">
                      Fabric: {extractedFeatures.fabric}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Catalog items matches container */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              {matchedProducts.length > 0 ? `AI Wardrobe Matches (${matchedProducts.length})` : "Wardrobe Output"}
            </h4>

            {isSearching ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="glass-panel rounded-2xl h-80 animate-pulse shimmer-bg" />
                <div className="glass-panel rounded-2xl h-80 animate-pulse shimmer-bg" />
              </div>
            ) : matchedProducts.length === 0 ? (
              <div className="glass-panel p-12 text-center text-gray-400 space-y-3 rounded-2xl">
                <ImageIcon className="w-8 h-8 mx-auto opacity-35" />
                <p className="text-xs">No active matching results. Supply search queries or image assets above to initiate Gemini analysis.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {matchedProducts.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
