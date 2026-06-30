import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { Trash2, Plus, Minus, Sparkles, Tag, ArrowRight, ShoppingBag } from "lucide-react";

export const Cart: React.FC = () => {
  const { cart, removeFromCart, updateCartQty, setTab, addNotification } = useApp();
  const [couponCode, setCouponCode] = useState<string>("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [isApplying, setIsApplying] = useState<boolean>(false);

  const subtotal = cart.reduce((sum, item) => {
    if (!item.product) return sum;
    const price = item.product.price * (1 - item.product.discount / 100);
    return sum + price * item.quantity;
  }, 0);

  // Compute Coupon discount
  let discountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discountType === "percentage") {
      discountAmount = subtotal * (appliedCoupon.value / 100);
    } else {
      discountAmount = appliedCoupon.value;
    }
  }

  const tax = (subtotal - discountAmount) * 0.08; // 8% tax
  const shipping = subtotal > 150 || subtotal === 0 ? 0 : 15; // free over $150
  const grandTotal = subtotal - discountAmount + tax + shipping;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setIsApplying(true);
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode, amount: subtotal })
      });

      if (res.ok) {
        const coupon = await res.json();
        setAppliedCoupon(coupon);
        addNotification(`Coupon ${coupon.code} applied successfully!`, "success");
      } else {
        const err = await res.json();
        addNotification(err.error || "Failed to apply coupon.", "warning");
      }
    } catch (err) {
      addNotification("Network error applying coupon.", "warning");
    } finally {
      setIsApplying(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    addNotification("Coupon removed.", "info");
  };

  const handleProceedToCheckout = () => {
    if (cart.length === 0) return;
    
    // Pass cart figures to checkout tab by redirecting
    // We can store final pricing structure in window or local state to carry forward
    const finalPricing = {
      subtotal,
      discount: discountAmount,
      tax,
      shipping,
      total: grandTotal,
      couponCode: appliedCoupon?.code
    };
    (window as any).checkoutPricing = finalPricing;
    setTab("checkout");
  };

  return (
    <div className="space-y-8 pb-16" id="cart-page-container">
      <div className="border-b border-white/5 pb-5">
        <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-2">
          <ShoppingBag className="w-7 h-7 text-gold-400" />
          Shopping Bag
        </h1>
        <p className="text-sm text-gray-400">
          Review your selected items and apply custom styling coupons before secure checkout.
        </p>
      </div>

      {cart.length === 0 ? (
        <div className="glass-panel p-16 text-center space-y-4 rounded-2xl" id="empty-cart-state">
          <div className="p-4 bg-white/5 rounded-full w-fit mx-auto text-gray-400">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white">Your styling bag is empty</h3>
          <p className="text-sm text-gray-400 max-w-sm mx-auto">
            Explore our curated catalog or speak with Aura to build coordinating ensembles.
          </p>
          <button
            onClick={() => setTab("products")}
            className="bg-gold-500 hover:bg-gold-600 text-black px-6 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Explore Catalog
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items List segment */}
          <div className="lg:col-span-2 space-y-4" id="cart-items-list">
            {cart.map((item, idx) => {
              if (!item.product) return null;
              const price = item.product.price * (1 - item.product.discount / 100);
              return (
                <div 
                  key={`${item.productId}-${item.size}-${item.color}-${idx}`} 
                  className="glass-panel p-5 rounded-2xl flex flex-col sm:flex-row gap-5 relative group"
                  id={`cart-item-${item.productId}`}
                >
                  {/* Thumbnail Image */}
                  <div className="w-24 aspect-[4/5] rounded-xl overflow-hidden shrink-0 bg-gray-950">
                    <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover" />
                  </div>

                  {/* Description Info */}
                  <div className="flex-1 flex flex-col justify-between py-1">
                    <div className="space-y-1">
                      <div className="flex justify-between items-start gap-4">
                        <span className="font-semibold text-sm text-white block pr-6">
                          {item.product.name}
                        </span>
                        
                        <button
                          onClick={() => removeFromCart(item.productId, item.size, item.color)}
                          className="text-gray-500 hover:text-red-400 transition-colors absolute top-5 right-5 cursor-pointer"
                          aria-label="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <span className="text-xs text-gold-400 font-mono block">
                        {item.product.brand}
                      </span>

                      {/* Options badges chosen */}
                      <div className="flex gap-3 text-xs text-gray-400 pt-1 font-mono">
                        <span>Size: <span className="text-white">{item.size}</span></span>
                        <span>Color: <span className="text-white">{item.color}</span></span>
                      </div>
                    </div>

                    {/* Quantity Adjustment + Individual Price */}
                    <div className="flex items-center justify-between mt-4 sm:mt-0">
                      <div className="flex items-center gap-3 border border-white/10 rounded-lg px-2 py-1 bg-white/5">
                        <button
                          onClick={() => updateCartQty(item.productId, item.size, item.color, item.quantity - 1)}
                          className="p-0.5 text-gray-400 hover:text-white"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold text-white font-mono">{item.quantity}</span>
                        <button
                          onClick={() => updateCartQty(item.productId, item.size, item.color, item.quantity + 1)}
                          className="p-0.5 text-gray-400 hover:text-white"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="text-right">
                        <span className="font-bold text-white block">
                          ${(price * item.quantity).toFixed(2)}
                        </span>
                        {item.quantity > 1 && (
                          <span className="text-[10px] text-gray-500 block font-mono">
                            (${price.toFixed(2)} each)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Checkout pricing card summary column */}
          <div className="space-y-6" id="cart-summary-sidebar">
            {/* Promo coupon inputs card */}
            <div className="glass-panel p-5 rounded-2xl space-y-3">
              <span className="text-xs font-semibold tracking-wider text-gray-400 uppercase flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-gold-400" />
                COUPONS & DEALS
              </span>
              
              {!appliedCoupon ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. AURA10, FASHIONAI"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-gold-500"
                  />
                  <button
                    onClick={handleApplyCoupon}
                    disabled={isApplying || !couponCode.trim()}
                    className="bg-gold-500 hover:bg-gold-600 text-black px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Apply
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 rounded-xl bg-gold-400/5 border border-gold-400/20 text-xs">
                  <div className="flex items-center gap-2 text-gold-400">
                    <CheckCircle className="w-4 h-4" />
                    <span className="font-bold font-mono">{appliedCoupon.code}</span>
                    <span>({appliedCoupon.value}% saved)</span>
                  </div>
                  <button onClick={handleRemoveCoupon} className="text-red-400 hover:underline">
                    Remove
                  </button>
                </div>
              )}
              <span className="text-[10px] text-gray-500 block">
                Tip: Type <span className="font-mono text-gold-400 font-bold">FASHIONAI</span> to save 20% off items over $100!
              </span>
            </div>

            {/* Calculations Card */}
            <div className="glass-panel p-6 rounded-2xl space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/5 pb-3">
                Order Summary
              </h3>

              <div className="space-y-2.5 text-xs text-gray-400 font-mono">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="text-white">${subtotal.toFixed(2)}</span>
                </div>

                {appliedCoupon && (
                  <div className="flex justify-between text-gold-400">
                    <span>Coupon Discount ({appliedCoupon.code})</span>
                    <span>-${discountAmount.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>Shipping Estimation</span>
                  <span className="text-white">
                    {shipping === 0 ? "FREE" : `$${shipping.toFixed(2)}`}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span>Tax (8%)</span>
                  <span className="text-white">${tax.toFixed(2)}</span>
                </div>
              </div>

              {/* Total Row */}
              <div className="flex justify-between items-baseline pt-4 border-t border-white/5 text-white">
                <span className="font-sans font-bold text-sm uppercase">Total Estimate</span>
                <span className="font-mono text-xl font-bold text-gold-400">
                  ${grandTotal.toFixed(2)}
                </span>
              </div>

              {/* CTA button */}
              <button
                onClick={handleProceedToCheckout}
                className="w-full bg-gold-500 hover:bg-gold-600 text-black py-3.5 rounded-xl font-bold tracking-wide flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-lg shadow-gold-500/10 mt-2"
                id="cart-proceed-checkout-btn"
              >
                Proceed to Checkout
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-center">
                <span className="text-[10px] text-gray-500 uppercase tracking-widest block pt-2">
                  🔒 Encrypted Tailor Payments Secures Purchase
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Simple embedded Icon fallback just in case
const CheckCircle = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={props.className}
    {...props}
  >
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <path d="m9 11 3 3L22 4" />
  </svg>
);
export default Cart;
