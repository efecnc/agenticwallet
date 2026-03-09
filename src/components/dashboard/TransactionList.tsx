"use client";

import { useAppStore } from "@/store/app-store";
import Badge from "@/components/ui/Badge";
import { motion } from "framer-motion";
import { format, isToday, isYesterday, parseISO } from "date-fns";

function formatDateGroup(dateStr: string): string {
  const date = parseISO(dateStr);
  if (isToday(date)) return "Bugün";
  if (isYesterday(date)) return "Dün";
  return format(date, "d MMM yyyy");
}

export default function TransactionList() {
  const transactions = useAppStore((s) => s.transactions);

  if (transactions.length === 0) {
    return (
      <div className="glass-card p-6">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
          Son İşlemler
        </h2>
        <p className="text-slate-500 text-sm">Henüz işlem yok. Önce veritabanını doldurun.</p>
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
    >
      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
        Son İşlemler
      </h2>

      <div className="space-y-4 max-h-[400px] overflow-y-auto scrollbar-thin pr-1">
        {Object.entries(grouped).map(([dateKey, txns]) => (
          <div key={dateKey}>
            <div className="text-xs text-slate-500 font-medium mb-2">
              {formatDateGroup(txns[0].occurred_at)}
            </div>

            <div className="space-y-1">
              {txns.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-sm font-bold text-slate-300">
                      {(tx.merchant || tx.category)[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-medium">
                        {tx.merchant || tx.category}
                      </div>
                      <Badge label={tx.category} />
                    </div>
                  </div>

                  <div
                    className={`text-sm font-semibold tabular-nums ${
                      tx.type === "income" ? "text-emerald-400" : "text-slate-300"
                    }`}
                  >
                    {tx.type === "income" ? "+" : "-"}₺
                    {Number(tx.amount).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
