"use client";

import { useAppStore } from "@/store/app-store";
import { motion } from "framer-motion";
import { RefreshCw } from "lucide-react";

interface RecurringItem {
  merchant: string;
  category: string;
  amount: number;
  count: number;
  isRecurring: boolean;
}

export default function RecurringPayments() {
  const transactions = useAppStore((s) => s.transactions);

  if (transactions.length === 0) return null;

  // Detect recurring payments:
  // 1. Explicitly marked as is_recurring
  // 2. Same merchant+amount appearing 2+ times
  const merchantAmountMap: Record<string, { count: number; category: string; amountCents: number }> = {};

  for (const tx of transactions) {
    if (tx.type !== "expense") continue;
    const amountCents = Math.round(Number(tx.amount) * 100);
    const key = `${tx.merchant || tx.category}__${amountCents}`;

    if (!merchantAmountMap[key]) {
      merchantAmountMap[key] = { count: 0, category: tx.category, amountCents };
    }
    merchantAmountMap[key].count++;
  }

  // Find recurring: marked as recurring OR same merchant+amount 2+ times
  const recurringItems: RecurringItem[] = [];
  const seen = new Set<string>();

  // First add explicitly recurring
  for (const tx of transactions) {
    if (!tx.is_recurring || tx.type !== "expense") continue;
    const key = tx.merchant || tx.category;
    if (seen.has(key)) continue;
    seen.add(key);
    recurringItems.push({
      merchant: tx.merchant || tx.category,
      category: tx.category,
      amount: Number(tx.amount),
      count: merchantAmountMap[`${key}__${Math.round(Number(tx.amount) * 100)}`]?.count || 1,
      isRecurring: true,
    });
  }

  // Then add detected recurring (same amount 2+ times)
  for (const [key, val] of Object.entries(merchantAmountMap)) {
    if (val.count < 2) continue;
    const merchant = key.split("__")[0];
    if (seen.has(merchant)) continue;
    seen.add(merchant);
    recurringItems.push({
      merchant,
      category: val.category,
      amount: val.amountCents / 100,
      count: val.count,
      isRecurring: false,
    });
  }

  // Sort by amount descending
  recurringItems.sort((a, b) => b.amount - a.amount);

  if (recurringItems.length === 0) return null;

  // Total monthly recurring (integer math)
  const totalMonthlyCents = recurringItems.reduce(
    (s, r) => s + Math.round(r.amount * 100),
    0
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="glass-card p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4 text-violet-400" />
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
            Düzenli Ödemeler
          </h2>
        </div>
        <span className="text-xs text-slate-500">
          Aylık ~₺{(totalMonthlyCents / 100).toLocaleString("tr-TR", { minimumFractionDigits: 0 })}
        </span>
      </div>

      <div className="space-y-2 max-h-[250px] overflow-y-auto scrollbar-thin pr-1">
        {recurringItems.map((item) => (
          <div
            key={`${item.merchant}-${item.amount}`}
            className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-violet-500/10 flex items-center justify-center text-xs font-bold text-violet-300">
                {item.merchant[0].toUpperCase()}
              </div>
              <div>
                <div className="text-sm font-medium">{item.merchant}</div>
                <div className="text-xs text-slate-500 capitalize">
                  {item.category}
                  {item.isRecurring && " · Sabit"}
                </div>
              </div>
            </div>
            <span className="text-sm font-semibold tabular-nums text-slate-300">
              ₺{item.amount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
