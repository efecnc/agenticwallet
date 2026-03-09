"use client";

import { useAppStore } from "@/store/app-store";
import { motion } from "framer-motion";
import { Trophy, Flame, Target } from "lucide-react";

export default function SavingsStreaks() {
  const transactions = useAppStore((s) => s.transactions);
  const insights = useAppStore((s) => s.insights);

  // Calculate savings streak from transactions
  // A "savings day" = day where income > expenses or no expenses at all
  const now = new Date();
  const dayTotals: Record<string, { incomeCents: number; expenseCents: number }> = {};

  for (const tx of transactions) {
    const dayKey = tx.occurred_at.split("T")[0];
    if (!dayTotals[dayKey]) dayTotals[dayKey] = { incomeCents: 0, expenseCents: 0 };
    const cents = Math.round(Number(tx.amount) * 100);
    if (tx.type === "income") {
      dayTotals[dayKey].incomeCents += cents;
    } else if (tx.type === "expense") {
      dayTotals[dayKey].expenseCents += cents;
    }
  }

  // Count consecutive days from today backward where expenses < daily average
  // (more meaningful than just income > expense since income is monthly)
  const totalExpenseCents = Object.values(dayTotals).reduce((s, d) => s + d.expenseCents, 0);
  const uniqueDays = Object.keys(dayTotals).length || 1;
  const dailyAvgCents = Math.round(totalExpenseCents / uniqueDays);

  let currentStreak = 0;
  for (let i = 0; i < 30; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    const dayData = dayTotals[key];

    if (!dayData) {
      // No transactions = no spending = streak continues
      currentStreak++;
      continue;
    }

    if (dayData.expenseCents <= dailyAvgCents) {
      currentStreak++;
    } else {
      break;
    }
  }

  // Active challenges from insights
  const challenges = insights.filter(
    (i) => i.category === "challenge" && !i.is_dismissed
  );

  // Milestones
  const milestones = [
    { threshold: 3, label: "3 gün!", icon: "🔥" },
    { threshold: 7, label: "1 hafta!", icon: "⭐" },
    { threshold: 14, label: "2 hafta!", icon: "💪" },
    { threshold: 30, label: "1 ay!", icon: "🏆" },
  ];

  const currentMilestone = milestones.filter((m) => currentStreak >= m.threshold).pop();

  // Don't show if no streak and no challenges
  if (currentStreak < 2 && challenges.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="glass-card p-6"
    >
      <div className="flex items-center gap-2 mb-3">
        <Trophy className="w-4 h-4 text-amber-400" />
        <h2 className="text-xs font-semibold text-emerald-300/50 uppercase tracking-wider">
          Tasarruf Serisi
        </h2>
      </div>

      {/* Current streak */}
      {currentStreak >= 2 && (
        <div className="flex items-center gap-3 mb-4 px-3 py-3 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/10">
          <Flame className="w-6 h-6 text-amber-400" />
          <div>
            <div className="flex items-center gap-2">
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="text-xl font-bold text-amber-400 tabular-nums"
              >
                {currentStreak}
              </motion.span>
              <span className="text-sm text-slate-400">gün üst üste tasarruf!</span>
            </div>
            {currentMilestone && (
              <div className="text-xs text-amber-500/80 mt-0.5">
                {currentMilestone.icon} {currentMilestone.label} hedefine ulaştın!
              </div>
            )}
          </div>
        </div>
      )}

      {/* Active challenges */}
      {challenges.length > 0 && (
        <div className="space-y-2">
          <div className="text-[10px] text-slate-600 uppercase font-semibold">Aktif Meydan Okumalar</div>
          {challenges.map((challenge) => {
            const meta = challenge.metadata as {
              duration_days?: number;
              start_date?: string;
              end_date?: string;
              status?: string;
            } | undefined;

            const endDate = meta?.end_date ? new Date(meta.end_date) : null;
            const daysLeft = endDate
              ? Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
              : null;

            const totalDays = meta?.duration_days || 7;
            const elapsed = totalDays - (daysLeft || 0);
            const progressPct = Math.min(100, Math.round((elapsed / totalDays) * 100));

            return (
              <div
                key={challenge.id}
                className="px-3 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <Target className="w-3.5 h-3.5 text-brand-teal" />
                  <span className="text-sm font-medium">{challenge.title.replace(/^🎯\s*/, "")}</span>
                </div>
                <div className="text-[11px] text-slate-500 mb-2">{challenge.body}</div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPct}%` }}
                      transition={{ duration: 0.8 }}
                      className="h-full rounded-full bg-brand-teal"
                    />
                  </div>
                  {daysLeft !== null && (
                    <span className="text-[10px] text-slate-500 tabular-nums">
                      {daysLeft} gün kaldı
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
