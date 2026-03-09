"use client";

import { useAppStore } from "@/store/app-store";
import { ArrowRight, Check, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function PendingTransfers() {
  const pendingTransfers = useAppStore((s) => s.pendingTransfers);
  const wallets = useAppStore((s) => s.wallets);
  const confirmTransfer = useAppStore((s) => s.confirmTransfer);
  const rejectTransfer = useAppStore((s) => s.rejectTransfer);

  if (pendingTransfers.length === 0) return null;

  function getWalletName(id: string): string {
    return wallets.find((w) => w.id === id)?.name || "Unknown";
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="glass-card p-6"
    >
      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
        Bekleyen Transferler
      </h2>

      <div className="space-y-3">
        <AnimatePresence>
          {pendingTransfers.map((transfer) => (
            <motion.div
              key={transfer.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, height: 0 }}
              className="bg-white/5 rounded-lg p-4"
            >
              <div className="flex items-center gap-2 text-sm mb-2">
                <span className="text-slate-300">{getWalletName(transfer.from_wallet_id)}</span>
                <ArrowRight className="w-4 h-4 text-brand-teal" />
                <span className="text-brand-teal font-medium">
                  {getWalletName(transfer.to_wallet_id)}
                </span>
              </div>

              <div className="text-xl font-bold mb-1">
                ₺{Number(transfer.amount).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
              </div>

              {transfer.reason && (
                <p className="text-sm text-slate-400 mb-3">{transfer.reason}</p>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => confirmTransfer(transfer.id)}
                  className="flex items-center gap-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <Check className="w-4 h-4" />
                  Onayla
                </button>
                <button
                  onClick={() => rejectTransfer(transfer.id)}
                  className="flex items-center gap-1 px-4 py-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-lg text-sm font-medium transition-colors"
                >
                  <X className="w-4 h-4" />
                  Reddet
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
