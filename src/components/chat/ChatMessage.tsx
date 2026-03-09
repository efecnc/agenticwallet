"use client";

import type { ChatMessageUI } from "@/types/chat";
import { motion } from "framer-motion";
import { Bot, User, Flame, Sparkles, Heart, Wrench } from "lucide-react";

function cleanDisplayContent(content: string): string {
  return content
    .replace(/^\[ROAST_MODE\]\s*/i, "")
    .replace(/^\[MOTIVATION_MODE\]\s*/i, "")
    .replace(/^\[ABI_MODE\]\s*/i, "");
}

function getMessageMode(content: string): "roast" | "motivation" | "abi" | null {
  if (content.startsWith("[ROAST_MODE]")) return "roast";
  if (content.startsWith("[MOTIVATION_MODE]")) return "motivation";
  if (content.startsWith("[ABI_MODE]")) return "abi";
  return null;
}

const toolLabels: Record<string, string> = {
  query_transactions: "İşlemler",
  calculate_balance: "Hesaplama",
  save_memory: "Hafıza",
  read_memory: "Arama",
  transfer_to_savings: "Transfer",
  calculate_safe_to_spend: "Bütçe",
  propose_challenge: "Meydan Okuma",
};

export default function ChatMessage({ message }: { message: ChatMessageUI }) {
  const isUser = message.role === "user";
  const mode = getMessageMode(message.content);
  const displayContent = cleanDisplayContent(message.content);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex gap-2.5 py-1.5 ${isUser ? "flex-row-reverse" : ""}`}
      role="article"
      aria-label={`${isUser ? "Senin" : "Parafin'in"} mesajı`}
    >
      {/* Avatar */}
      <div
        className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-1 ${
          isUser
            ? "bg-gradient-to-br from-brand-teal to-emerald-600"
            : "bg-white/[0.06] border border-white/[0.08]"
        }`}
        aria-hidden="true"
      >
        {isUser ? (
          mode === "roast" ? (
            <Flame className="w-3.5 h-3.5 text-white" />
          ) : mode === "motivation" ? (
            <Sparkles className="w-3.5 h-3.5 text-white" />
          ) : mode === "abi" ? (
            <Heart className="w-3.5 h-3.5 text-white" />
          ) : (
            <User className="w-3.5 h-3.5 text-white" />
          )
        ) : (
          <Bot className="w-3.5 h-3.5 text-slate-400" />
        )}
      </div>

      {/* Message bubble */}
      <div className={`max-w-[82%] ${isUser ? "items-end" : "items-start"}`}>
        <div
          className={`rounded-2xl px-4 py-2.5 text-[13.5px] leading-relaxed ${
            isUser
              ? mode === "roast"
                ? "bg-gradient-to-br from-orange-500 to-red-500 text-white rounded-tr-md shadow-lg shadow-orange-500/10"
                : mode === "motivation"
                ? "bg-gradient-to-br from-emerald-500 to-teal-500 text-white rounded-tr-md shadow-lg shadow-emerald-500/10"
                : mode === "abi"
                ? "bg-gradient-to-br from-violet-500 to-purple-500 text-white rounded-tr-md shadow-lg shadow-violet-500/10"
                : "bg-gradient-to-br from-brand-teal to-emerald-600 text-white rounded-tr-md shadow-lg shadow-brand-teal/10"
              : "bg-white/[0.05] text-slate-200 rounded-tl-md border border-white/[0.06]"
          }`}
        >
          <div className="whitespace-pre-wrap break-words">{displayContent}</div>
        </div>

        {/* Tool calls indicator */}
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="flex items-center gap-1.5 mt-1.5 px-1">
            <Wrench className="w-3 h-3 text-slate-600" aria-hidden="true" />
            <div className="flex flex-wrap gap-1" aria-label="Kullanılan araçlar">
              {message.toolCalls.map((tc, i) => (
                <span
                  key={i}
                  className="text-[10px] px-1.5 py-0.5 bg-white/[0.04] text-slate-500 rounded font-medium"
                >
                  {toolLabels[tc.name] || tc.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
