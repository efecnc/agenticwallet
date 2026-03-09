"use client";

import { useAppStore } from "@/store/app-store";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { motion } from "framer-motion";
import { TrendingUp, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { useState, useMemo } from "react";
import EmptyState from "@/components/ui/EmptyState";

export default function SpendingTrends() {
  const transactions = useAppStore((s) => s.transactions);
  const isInitialized = useAppStore((s) => s.isInitialized);
  const [view, setView] = useState<"weekly" | "monthly">("weekly");

  const { chartData, totalIncomeCents, totalExpenseCents, latestValue } = useMemo(() => {
    if (transactions.length === 0) {
      return { chartData: [], totalIncomeCents: 0, totalExpenseCents: 0, latestValue: 0 };
    }

    const now = new Date();
    let inCents = 0;
    let outCents = 0;

    for (const tx of transactions) {
      const cents = Math.round(Number(tx.amount) * 100);
      if (tx.type === "income") inCents += cents;
      else if (tx.type === "expense") outCents += cents;
    }

    if (view === "weekly") {
      const weeks: { label: string; harcama: number }[] = [];
      for (let i = 7; i >= 0; i--) {
        const weekStart = new Date(now.getTime() - (i + 1) * 7 * 86400000);
        const weekEnd = new Date(now.getTime() - i * 7 * 86400000);

        const totalCents = transactions
          .filter((t) => {
            if (t.type !== "expense") return false;
            const d = new Date(t.occurred_at);
            return d >= weekStart && d < weekEnd;
          })
          .reduce((s, t) => s + Math.round(Number(t.amount) * 100), 0);

        const startDay = weekStart.getDate();
        const startMonth = weekStart.toLocaleDateString("tr-TR", { month: "short" });
        weeks.push({
          label: `${startDay} ${startMonth}`,
          harcama: totalCents / 100,
        });
      }

      const firstNonZero = weeks.findIndex((d) => d.harcama > 0);
      const trimmed = firstNonZero >= 0 ? weeks.slice(firstNonZero) : weeks;
      return {
        chartData: trimmed,
        totalIncomeCents: inCents,
        totalExpenseCents: outCents,
        latestValue: trimmed.length > 0 ? trimmed[trimmed.length - 1].harcama : 0,
      };
    } else {
      const months: { label: string; harcama: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

        const totalCents = transactions
          .filter((t) => {
            if (t.type !== "expense") return false;
            const d = new Date(t.occurred_at);
            return d >= monthDate && d < nextMonth;
          })
          .reduce((s, t) => s + Math.round(Number(t.amount) * 100), 0);

        months.push({
          label: monthDate.toLocaleDateString("tr-TR", { month: "short" }),
          harcama: totalCents / 100,
        });
      }

      const firstNonZero = months.findIndex((d) => d.harcama > 0);
      const trimmed = firstNonZero >= 0 ? months.slice(firstNonZero) : months;
      return {
        chartData: trimmed,
        totalIncomeCents: inCents,
        totalExpenseCents: outCents,
        latestValue: trimmed.length > 0 ? trimmed[trimmed.length - 1].harcama : 0,
      };
    }
  }, [transactions, view]);

  if (!isInitialized) {
    return (
      <div className="glass-card p-6" role="status" aria-label="Analitik yükleniyor">
        <div className="flex items-center gap-2 mb-4">
          <div className="skeleton-circle w-4 h-4" />
          <div className="skeleton-text w-24 h-3" />
        </div>
        <div className="skeleton h-12 w-32 rounded-xl mb-4" />
        <div className="skeleton h-48 w-full rounded-xl" />
      </div>
    );
  }

  if (transactions.length === 0 || chartData.length < 2) {
    return (
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-4 h-4 text-emerald-400" aria-hidden="true" />
          <h2 className="text-xs font-semibold text-emerald-300/50 uppercase tracking-wider">
            Analitik
          </h2>
        </div>
        <EmptyState
          icon={TrendingUp}
          title="Veri yetersiz"
          description="Haftalık trendler birkaç haftanın verisiyle oluşacak."
          iconColor="text-emerald-400"
        />
      </div>
    );
  }

  const totalIncome = totalIncomeCents / 100;
  const totalExpense = totalExpenseCents / 100;
  const total = totalIncome + totalExpense || 1;
  const incomePct = Math.round((totalIncome / total) * 1000) / 10;
  const expensePct = Math.round((totalExpense / total) * 1000) / 10;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="glass-card p-6"
      role="region"
      aria-label="Harcama analitik grafiği"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-400" aria-hidden="true" />
          <h2 className="text-xs font-semibold text-emerald-300/50 uppercase tracking-wider">
            Analitik
          </h2>
        </div>

        {/* Period toggle */}
        <div className="flex bg-white/[0.06] rounded-xl p-0.5">
          <button
            onClick={() => setView("weekly")}
            className={`px-3 py-1 rounded-lg text-[10px] font-semibold transition-all ${
              view === "weekly"
                ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/30"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            Haftalık
          </button>
          <button
            onClick={() => setView("monthly")}
            className={`px-3 py-1 rounded-lg text-[10px] font-semibold transition-all ${
              view === "monthly"
                ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/30"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            Aylık
          </button>
        </div>
      </div>

      {/* Big number */}
      <div className="mb-4">
        <div className="text-3xl font-extrabold tracking-tight text-white">
          {(latestValue / 1000).toFixed(2).replace(".", ",")}
          <span className="text-xl text-emerald-300/50 ml-0.5">k</span>
        </div>
        <p className="text-[11px] text-emerald-300/40 mt-0.5">
          Son {view === "weekly" ? "hafta" : "ay"} harcama
        </p>
      </div>

      {/* Chart */}
      <div className="h-48 -mx-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="mintGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="label"
              tick={{ fill: "#475569", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#475569", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
              width={35}
            />
            <Tooltip
              formatter={(value: number) => [
                `₺${value.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}`,
                "Harcama",
              ]}
              contentStyle={{
                background: "rgba(16, 185, 129, 0.1)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(16, 185, 129, 0.2)",
                borderRadius: "16px",
                color: "#e2e8f0",
                fontSize: "12px",
                boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
                padding: "8px 12px",
              }}
            />
            <Area
              type="monotone"
              dataKey="harcama"
              stroke="#10b981"
              strokeWidth={2.5}
              fill="url(#mintGradient)"
              dot={{ fill: "#10b981", r: 3.5, strokeWidth: 2, stroke: "#0a0f1e" }}
              activeDot={{ r: 6, strokeWidth: 2, fill: "#10b981", stroke: "#0a0f1e" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Income / Expense summary */}
      <div className="flex items-center gap-6 mt-4 pt-4 border-t border-emerald-500/[0.08]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div>
            <span className="text-[10px] text-emerald-300/40 block">gelir</span>
            <span className="text-xs font-bold text-emerald-400 tabular-nums">%{incomePct}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-red-500/10 flex items-center justify-center">
            <ArrowUpRight className="w-3.5 h-3.5 text-red-400" />
          </div>
          <div>
            <span className="text-[10px] text-red-300/40 block">gider</span>
            <span className="text-xs font-bold text-red-400 tabular-nums">%{expensePct}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
