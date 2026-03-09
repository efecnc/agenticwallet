"use client";

import { useAppStore } from "@/store/app-store";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";

export default function HealthScore() {
  const transactions = useAppStore((s) => s.transactions);
  const wallets = useAppStore((s) => s.wallets);

  // Calculate health score deterministically (0-100)
  const mainWallet = wallets.find((w) => w.type === "main");
  const savingsGoals = wallets.filter((w) => w.type === "savings_goal");

  if (!mainWallet || transactions.length === 0) {
    return (
      <div className="glass-card p-6 animate-pulse">
        <div className="h-4 w-24 bg-white/10 rounded mb-4" />
        <div className="h-20 w-20 bg-white/10 rounded-full mx-auto" />
      </div>
    );
  }

  // Scoring factors (all deterministic, integer math)
  let score = 50;

  // 1. Savings ratio: savings / (savings + main balance)
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

  // 2. Savings goal progress
  for (const goal of savingsGoals) {
    const progress = Number(goal.balance) / (Number(goal.target_amount) || 1);
    if (progress >= 0.5) score += 5;
    else if (progress >= 0.25) score += 2;
  }

  // 3. Income vs expense ratio (from loaded transactions)
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

  // Clamp 0-100
  score = Math.max(0, Math.min(100, score));

  const getGrade = (s: number) => {
    if (s >= 85) return { grade: "A", color: "#10b981", label: "Mükemmel" };
    if (s >= 70) return { grade: "B", color: "#22d3ee", label: "İyi" };
    if (s >= 55) return { grade: "C", color: "#f59e0b", label: "Orta" };
    if (s >= 40) return { grade: "D", color: "#f97316", label: "Dikkat" };
    return { grade: "F", color: "#ef4444", label: "Kritik" };
  };

  const { grade, color, label } = getGrade(score);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="glass-card p-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <Heart className="w-4 h-4 text-rose-400" />
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
          Finansal Sağlık
        </h2>
      </div>

      <div className="flex flex-col items-center">
        <div className="relative w-24 h-24">
          {/* Background circle */}
          <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="rgba(255,255,255,0.05)"
              strokeWidth="8"
            />
            <motion.circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke={color}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 42}`}
              initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
              animate={{
                strokeDashoffset: 2 * Math.PI * 42 * (1 - score / 100),
              }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold" style={{ color }}>
              {grade}
            </span>
          </div>
        </div>

        <div className="mt-3 text-center">
          <span className="text-sm font-medium" style={{ color }}>
            {label}
          </span>
          <span className="text-xs text-slate-500 ml-1">({score}/100)</span>
        </div>
      </div>
    </motion.div>
  );
}
