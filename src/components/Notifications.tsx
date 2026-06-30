import React from "react";
import { useApp } from "../context/AppContext";
import { CheckCircle, AlertCircle, Info, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export const Notifications: React.FC = () => {
  const { notifications, removeNotification } = useApp();

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full" id="notification-container">
      <AnimatePresence>
        {notifications.map((n) => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="glass-panel gold-glow p-4 rounded-xl flex items-start gap-3 shadow-2xl overflow-hidden relative"
            id={`notification-${n.id}`}
          >
            {/* Color indicators based on notification type */}
            <div className="mt-0.5">
              {n.type === "success" && <CheckCircle className="w-5 h-5 text-gold-400" />}
              {n.type === "warning" && <AlertCircle className="w-5 h-5 text-red-400" />}
              {n.type === "info" && <Info className="w-5 h-5 text-blue-400" />}
            </div>

            <div className="flex-1 text-sm font-medium pr-4 text-gray-200">
              {n.text}
            </div>

            <button
              onClick={() => removeNotification(n.id)}
              className="text-gray-400 hover:text-white transition-colors"
              aria-label="Close notification"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Glowing Accent Bar */}
            <div 
              className={`absolute bottom-0 left-0 h-[2px] w-full ${
                n.type === "success" ? "bg-gold-500" : n.type === "warning" ? "bg-red-500" : "bg-blue-500"
              }`}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
