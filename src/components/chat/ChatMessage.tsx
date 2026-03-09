"use client";

import type { ChatMessageUI } from "@/types/chat";
import { motion } from "framer-motion";
import { Bot, User, Flame, Sparkles } from "lucide-react";

function cleanDisplayContent(content: string): string {
  return content
    .replace(/^\[ROAST_MODE\]\s*/i, "")
    .replace(/^\[MOTIVATION_MODE\]\s*/i, "");
}

function getMessageMode(content: string): "roast" | "motivation" | null {
  if (content.startsWith("[ROAST_MODE]")) return "roast";
  if (content.startsWith("[MOTIVATION_MODE]")) return "motivation";
  return null;
}

export default function ChatMessage({ message }: { message: ChatMessageUI }) {
  const isUser = message.role === "user";
  const mode = getMessageMode(message.content);
  const displayContent = cleanDisplayContent(message.content);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}
    >
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          isUser
            ? mode === "roast"
              ? "bg-orange-500/20"
              : mode === "motivation"
              ? "bg-emerald-500/20"
              : "bg-brand-teal/20"
            : "bg-white/10"
        }`}
      >
        {isUser ? (
          mode === "roast" ? (
            <Flame className="w-4 h-4 text-orange-400" />
          ) : mode === "motivation" ? (
            <Sparkles className="w-4 h-4 text-emerald-400" />
          ) : (
            <User className="w-4 h-4 text-brand-teal" />
          )
        ) : (
          <Bot className="w-4 h-4 text-slate-300" />
        )}
      </div>

      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? mode === "roast"
              ? "bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-br-md"
              : mode === "motivation"
              ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-br-md"
              : "bg-brand-teal text-white rounded-br-md"
            : "bg-white/5 text-slate-200 rounded-bl-md"
        }`}
      >
        <div className="whitespace-pre-wrap">{displayContent}</div>

        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="mt-2 pt-2 border-t border-white/10">
            <div className="text-xs text-slate-400">
              Used {message.toolCalls.length} tool{message.toolCalls.length > 1 ? "s" : ""}:{" "}
              {message.toolCalls.map((tc) => tc.name).join(", ")}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
