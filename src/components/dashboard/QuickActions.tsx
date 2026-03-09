"use client";

import { useAppStore } from "@/store/app-store";
import {
  PiggyBank,
  Search,
  BarChart3,
  Flame,
  Sparkles,
  Heart,
} from "lucide-react";
import { motion } from "framer-motion";

const actions = [
  {
    label: "Harcama Sor",
    icon: Search,
    message: "Bu ay toplam ne kadar harcadım?",
    bg: "bg-blue-500/10 hover:bg-blue-500/20",
    text: "text-blue-300",
  },
  {
    label: "Biriktir",
    icon: PiggyBank,
    message: "Tatil için biraz para biriktirmek istiyorum, önerir misin?",
    bg: "bg-emerald-500/10 hover:bg-emerald-500/20",
    text: "text-emerald-300",
  },
  {
    label: "Analiz",
    icon: BarChart3,
    message: "Harcamalarımı analiz et, nerede tasarruf edebilirim?",
    bg: "bg-violet-500/10 hover:bg-violet-500/20",
    text: "text-violet-300",
  },
  {
    label: "Roast Me",
    icon: Flame,
    message: "[ROAST_MODE] Roast my spending habits",
    bg: "bg-orange-500/10 hover:bg-orange-500/20",
    text: "text-orange-300",
  },
  {
    label: "Motive Et",
    icon: Sparkles,
    message: "[MOTIVATION_MODE] Motivate me about my finances",
    bg: "bg-amber-500/10 hover:bg-amber-500/20",
    text: "text-amber-300",
  },
  {
    label: "Abi Modu",
    icon: Heart,
    message: "[ABI_MODE] Abi/Abla, finansal durumum nasıl?",
    bg: "bg-violet-500/10 hover:bg-violet-500/20",
    text: "text-violet-300",
  },
];

export default function QuickActions() {
  const sendMessage = useAppStore((s) => s.sendMessage);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 }}
      role="toolbar"
      aria-label="Hızlı eylemler"
    >
      <div className="flex gap-2 overflow-x-auto scrollbar-hidden pb-1">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.label}
              onClick={() => sendMessage(action.message)}
              className={`flex items-center gap-2 px-4 py-2.5 ${action.bg} rounded-xl ${action.text} text-xs font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap flex-shrink-0 border border-white/[0.04] focus-ring`}
              aria-label={action.label}
            >
              <Icon className="w-3.5 h-3.5" aria-hidden="true" />
              {action.label}
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}
