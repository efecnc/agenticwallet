"use client";

import { useState, useEffect } from "react";
import { useAppStore } from "@/store/app-store";
import { motion } from "framer-motion";
import { Target, Plus, X } from "lucide-react";

interface Budget {
  category: string;
  limit: number; // in TRY
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

  // Load from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setBudgets(JSON.parse(stored));
      } catch { /* ignore */ }
    }
  }, []);

  // Save to localStorage
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

  // Calculate spent per category (this month, integer math)
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
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-amber-400" />
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
            Bütçe Takibi
          </h2>
        </div>
        {availableCategories.length > 0 && (
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="text-xs text-brand-teal hover:text-emerald-300 flex items-center gap-1 transition-colors"
          >
            <Plus className="w-3 h-3" />
            Ekle
          </button>
        )}
      </div>

      {/* Add budget form */}
      {showAdd && (
        <div className="flex gap-2 mb-4 p-3 bg-white/5 rounded-lg">
          <select
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            className="flex-1 bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
          >
            {availableCategories.map((c) => (
              <option key={c} value={c}>
                {categoryLabels[c] || c}
              </option>
            ))}
          </select>
          <input
            type="number"
            placeholder="Limit (₺)"
            value={newLimit}
            onChange={(e) => setNewLimit(e.target.value)}
            className="w-28 bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500"
          />
          <button
            onClick={addBudget}
            className="px-3 py-2 bg-brand-teal text-white rounded-lg text-sm font-medium hover:bg-emerald-400 transition-colors"
          >
            Kaydet
          </button>
        </div>
      )}

      {budgets.length === 0 ? (
        <p className="text-sm text-slate-500">
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
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium capitalize">
                      {categoryLabels[budget.category] || budget.category}
                    </span>
                    {isOver && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-red-500/20 text-red-400 rounded-full font-medium">
                        Aşıldı!
                      </span>
                    )}
                    {isNear && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/20 text-amber-400 rounded-full font-medium">
                        Dikkat
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 tabular-nums">
                      ₺{spent.toLocaleString("tr-TR", { minimumFractionDigits: 0 })} / ₺{budget.limit.toLocaleString("tr-TR", { minimumFractionDigits: 0 })}
                    </span>
                    <button
                      onClick={() => removeBudget(budget.category)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3 text-slate-500 hover:text-slate-300" />
                    </button>
                  </div>
                </div>

                <div className="w-full bg-white/5 rounded-full h-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className={`h-2 rounded-full ${
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
