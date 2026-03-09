"use client";

import { useAppStore } from "@/store/app-store";
import { motion } from "framer-motion";
import { CalendarClock } from "lucide-react";

interface InstallmentPlan {
  merchant: string;
  description: string;
  current: number;
  total: number;
  monthlyAmount: number;
  remaining: number;
  totalRemaining: number;
}

export default function TaksitTracker() {
  const transactions = useAppStore((s) => s.transactions);

  if (transactions.length === 0) return null;

  // Find transactions with installment metadata and group by plan
  const planMap: Record<string, InstallmentPlan> = {};

  for (const tx of transactions) {
    const inst = tx.metadata?.installment as {
      current: number;
      total: number;
      monthly_amount: number;
      description: string;
    } | undefined;

    if (!inst) continue;

    const key = `${tx.merchant}-${inst.description}`;
    if (!planMap[key] || inst.current > planMap[key].current) {
      const remaining = inst.total - inst.current;
      const totalRemainingCents = remaining * Math.round(inst.monthly_amount * 100);
      planMap[key] = {
        merchant: tx.merchant || tx.category,
        description: inst.description,
        current: inst.current,
        total: inst.total,
        monthlyAmount: inst.monthly_amount,
        remaining,
        totalRemaining: totalRemainingCents / 100,
      };
    }
  }

  const plans = Object.values(planMap).filter((p) => p.remaining > 0);
  if (plans.length === 0) return null;

  // Total monthly taksit obligation (integer math)
  const totalMonthlyCents = plans.reduce(
    (s, p) => s + Math.round(p.monthlyAmount * 100),
    0
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
      className="glass-card p-6"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <CalendarClock className="w-4 h-4 text-cyan-400" />
          <h2 className="text-xs font-semibold text-emerald-300/50 uppercase tracking-wider">
            Taksit Takibi
          </h2>
        </div>
        <span className="text-[11px] text-slate-600 font-medium px-2 py-0.5 bg-white/[0.04] rounded-full">
          {plans.length} aktif plan
        </span>
      </div>

      {/* Total monthly obligation */}
      <div className="mb-4 px-2 py-2.5 rounded-xl bg-white/[0.02]">
        <div className="text-[10px] text-slate-600 uppercase">Aylık Taksit Toplamı</div>
        <div className="text-sm font-bold text-cyan-400 tabular-nums">
          ₺{(totalMonthlyCents / 100).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
        </div>
      </div>

      <div className="space-y-3">
        {plans.map((plan) => {
          const progressPct = Math.round((plan.current / plan.total) * 100);
          return (
            <div
              key={`${plan.merchant}-${plan.description}`}
              className="px-2 py-2"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div>
                  <div className="text-sm font-medium">{plan.merchant}</div>
                  <div className="text-[11px] text-slate-500">{plan.description}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold tabular-nums text-slate-300">
                    ₺{plan.monthlyAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}/ay
                  </div>
                  <div className="text-[10px] text-slate-600">
                    {plan.remaining} taksit kaldı
                  </div>
                </div>
              </div>
              {/* Progress bar */}
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPct}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="h-full rounded-full bg-cyan-500"
                  />
                </div>
                <span className="text-[10px] text-slate-500 tabular-nums w-10 text-right">
                  {plan.current}/{plan.total}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
