"use client";

import { useAppStore } from "@/store/app-store";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { RefreshCw, Repeat, AlertTriangle, Clock } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import type { Transaction } from "@/types/database";

interface RecurringItem {
  merchant: string;
  category: string;
  amount: number;
  count: number;
  isRecurring: boolean;
  nextRenewalDays: number | null;
  priceChange: number | null;
}

export default function RecurringPayments() {
  const transactions = useAppStore((s) => s.transactions);
  const isInitialized = useAppStore((s) => s.isInitialized);
  const [extendedTxns, setExtendedTxns] = useState<Transaction[]>([]);

  // Fetch extended recurring transactions for better analysis
  useEffect(() => {
    async function fetchExtended() {
      try {
        const res = await fetch("/api/transactions?limit=200&is_recurring=true");
        const data = await res.json();
        if (data.transactions?.length > 0) setExtendedTxns(data.transactions);
      } catch {
        // fallback to store transactions
      }
    }
    if (transactions.length > 0) fetchExtended();
  }, [transactions.length]);

  const allTxns = extendedTxns.length > 0 ? [...extendedTxns, ...transactions] : transactions;

  if (!isInitialized) {
    return (
      <div className="glass-card p-6" role="status" aria-label="Düzenli ödemeler yükleniyor">
        <div className="flex items-center gap-2 mb-3">
          <div className="skeleton-circle w-4 h-4" />
          <div className="skeleton-text w-28 h-3" />
        </div>
        <div className="skeleton h-14 w-full rounded-xl mb-4" />
        <div className="space-y-1">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 py-2.5 px-2">
              <div className="skeleton-circle w-9 h-9 rounded-xl" />
              <div className="flex-1 space-y-1.5">
                <div className="skeleton-text w-24" />
                <div className="skeleton-text-sm w-16" />
              </div>
              <div className="skeleton-text w-16" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (allTxns.length === 0) {
    return (
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-2">
          <RefreshCw className="w-4 h-4 text-violet-400" aria-hidden="true" />
          <h2 className="text-xs font-semibold text-emerald-300/50 uppercase tracking-wider">
            Düzenli Ödemeler
          </h2>
        </div>
        <EmptyState
          icon={RefreshCw}
          title="Abonelik bulunamadı"
          description="Düzenli ödemeler otomatik olarak tespit edilecek."
          iconColor="text-violet-400"
        />
      </div>
    );
  }

  const now = new Date();

  // Group by merchant to detect recurring + track price history
  const merchantHistory: Record<
    string,
    { amounts: { value: number; date: string }[]; category: string; isRecurring: boolean }
  > = {};

  for (const tx of allTxns) {
    if (tx.type !== "expense") continue;
    const key = tx.merchant || tx.category;
    if (!merchantHistory[key]) {
      merchantHistory[key] = { amounts: [], category: tx.category, isRecurring: tx.is_recurring };
    }
    merchantHistory[key].amounts.push({ value: Number(tx.amount), date: tx.occurred_at });
    if (tx.is_recurring) merchantHistory[key].isRecurring = true;
  }

  const recurringItems: RecurringItem[] = [];

  for (const [merchant, info] of Object.entries(merchantHistory)) {
    const isExplicit = info.isRecurring;
    const hasMultiple = info.amounts.length >= 2;

    if (!isExplicit && !hasMultiple) continue;

    // For non-explicit, check amount consistency (within 10%)
    if (!isExplicit) {
      const cents = info.amounts.map((a) => Math.round(a.value * 100));
      const median = cents.sort((a, b) => a - b)[Math.floor(cents.length / 2)];
      const allSimilar = cents.every((c) => Math.abs(c - median) / median < 0.1);
      if (!allSimilar) continue;
    }

    // Sort by date descending
    info.amounts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const latest = info.amounts[0];
    const previous = info.amounts.length > 1 ? info.amounts[1] : null;

    // Price change detection (integer math)
    let priceChange: number | null = null;
    if (previous) {
      const diffCents = Math.round(latest.value * 100) - Math.round(previous.value * 100);
      if (Math.abs(diffCents) > 0) {
        priceChange = diffCents / 100;
      }
    }

    // Next renewal countdown
    let nextRenewalDays: number | null = null;
    const lastDate = new Date(latest.date);
    const dayOfMonth = lastDate.getDate();
    const nextRenewal = new Date(now.getFullYear(), now.getMonth(), dayOfMonth);
    if (nextRenewal <= now) nextRenewal.setMonth(nextRenewal.getMonth() + 1);
    nextRenewalDays = Math.ceil((nextRenewal.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    recurringItems.push({
      merchant,
      category: info.category,
      amount: latest.value,
      count: info.amounts.length,
      isRecurring: isExplicit,
      nextRenewalDays,
      priceChange,
    });
  }

  recurringItems.sort((a, b) => b.amount - a.amount);
  if (recurringItems.length === 0) return null;

  // Totals (integer math)
  const totalMonthlyCents = recurringItems.reduce((s, r) => s + Math.round(r.amount * 100), 0);
  const totalAnnualCents = totalMonthlyCents * 12;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="glass-card p-6"
      role="region"
      aria-label={`Düzenli ödemeler: ${recurringItems.length} abonelik`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4 text-violet-400" aria-hidden="true" />
          <h2 className="text-xs font-semibold text-emerald-300/50 uppercase tracking-wider">
            Düzenli Ödemeler
          </h2>
        </div>
        <span className="text-[11px] text-slate-600 font-medium px-2 py-0.5 bg-white/[0.04] rounded-full">
          {recurringItems.length} abonelik
        </span>
      </div>

      {/* Cost summary: monthly + annual */}
      <div className="flex items-center gap-4 mb-4 px-2 py-2.5 rounded-xl bg-white/[0.02]">
        <div>
          <div className="text-[10px] text-slate-600 uppercase">Aylık</div>
          <div className="text-sm font-bold text-slate-300 tabular-nums">
            ₺{(totalMonthlyCents / 100).toLocaleString("tr-TR", { minimumFractionDigits: 0 })}
          </div>
        </div>
        <div className="w-px h-8 bg-white/[0.06]" />
        <div>
          <div className="text-[10px] text-slate-600 uppercase">Yıllık</div>
          <div className="text-sm font-bold text-amber-400 tabular-nums">
            ₺{(totalAnnualCents / 100).toLocaleString("tr-TR", { minimumFractionDigits: 0 })}
          </div>
        </div>
      </div>

      <div className="space-y-1 max-h-[280px] overflow-y-auto scrollbar-thin pr-1">
        {recurringItems.map((item) => (
          <div
            key={`${item.merchant}-${item.amount}`}
            className="flex items-center gap-3 py-2.5 px-2 rounded-xl hover:bg-white/[0.03] transition-colors"
          >
            <div
              className="w-9 h-9 rounded-xl bg-violet-500/10 flex items-center justify-center text-xs font-bold text-violet-300 flex-shrink-0"
              aria-hidden="true"
            >
              {item.merchant[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{item.merchant}</div>
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                <span className="text-[11px] text-slate-600 capitalize">{item.category}</span>
                {item.isRecurring && (
                  <span className="flex items-center gap-0.5 text-[10px] text-violet-400/80">
                    <Repeat className="w-2.5 h-2.5" aria-hidden="true" />
                    Sabit
                  </span>
                )}
                {item.nextRenewalDays !== null && item.nextRenewalDays <= 7 && (
                  <span className="flex items-center gap-0.5 text-[10px] text-cyan-400">
                    <Clock className="w-2.5 h-2.5" aria-hidden="true" />
                    {item.nextRenewalDays} gün
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {item.priceChange !== null && item.priceChange !== 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-medium flex items-center gap-0.5 ${
                    item.priceChange > 0
                      ? "bg-amber-500/10 text-amber-400"
                      : "bg-emerald-500/10 text-emerald-400"
                  }`}
                  aria-label={`Fiyat değişimi: ${item.priceChange > 0 ? "+" : ""}₺${Math.abs(item.priceChange).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}`}
                >
                  {item.priceChange > 0 && <AlertTriangle className="w-2.5 h-2.5" aria-hidden="true" />}
                  {item.priceChange > 0 ? "+" : ""}₺{Math.abs(item.priceChange).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                </span>
              )}
              <span className="text-sm font-semibold tabular-nums text-slate-300">
                ₺{item.amount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
