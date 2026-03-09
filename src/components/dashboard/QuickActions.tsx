"use client";

import { useAppStore } from "@/store/app-store";
import {
  PiggyBank,
  Search,
  BarChart3,
  Flame,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";

const actions = [
  {
    label: "Harcama Sor",
    icon: Search,
    message: "Bu ay toplam ne kadar harcadım?",
    color: "from-blue-500/20 to-cyan-500/20",
    border: "border-blue-500/20",
    textColor: "text-blue-300",
  },
  {
    label: "Biriktir",
    icon: PiggyBank,
    message: "Tatil için biraz para biriktirmek istiyorum, önerir misin?",
    color: "from-emerald-500/20 to-teal-500/20",
    border: "border-emerald-500/20",
    textColor: "text-emerald-300",
  },
  {
    label: "Analiz",
    icon: BarChart3,
    message: "Harcamalarımı analiz et, nerede tasarruf edebilirim?",
    color: "from-violet-500/20 to-purple-500/20",
    border: "border-violet-500/20",
    textColor: "text-violet-300",
  },
  {
    label: "Roast Me",
    icon: Flame,
    message: "[ROAST_MODE] Roast my spending habits",
    color: "from-orange-500/20 to-red-500/20",
    border: "border-orange-500/20",
    textColor: "text-orange-300",
  },
  {
    label: "Motive Et",
    icon: Sparkles,
    message: "[MOTIVATION_MODE] Motivate me about my finances",
    color: "from-emerald-500/20 to-teal-500/20",
    border: "border-emerald-500/20",
    textColor: "text-emerald-300",
  },
];

export default function QuickActions() {
  const sendMessage = useAppStore((s) => s.sendMessage);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 }}
    >
      <div className="flex gap-2 overflow-x-auto scrollbar-thin pb-1">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.label}
              onClick={() => sendMessage(action.message)}
              className={`flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r ${action.color} border ${action.border} rounded-xl ${action.textColor} text-sm font-medium transition-all hover:scale-105 whitespace-nowrap flex-shrink-0`}
            >
              <Icon className="w-4 h-4" />
              {action.label}
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}
