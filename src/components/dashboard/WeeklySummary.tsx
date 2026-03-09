"use client";

import { useAppStore } from "@/store/app-store";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export default function WeeklySummary() {
  const transactions = useAppStore((s) => s.transactions);

  if (transactions.length === 0) {
    return (
      <div className="glass-card p-6 animate-pulse">
        <div className="h-4 w-24 bg-white/10 rounded mb-4" />
        <div className="h-8 w-32 bg-white/10 rounded" />
      </div>
    );
  }

  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  // This week expenses (integer math)
  const thisWeekCents = transactions
    .filter((t) => t.type === "expense" && new Date(t.occurred_at) >= oneWeekAgo)
    .reduce((s, t) => s + Math.round(Number(t.amount) * 100), 0);

  // Last week expenses
  const lastWeekCents = transactions
    .filter(
      (t) =>
        t.type === "expense" &&
        new Date(t.occurred_at) >= twoWeeksAgo &&
        new Date(t.occurred_at) < oneWeekAgo
    )
    .reduce((s, t) => s + Math.round(Number(t.amount) * 100), 0);

  // This week income
  const thisWeekIncomeCents = transactions
    .filter((t) => t.type === "income" && new Date(t.occurred_at) >= oneWeekAgo)
    .reduce((s, t) => s + Math.round(Number(t.amount) * 100), 0);

  const thisWeek = thisWeekCents / 100;
  const lastWeek = lastWeekCents / 100;
  const thisWeekIncome = thisWeekIncomeCents / 100;

  const changePercent =
    lastWeek > 0 ? Math.round(((thisWeek - lastWeek) / lastWeek) * 100) : 0;

  const isUp = changePercent > 0;
  const isDown = changePercent < 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="glass-card p-6"
    >
      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
        Haftalık Özet
      </h2>

      <div className="space-y-3">
        {/* This week spending */}
        <div>
          <div className="text-xs text-slate-500 mb-1">Bu hafta harcama</div>
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold">
              ₺{thisWeek.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
            </span>
            {changePercent !== 0 && (
              <span
                className={`flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded-full ${
                  isUp
                    ? "bg-red-500/10 text-red-400"
                    : "bg-emerald-500/10 text-emerald-400"
                }`}
              >
                {isUp ? (
                  <TrendingUp className="w-3 h-3" />
                ) : isDown ? (
                  <TrendingDown className="w-3 h-3" />
                ) : (
                  <Minus className="w-3 h-3" />
                )}
                {Math.abs(changePercent)}%
              </span>
            )}
          </div>
        </div>

        {/* Income */}
        {thisWeekIncome > 0 && (
          <div>
            <div className="text-xs text-slate-500 mb-1">Bu hafta gelir</div>
            <div className="text-lg font-semibold text-emerald-400">
              +₺{thisWeekIncome.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
            </div>
          </div>
        )}

        {/* Last week for comparison */}
        <div className="pt-2 border-t border-white/5">
          <div className="text-xs text-slate-500">
            Geçen hafta: ₺{lastWeek.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
