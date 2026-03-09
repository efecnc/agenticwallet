"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/store/app-store";
import { motion } from "framer-motion";
import { Tag, TrendingDown } from "lucide-react";

interface MerchantDeal {
  merchant: string;
  avgCents: number;
  bestDealCents: number;
  savedCents: number;
  dealCount: number;
}

export default function DiscountFollower() {
  const storeTransactions = useAppStore((s) => s.transactions);
  const [extendedTxns, setExtendedTxns] = useState(storeTransactions);

  // Fetch extended transaction history for better averages
  useEffect(() => {
    const fetchExtended = async () => {
      try {
        const res = await fetch("/api/transactions?limit=200");
        const data = await res.json();
        if (data.transactions?.length) {
          setExtendedTxns(data.transactions);
        }
      } catch {
        // Fall back to store transactions
      }
    };
    fetchExtended();
  }, []);

  const transactions = extendedTxns.length > 0 ? extendedTxns : storeTransactions;

  // Group expense transactions by merchant
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const merchantTxns: Record<string, { amountCents: number; date: string }[]> = {};

  for (const tx of transactions) {
    if (tx.type !== "expense" || !tx.merchant) continue;
    const amountCents = Math.round(Number(tx.amount) * 100);
    if (!merchantTxns[tx.merchant]) merchantTxns[tx.merchant] = [];
    merchantTxns[tx.merchant].push({ amountCents, date: tx.occurred_at });
  }

  // Find merchants where current-month purchases were below average (20% threshold)
  const deals: MerchantDeal[] = [];
  let totalSavedCents = 0;

  for (const [merchant, txns] of Object.entries(merchantTxns)) {
    if (txns.length < 3) continue;

    const totalCents = txns.reduce((s, t) => s + t.amountCents, 0);
    const avgCents = Math.round(totalCents / txns.length);
    const thresholdCents = Math.round(avgCents * 0.8); // 20% below average

    const currentMonthDeals = txns.filter((t) => {
      const d = new Date(t.date);
      return (
        d.getMonth() === currentMonth &&
        d.getFullYear() === currentYear &&
        t.amountCents < thresholdCents
      );
    });

    if (currentMonthDeals.length === 0) continue;

    let savedCents = 0;
    let bestDealCents = Infinity;

    for (const deal of currentMonthDeals) {
      savedCents += avgCents - deal.amountCents;
      if (deal.amountCents < bestDealCents) bestDealCents = deal.amountCents;
    }

    totalSavedCents += savedCents;
    deals.push({
      merchant,
      avgCents,
      bestDealCents,
      savedCents,
      dealCount: currentMonthDeals.length,
    });
  }

  // Sort by saved amount descending, show top 5
  deals.sort((a, b) => b.savedCents - a.savedCents);
  const topDeals = deals.slice(0, 5);

  if (topDeals.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="glass-card p-5"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-emerald-400" />
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            İndirim Takibi
          </h2>
        </div>
        <span className="text-[10px] text-slate-600 font-medium">Bu ay</span>
      </div>

      {/* Total saved */}
      <div className="flex items-center gap-2 mb-4 px-3 py-3 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/10">
        <TrendingDown className="w-5 h-5 text-emerald-400" />
        <div>
          <div className="flex items-baseline gap-1.5">
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="text-lg font-bold text-emerald-400 tabular-nums"
            >
              ₺{(totalSavedCents / 100).toLocaleString("tr-TR", { minimumFractionDigits: 0 })}
            </motion.span>
            <span className="text-sm text-slate-400">tasarruf edildi</span>
          </div>
          <span className="text-[11px] text-emerald-500/70">
            Ortalama altı alışverişlerden
          </span>
        </div>
      </div>

      {/* Deal list */}
      <div className="space-y-2">
        {topDeals.map((deal) => {
          const savePct = Math.round((deal.savedCents / (deal.avgCents * deal.dealCount)) * 100);
          return (
            <div
              key={deal.merchant}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]"
            >
              {/* Merchant initial */}
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-emerald-400">
                  {deal.merchant.charAt(0)}
                </span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium truncate">{deal.merchant}</span>
                  <span className="text-xs font-semibold text-emerald-400 tabular-nums ml-2">
                    ₺{(deal.savedCents / 100).toLocaleString("tr-TR", { minimumFractionDigits: 0 })}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-slate-500 tabular-nums">
                    Ort: ₺{(deal.avgCents / 100).toLocaleString("tr-TR", { minimumFractionDigits: 0 })}
                  </span>
                  <span className="text-[10px] text-slate-600">→</span>
                  <span className="text-[10px] text-emerald-500 tabular-nums">
                    ₺{(deal.bestDealCents / 100).toLocaleString("tr-TR", { minimumFractionDigits: 0 })}
                  </span>
                  <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded font-semibold">
                    %{savePct} ucuz
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
