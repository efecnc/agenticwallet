"use client";

import { useAppStore } from "@/store/app-store";
import { motion } from "framer-motion";
import { TrendingDown, Flame } from "lucide-react";
import { monthlyInflationRates, annualInflationRate } from "@/lib/data/inflation-rates";
import EmptyState from "@/components/ui/EmptyState";

export default function InflationTracker() {
  const transactions = useAppStore((s) => s.transactions);
  const isInitialized = useAppStore((s) => s.isInitialized);

  if (!isInitialized) {
    return (
      <div className="glass-card p-5" role="status" aria-label="Enflasyon takibi yükleniyor">
        <div className="flex items-center gap-2 mb-4">
          <div className="skeleton-circle w-4 h-4" />
          <div className="skeleton-text w-28 h-3" />
        </div>
        <div className="space-y-3">
          <div className="skeleton h-16 w-full rounded-xl" />
          <div className="skeleton h-8 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  // Calculate monthly spending power loss
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const monthlyRate = monthlyInflationRates[currentMonthKey] || 2.8;

  // Total expenses this month (integer math)
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthlyExpenseCents = transactions
    .filter((t) => t.type === "expense" && new Date(t.occurred_at) >= monthStart)
    .reduce((s, t) => s + Math.round(Number(t.amount) * 100), 0);

  const monthlyExpense = monthlyExpenseCents / 100;

  if (monthlyExpense === 0) {
    return (
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-2">
          <Flame className="w-4 h-4 text-orange-400" aria-hidden="true" />
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Enflasyon Etkisi
          </h2>
        </div>
        <EmptyState
          icon={TrendingDown}
          title="Veri yetersiz"
          description="Bu ayki harcamalarınla enflasyon etkisi burada görünecek."
          iconColor="text-orange-400"
        />
      </div>
    );
  }

  // Purchasing power loss this month (integer math)
  const lossCents = Math.round(monthlyExpenseCents * monthlyRate) / 100;
  const loss = lossCents / 100;

  // Annual projection
  const annualLossCents = Math.round(monthlyExpenseCents * 12 * annualInflationRate) / 100;
  const annualLoss = annualLossCents / 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="glass-card p-5"
      role="region"
      aria-label="Enflasyon etkisi takibi"
    >
      <div className="flex items-center gap-2 mb-4">
        <Flame className="w-4 h-4 text-orange-400" aria-hidden="true" />
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Enflasyon Etkisi
        </h2>
      </div>

      {/* This month's loss */}
      <div className="bg-orange-500/[0.06] rounded-xl p-4 mb-3 border border-orange-500/10">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] text-slate-500 font-medium">Bu ay satın alma gücü kaybı</span>
          <span className="text-[10px] text-orange-400/80 font-medium px-1.5 py-0.5 bg-orange-500/10 rounded-full">
            %{monthlyRate}
          </span>
        </div>
        <div className="text-xl font-bold text-orange-400 tabular-nums">
          -₺{loss.toLocaleString("tr-TR", { minimumFractionDigits: 0 })}
        </div>
        <div className="text-[10px] text-slate-600 mt-1">
          ₺{monthlyExpense.toLocaleString("tr-TR", { minimumFractionDigits: 0 })} harcaman {monthlyRate}% daha az değerli
        </div>
      </div>

      {/* Annual projection */}
      <div className="flex items-center justify-between px-2 py-2 rounded-lg bg-white/[0.02]">
        <span className="text-[11px] text-slate-500">Yıllık projeksiyon</span>
        <span className="text-sm font-bold text-red-400 tabular-nums">
          -₺{annualLoss.toLocaleString("tr-TR", { minimumFractionDigits: 0 })}
        </span>
      </div>
    </motion.div>
  );
}
