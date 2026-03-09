"use client";

import { useAppStore } from "@/store/app-store";
import { AlertTriangle, TrendingUp, Info, CheckCircle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { InsightSeverity } from "@/types/database";

const severityConfig: Record<
  InsightSeverity,
  { icon: React.ElementType; borderColor: string; iconColor: string }
> = {
  info: { icon: Info, borderColor: "border-l-blue-500", iconColor: "text-blue-400" },
  positive: { icon: CheckCircle, borderColor: "border-l-emerald-500", iconColor: "text-emerald-400" },
  warning: { icon: AlertTriangle, borderColor: "border-l-amber-500", iconColor: "text-amber-400" },
  alert: { icon: AlertTriangle, borderColor: "border-l-red-500", iconColor: "text-red-400" },
};

export default function ProactiveAlerts() {
  const insights = useAppStore((s) => s.insights);
  const dismissInsight = useAppStore((s) => s.dismissInsight);

  if (insights.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="glass-card p-6"
    >
      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
        Yapay Zeka Önerileri
      </h2>

      <div className="space-y-3">
        <AnimatePresence>
          {insights.map((insight) => {
            const config = severityConfig[insight.severity] || severityConfig.info;
            const Icon = config.icon;

            return (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20, height: 0 }}
                className={`bg-white/5 rounded-lg p-4 border-l-4 ${config.borderColor} relative group`}
              >
                <button
                  onClick={() => dismissInsight(insight.id)}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 hover:text-slate-300"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="flex items-start gap-3">
                  <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${config.iconColor}`} />
                  <div>
                    <div className="font-medium text-sm">{insight.title}</div>
                    <div className="text-sm text-slate-400 mt-1">{insight.body}</div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
