"use client";

import { motion } from "framer-motion";
import { Bot } from "lucide-react";

export default function ToolCallIndicator({ label }: { label: string | null }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-2.5 py-1.5"
      role="status"
      aria-label={label || "Düşünüyor"}
    >
      {/* Avatar */}
      <div className="w-7 h-7 rounded-lg bg-white/[0.06] border border-white/[0.08] flex items-center justify-center flex-shrink-0 mt-1" aria-hidden="true">
        <Bot className="w-3.5 h-3.5 text-slate-400" />
      </div>

      {/* Typing bubble */}
      <div className="bg-white/[0.05] border border-white/[0.06] rounded-2xl rounded-tl-md px-4 py-3">
        {label ? (
          <div className="flex items-center gap-2">
            <div className="flex gap-1" aria-hidden="true">
              <div className="typing-dot" />
              <div className="typing-dot" />
              <div className="typing-dot" />
            </div>
            <span className="text-xs text-slate-500 font-medium">{label}</span>
          </div>
        ) : (
          <div className="flex gap-1" aria-hidden="true">
            <div className="typing-dot" />
            <div className="typing-dot" />
            <div className="typing-dot" />
          </div>
        )}
      </div>
    </motion.div>
  );
}
