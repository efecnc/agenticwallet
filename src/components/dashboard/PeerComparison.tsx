"use client";

import { useAppStore } from "@/store/app-store";
import { motion } from "framer-motion";
import { Users, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { peerBenchmarks } from "@/lib/data/peer-benchmarks";
import EmptyState from "@/components/ui/EmptyState";

export default function PeerComparison() {
  const transactions = useAppStore((s) => s.transactions);
  const isInitialized = useAppStore((s) => s.isInitialized);

  if (!isInitialized) {
    return (
      <div className="glass-card p-5" role="status" aria-label="Akran karşılaştırması yükleniyor">
        <div className="flex items-center gap-2 mb-4">
          <div className="skeleton-circle w-4 h-4" />
          <div className="skeleton-text w-32 h-3" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="skeleton-text w-16" />
              <div className="skeleton h-2 flex-1 rounded-full" />
              <div className="skeleton-text w-12" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Calculate this month's spending by category (integer math)
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const spentByCategory: Record<string, number> = {};

  for (const tx of transactions) {
    if (tx.type !== "expense") continue;
    if (new Date(tx.occurred_at) < monthStart) continue;
    const cents = Math.round(Number(tx.amount) * 100);
    spentByCategory[tx.category] = (spentByCategory[tx.category] || 0) + cents;
  }

  const comparisons = peerBenchmarks
    .map((bench) => {
      const spentCents = spentByCategory[bench.category] || 0;
      const spent = spentCents / 100;
      const avg = bench.averageMonthly;
      const diffPercent = avg > 0 ? Math.round(((spent - avg) / avg) * 100) : 0;

      return {
        ...bench,
        spent,
        diffPercent,
      };
    })
    .filter((c) => c.spent > 0);

  if (comparisons.length === 0) {
    return (
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-2">
          <Users className="w-4 h-4 text-indigo-400" aria-hidden="true" />
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Akran Karşılaştırması
          </h2>
        </div>
        <EmptyState
          icon={Users}
          title="Veri yetersiz"
          description="Bu ayki harcamalarınla İstanbul Gen Z ortalamasını karşılaştıracağız."
          iconColor="text-indigo-400"
        />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.55 }}
      className="glass-card p-5"
      role="region"
      aria-label="İstanbul Gen Z akran karşılaştırması"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-indigo-400" aria-hidden="true" />
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            İstanbul Gen Z Ortalaması
          </h2>
        </div>
      </div>

      <div className="space-y-3">
        {comparisons.map((c) => {
          const isAbove = c.diffPercent > 5;
          const isBelow = c.diffPercent < -5;
          const maxVal = Math.max(c.spent, c.averageMonthly);

          return (
            <div key={c.category}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-slate-400 font-medium">{c.label}</span>
                <div className="flex items-center gap-1.5">
                  {isAbove ? (
                    <TrendingUp className="w-3 h-3 text-red-400" aria-hidden="true" />
                  ) : isBelow ? (
                    <TrendingDown className="w-3 h-3 text-emerald-400" aria-hidden="true" />
                  ) : (
                    <Minus className="w-3 h-3 text-slate-500" aria-hidden="true" />
                  )}
                  <span
                    className={`text-[10px] font-semibold ${
                      isAbove ? "text-red-400" : isBelow ? "text-emerald-400" : "text-slate-500"
                    }`}
                    aria-label={`Ortalamadan %${Math.abs(c.diffPercent)} ${isAbove ? "fazla" : isBelow ? "az" : "aynı"}`}
                  >
                    {c.diffPercent > 0 ? "+" : ""}{c.diffPercent}%
                  </span>
                </div>
              </div>

              {/* Comparison bars */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-600 w-8">Sen</span>
                  <div className="flex-1 bg-white/[0.04] rounded-full h-1.5 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${maxVal > 0 ? (c.spent / maxVal) * 100 : 0}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className={`h-1.5 rounded-full ${isAbove ? "bg-red-400" : "bg-brand-teal"}`}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 tabular-nums w-16 text-right">
                    ₺{c.spent.toLocaleString("tr-TR", { minimumFractionDigits: 0 })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-600 w-8">Ort.</span>
                  <div className="flex-1 bg-white/[0.04] rounded-full h-1.5 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${maxVal > 0 ? (c.averageMonthly / maxVal) * 100 : 0}%` }}
                      transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
                      className="h-1.5 rounded-full bg-indigo-500/60"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 tabular-nums w-16 text-right">
                    ₺{c.averageMonthly.toLocaleString("tr-TR", { minimumFractionDigits: 0 })}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
