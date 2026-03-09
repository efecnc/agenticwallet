"use client";

import { useAppStore } from "@/store/app-store";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import { motion } from "framer-motion";
import { format, isToday, isYesterday, parseISO } from "date-fns";
import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight, Receipt } from "lucide-react";

function formatDateGroup(dateStr: string): string {
  const date = parseISO(dateStr);
  if (isToday(date)) return "Bugün";
  if (isYesterday(date)) return "Dün";
  return format(date, "d MMM yyyy");
}

const merchantColors: Record<string, string> = {
  M: "from-green-500 to-emerald-600",
  A: "from-red-500 to-rose-600",
  B: "from-yellow-500 to-amber-600",
  C: "from-blue-500 to-indigo-600",
  S: "from-emerald-500 to-teal-600",
  K: "from-amber-500 to-orange-600",
  N: "from-red-600 to-red-700",
  Y: "from-orange-500 to-red-500",
  G: "from-purple-500 to-violet-600",
  T: "from-cyan-500 to-blue-600",
  U: "from-sky-500 to-blue-600",
  I: "from-indigo-500 to-purple-600",
  İ: "from-teal-500 to-cyan-600",
  L: "from-pink-500 to-rose-600",
  H: "from-violet-500 to-purple-600",
  E: "from-slate-500 to-zinc-600",
  V: "from-fuchsia-500 to-pink-600",
  R: "from-lime-500 to-green-600",
  D: "from-stone-500 to-stone-600",
};

export default function TransactionList() {
  const transactions = useAppStore((s) => s.transactions);
  const isInitialized = useAppStore((s) => s.isInitialized);

  if (!isInitialized) {
    return (
      <div className="glass-card p-6" role="status" aria-label="İşlemler yükleniyor">
        <div className="skeleton-text w-24 h-3.5 mb-4" />
        <div className="space-y-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3 py-2.5 px-2">
              <div className="skeleton-circle w-10 h-10 flex-shrink-0 rounded-xl" />
              <div className="flex-1 space-y-1.5">
                <div className="skeleton-text w-28" />
                <div className="skeleton-text-sm w-16" />
              </div>
              <div className="skeleton-text w-20" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="glass-card p-6">
        <h2 className="text-xs font-semibold text-emerald-300/50 uppercase tracking-wider mb-2">
          Son İşlemler
        </h2>
        <EmptyState
          icon={Receipt}
          title="Henüz işlem yok"
          description="İşlemler burada otomatik olarak görünecek."
          iconColor="text-blue-400"
        />
      </div>
    );
  }

  // Group by date
  const grouped: Record<string, typeof transactions> = {};
  for (const tx of transactions) {
    const dateKey = tx.occurred_at.split("T")[0];
    if (!grouped[dateKey]) grouped[dateKey] = [];
    grouped[dateKey].push(tx);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="glass-card p-6"
      role="region"
      aria-label="Son işlemler listesi"
    >
      <h2 className="text-xs font-semibold text-emerald-300/50 uppercase tracking-wider mb-4">
        Son İşlemler
      </h2>

      <div className="space-y-5 max-h-[420px] overflow-y-auto scrollbar-thin pr-1">
        {Object.entries(grouped).map(([dateKey, txns]) => (
          <div key={dateKey}>
            <div className="text-[11px] text-slate-600 font-semibold uppercase tracking-wider mb-2 px-1">
              {formatDateGroup(txns[0].occurred_at)}
            </div>

            <div className="space-y-0.5">
              {txns.map((tx) => {
                const letter = (tx.merchant || tx.category)[0].toUpperCase();
                const gradient = merchantColors[letter] || "from-slate-500 to-slate-600";

                return (
                  <div
                    key={tx.id}
                    className="flex items-center gap-3 py-2.5 px-2 rounded-xl hover:bg-white/[0.03] transition-colors group"
                  >
                    {/* Merchant avatar */}
                    <div
                      className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-xs font-bold text-white shadow-sm flex-shrink-0`}
                      aria-hidden="true"
                    >
                      {letter}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {tx.merchant || tx.category}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Badge label={tx.category} />
                        {tx.subcategory && (
                          <span className="text-[10px] text-slate-600">{tx.subcategory}</span>
                        )}
                      </div>
                    </div>

                    {/* Amount */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {tx.type === "income" ? (
                        <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                      ) : tx.type === "transfer" ? (
                        <ArrowLeftRight className="w-3.5 h-3.5 text-blue-400" aria-hidden="true" />
                      ) : (
                        <ArrowUpRight className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
                      )}
                      <span
                        className={`text-sm font-semibold tabular-nums ${
                          tx.type === "income"
                            ? "text-emerald-400"
                            : "text-slate-300"
                        }`}
                        aria-label={`${tx.type === "income" ? "Gelir" : "Harcama"}: ${Number(tx.amount).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} TL`}
                      >
                        {tx.type === "income" ? "+" : "-"}₺
                        {Number(tx.amount).toLocaleString("tr-TR", {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
