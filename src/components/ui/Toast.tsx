"use client";

import { createContext, useContext, useCallback, useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, AlertTriangle, Info, X, XCircle } from "lucide-react";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
}

interface ToastContextType {
  addToast: (type: ToastType, title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

const toastConfig: Record<ToastType, { icon: React.ElementType; bg: string; border: string; iconColor: string }> = {
  success: {
    icon: CheckCircle,
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    iconColor: "text-emerald-400",
  },
  error: {
    icon: XCircle,
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    iconColor: "text-red-400",
  },
  warning: {
    icon: AlertTriangle,
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    iconColor: "text-amber-400",
  },
  info: {
    icon: Info,
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    iconColor: "text-blue-400",
  },
};

let toastCounter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: ToastType, title: string, description?: string) => {
    const id = `toast-${++toastCounter}`;
    setToasts((prev) => [...prev, { id, type, title, description }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => {
            const config = toastConfig[toast.type];
            const Icon = config.icon;
            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, x: 60, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 60, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className={`${config.bg} backdrop-blur-xl border ${config.border} rounded-xl p-3.5 shadow-2xl shadow-black/30 pointer-events-auto`}
              >
                <div className="flex items-start gap-3">
                  <Icon className={`w-5 h-5 ${config.iconColor} flex-shrink-0 mt-0.5`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white">{toast.title}</p>
                    {toast.description && (
                      <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{toast.description}</p>
                    )}
                  </div>
                  <button
                    onClick={() => removeToast(toast.id)}
                    className="w-6 h-6 rounded-lg hover:bg-white/[0.08] flex items-center justify-center flex-shrink-0 transition-colors"
                    aria-label="Bildirimi kapat"
                  >
                    <X className="w-3.5 h-3.5 text-slate-500" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
