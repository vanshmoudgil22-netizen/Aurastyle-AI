import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { Star, Shield, RotateCcw, Truck, MessageSquare, Plus, Minus, Heart, Sparkles, Send } from "lucide-react";
import { ProductCard } from "../components/ProductCard";

export const ProductDetail: React.FC = () => {
  const { selectedProductId, products, addToCart, toggleWishlist, wishlist, addNotification, token } = useApp();
  const [product, setProduct] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [activeImage, setActiveImage] = useState<string>("");
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [isSubmittingReview, setIsSubmittingReview] = useState<boolean>(false);

  // Review form states
  const [newRating, setNewRating] = useState<number>(5);
  const [newComment, setNewComment] = useState<string>("");

  useEffect(() => {
    if (selectedProductId) {
      fetchProductDetails();
    }
  }, [selectedProductId, products]);

  const fetchProductDetails = async () => {
    try {
      const res = await fetch(`/api/products/${selectedProductId}`);
      if (res.ok) {
        const data = await res.json();
        setProduct(data.product);
        setReviews(data.reviews || []);
        if (data.product.images?.length > 0) {
          setActiveImage(data.product.images[0]);
        }
        if (data.product.sizes?.length > 0) {
          setSelectedSize(data.product.sizes[0]);
        }
        if (data.product.colors?.length > 0) {
          setSelectedColor(data.product.colors[0]);
        }
        setQuantity(1);
      }
    } catch (err) {
      console.error("Failed to load product details", err);
    }
  };

  if (!product) {
    return (
      <div className="py-20 text-center space-y-4" id="detail-loading-state">
        <div className="w-10 h-10 border-4 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-gray-400">Summoning product details...</p>
      </div>
    );
  }

  const isLiked = wishlist.some(item => item.id === product.id);
  const discountedPrice = product.price * (1 - product.discount / 100);

  const handleAddToCart = () => {
    if (product.stock <= 0) {
      addNotification("This item is currently sold out.", "warning");
      return;
    }
    addToCart(product.id, quantity, selectedSize, selectedColor);
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      addNotification("Please sign in to write a product review.", "info");
      return;
    }
    if (!newComment.trim()) return;

    setIsSubmittingReview(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          productId: product.id,
          rating: newRating,
          comment: newComment
        })
      });

      if (res.ok) {
        const review = await res.json();
        setReviews([review, ...reviews]);
        setNewComment("");
        setNewRating(5);
        addNotification("Review posted successfully! Thank you for sharing your experience.", "success");
        // Reload details to update total counts
        fetchProductDetails();
      }
    } catch (err) {
      addNotification("Failed to submit review.", "warning");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Upvote reviews helper
  const handleHelpfulVote = (reviewId: string) => {
    setReviews(prev => prev.map(r => {
      if (r.id === reviewId) {
        return { ...r, helpfulVotes: r.helpfulVotes + 1 };
      }
      return r;
    }));
    addNotification("Helpful vote cast.", "success");
  };

  // Filter out related products
  const relatedProducts = products
    .filter(p => p.id !== product.id && (p.category === product.category || p.occasion === product.occasion))
    .slice(0, 4);

  return (
    <div className="space-y-12 pb-16" id="product-detail-page">
      {/* Product Information Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
        {/* Gallery Image segment */}
        <div className="space-y-4" id="detail-image-gallery">
          <div className="aspect-[4/5] rounded-2xl overflow-hidden glass-panel border border-white/10 bg-gray-950">
            <img
              src={activeImage}
              alt={product.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Gallery Sub thumbnails list if available */}
          {product.images.length > 1 && (
            <div className="flex gap-3">
              {product.images.map((img: string, i: number) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(img)}
                  className={`w-20 h-24 rounded-lg overflow-hidden border transition-all cursor-pointer ${
                    activeImage === img ? "border-gold-500 scale-102" : "border-white/10 opacity-60 hover:opacity-100"
                  }`}
                >
                  <img src={img} alt="thumbnail" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Configurations Column */}
        <div className="space-y-6" id="detail-config-column">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-widest text-gold-400">
                {product.brand}
              </span>
              <span className="text-gray-600 text-xs">•</span>
              <span className="text-xs text-gray-400 font-mono">
                SKU: {product.sku}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
              {product.name}
            </h1>

            {/* Stars Review Indicator */}
            <div className="flex items-center gap-2">
              <div className="flex text-gold-400">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star 
                    key={i} 
                    className={`w-4 h-4 ${i < Math.floor(product.rating) ? "fill-current" : "opacity-30"}`} 
                  />
                ))}
              </div>
              <span className="text-sm font-semibold text-white">{product.rating}</span>
              <span className="text-xs text-gray-500">({product.reviewsCount} verified reviews)</span>
            </div>
          </div>

          {/* Pricing segment */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Special Pricing</span>
              <div className="flex items-baseline gap-2.5">
                <span className="text-2xl font-bold text-white">${discountedPrice.toFixed(2)}</span>
                {product.discount > 0 && (
                  <span className="text-sm text-gray-500 line-through">${product.price.toFixed(2)}</span>
                )}
              </div>
            </div>

            {product.discount > 0 && (
              <div className="bg-gold-500 text-black text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider animate-pulse">
                Save {product.discount}%
              </div>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <span className="text-xs font-semibold tracking-wider text-gray-400 uppercase">Aura Description</span>
            <p className="text-sm text-gray-300 leading-relaxed font-light">{product.description}</p>
          </div>

          {/* Dynamic Specs lists */}
          <div className="grid grid-cols-2 gap-4 py-3 border-y border-white/5 text-xs text-gray-400 font-mono">
            <div>
              <span className="text-gray-500">Fabric:</span> <span className="text-white font-sans">{product.fabric}</span>
            </div>
            <div>
              <span className="text-gray-500">Composition:</span> <span className="text-white font-sans">{product.material}</span>
            </div>
            <div>
              <span className="text-gray-500">Gender Match:</span> <span className="text-white font-sans">{product.gender}</span>
            </div>
            <div>
              <span className="text-gray-500">Ideal For:</span> <span className="text-white font-sans">{product.occasion}</span>
            </div>
          </div>

          {/* Color Select Grid */}
          <div className="space-y-3">
            <span className="text-xs font-semibold tracking-wider text-gray-400 uppercase">Selected Shade</span>
            <div className="flex gap-2">
              {product.colors.map((color: string) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`px-4 py-2 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                    selectedColor === color 
                      ? "bg-gold-500 text-black border-gold-500 font-semibold shadow-md shadow-gold-500/10" 
                      : "bg-white/5 text-gray-300 border-white/10 hover:border-gray-500"
                  }`}
                >
                  {color}
                </button>
              ))}
            </div>
          </div>

          {/* Size Pills Select */}
          <div className="space-y-3">
            <span className="text-xs font-semibold tracking-wider text-gray-400 uppercase">Selected Size</span>
            <div className="flex gap-2">
              {product.sizes.map((sz: string) => (
                <button
                  key={sz}
                  onClick={() => setSelectedSize(sz)}
                  className={`w-10 h-10 rounded-xl text-xs font-medium border transition-colors flex items-center justify-center cursor-pointer ${
                    selectedSize === sz 
                      ? "bg-gold-500 text-black border-gold-500 font-bold" 
                      : "bg-white/5 text-gray-300 border-white/10 hover:border-gray-500"
                  }`}
                >
                  {sz}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity selector & CTA buttons row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-4">
            {/* Quantity panel */}
            <div className="flex items-center justify-between border border-white/10 rounded-xl px-3 py-2 bg-white/5 sm:w-32">
              <button 
                onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                className="p-1 text-gray-400 hover:text-white transition-colors"
                disabled={quantity <= 1}
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="text-sm font-bold text-white font-mono px-4">{quantity}</span>
              <button 
                onClick={() => setQuantity(prev => prev + 1)}
                className="p-1 text-gray-400 hover:text-white transition-colors"
                disabled={quantity >= product.stock}
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Add to Bag CTA */}
            <button
              onClick={handleAddToCart}
              className={`flex-1 px-6 py-3.5 rounded-xl font-bold tracking-wide flex items-center justify-center gap-2 transition-all cursor-pointer ${
                product.stock > 0
                  ? "bg-gold-500 hover:bg-gold-600 text-black shadow-lg shadow-gold-500/10"
                  : "bg-gray-800 text-gray-500 cursor-not-allowed"
              }`}
              disabled={product.stock <= 0}
            >
              {product.stock > 0 ? "Add to Styling Bag" : "Sold Out"}
            </button>

            {/* Wishlist toggle CTA */}
            <button
              onClick={() => toggleWishlist(product.id)}
              className={`p-3.5 rounded-xl border transition-colors cursor-pointer ${
                isLiked 
                  ? "bg-red-500/10 border-red-500/30 text-red-500" 
                  : "border-white/10 text-gray-300 hover:text-white hover:bg-white/5"
              }`}
              aria-label="Wishlist"
            >
              <Heart className={`w-5 h-5 ${isLiked ? "fill-current" : ""}`} />
            </button>
          </div>

          {/* Secure / Delivery badges info */}
          <div className="grid grid-cols-3 gap-3 pt-6 border-t border-white/5 text-[10px] text-gray-400 font-mono">
            <div className="flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-gold-400" />
              <span>Free Express Delivery</span>
            </div>
            <div className="flex items-center gap-1.5">
              <RotateCcw className="w-3.5 h-3.5 text-gold-400" />
              <span>30-Day Easy Returns</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-gold-400" />
              <span>Tailored Authenticity</span>
            </div>
          </div>
        </div>
      </div>

      {/* AI Tags Section */}
      <div className="glass-panel p-6 rounded-2xl space-y-3" id="detail-ai-tags-section">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider">
          <Sparkles className="w-4 h-4 text-gold-400" />
          Aura Smart Tags
        </h3>
        <p className="text-xs text-gray-400">
          These AI attributes help Aura's recommendation engine match this garment to your requests.
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          {product.aiTags.map((tag: string) => (
            <span 
              key={tag}
              className="px-3 py-1 bg-white/5 hover:bg-gold-500/10 hover:text-gold-400 transition-colors rounded-full text-xs font-medium text-gray-300 border border-white/5 font-mono cursor-pointer"
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>

      {/* Customer Reviews Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 border-t border-white/5 pt-10" id="reviews-section">
        {/* Review Summarizer column */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-white">Verified Reviews</h2>
          <div className="glass-panel p-6 rounded-2xl text-center space-y-4">
            <span className="text-4xl font-extrabold text-white">{product.rating}</span>
            <div className="flex justify-center text-gold-400 gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star 
                  key={i} 
                  className={`w-5 h-5 ${i < Math.floor(product.rating) ? "fill-current" : "opacity-30"}`} 
                />
              ))}
            </div>
            <p className="text-xs text-gray-400">
              Computed from {reviews.length} authentic purchaser remarks.
            </p>
          </div>

          {/* Interactive Review writer Form */}
          <div className="glass-panel p-5 rounded-2xl space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Write a Review</h3>
            <form onSubmit={submitReview} className="space-y-3">
              <div>
                <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Your Rating</label>
                <div className="flex text-gold-400 gap-1.5">
                  {[1, 2, 3, 4, 5].map((stars) => (
                    <button
                      key={stars}
                      type="button"
                      onClick={() => setNewRating(stars)}
                      className="p-0.5 hover:scale-110 transition-transform cursor-pointer"
                    >
                      <Star className={`w-5 h-5 ${stars <= newRating ? "fill-current" : "opacity-30"}`} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Comment</label>
                <textarea
                  rows={3}
                  placeholder="Tell others how it fits, feels, and looks..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-gold-500"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingReview || !token}
                className={`w-full py-2.5 rounded-xl font-bold text-xs tracking-wide flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  token 
                    ? "bg-gold-500 hover:bg-gold-600 text-black" 
                    : "bg-gray-800 text-gray-500 cursor-not-allowed"
                }`}
              >
                <Send className="w-3.5 h-3.5" />
                {token ? "Submit Review" : "Login to Review"}
              </button>
            </form>
          </div>
        </div>

        {/* Reviews List Column */}
        <div className="lg:col-span-2 space-y-4" id="reviews-list">
          {reviews.length === 0 ? (
            <div className="glass-panel p-8 rounded-2xl text-center text-gray-400 space-y-2">
              <MessageSquare className="w-6 h-6 mx-auto opacity-30" />
              <p className="text-sm">Be the first to share styling remarks for this garment.</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
              {reviews.map((r: any) => (
                <div key={r.id} className="glass-panel p-5 rounded-2xl space-y-2.5 relative" id={`review-${r.id}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-sm text-white">{r.userName}</span>
                      <span className="text-[10px] text-gray-500 font-mono ml-2">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex text-gold-400">
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <Star 
                          key={idx} 
                          className={`w-3 h-3 ${idx < r.rating ? "fill-current" : "opacity-20"}`} 
                        />
                      ))}
                    </div>
                  </div>

                  <p className="text-xs text-gray-300 leading-relaxed font-light">
                    {r.comment}
                  </p>

                  <div className="flex items-center justify-between text-[10px] font-mono text-gray-500 pt-1 border-t border-white/5">
                    <span>VERIFIED PURCHASER</span>
                    <button 
                      onClick={() => handleHelpfulVote(r.id)}
                      className="text-gray-400 hover:text-gold-400 transition-colors flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      Helpful ({r.helpfulVotes})
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Related Products Showcase */}
      <section className="space-y-6 border-t border-white/5 pt-10" id="related-products-section">
        <h2 className="text-xl font-bold text-white">Coordinates & Related Outfits</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {relatedProducts.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    </div>
  );
};
