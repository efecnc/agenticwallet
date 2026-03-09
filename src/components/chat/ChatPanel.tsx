"use client";

import { useEffect, useRef } from "react";
import { useAppStore } from "@/store/app-store";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import ToolCallIndicator from "./ToolCallIndicator";
import { Bot, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ChatPanel() {
  const chatMessages = useAppStore((s) => s.chatMessages);
  const sendMessage = useAppStore((s) => s.sendMessage);
  const isChatLoading = useAppStore((s) => s.isChatLoading);
  const currentToolCall = useAppStore((s) => s.currentToolCall);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [chatMessages, isChatLoading]);

  const isEmpty = chatMessages.length === 0;

  return (
    <div className="flex flex-col h-full min-h-0" role="region" aria-label="Parafin sohbet paneli">
      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto scrollbar-thin min-h-0"
        role="log"
        aria-live="polite"
        aria-label="Sohbet mesajları"
      >
        <AnimatePresence mode="wait">
          {isEmpty ? (
            <motion.div
              key="welcome"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center h-full px-6"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="relative mb-5"
              >
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-teal/15 to-emerald-600/5 flex items-center justify-center">
                  <Bot className="w-8 h-8 text-brand-teal/80" aria-hidden="true" />
                </div>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: "spring" }}
                  className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center"
                >
                  <Sparkles className="w-3 h-3 text-white" aria-hidden="true" />
                </motion.div>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-sm text-slate-400 text-center max-w-[200px] leading-relaxed"
              >
                Finansal asistanın hazır. Ne sormak istersin?
              </motion.p>
            </motion.div>
          ) : (
            <motion.div
              key="messages"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="px-4 pt-4 pb-2 space-y-0.5"
            >
              {chatMessages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} />
              ))}

              {isChatLoading && (
                <ToolCallIndicator label={currentToolCall} />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input with inline quick actions */}
      <ChatInput
        onSend={sendMessage}
        disabled={isChatLoading}
        showSuggestions={isEmpty}
      />
    </div>
  );
}
