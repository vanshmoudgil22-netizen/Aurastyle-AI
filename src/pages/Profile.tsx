import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { User, Mail, Shield, MapPin, CreditCard, LogOut, Lock, Plus, Trash2, Globe } from "lucide-react";

export const Profile: React.FC = () => {
  const { user, login, register, logout, addNotification, token } = useApp();
  const [isLoginState, setIsLoginState] = useState<boolean>(true);

  // Auth fields
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  // Address fields
  const [isAddingAddress, setIsAddingAddress] = useState<boolean>(false);
  const [newAddress, setNewAddress] = useState({
    name: "Home Office",
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "United States"
  });

  // Card fields
  const [isAddingCard, setIsAddingCard] = useState<boolean>(false);
  const [newCard, setNewCard] = useState({
    holder: "",
    number: "",
    expiry: "12/29",
    brand: "Visa"
  });

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoginState) {
      const success = await login(email, password);
      if (success) resetAuthFields();
    } else {
      if (!name) {
        addNotification("Full name is required.", "warning");
        return;
      }
      const success = await register(name, email);
      if (success) resetAuthFields();
    }
  };

  const resetAuthFields = () => {
    setName("");
    setEmail("");
    setPassword("");
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !user) return;

    const addresses = [...(user.addresses || [])];
    const created = {
      ...newAddress,
      id: "a-" + Math.random().toString(36).substr(2, 9),
      isDefault: addresses.length === 0
    };
    addresses.push(created);

    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ addresses })
      });

      if (res.ok) {
        user.addresses = addresses;
        addNotification("Address saved successfully.", "success");
        setIsAddingAddress(false);
        setNewAddress({ name: "Home Office", street: "", city: "", state: "", zipCode: "", country: "United States" });
      }
    } catch (err) {
      addNotification("Failed to save address.", "warning");
    }
  };

  const handleDeleteAddress = async (addrId: string) => {
    if (!token || !user) return;
    const addresses = user.addresses.filter(a => a.id !== addrId);

    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ addresses })
      });

      if (res.ok) {
        user.addresses = addresses;
        addNotification("Address removed.", "info");
      }
    } catch (err) {
      addNotification("Failed to remove address.", "warning");
    }
  };

  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !user) return;

    const cards = [...(user.savedCards || [])];
    const created = {
      id: "card-" + Math.random().toString(36).substr(2, 9),
      cardholderName: newCard.holder,
      last4: newCard.number.slice(-4) || "4242",
      expiryDate: newCard.expiry,
      brand: newCard.brand
    };
    cards.push(created);

    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ savedCards: cards })
      });

      if (res.ok) {
        user.savedCards = cards;
        addNotification("Card added successfully.", "success");
        setIsAddingCard(false);
        setNewCard({ holder: "", number: "", expiry: "12/29", brand: "Visa" });
      }
    } catch (err) {
      addNotification("Failed to save credit card details.", "warning");
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    if (!token || !user) return;
    const cards = user.savedCards.filter(c => c.id !== cardId);

    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ savedCards: cards })
      });

      if (res.ok) {
        user.savedCards = cards;
        addNotification("Billing card removed.", "info");
      }
    } catch (err) {
      addNotification("Failed to remove card.", "warning");
    }
  };

  // 1. LOGGED OUT AUTHENTICATION MODE
  if (!user) {
    return (
      <div className="max-w-md mx-auto py-12 space-y-8" id="auth-page-container">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-extrabold text-white uppercase tracking-wider">
            Aura<span className="text-gold-400 font-light">Style</span>
          </h1>
          <p className="text-xs text-gray-400 font-light tracking-wide">
            Securely sign in to unlock custom AI stylist curations and coupon privileges.
          </p>
        </div>

        {/* Dual Tab switches */}
        <div className="flex bg-white/5 p-1 rounded-xl" id="auth-modes">
          <button
            onClick={() => { setIsLoginState(true); resetAuthFields(); }}
            className={`flex-1 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
              isLoginState ? "bg-gold-500 text-black shadow-lg" : "text-gray-400"
            }`}
          >
            Access Account
          </button>
          <button
            onClick={() => { setIsLoginState(false); resetAuthFields(); }}
            className={`flex-1 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
              !isLoginState ? "bg-gold-500 text-black shadow-lg" : "text-gray-400"
            }`}
          >
            Register Account
          </button>
        </div>

        {/* Form Core */}
        <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
          <form onSubmit={handleAuthSubmit} className="space-y-4" id="auth-form">
            {!isLoginState && (
              <div>
                <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Jane Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-gold-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="email"
                  required
                  placeholder="e.g. jane@aurastyle.ai"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-gold-500"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Secure Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-gold-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-gold-500 hover:bg-gold-600 text-black font-bold py-3.5 rounded-xl text-xs tracking-wide transition-colors cursor-pointer"
            >
              {isLoginState ? "Settle Secure Sign-In" : "Forge New Account"}
            </button>
          </form>

          <div className="text-center pt-2">
            <span className="text-[10px] text-gray-500 block font-mono">
              Note: Type <span className="font-bold text-gold-400">admin@aurastyle.ai</span> to log in as administrator.
            </span>
          </div>
        </div>
      </div>
    );
  }

  // 2. LOGGED IN PROFILE MANAGEMENT
  return (
    <div className="space-y-8 pb-16" id="profile-suite-page">
      <div className="border-b border-white/5 pb-5 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-2">
            <User className="w-7 h-7 text-gold-400" />
            My Profile Suite
          </h1>
          <p className="text-sm text-gray-400">
            Welcome back, {user.name}. Settle saved cards and delivery destinations.
          </p>
        </div>

        <button
          onClick={logout}
          className="flex items-center gap-1.5 px-4 py-2 border border-white/10 text-xs font-semibold text-gray-400 hover:text-red-400 hover:bg-white/5 transition-all rounded-xl cursor-pointer"
          id="logout-btn"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Hand: Delivery Destinations */}
        <div className="space-y-4" id="addresses-panel">
          <div className="flex justify-between items-center border-b border-white/5 pb-2">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gold-400" />
              Saved Addresses
            </h3>
            <button
              onClick={() => setIsAddingAddress(!isAddingAddress)}
              className="text-xs text-gold-400 hover:text-white flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              {isAddingAddress ? "Cancel" : "Add Address"}
            </button>
          </div>

          {isAddingAddress ? (
            <form onSubmit={handleAddAddress} className="glass-panel p-5 rounded-2xl space-y-3">
              <span className="text-xs font-semibold text-white uppercase block">New Address Info</span>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-[9px] font-bold text-gray-500 uppercase">Label (e.g. Home, Office)</label>
                  <input
                    type="text"
                    required
                    value={newAddress.name}
                    onChange={(e) => setNewAddress({ ...newAddress, name: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-[9px] font-bold text-gray-500 uppercase">Street</label>
                  <input
                    type="text"
                    required
                    value={newAddress.street}
                    onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-gray-500 uppercase">City</label>
                  <input
                    type="text"
                    required
                    value={newAddress.city}
                    onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-gray-500 uppercase">State</label>
                  <input
                    type="text"
                    required
                    value={newAddress.state}
                    onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-gray-500 uppercase">ZIP</label>
                  <input
                    type="text"
                    required
                    value={newAddress.zipCode}
                    onChange={(e) => setNewAddress({ ...newAddress, zipCode: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-gray-500 uppercase">Country</label>
                  <input
                    type="text"
                    required
                    value={newAddress.country}
                    onChange={(e) => setNewAddress({ ...newAddress, country: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-2 bg-gold-500 hover:bg-gold-600 text-black text-xs font-bold rounded-xl transition-colors mt-2"
              >
                Save Destination
              </button>
            </form>
          ) : user.addresses.length === 0 ? (
            <div className="glass-panel p-6 text-center text-xs text-gray-500">
              No delivery addresses saved. Tap Add Address to configure.
            </div>
          ) : (
            <div className="space-y-3">
              {user.addresses.map((a) => (
                <div key={a.id} className="glass-panel p-4 rounded-2xl flex items-center justify-between border border-white/5">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-white font-mono flex items-center gap-1.5 uppercase">
                      <MapPin className="w-3.5 h-3.5 text-gold-400" />
                      {a.name} {a.isDefault && <span className="text-[9px] text-emerald-400 border border-emerald-400/20 px-1 rounded font-normal">Default</span>}
                    </span>
                    <p className="text-xs text-gray-400 leading-normal font-light">
                      {a.street}, {a.city}, {a.state} {a.zipCode}, {a.country}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteAddress(a.id)}
                    className="text-gray-500 hover:text-red-400 p-1.5 rounded hover:bg-white/5 transition-all cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Hand: Saved Cards */}
        <div className="space-y-4" id="cards-panel">
          <div className="flex justify-between items-center border-b border-white/5 pb-2">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-gold-400" />
              Saved Cards
            </h3>
            <button
              onClick={() => setIsAddingCard(!isAddingCard)}
              className="text-xs text-gold-400 hover:text-white flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              {isAddingCard ? "Cancel" : "Add Card"}
            </button>
          </div>

          {isAddingCard ? (
            <form onSubmit={handleAddCard} className="glass-panel p-5 rounded-2xl space-y-3">
              <span className="text-xs font-semibold text-white uppercase block">New Card Info</span>
              <div className="space-y-2.5">
                <div>
                  <label className="text-[9px] font-bold text-gray-500 uppercase">Cardholder Name</label>
                  <input
                    type="text"
                    required
                    value={newCard.holder}
                    onChange={(e) => setNewCard({ ...newCard, holder: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-gray-500 uppercase">Card Number</label>
                  <input
                    type="text"
                    required
                    maxLength={19}
                    placeholder="e.g. 4242 4242 4242 4242"
                    value={newCard.number}
                    onChange={(e) => setNewCard({ ...newCard, number: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] font-bold text-gray-500 uppercase">Expiry Date</label>
                    <input
                      type="text"
                      required
                      placeholder="MM/YY"
                      value={newCard.expiry}
                      onChange={(e) => setNewCard({ ...newCard, expiry: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none text-center"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-gray-500 uppercase">Brand</label>
                    <select
                      value={newCard.brand}
                      onChange={(e) => setNewCard({ ...newCard, brand: e.target.value })}
                      className="w-full bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                    >
                      <option value="Visa">Visa</option>
                      <option value="Mastercard">Mastercard</option>
                      <option value="Amex">American Express</option>
                    </select>
                  </div>
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-2 bg-gold-500 hover:bg-gold-600 text-black text-xs font-bold rounded-xl transition-colors mt-2"
              >
                Save Credit Card
              </button>
            </form>
          ) : user.savedCards.length === 0 ? (
            <div className="glass-panel p-6 text-center text-xs text-gray-500">
              No saved payment methods. Settle details above to configure billing cards.
            </div>
          ) : (
            <div className="space-y-3">
              {user.savedCards.map((c) => (
                <div key={c.id} className="glass-panel p-4 rounded-2xl flex items-center justify-between border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="bg-white/5 p-2 rounded-lg text-gray-400">
                      <CreditCard className="w-5 h-5 text-gold-400" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block font-mono">
                        {c.brand} •••• {c.last4}
                      </span>
                      <span className="text-[10px] text-gray-500 font-mono">
                        Expires: {c.expiryDate} • Holder: {c.cardholderName}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteCard(c.id)}
                    className="text-gray-500 hover:text-red-400 p-1.5 rounded hover:bg-white/5 transition-all cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default Profile;
