"use client";

import { useAppStore } from "@/store/app-store";
import { Shield, Plane, Target, PiggyBank } from "lucide-react";
import { motion } from "framer-motion";
import EmptyState from "@/components/ui/EmptyState";

const iconMap: Record<string, React.ElementType> = {
  shield: Shield,
  plane: Plane,
  default: Target,
};

export default function SavingsGoals() {
  const wallets = useAppStore((s) => s.wallets);
  const isInitialized = useAppStore((s) => s.isInitialized);
  const savingsGoals = wallets.filter((w) => w.type === "savings_goal");

  if (!isInitialized) {
    return (
      <div className="glass-card p-6" role="status" aria-label="Birikim hedefleri yükleniyor">
        <div className="skeleton-text w-28 h-3.5 mb-4" />
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="p-3">
              <div className="flex items-center gap-3 mb-3">
                <div className="skeleton-circle w-10 h-10" />
                <div className="flex-1 space-y-1.5">
                  <div className="skeleton-text w-24" />
                  <div className="skeleton-text-sm w-36" />
                </div>
              </div>
              <div className="skeleton h-2.5 w-full rounded-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (savingsGoals.length === 0) {
    return (
      <div className="glass-card p-6">
        <h2 className="text-xs font-semibold text-emerald-300/50 uppercase tracking-wider mb-2">
          Birikim Hedefleri
        </h2>
        <EmptyState
          icon={PiggyBank}
          title="Henüz hedef yok"
          description="Parafin'e bir birikim hedefi söyle, sana yardımcı olsun."
          iconColor="text-emerald-400"
        />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="glass-card p-6"
      role="region"
      aria-label="Birikim hedefleri"
    >
      <h2 className="text-xs font-semibold text-emerald-300/50 uppercase tracking-wider mb-4">
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
            <div
              key={goal.id}
              className="group p-3 -mx-1 rounded-2xl hover:bg-emerald-500/[0.03] transition-colors cursor-default"
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center"
                  style={{ backgroundColor: `${goal.color}15` }}
                >
                  <Icon className="w-5 h-5" style={{ color: goal.color }} aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">{goal.name}</span>
                    <span className="text-sm font-extrabold tabular-nums" style={{ color: goal.color }}>
                      {percentage}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-xs text-emerald-300/30">
                      ₺{balance.toLocaleString("tr-TR", { minimumFractionDigits: 0 })}
                      <span className="text-emerald-300/20"> / ₺{target.toLocaleString("tr-TR", { minimumFractionDigits: 0 })}</span>
                    </span>
                    <span className="text-[11px] text-emerald-300/30">
                      ₺{remaining.toLocaleString("tr-TR", { minimumFractionDigits: 0 })} kaldı
                    </span>
                  </div>
                </div>
              </div>

              <div
                className="w-full bg-emerald-500/[0.06] rounded-full h-2.5 overflow-hidden"
                role="progressbar"
                aria-valuenow={percentage}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${goal.name}: %${percentage} tamamlandı`}
              >
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
                  className="h-2.5 rounded-full relative"
                  style={{ backgroundColor: goal.color }}
                >
                  <div
                    className="absolute inset-0 rounded-full opacity-40"
                    style={{ background: `linear-gradient(90deg, transparent, ${goal.color})` }}
                  />
                </motion.div>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
