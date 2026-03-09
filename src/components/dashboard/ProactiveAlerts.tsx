"use client";

import { useAppStore } from "@/store/app-store";
import { AlertTriangle, TrendingUp, Info, CheckCircle, X, Sparkles, Lightbulb } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { InsightSeverity } from "@/types/database";
import EmptyState from "@/components/ui/EmptyState";

const severityConfig: Record<
  InsightSeverity,
  { icon: React.ElementType; bg: string; border: string; iconColor: string }
> = {
  info: {
    icon: Info,
    bg: "bg-blue-500/[0.06]",
    border: "border-l-blue-400",
    iconColor: "text-blue-400",
  },
  positive: {
    icon: CheckCircle,
    bg: "bg-emerald-500/[0.06]",
    border: "border-l-emerald-400",
    iconColor: "text-emerald-400",
  },
  warning: {
    icon: AlertTriangle,
    bg: "bg-amber-500/[0.06]",
    border: "border-l-amber-400",
    iconColor: "text-amber-400",
  },
  alert: {
    icon: AlertTriangle,
    bg: "bg-red-500/[0.06]",
    border: "border-l-red-400",
    iconColor: "text-red-400",
  },
};

export default function ProactiveAlerts() {
  const insights = useAppStore((s) => s.insights);
  const dismissInsight = useAppStore((s) => s.dismissInsight);
  const isInitialized = useAppStore((s) => s.isInitialized);

  if (!isInitialized) {
    return (
      <div className="glass-card p-6" role="status" aria-label="AI önerileri yükleniyor">
        <div className="flex items-center gap-2 mb-4">
          <div className="skeleton-circle w-4 h-4" />
          <div className="skeleton-text w-20 h-3" />
        </div>
        <div className="space-y-2.5">
          {[1, 2].map((i) => (
            <div key={i} className="rounded-2xl p-4 bg-emerald-500/[0.03] border-l-[3px] border-l-emerald-800/20">
              <div className="flex items-start gap-3">
                <div className="skeleton-circle w-8 h-8 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton-text w-32" />
                  <div className="skeleton-text-sm w-full" />
                  <div className="skeleton-text-sm w-3/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (insights.length === 0) {
    return (
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-emerald-400" aria-hidden="true" />
          <h2 className="text-xs font-semibold text-emerald-300/50 uppercase tracking-wider">
            AI Önerileri
          </h2>
        </div>
        <EmptyState
          icon={Lightbulb}
          title="Şu an öneri yok"
          description="Verilerini analiz ediyoruz. Kısa süre sonra öneriler burada görünecek."
          iconColor="text-amber-400"
        />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="glass-card p-6"
      role="region"
      aria-label="AI finansal önerileri"
    >
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-4 h-4 text-emerald-400" aria-hidden="true" />
        <h2 className="text-xs font-semibold text-emerald-300/50 uppercase tracking-wider">
          AI Önerileri
        </h2>
      </div>

      <div className="space-y-2.5">
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
                className={`${config.bg} rounded-2xl p-4 border-l-[3px] ${config.border} relative group`}
                role="alert"
              >
                <button
                  onClick={() => dismissInsight(insight.id)}
                  className="absolute top-3 right-3 w-6 h-6 rounded-xl bg-white/[0.06] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-white/[0.12] focus-ring focus:opacity-100"
                  aria-label={`"${insight.title}" bildirimini kapat`}
                >
                  <X className="w-3 h-3 text-slate-400" aria-hidden="true" />
                </button>

                <div className="flex items-start gap-3 pr-6">
                  <div className="w-8 h-8 rounded-xl bg-white/[0.06] flex items-center justify-center flex-shrink-0">
                    <Icon className={`w-4 h-4 ${config.iconColor}`} aria-hidden="true" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm mb-0.5">{insight.title}</div>
                    <div className="text-[13px] text-slate-400 leading-relaxed">{insight.body}</div>
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
