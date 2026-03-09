"use client";

import { useState, useEffect } from "react";
import { useAppStore } from "@/store/app-store";
import { motion } from "framer-motion";
import { Target, Plus, X } from "lucide-react";

interface Budget {
  category: string;
  limit: number;
}

const STORAGE_KEY = "parafin_budgets";

const categoryLabels: Record<string, string> = {
  groceries: "Market",
  dining: "Yemek",
  coffee: "Kahve",
  transport: "Ulaşım",
  shopping: "Alışveriş",
  subscription: "Abonelik",
  utilities: "Faturalar",
  rent: "Kira",
};

export default function BudgetTracker() {
  const transactions = useAppStore((s) => s.transactions);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newCategory, setNewCategory] = useState("groceries");
  const [newLimit, setNewLimit] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setBudgets(JSON.parse(stored));
      } catch { /* ignore */ }
    }
  }, []);

  function saveBudgets(updated: Budget[]) {
    setBudgets(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }

  function addBudget() {
    const limit = parseFloat(newLimit);
    if (!limit || limit <= 0) return;
    if (budgets.some((b) => b.category === newCategory)) return;

    saveBudgets([...budgets, { category: newCategory, limit }]);
    setNewLimit("");
    setShowAdd(false);
  }

  function removeBudget(category: string) {
    saveBudgets(budgets.filter((b) => b.category !== category));
  }

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const spentByCategory: Record<string, number> = {};

  for (const tx of transactions) {
    if (tx.type !== "expense") continue;
    if (new Date(tx.occurred_at) < monthStart) continue;
    const cents = Math.round(Number(tx.amount) * 100);
    spentByCategory[tx.category] = (spentByCategory[tx.category] || 0) + cents;
  }

  const availableCategories = Object.keys(categoryLabels).filter(
    (c) => !budgets.some((b) => b.category === c)
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.45 }}
      className="glass-card p-6"
      role="region"
      aria-label="Bütçe takibi"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-amber-400" aria-hidden="true" />
          <h2 className="text-xs font-semibold text-emerald-300/50 uppercase tracking-wider">
            Bütçe Takibi
          </h2>
        </div>
        {availableCategories.length > 0 && (
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="w-7 h-7 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] flex items-center justify-center transition-colors focus-ring"
            aria-label={showAdd ? "Bütçe ekleme formunu kapat" : "Yeni bütçe ekle"}
          >
            <Plus className={`w-3.5 h-3.5 text-brand-teal transition-transform duration-200 ${showAdd ? "rotate-45" : ""}`} aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Add budget form */}
      {showAdd && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="flex gap-2 mb-4 p-3 bg-white/[0.04] rounded-xl border border-white/[0.06]"
          role="form"
          aria-label="Yeni bütçe ekle"
        >
          <label className="sr-only" htmlFor="budget-category">Kategori</label>
          <select
            id="budget-category"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            className="flex-1 bg-white/[0.08] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white appearance-none focus-ring"
          >
            {availableCategories.map((c) => (
              <option key={c} value={c}>
                {categoryLabels[c] || c}
              </option>
            ))}
          </select>
          <label className="sr-only" htmlFor="budget-limit">Bütçe limiti (₺)</label>
          <input
            id="budget-limit"
            type="number"
            placeholder="₺ Limit"
            value={newLimit}
            onChange={(e) => setNewLimit(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addBudget()}
            className="w-24 bg-white/[0.08] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus-ring"
          />
          <button
            onClick={addBudget}
            className="px-3 py-2 bg-brand-teal text-white rounded-lg text-xs font-semibold hover:bg-emerald-400 transition-colors focus-ring"
          >
            Ekle
          </button>
        </motion.div>
      )}

      {budgets.length === 0 ? (
        <p className="text-[13px] text-slate-600 leading-relaxed">
          Henüz bütçe belirlenmemiş. Harcamalarını kontrol altına almak için bir kategori ekle.
        </p>
      ) : (
        <div className="space-y-3">
          {budgets.map((budget) => {
            const spentCents = spentByCategory[budget.category] || 0;
            const spent = spentCents / 100;
            const limitCents = Math.round(budget.limit * 100);
            const percentage = Math.min(
              Math.round((spentCents / limitCents) * 100),
              100
            );
            const isOver = spentCents > limitCents;
            const isNear = percentage >= 80 && !isOver;

            return (
              <div key={budget.category} className="group">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {categoryLabels[budget.category] || budget.category}
                    </span>
                    {isOver && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-red-500/15 text-red-400 rounded-full font-semibold" role="alert">
                        Aşıldı!
                      </span>
                    )}
                    {isNear && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/15 text-amber-400 rounded-full font-semibold" role="alert">
                        Dikkat
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-500 tabular-nums font-medium">
                      ₺{spent.toLocaleString("tr-TR", { minimumFractionDigits: 0 })}
                      <span className="text-slate-600"> / ₺{budget.limit.toLocaleString("tr-TR", { minimumFractionDigits: 0 })}</span>
                    </span>
                    <button
                      onClick={() => removeBudget(budget.category)}
                      className="w-5 h-5 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity hover:bg-white/[0.08] focus-ring"
                      aria-label={`${categoryLabels[budget.category] || budget.category} bütçesini kaldır`}
                    >
                      <X className="w-3 h-3 text-slate-500" aria-hidden="true" />
                    </button>
                  </div>
                </div>

                <div
                  className="w-full bg-white/[0.04] rounded-full h-1.5 overflow-hidden"
                  role="progressbar"
                  aria-valuenow={Math.min(Math.round((spentCents / limitCents) * 100), 100)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${categoryLabels[budget.category]}: %${percentage} kullanıldı`}
                >
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className={`h-1.5 rounded-full ${
                      isOver
                        ? "bg-red-500"
                        : isNear
                        ? "bg-amber-500"
                        : "bg-brand-teal"
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
