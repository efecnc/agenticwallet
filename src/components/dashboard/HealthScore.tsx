"use client";

import { useAppStore } from "@/store/app-store";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";

export default function HealthScore() {
  const transactions = useAppStore((s) => s.transactions);
  const wallets = useAppStore((s) => s.wallets);
  const isInitialized = useAppStore((s) => s.isInitialized);

  const mainWallet = wallets.find((w) => w.type === "main");
  const savingsGoals = wallets.filter((w) => w.type === "savings_goal");

  if (!isInitialized || !mainWallet || transactions.length === 0) {
    return (
      <div className="glass-card p-5" role="status" aria-label="Finansal sağlık puanı yükleniyor">
        <div className="skeleton-text w-16 h-2.5 mb-3" />
        <div className="flex flex-col items-center">
          <div className="skeleton-circle w-20 h-20" />
          <div className="skeleton h-5 w-14 rounded-full mt-2" />
        </div>
      </div>
    );
  }

  // Scoring (deterministic, integer math)
  let score = 50;

  const totalSavingsCents = savingsGoals.reduce(
    (sum, w) => sum + Math.round(Number(w.balance) * 100),
    0
  );
  const mainBalanceCents = Math.round(Number(mainWallet.balance) * 100);
  const totalCents = totalSavingsCents + mainBalanceCents;
  if (totalCents > 0) {
    const savingsRatio = totalSavingsCents / totalCents;
    if (savingsRatio >= 0.2) score += 15;
    else if (savingsRatio >= 0.1) score += 8;
    else score -= 5;
  }

  for (const goal of savingsGoals) {
    const progress = Number(goal.balance) / (Number(goal.target_amount) || 1);
    if (progress >= 0.5) score += 5;
    else if (progress >= 0.25) score += 2;
  }

  const incomeCents = transactions
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + Math.round(Number(t.amount) * 100), 0);
  const expenseCents = transactions
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + Math.round(Number(t.amount) * 100), 0);

  if (incomeCents > 0 && expenseCents > 0) {
    const ratio = expenseCents / incomeCents;
    if (ratio < 0.6) score += 15;
    else if (ratio < 0.8) score += 8;
    else if (ratio > 1) score -= 10;
  }

  score = Math.max(0, Math.min(100, score));

  const getGrade = (s: number) => {
    if (s >= 85) return { grade: "A", color: "#10b981", label: "Mükemmel" };
    if (s >= 70) return { grade: "B", color: "#34d399", label: "İyi" };
    if (s >= 55) return { grade: "C", color: "#f59e0b", label: "Orta" };
    if (s >= 40) return { grade: "D", color: "#f97316", label: "Dikkat" };
    return { grade: "F", color: "#ef4444", label: "Kritik" };
  };

  const { grade, color, label } = getGrade(score);
  const circumference = 2 * Math.PI * 36;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="glass-card p-5"
      role="region"
      aria-label={`Finansal sağlık puanı: ${grade}, ${score}/100`}
    >
      <div className="flex items-center gap-1.5 mb-2">
        <Heart className="w-3 h-3 text-emerald-300/40" aria-hidden="true" />
        <span className="text-[10px] text-emerald-300/40 font-semibold uppercase tracking-wider">sağlık</span>
      </div>

      <div className="flex flex-col items-center">
        <div className="relative w-20 h-20">
          <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80" aria-hidden="true">
            <circle
              cx="40" cy="40" r="36"
              fill="none"
              stroke="rgba(16, 185, 129, 0.06)"
              strokeWidth="5"
            />
            <motion.circle
              cx="40" cy="40" r="36"
              fill="none"
              stroke={color}
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={`${circumference}`}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: circumference * (1 - score / 100) }}
              transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
              style={{ filter: `drop-shadow(0 0 8px ${color}40)` }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: "spring" }}
              className="text-2xl font-extrabold"
              style={{ color }}
            >
              {grade}
            </motion.span>
          </div>
        </div>

        <div className="mt-1.5 px-2.5 py-0.5 rounded-full" style={{ backgroundColor: `${color}15` }}>
          <span className="text-[10px] font-bold" style={{ color }}>
            {label} · {score}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
