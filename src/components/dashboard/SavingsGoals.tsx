"use client";

import { useAppStore } from "@/store/app-store";
import { Shield, Plane, Target } from "lucide-react";
import { motion } from "framer-motion";

const iconMap: Record<string, React.ElementType> = {
  shield: Shield,
  plane: Plane,
  default: Target,
};

export default function SavingsGoals() {
  const wallets = useAppStore((s) => s.wallets);
  const savingsGoals = wallets.filter((w) => w.type === "savings_goal");

  if (savingsGoals.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="glass-card p-6"
    >
      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
        Birikim Hedefleri
      </h2>

      <div className="space-y-4">
        {savingsGoals.map((goal) => {
          const balance = Number(goal.balance);
          const target = Number(goal.target_amount) || 1;
          const percentage = Math.min(Math.round((balance / target) * 100), 100);
          const remaining = Math.max(target - balance, 0);
          const Icon = iconMap[goal.icon] || iconMap.default;

          return (
            <div key={goal.id}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${goal.color}20` }}
                  >
                    <Icon className="w-4 h-4" style={{ color: goal.color }} />
                  </div>
                  <div>
                    <div className="text-sm font-medium">{goal.name}</div>
                    <div className="text-xs text-slate-400">
                      ₺{remaining.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} kaldı
                    </div>
                  </div>
                </div>
                <span className="text-sm font-semibold" style={{ color: goal.color }}>
                  {percentage}%
                </span>
              </div>

              <div className="w-full bg-white/5 rounded-full h-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-2 rounded-full"
                  style={{ backgroundColor: goal.color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
