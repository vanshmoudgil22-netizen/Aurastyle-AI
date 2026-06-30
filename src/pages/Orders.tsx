import React, { useEffect, useState } from "react";
import { useApp } from "../context/AppContext";
import { Calendar, Package, ArrowLeft, Truck, Check, HelpCircle } from "lucide-react";

export const Orders: React.FC = () => {
  const { token, setTab, activeOrderToTrack, user, trackOrder } = useApp();
  const [ordersList, setOrdersList] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (token) {
      fetchOrders();
    }
  }, [token]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/orders", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setOrdersList(data);
      }
    } catch (err) {
      console.error("Failed to load orders", err);
    } finally {
      setLoading(false);
    }
  };

  // Stepper helper for order tracking status
  const getStatusStep = (status: string) => {
    switch (status) {
      case "Processing": return 1;
      case "Shipped": return 2;
      case "Delivered": return 3;
      default: return 1;
    }
  };

  // If we are tracking a specific order
  if (activeOrderToTrack) {
    const currentStep = getStatusStep(activeOrderToTrack.orderStatus);
    const orderDate = new Date(activeOrderToTrack.createdAt).toLocaleDateString();

    return (
      <div className="space-y-8 pb-16" id="order-tracking-portal">
        <button
          onClick={() => setTab("orders")}
          className="flex items-center gap-2 text-xs text-gold-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Orders List
        </button>

        <div className="border-b border-white/5 pb-4">
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-2">
            <Package className="w-7 h-7 text-gold-400" />
            Track Order #{activeOrderToTrack.id}
          </h1>
          <p className="text-sm text-gray-400">
            Placed on {orderDate} • Payment Mode: {activeOrderToTrack.paymentMethod}
          </p>
        </div>

        {/* Stepper Progress Block */}
        <div className="glass-panel p-8 rounded-2xl space-y-8" id="tracking-stepper">
          <div className="flex items-center justify-between relative max-w-xl mx-auto">
            {/* Progress Connect Line */}
            <div className="absolute top-1/2 -translate-y-1/2 left-0 w-full h-1 bg-gray-800 -z-10 rounded" />
            <div 
              className="absolute top-1/2 -translate-y-1/2 left-0 h-1 bg-gold-500 -z-10 rounded transition-all duration-500" 
              style={{ width: currentStep === 1 ? "15%" : currentStep === 2 ? "50%" : "100%" }}
            />

            {/* Step 1 */}
            <div className="flex flex-col items-center gap-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                currentStep >= 1 ? "bg-gold-500 text-black shadow-md shadow-gold-500/15" : "bg-gray-800 text-gray-400"
              }`}>
                {currentStep > 1 ? <Check className="w-5 h-5" /> : "1"}
              </div>
              <span className="text-[10px] font-mono tracking-wider font-semibold uppercase text-gray-300">Processing</span>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center gap-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                currentStep >= 2 ? "bg-gold-500 text-black shadow-md shadow-gold-500/15" : "bg-gray-800 text-gray-400"
              }`}>
                {currentStep > 2 ? <Check className="w-5 h-5" /> : "2"}
              </div>
              <span className="text-[10px] font-mono tracking-wider font-semibold uppercase text-gray-300">Shipped</span>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center gap-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                currentStep >= 3 ? "bg-gold-500 text-black shadow-md" : "bg-gray-800 text-gray-400"
              }`}>
                {currentStep > 3 ? <Check className="w-5 h-5" /> : "3"}
              </div>
              <span className="text-[10px] font-mono tracking-wider font-semibold uppercase text-gray-300">Delivered</span>
            </div>
          </div>

          <div className="border-t border-white/5 pt-6 max-w-xl mx-auto space-y-4 text-center">
            <h4 className="text-sm font-semibold text-white">
              {activeOrderToTrack.orderStatus === "Processing" && "Aura tailor masters are verifying and packing your luxury coordinate garments."}
              {activeOrderToTrack.orderStatus === "Shipped" && `Courier has picked up package. Tracing number: ${activeOrderToTrack.trackingNumber || "AURA-TRK-738210"}`}
              {activeOrderToTrack.orderStatus === "Delivered" && "Your styling package has been dropped off. Enjoy your custom coordinates!"}
            </h4>
            <p className="text-xs text-gray-400">
              Estimated Delivery: 2-3 Business Days via Aura Express Courier.
            </p>
          </div>
        </div>

        {/* Invoice detail grids */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Items card */}
          <div className="md:col-span-2 glass-panel p-6 rounded-2xl space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400 block border-b border-white/5 pb-2">
              Package Articles ({activeOrderToTrack.items.length})
            </span>

            <div className="space-y-4">
              {activeOrderToTrack.items.map((item: any, idx: number) => (
                <div key={idx} className="flex gap-4 items-center">
                  <div className="w-14 aspect-[4/5] bg-gray-950 rounded-lg overflow-hidden border border-white/5 shrink-0">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-sm text-white block truncate">{item.name}</span>
                    <span className="text-xs text-gray-500 font-mono">
                      QTY: {item.quantity} • Size {item.size} • Color {item.color}
                    </span>
                  </div>
                  <span className="font-bold text-white text-sm">
                    ${(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Settle summary details */}
          <div className="glass-panel p-6 rounded-2xl space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400 block border-b border-white/5 pb-2">
              Receipt Invoice Breakdown
            </span>

            <div className="space-y-2.5 text-xs text-gray-400 font-mono">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="text-white">${activeOrderToTrack.pricing.subtotal.toFixed(2)}</span>
              </div>
              {activeOrderToTrack.pricing.discount > 0 && (
                <div className="flex justify-between text-gold-400">
                  <span>Coupon Deduction</span>
                  <span>-${activeOrderToTrack.pricing.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Express Shipping</span>
                <span className="text-white">
                  {activeOrderToTrack.pricing.shipping === 0 ? "FREE" : `$${activeOrderToTrack.pricing.shipping.toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Taxes (8%)</span>
                <span className="text-white">${activeOrderToTrack.pricing.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-3 border-t border-white/5 text-white text-sm font-bold font-sans">
                <span>BILLING CHARGES</span>
                <span className="text-gold-400 font-mono">${activeOrderToTrack.pricing.total.toFixed(2)}</span>
              </div>
            </div>

            <div className="pt-2">
              <span className="text-[10px] text-gray-500 font-mono block">
                DELIVERY ADDRESS:<br />
                {activeOrderToTrack.shippingAddress.name}<br />
                {activeOrderToTrack.shippingAddress.street}, {activeOrderToTrack.shippingAddress.city}, {activeOrderToTrack.shippingAddress.state} {activeOrderToTrack.shippingAddress.zipCode}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // General Orders historic list
  return (
    <div className="space-y-8 pb-16" id="orders-history-page">
      <div className="border-b border-white/5 pb-5">
        <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-2">
          <Package className="w-7 h-7 text-gold-400" />
          Historic Styling Orders
        </h1>
        <p className="text-sm text-gray-400">
          Trace courier status and view full receipt details of past orders.
        </p>
      </div>

      {!token ? (
        <div className="glass-panel p-16 text-center space-y-4 rounded-2xl">
          <Package className="w-8 h-8 text-gray-500 mx-auto" />
          <h3 className="text-lg font-bold text-white">Settle Sign-In to View History</h3>
          <p className="text-sm text-gray-400 max-w-sm mx-auto">
            Create an account or login to access complete historic lists of order purchases.
          </p>
          <button
            onClick={() => setTab("profile")}
            className="bg-gold-500 hover:bg-gold-600 text-black px-6 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Access Profile
          </button>
        </div>
      ) : loading ? (
        <div className="py-20 text-center space-y-4">
          <div className="w-10 h-10 border-4 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-400 font-mono text-xs">SCANNING SHIPMENTS LOGS...</p>
        </div>
      ) : ordersList.length === 0 ? (
        <div className="glass-panel p-16 text-center space-y-4 rounded-2xl" id="empty-history-state">
          <Package className="w-8 h-8 text-gray-500 mx-auto" />
          <h3 className="text-lg font-bold text-white">No orders placed yet</h3>
          <p className="text-sm text-gray-400 max-w-sm mx-auto">
            You haven't processed any styling ensembles. Buy a tailored garment or chat with Aura!
          </p>
          <button
            onClick={() => setTab("products")}
            className="bg-gold-500 hover:bg-gold-600 text-black px-6 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Explore Wardrobe
          </button>
        </div>
      ) : (
        <div className="space-y-4" id="orders-list">
          {ordersList.map((ord) => (
            <div 
              key={ord.id} 
              className="glass-panel p-5 rounded-2xl border border-white/5 hover:border-white/10 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-6 relative"
              id={`order-row-${ord.id}`}
            >
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-white font-mono">#{ord.id}</span>
                  <span className="text-gray-600">•</span>
                  <span className="text-xs text-gray-400 font-mono flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-gray-500" />
                    {new Date(ord.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex gap-2">
                  {ord.items.slice(0, 3).map((item: any, idx: number) => (
                    <div key={idx} className="w-10 h-12 bg-gray-900 rounded overflow-hidden border border-white/5">
                      <img src={item.image} alt="thumb" className="w-full h-full object-cover" />
                    </div>
                  ))}
                  {ord.items.length > 3 && (
                    <div className="w-10 h-12 rounded border border-white/5 bg-white/5 flex items-center justify-center text-[10px] text-gray-400 font-bold">
                      +{ord.items.length - 3}
                    </div>
                  )}
                </div>

                <p className="text-xs text-gray-400 truncate max-w-md">
                  {ord.items.map((i: any) => i.name).join(", ")}
                </p>
              </div>

              {/* Status and CTA triggers */}
              <div className="flex items-center gap-6 justify-between md:justify-end shrink-0 pt-4 md:pt-0 border-t md:border-t-0 border-white/5">
                <div className="text-left md:text-right">
                  <span className="text-[10px] text-gray-500 block font-mono">TOTAL BILLING CHARGES</span>
                  <span className="text-sm font-bold text-white font-mono">${ord.pricing.total.toFixed(2)}</span>
                </div>

                <div className="flex items-center gap-4">
                  {/* Status Badge */}
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    ord.orderStatus === "Processing" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" :
                    ord.orderStatus === "Shipped" ? "bg-gold-500/15 text-gold-400 border border-gold-500/20" :
                    "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  }`}>
                    {ord.orderStatus}
                  </span>

                  <button
                    onClick={() => trackOrder(ord)}
                    className="bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold px-4 py-2 rounded-xl text-white transition-colors cursor-pointer"
                  >
                    Track
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
export default Orders;
