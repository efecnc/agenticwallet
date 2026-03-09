"use client";

import { useAppStore } from "@/store/app-store";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";

export default function SpendingTrends() {
  const transactions = useAppStore((s) => s.transactions);

  if (transactions.length === 0) return null;

  // Group expenses by week (last 8 weeks), integer math
  const now = new Date();
  const weeks: { label: string; totalCents: number }[] = [];

  for (let i = 7; i >= 0; i--) {
    const weekStart = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
    const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);

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
      totalCents,
    });
  }

  const chartData = weeks.map((w) => ({
    name: w.label,
    harcama: w.totalCents / 100,
  }));

  // Filter out weeks with 0 if they're leading zeros
  const firstNonZero = chartData.findIndex((d) => d.harcama > 0);
  const trimmedData = firstNonZero >= 0 ? chartData.slice(firstNonZero) : chartData;

  if (trimmedData.length < 2) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
      className="glass-card p-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-4 h-4 text-brand-teal" />
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
          Harcama Trendi
        </h2>
      </div>

      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trimmedData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="name"
              tick={{ fill: "#64748b", fontSize: 11 }}
              axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#64748b", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => `₺${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              formatter={(value: number) => [
                `₺${value.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}`,
                "Harcama",
              ]}
              contentStyle={{
                background: "#1e293b",
                border: "1px solid #334155",
                borderRadius: "8px",
                color: "#e2e8f0",
                fontSize: "12px",
              }}
            />
            <Line
              type="monotone"
              dataKey="harcama"
              stroke="#10b981"
              strokeWidth={2.5}
              dot={{ fill: "#10b981", r: 4, strokeWidth: 0 }}
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
