"use client";

import { useAppStore } from "@/store/app-store";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { motion } from "framer-motion";
import EmptyState from "@/components/ui/EmptyState";
import { PieChart as PieChartIcon } from "lucide-react";

const COLORS = [
  "#10b981",
  "#34d399",
  "#6ee7b7",
  "#a7f3d0",
  "#059669",
  "#047857",
  "#065f46",
  "#064e3b",
];

const categoryLabels: Record<string, string> = {
  groceries: "Market",
  rent: "Kira",
  salary: "Maaş",
  subscription: "Abonelik",
  coffee: "Kahve",
  dining: "Yemek",
  transport: "Ulaşım",
  shopping: "Alışveriş",
  utilities: "Faturalar",
};

export default function SpendingChart() {
  const transactions = useAppStore((s) => s.transactions);
  const isInitialized = useAppStore((s) => s.isInitialized);

  if (!isInitialized) {
    return (
      <div className="glass-card p-6" role="status" aria-label="Harcama grafiği yükleniyor">
        <div className="skeleton-text w-36 h-3.5 mb-4" />
        <div className="flex items-center gap-6">
          <div className="skeleton-circle w-36 h-36 flex-shrink-0" />
          <div className="flex-1 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="skeleton w-2.5 h-2.5 rounded-full" />
                  <div className="skeleton-text-sm w-14" />
                </div>
                <div className="skeleton-text-sm w-8" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const categoryCents: Record<string, number> = {};
  for (const tx of transactions) {
    if (tx.type !== "expense") continue;
    categoryCents[tx.category] =
      (categoryCents[tx.category] || 0) + Math.round(Number(tx.amount) * 100);
  }

  const chartData = Object.entries(categoryCents)
    .map(([name, cents]) => ({
      name: categoryLabels[name] || name,
      rawName: name,
      value: cents / 100,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  if (chartData.length === 0) {
    return (
      <div className="glass-card p-6">
        <h2 className="text-xs font-semibold text-emerald-300/50 uppercase tracking-wider mb-2">
          Kategoriler
        </h2>
        <EmptyState
          icon={PieChartIcon}
          title="Veri yetersiz"
          description="Harcamalar oluştukça grafik burada görünecek."
          iconColor="text-emerald-400"
        />
      </div>
    );
  }

  const totalCents = Object.values(categoryCents).reduce((a, b) => a + b, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="glass-card p-6"
      role="region"
      aria-label="Kategoriye göre harcama grafiği"
    >
      <h2 className="text-xs font-semibold text-emerald-300/50 uppercase tracking-wider mb-4">
        Kategoriler
      </h2>

      <div className="flex items-center gap-6">
        <div className="w-36 h-36 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={34}
                outerRadius={60}
                paddingAngle={3}
                dataKey="value"
                stroke="none"
                cornerRadius={4}
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
                  background: "rgba(16, 185, 129, 0.1)",
                  backdropFilter: "blur(12px)",
                  border: "1px solid rgba(16, 185, 129, 0.2)",
                  borderRadius: "16px",
                  color: "#e2e8f0",
                  fontSize: "12px",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
                  padding: "8px 12px",
                }}
                itemStyle={{ color: "#e2e8f0" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex-1 space-y-2.5">
          {chartData.map((item, i) => {
            const pct =
              totalCents > 0
                ? Math.round((item.value * 10000) / (totalCents / 100)) / 100
                : 0;
            return (
              <div key={item.rawName} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: COLORS[i % COLORS.length] }}
                    aria-hidden="true"
                  />
                  <span className="text-slate-400 text-xs">{item.name}</span>
                </div>
                <span className="text-emerald-300/60 tabular-nums text-xs font-semibold">%{pct}</span>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
