import React, { useState, useEffect, useRef } from "react";
import { useApp } from "../context/AppContext";
import { ProductCard } from "../components/ProductCard";
import { Sparkles, Send, Mic, User, User as UserIcon, Calendar, ArrowRight, Star, RefreshCw } from "lucide-react";

export const AIStylist: React.FC = () => {
  const { chatSession, isChatLoading, startStylistSession, sendStylistMessage, products, addNotification } = useApp();
  const [inputText, setInputText] = useState<string>("");
  const [isListening, setIsListening] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chatSession) {
      startStylistSession();
    }
  }, [chatSession]);

  useEffect(() => {
    scrollToBottom();
  }, [chatSession?.messages, isChatLoading]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSend = () => {
    if (!inputText.trim() || isChatLoading) return;
    sendStylistMessage(inputText);
    setInputText("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

  // Pre-filled quick start recommendation prompts
  const starterPrompts = [
    { label: "Wedding guest ensemble", text: "I have a formal wedding to attend tomorrow. Suggest a complete curated ensemble with accessories." },
    { label: "Tailor an interview look", text: "I have an interview for an executive role. Tailor a confident formal look from the wardrobe." },
    { label: "Cozy winter outfit", text: "I need styling suggestions for a cozy, elegant winter weekend getaway." },
    { label: "Denim street styling", text: "Suggest some edgy street combinations featuring a denim jacket." }
  ];

  // Voice recognition helper inside chat
  const triggerVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      addNotification("Voice recognition not supported on this browser version.", "warning");
      return;
    }

    try {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.lang = "en-US";
      rec.interimResults = false;

      rec.onstart = () => {
        setIsListening(true);
        addNotification("Listening to your voice...", "info");
      };

      rec.onerror = () => {
        addNotification("Microphone failure or permission denied.", "warning");
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      rec.onresult = (event: any) => {
        const result = event.results[0][0].transcript;
        setInputText(result);
      };

      rec.start();
    } catch (err) {
      console.error(err);
      setIsListening(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] min-h-[500px]" id="stylist-page-container">
      {/* Upper header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-4 px-1">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gold-500 rounded-xl flex items-center justify-center text-black shadow-lg shadow-gold-500/10">
            <Sparkles className="w-5 h-5 fill-black/10" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-1.5">
              Aura Styling Suite
            </h1>
            <p className="text-xs text-emerald-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Interactive AI Stylist (Active)
            </p>
          </div>
        </div>

        <button 
          onClick={startStylistSession}
          disabled={isChatLoading}
          className="px-3 py-1.5 rounded-lg border border-white/10 text-xs font-semibold text-gray-400 hover:text-white hover:bg-white/5 transition-all flex items-center gap-1.5 cursor-pointer"
          title="Restart Stylist Session"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isChatLoading ? "animate-spin" : ""}`} />
          Reset Wardrobe
        </button>
      </div>

      {/* Main chat log frame */}
      <div className="flex-1 overflow-y-auto py-6 space-y-6 px-1" id="chat-messages-container">
        {chatSession?.messages.map((msg, i) => (
          <div 
            key={i} 
            className={`flex gap-3 max-w-2xl ${
              msg.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
            }`}
            id={`chat-message-${i}`}
          >
            {/* Avatar block */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${
              msg.sender === "user" 
                ? "bg-white/5 border-white/10 text-white" 
                : "bg-gold-500 border-gold-500 text-black shadow-md shadow-gold-500/10"
            }`}>
              {msg.sender === "user" ? <UserIcon className="w-4 h-4" /> : <Sparkles className="w-4 h-4 fill-black/10" />}
            </div>

            {/* Bubble contents */}
            <div className="space-y-4 flex-1">
              <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                msg.sender === "user"
                  ? "bg-white/10 text-white rounded-tr-none"
                  : "bg-white/5 border border-white/5 text-gray-200 rounded-tl-none font-light"
              }`}>
                {msg.text}
              </div>

              {/* Suggested Product Carousels */}
              {msg.suggestedProducts && msg.suggestedProducts.length > 0 && (
                <div className="space-y-2 mt-2" id={`chat-suggestions-${i}`}>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-gold-400 block font-bold">
                    Aura's Recommended Coordinate Wardrobe:
                  </span>
                  
                  {/* Grid or flex scroll container of suggested cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-2">
                    {msg.suggestedProducts.map(prodId => {
                      const prod = products.find(p => p.id === prodId);
                      if (!prod) return null;
                      return (
                        <div key={prodId} className="w-full shrink-0 scale-95 hover:scale-100 transition-transform">
                          <ProductCard product={prod} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isChatLoading && (
          <div className="flex gap-3 mr-auto max-w-lg" id="chat-typing-indicator">
            <div className="w-8 h-8 rounded-full bg-gold-500 text-black flex items-center justify-center shrink-0 border border-gold-500 shadow-md">
              <Sparkles className="w-4 h-4 fill-black/10" />
            </div>
            <div className="bg-white/5 border border-white/5 p-4 rounded-2xl rounded-tl-none flex items-center gap-1.5">
              <span className="w-2 h-2 bg-gold-400 rounded-full animate-bounce" />
              <span className="w-2 h-2 bg-gold-400 rounded-full animate-bounce [animation-delay:0.2s]" />
              <span className="w-2 h-2 bg-gold-400 rounded-full animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Starter prompts drawer if chat is fresh */}
      {chatSession?.messages.length === 1 && (
        <div className="pb-4 space-y-2 px-1" id="starter-prompts-drawer">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
            Select an occasion to initiate styling dialogue:
          </span>
          <div className="flex flex-wrap gap-2">
            {starterPrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => sendStylistMessage(p.text)}
                disabled={isChatLoading}
                className="px-3 py-2 text-xs rounded-xl glass-panel border border-white/5 hover:border-gold-500/20 text-gray-300 hover:text-white transition-all cursor-pointer flex items-center gap-1.5"
              >
                {p.label}
                <ArrowRight className="w-3 h-3 text-gold-400" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Interactive typing input tray */}
      <div className="glass-panel p-3 rounded-2xl border border-white/10 flex items-center gap-3 relative z-10" id="chat-input-tray">
        <button
          onClick={triggerVoiceInput}
          disabled={isChatLoading}
          className={`p-2.5 rounded-xl transition-all cursor-pointer ${
            isListening 
              ? "bg-red-500 text-white animate-pulse" 
              : "bg-white/5 text-gray-400 hover:text-white"
          }`}
          title="Voice input"
        >
          <Mic className="w-4 h-4" />
        </button>

        <input
          type="text"
          placeholder="Type your styling request or voice answers..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyPress}
          disabled={isChatLoading}
          className="flex-1 bg-transparent text-sm text-white focus:outline-none placeholder-gray-500 px-2"
          id="stylist-chat-input"
        />

        <button
          onClick={handleSend}
          disabled={!inputText.trim() || isChatLoading}
          className={`p-2.5 rounded-xl transition-colors cursor-pointer ${
            inputText.trim() && !isChatLoading
              ? "bg-gold-500 text-black hover:bg-gold-600 shadow-md shadow-gold-500/10"
              : "bg-white/5 text-gray-600 cursor-not-allowed"
          }`}
          id="stylist-chat-send-btn"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
