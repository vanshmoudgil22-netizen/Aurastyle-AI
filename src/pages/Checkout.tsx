import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { CreditCard, Truck, AlertCircle, ShoppingBag, MapPin, Sparkles, Check } from "lucide-react";

export const Checkout: React.FC = () => {
  const { cart, user, placeOrder, setTab, addNotification, trackOrder } = useApp();
  const [shippingAddress, setShippingAddress] = useState<any>({
    name: user?.name || "",
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "United States"
  });

  const [paymentMethod, setPaymentMethod] = useState<string>("Stripe Card");
  const [cardInfo, setCardInfo] = useState({
    number: "",
    holder: user?.name || "",
    expiry: "",
    cvv: ""
  });

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Read pricing parameters passed from Cart tab
  const [pricing, setPricing] = useState<any>({
    subtotal: 0,
    discount: 0,
    tax: 0,
    shipping: 15,
    total: 0,
    couponCode: ""
  });

  useEffect(() => {
    // If user has saved addresses, prefill
    if (user?.addresses?.length > 0) {
      const def = user.addresses.find(a => a.isDefault) || user.addresses[0];
      setShippingAddress(def);
    }

    const savedPricing = (window as any).checkoutPricing;
    if (savedPricing) {
      setPricing(savedPricing);
    } else {
      // Calculate locally if accessed directly
      const sub = cart.reduce((sum, item) => {
        if (!item.product) return sum;
        return sum + item.product.price * (1 - item.product.discount / 100) * item.quantity;
      }, 0);
      const tx = sub * 0.08;
      const sh = sub > 150 || sub === 0 ? 0 : 15;
      setPricing({
        subtotal: sub,
        discount: 0,
        tax: tx,
        shipping: sh,
        total: sub + tx + sh,
        couponCode: ""
      });
    }
  }, [user, cart]);

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    // Validate fields
    if (!shippingAddress.street || !shippingAddress.city || !shippingAddress.zipCode) {
      addNotification("Please complete all shipping address fields.", "warning");
      return;
    }

    if (paymentMethod === "Stripe Card" && !cardInfo.number) {
      addNotification("Please complete card billing fields.", "warning");
      return;
    }

    setIsSubmitting(true);
    try {
      const items = cart.map(item => ({
        productId: item.productId,
        name: item.product?.name || "",
        brand: item.product?.brand || "",
        price: item.product ? item.product.price * (1 - item.product.discount / 100) : 0,
        quantity: item.quantity,
        size: item.size,
        color: item.color,
        image: item.product?.images[0] || ""
      }));

      const orderData = {
        items,
        shippingAddress,
        shippingMethod: "Aura Express Courier",
        couponApplied: pricing.couponCode,
        pricing: {
          subtotal: pricing.subtotal,
          discount: pricing.discount,
          tax: pricing.tax,
          shipping: pricing.shipping,
          total: pricing.total
        },
        paymentMethod
      };

      const placed = await placeOrder(orderData);
      if (placed) {
        addNotification("Purchase successful!", "success");
        // Clear window pricing
        (window as any).checkoutPricing = null;
        // Direct tracking page
        trackOrder(placed);
      }
    } catch (err) {
      addNotification("Checkout failed.", "warning");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 pb-16" id="checkout-page-container">
      <div className="border-b border-white/5 pb-5">
        <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-2">
          <Truck className="w-7 h-7 text-gold-400" />
          Secure Checkout
        </h1>
        <p className="text-sm text-gray-400">
          Tailor shipping specifics and settle payments securely with encryptions.
        </p>
      </div>

      <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Detail Input forms column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Shipping Address cards */}
          <div className="glass-panel p-6 rounded-2xl space-y-4">
            <span className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gold-400" />
              1. Delivery Address
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Recipient Name</label>
                <input
                  type="text"
                  required
                  value={shippingAddress.name}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, name: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-gold-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Street Address</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 123 Fashion Ave"
                  value={shippingAddress.street}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, street: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-gold-500"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">City</label>
                <input
                  type="text"
                  required
                  value={shippingAddress.city}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-gold-500"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">State / Region</label>
                <input
                  type="text"
                  required
                  value={shippingAddress.state}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-gold-500"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Postal / ZIP Code</label>
                <input
                  type="text"
                  required
                  value={shippingAddress.zipCode}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, zipCode: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-gold-500"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Country</label>
                <input
                  type="text"
                  required
                  value={shippingAddress.country}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, country: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-gold-500"
                />
              </div>
            </div>
          </div>

          {/* Settle Payment Selection card */}
          <div className="glass-panel p-6 rounded-2xl space-y-4">
            <span className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-gold-400" />
              2. Settle Payments
            </span>

            <div className="flex bg-white/5 p-1 rounded-xl max-w-sm" id="payment-selector">
              <button
                type="button"
                onClick={() => setPaymentMethod("Stripe Card")}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold cursor-pointer ${
                  paymentMethod === "Stripe Card" ? "bg-gold-500 text-black font-bold" : "text-gray-400"
                }`}
              >
                Credit Card
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("Cash on Delivery")}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold cursor-pointer ${
                  paymentMethod === "Cash on Delivery" ? "bg-gold-500 text-black font-bold" : "text-gray-400"
                }`}
              >
                COD
              </button>
            </div>

            {paymentMethod === "Stripe Card" ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border border-white/5 p-4 rounded-xl bg-white/5">
                <div className="sm:col-span-3">
                  <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Card Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 4242 4242 4242 4242"
                    value={cardInfo.number}
                    onChange={(e) => setCardInfo({ ...cardInfo, number: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-gold-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Card Holder</label>
                  <input
                    type="text"
                    value={cardInfo.holder}
                    onChange={(e) => setCardInfo({ ...cardInfo, holder: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-gold-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Expiry / CVV</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="MM/YY"
                      value={cardInfo.expiry}
                      onChange={(e) => setCardInfo({ ...cardInfo, expiry: e.target.value })}
                      className="w-1/2 bg-white/5 border border-white/10 rounded-xl px-2 py-2.5 text-center text-xs text-white focus:outline-none focus:border-gold-500"
                    />
                    <input
                      type="password"
                      placeholder="CVC"
                      maxLength={3}
                      value={cardInfo.cvv}
                      onChange={(e) => setCardInfo({ ...cardInfo, cvv: e.target.value })}
                      className="w-1/2 bg-white/5 border border-white/10 rounded-xl px-2 py-2.5 text-center text-xs text-white focus:outline-none focus:border-gold-500"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3 p-4 bg-white/5 border border-white/5 rounded-xl text-xs text-gray-400 leading-relaxed">
                <AlertCircle className="w-5 h-5 text-gold-400 shrink-0 mt-0.5" />
                <span>You chosen Cash on Delivery (COD). Settle the full billing amount $${pricing.total.toFixed(2)} when the Aura courier drops off your package.</span>
              </div>
            )}
          </div>
        </div>

        {/* Invoice Summary column sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-panel p-6 rounded-2xl space-y-5">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/5 pb-3 flex items-center gap-1.5">
              <ShoppingBag className="w-4 h-4 text-gold-400" />
              Order Summary
            </h3>

            {/* List mini products chosen */}
            <div className="space-y-3 max-h-44 overflow-y-auto pr-2">
              {cart.map((item, idx) => (
                <div key={idx} className="flex gap-3 text-xs">
                  <div className="w-10 h-12 bg-gray-900 rounded overflow-hidden shrink-0 border border-white/5">
                    <img src={item.product?.images[0]} alt="thumbnail" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-white block truncate">{item.product?.name}</span>
                    <span className="text-gray-500 block font-mono text-[10px]">
                      QTY: {item.quantity} • Size {item.size} • Color {item.color}
                    </span>
                  </div>
                  <span className="font-bold text-white">
                    ${((item.product ? item.product.price * (1 - item.product.discount / 100) : 0) * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* Price Calculations items */}
            <div className="space-y-2 text-xs text-gray-400 border-t border-white/5 pt-4 font-mono">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="text-white">${pricing.subtotal.toFixed(2)}</span>
              </div>
              {pricing.discount > 0 && (
                <div className="flex justify-between text-gold-400 font-bold">
                  <span>Discount Applied</span>
                  <span>-${pricing.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Courier Express Shipping</span>
                <span className="text-white">
                  {pricing.shipping === 0 ? "FREE" : `$${pricing.shipping.toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Tax (8%)</span>
                <span className="text-white">${pricing.tax.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex justify-between items-baseline pt-4 border-t border-white/5 text-white">
              <span className="text-sm font-sans font-bold uppercase">Grand Total</span>
              <span className="font-mono text-xl font-bold text-gold-400">
                ${pricing.total.toFixed(2)}
              </span>
            </div>

            {/* Place Order CTA */}
            <button
              type="submit"
              disabled={isSubmitting || cart.length === 0}
              className={`w-full py-3.5 rounded-xl font-bold text-sm tracking-wide flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                isSubmitting 
                  ? "bg-gray-800 text-gray-500 cursor-not-allowed" 
                  : "bg-gold-500 hover:bg-gold-600 text-black shadow-lg shadow-gold-500/10"
              }`}
            >
              <Sparkles className="w-4 h-4 fill-black/10" />
              {isSubmitting ? "Tailing Order on Secure Servers..." : "Place Styling Order"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
export default Checkout;
