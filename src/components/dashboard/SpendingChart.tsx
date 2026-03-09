"use client";

import { useAppStore } from "@/store/app-store";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { motion } from "framer-motion";

const COLORS = [
  "#10b981", // emerald
  "#f59e0b", // amber
  "#3b82f6", // blue
  "#ef4444", // red
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#f97316", // orange
];

export default function SpendingChart() {
  const transactions = useAppStore((s) => s.transactions);

  // Aggregate spending by category (expenses only) using integer math
  const categoryCents: Record<string, number> = {};
  for (const tx of transactions) {
    if (tx.type !== "expense") continue;
    categoryCents[tx.category] =
      (categoryCents[tx.category] || 0) + Math.round(Number(tx.amount) * 100);
  }

  const chartData = Object.entries(categoryCents)
    .map(([name, cents]) => ({ name, value: cents / 100 }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  if (chartData.length === 0) return null;

  const totalCents = Object.values(categoryCents).reduce((a, b) => a + b, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="glass-card p-6"
    >
      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
        Kategoriye Göre Harcama
      </h2>

      <div className="flex items-center gap-6">
        <div className="w-40 h-40 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={35}
                outerRadius={65}
                paddingAngle={3}
                dataKey="value"
                stroke="none"
              >
                {chartData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) =>
                  `₺${value.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}`
                }
                contentStyle={{
                  background: "#1e293b",
                  border: "1px solid #334155",
                  borderRadius: "8px",
                  color: "#e2e8f0",
                  fontSize: "12px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex-1 space-y-2">
          {chartData.map((item, i) => {
            const pct = totalCents > 0 ? Math.round((item.value * 10000) / (totalCents / 100)) / 100 : 0;
            return (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[i % COLORS.length] }}
                  />
                  <span className="text-slate-300 capitalize">{item.name}</span>
                </div>
                <span className="text-slate-400 tabular-nums">{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
