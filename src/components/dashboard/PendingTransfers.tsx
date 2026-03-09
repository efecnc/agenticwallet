"use client";

import { useAppStore } from "@/store/app-store";
import { ArrowRight, Check, X, Zap } from "lucide-react";
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
      role="region"
      aria-label="Bekleyen transferler"
    >
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-4 h-4 text-amber-400" aria-hidden="true" />
        <h2 className="text-xs font-semibold text-emerald-300/50 uppercase tracking-wider">
          Bekleyen Transferler
        </h2>
      </div>

      <div className="space-y-3">
        <AnimatePresence>
          {pendingTransfers.map((transfer) => (
            <motion.div
              key={transfer.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, height: 0 }}
              className="bg-emerald-500/[0.04] rounded-2xl p-4 border border-emerald-500/[0.08]"
            >
              {/* Transfer flow */}
              <div className="flex items-center gap-2 text-sm mb-3">
                <span className="px-2.5 py-1 bg-white/[0.06] rounded-xl text-slate-300 text-xs font-medium">
                  {getWalletName(transfer.from_wallet_id)}
                </span>
                <ArrowRight className="w-4 h-4 text-emerald-400 flex-shrink-0" aria-hidden="true" />
                <span className="px-2.5 py-1 bg-emerald-500/10 rounded-xl text-emerald-400 text-xs font-medium">
                  {getWalletName(transfer.to_wallet_id)}
                </span>
              </div>

              {/* Amount */}
              <div className="text-2xl font-extrabold mb-1 tracking-tight">
                ₺{Number(transfer.amount).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
              </div>

              {/* Reason */}
              {transfer.reason && (
                <p className="text-[13px] text-slate-400 mb-4 leading-relaxed">{transfer.reason}</p>
              )}

              {/* Action buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => confirmTransfer(transfer.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-sm font-semibold transition-all hover:shadow-lg hover:shadow-emerald-500/20 active:scale-[0.98] focus-ring"
                  aria-label={`₺${Number(transfer.amount).toLocaleString("tr-TR")} transferini onayla`}
                >
                  <Check className="w-4 h-4" aria-hidden="true" />
                  Onayla
                </button>
                <button
                  onClick={() => rejectTransfer(transfer.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white/[0.06] hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-2xl text-sm font-semibold transition-all active:scale-[0.98] focus-ring"
                  aria-label={`₺${Number(transfer.amount).toLocaleString("tr-TR")} transferini reddet`}
                >
                  <X className="w-4 h-4" aria-hidden="true" />
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
