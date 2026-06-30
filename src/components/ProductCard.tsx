import React from "react";
import { Product } from "../types";
import { useApp } from "../context/AppContext";
import { Heart, Star, Sparkles, ArrowRight } from "lucide-react";

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { selectProduct, toggleWishlist, wishlist } = useApp();

  const isLiked = wishlist.some(item => item.id === product.id);
  const discountedPrice = product.price * (1 - product.discount / 100);

  return (
    <div 
      className="glass-panel rounded-2xl overflow-hidden group hover:border-gold-500/30 transition-all duration-300 flex flex-col h-full relative"
      id={`product-card-${product.id}`}
    >
      {/* Product Image Stage */}
      <div className="relative aspect-[4/5] overflow-hidden bg-gray-950">
        <img
          src={product.images[0]}
          alt={product.name}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        
        {/* Wishlist Floating Toggle */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product.id);
          }}
          className={`absolute top-4 right-4 p-2 rounded-full backdrop-blur-md transition-all duration-300 hover:scale-110 cursor-pointer ${
            isLiked 
              ? "bg-red-500 text-white" 
              : "bg-black/40 text-gray-300 hover:text-white"
          }`}
          aria-label="Add to Wishlist"
          id={`wishlist-toggle-${product.id}`}
        >
          <Heart className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`} />
        </button>

        {/* Discount Badge */}
        {product.discount > 0 && (
          <div className="absolute top-4 left-4 bg-gold-500 text-black text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
            {product.discount}% OFF
          </div>
        )}

        {/* Stock Alert Warning */}
        {product.stock <= 5 && product.stock > 0 && (
          <div className="absolute bottom-4 left-4 bg-red-600 text-white text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wider">
            Only {product.stock} Left
          </div>
        )}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-gold-400 font-bold tracking-widest text-sm uppercase">
            Sold Out
          </div>
        )}
      </div>

      {/* Product Information Core */}
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-center justify-between text-[11px] uppercase tracking-widest text-gray-400 font-mono mb-1.5">
          <span>{product.brand}</span>
          <span>{product.gender}</span>
        </div>

        <button
          onClick={() => selectProduct(product.id)}
          className="text-left font-sans font-medium text-white group-hover:text-gold-400 transition-colors text-base line-clamp-1 mb-2 cursor-pointer"
          id={`product-title-${product.id}`}
        >
          {product.name}
        </button>

        {/* Ratings and Category */}
        <div className="flex items-center gap-1.5 mb-4">
          <div className="flex text-gold-400">
            <Star className="w-3.5 h-3.5 fill-current" />
          </div>
          <span className="text-xs font-medium text-gray-300">{product.rating}</span>
          <span className="text-xs text-gray-500">({product.reviewsCount})</span>
          <span className="text-gray-600 text-xs">•</span>
          <span className="text-xs text-gray-400">{product.subcategory}</span>
        </div>

        {/* Pricing Layout */}
        <div className="mt-auto flex items-center justify-between pt-3 border-t border-white/5">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-white">
              ${discountedPrice.toFixed(2)}
            </span>
            {product.discount > 0 && (
              <span className="text-xs text-gray-500 line-through">
                ${product.price.toFixed(2)}
              </span>
            )}
          </div>

          <button
            onClick={() => selectProduct(product.id)}
            className="text-xs font-medium text-gold-400 group-hover:text-white flex items-center gap-1 hover:underline cursor-pointer"
            id={`product-view-${product.id}`}
          >
            Style
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
