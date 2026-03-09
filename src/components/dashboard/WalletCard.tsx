"use client";

import { useAppStore } from "@/store/app-store";
import { Eye, EyeOff, TrendingUp, ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useMemo } from "react";

export default function WalletCard() {
  const wallets = useAppStore((s) => s.wallets);
  const transactions = useAppStore((s) => s.transactions);
  const safeToSpend = useAppStore((s) => s.safeToSpend);
  const mainWallet = wallets.find((w) => w.type === "main");
  const [hidden, setHidden] = useState(false);
  const [period, setPeriod] = useState<"daily" | "weekly">("daily");

  // Calculate daily growth from transactions
  const growth = useMemo(() => {
    if (transactions.length === 0) return { percent: 0, amount: 0 };
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const yesterdayDate = new Date(now);
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = yesterdayDate.toISOString().split("T")[0];

    let todayInCents = 0;
    let todayOutCents = 0;
    let yesterdayInCents = 0;
    let yesterdayOutCents = 0;

    for (const tx of transactions) {
      const day = tx.occurred_at.split("T")[0];
      const cents = Math.round(Number(tx.amount) * 100);
      if (day === todayStr) {
        if (tx.type === "income") todayInCents += cents;
        else if (tx.type === "expense") todayOutCents += cents;
      } else if (day === yesterdayStr) {
        if (tx.type === "income") yesterdayInCents += cents;
        else if (tx.type === "expense") yesterdayOutCents += cents;
      }
    }

    const todayNet = todayInCents - todayOutCents;
    const yesterdayNet = yesterdayInCents - yesterdayOutCents;
    const diff = todayNet - yesterdayNet;
    const base = Math.abs(yesterdayNet) || 1;
    const pct = Math.round((diff / base) * 100) / 10;

    return { percent: pct, amount: diff / 100 };
  }, [transactions]);

  // Mini sparkline data from last 7 days
  const sparklineData = useMemo(() => {
    const days: number[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayStr = d.toISOString().split("T")[0];
      let netCents = 0;
      for (const tx of transactions) {
        if (tx.occurred_at.split("T")[0] === dayStr) {
          const cents = Math.round(Number(tx.amount) * 100);
          if (tx.type === "income") netCents += cents;
          else if (tx.type === "expense") netCents -= cents;
        }
      }
      days.push(netCents / 100);
    }
    return days;
  }, [transactions]);

  if (!mainWallet) {
    return (
      <div className="hero-card p-6" role="status" aria-label="Bakiye yükleniyor">
        <div className="skeleton-text w-20 mb-3" />
        <div className="skeleton h-10 w-48 rounded-xl mb-4" />
        <div className="flex gap-3">
          <div className="skeleton h-8 w-24 rounded-xl" />
          <div className="skeleton h-8 w-24 rounded-xl" />
        </div>
      </div>
    );
  }

  const balance = Number(mainWallet.balance);

  // Sparkline SVG
  const sparklineMax = Math.max(...sparklineData.map(Math.abs), 1);
  const sparklinePoints = sparklineData
    .map((val, i) => {
      const x = (i / 6) * 120;
      const y = 30 - (val / sparklineMax) * 25;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="hero-card p-6 relative overflow-hidden"
      role="region"
      aria-label="Ana hesap bakiyesi"
    >
      {/* Background glow */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/[0.08] rounded-full blur-3xl" />
      <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-emerald-500/[0.05] rounded-full blur-2xl" />

      <div className="relative z-10">
        {/* Header row */}
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-emerald-300/60 font-medium">Bakiye</span>
          <button
            onClick={() => setHidden(!hidden)}
            className="p-1.5 -mr-1 text-emerald-300/40 hover:text-emerald-300 transition-colors rounded-xl focus-ring"
            aria-label={hidden ? "Bakiyeyi göster" : "Bakiyeyi gizle"}
          >
            {hidden ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
          </button>
        </div>

        {/* Balance */}
        {hidden ? (
          <div className="flex items-baseline gap-1 mb-3" aria-label="Bakiye gizli">
            <span className="text-4xl font-extrabold text-emerald-100/40">₺</span>
            <span className="text-4xl font-extrabold text-emerald-100/20 tracking-[0.15em]">•••••</span>
          </div>
        ) : (
          <div className="flex items-baseline gap-3 mb-3">
            <div
              className="text-4xl font-extrabold tracking-tight text-white"
              aria-label={`Bakiye: ${balance.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} Türk Lirası`}
            >
              {(balance / 1000).toFixed(2).replace(".", ",")}
              <span className="text-2xl text-emerald-300/60 ml-0.5">k</span>
            </div>

            {/* Mini sparkline */}
            <div className="flex-1 flex justify-end">
              <svg width="120" height="40" viewBox="0 0 120 40" className="opacity-60">
                <defs>
                  <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <polygon
                  points={`0,40 ${sparklinePoints} 120,40`}
                  fill="url(#sparkGrad)"
                />
                <motion.polyline
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  points={sparklinePoints}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        )}

        {/* Growth & Period toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Daily growth */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-emerald-300/50">Günlük büyüme</span>
              <div className="flex items-center gap-0.5">
                <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-sm font-bold text-emerald-400 tabular-nums">
                  %{Math.abs(growth.percent).toFixed(1)}
                </span>
              </div>
            </div>
          </div>

          {/* Period toggle */}
          <div className="flex bg-white/[0.06] rounded-xl p-0.5">
            <button
              onClick={() => setPeriod("daily")}
              className={`px-3 py-1 rounded-lg text-[10px] font-semibold transition-all ${
                period === "daily"
                  ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/30"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              Günlük
            </button>
            <button
              onClick={() => setPeriod("weekly")}
              className={`px-3 py-1 rounded-lg text-[10px] font-semibold transition-all ${
                period === "weekly"
                  ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/30"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              Haftalık
            </button>
          </div>
        </div>

        {/* Safe to spend row */}
        {safeToSpend && !hidden && (
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-emerald-500/[0.08]">
            <div>
              <span className="text-[10px] text-emerald-300/40 block uppercase tracking-wider">Bugün</span>
              <span className="text-lg font-bold text-white tabular-nums">
                {(safeToSpend.daily_budget / 1000).toFixed(1).replace(".", ",")}
                <span className="text-sm text-emerald-300/50 ml-0.5">k</span>
              </span>
            </div>
            <div className="w-px h-8 bg-emerald-500/[0.1]" />
            <div>
              <span className="text-[10px] text-emerald-300/40 block uppercase tracking-wider">Harcayabilirsin</span>
              <span className="text-lg font-bold text-emerald-400 tabular-nums">
                {(safeToSpend.safe_to_spend / 1000).toFixed(1).replace(".", ",")}
                <span className="text-sm text-emerald-300/50 ml-0.5">k</span>
              </span>
            </div>
            <div className="w-px h-8 bg-emerald-500/[0.1]" />
            <div>
              <span className="text-[10px] text-emerald-300/40 block uppercase tracking-wider">Maaşa</span>
              <span className="text-lg font-bold text-white tabular-nums">
                {safeToSpend.days_until_payday}
                <span className="text-sm text-emerald-300/50 ml-0.5"> gün</span>
              </span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
