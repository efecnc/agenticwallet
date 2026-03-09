"use client";

import { useAppStore } from "@/store/app-store";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownLeft } from "lucide-react";

export default function WeeklySummary() {
  const transactions = useAppStore((s) => s.transactions);
  const isInitialized = useAppStore((s) => s.isInitialized);

  if (!isInitialized || transactions.length === 0) {
    return (
      <div className="glass-card p-5" role="status" aria-label="Haftalık özet yükleniyor">
        <div className="skeleton-text w-16 h-2.5 mb-3" />
        <div className="skeleton h-7 w-20 rounded-lg mb-2" />
        <div className="skeleton h-5 w-12 rounded-full" />
      </div>
    );
  }

  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 86400000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 86400000);

  const thisWeekCents = transactions
    .filter((t) => t.type === "expense" && new Date(t.occurred_at) >= oneWeekAgo)
    .reduce((s, t) => s + Math.round(Number(t.amount) * 100), 0);

  const lastWeekCents = transactions
    .filter(
      (t) =>
        t.type === "expense" &&
        new Date(t.occurred_at) >= twoWeeksAgo &&
        new Date(t.occurred_at) < oneWeekAgo
    )
    .reduce((s, t) => s + Math.round(Number(t.amount) * 100), 0);

  const thisWeek = thisWeekCents / 100;
  const lastWeek = lastWeekCents / 100;

  const changePercent =
    lastWeek > 0 ? Math.round(((thisWeek - lastWeek) / lastWeek) * 100) : 0;

  const isUp = changePercent > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="glass-card p-5"
      role="region"
      aria-label="Haftalık harcama özeti"
    >
      <div className="flex items-center gap-1.5 mb-2">
        <ArrowUpRight className="w-3 h-3 text-emerald-300/40" aria-hidden="true" />
        <span className="text-[10px] text-emerald-300/40 font-semibold uppercase tracking-wider">harcanan</span>
      </div>

      <div className="text-2xl font-extrabold tracking-tight text-white mb-2 tabular-nums">
        ₺{(thisWeek / 1000).toFixed(1).replace(".", ",")}k
      </div>

      {changePercent !== 0 && (
        <div
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
            isUp
              ? "bg-red-500/10 text-red-400"
              : "bg-emerald-500/10 text-emerald-400"
          }`}
          aria-label={`Geçen haftaya göre %${Math.abs(changePercent)} ${isUp ? "artış" : "azalış"}`}
        >
          {isUp ? (
            <TrendingUp className="w-3 h-3" aria-hidden="true" />
          ) : (
            <TrendingDown className="w-3 h-3" aria-hidden="true" />
          )}
          %{Math.abs(changePercent)}
        </div>
      )}
    </motion.div>
  );
}
