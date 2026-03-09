"use client";

import { useAppStore } from "@/store/app-store";
import { Wallet } from "lucide-react";
import { motion } from "framer-motion";

export default function WalletCard() {
  const wallets = useAppStore((s) => s.wallets);
  const mainWallet = wallets.find((w) => w.type === "main");

  if (!mainWallet) {
    return (
      <div className="glass-card p-6 animate-pulse">
        <div className="h-8 w-32 bg-white/10 rounded mb-2" />
        <div className="h-12 w-48 bg-white/10 rounded" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6 relative overflow-hidden"
    >
      {/* Gradient accent */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-brand-teal/20 to-transparent rounded-bl-full" />

      <div className="flex items-center gap-2 text-slate-400 mb-1">
        <Wallet className="w-4 h-4" />
        <span className="text-sm font-medium">{mainWallet.name}</span>
      </div>

      <div className="text-4xl font-bold tracking-tight">
        ₺{Number(mainWallet.balance).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
      </div>

      <div className="mt-3 text-sm text-slate-400">
        Kullanılabilir bakiye
      </div>
    </motion.div>
  );
}
