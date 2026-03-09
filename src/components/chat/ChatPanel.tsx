"use client";

import { useEffect, useRef } from "react";
import { useAppStore } from "@/store/app-store";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import ToolCallIndicator from "./ToolCallIndicator";
import { Bot } from "lucide-react";

export default function ChatPanel() {
  const chatMessages = useAppStore((s) => s.chatMessages);
  const sendMessage = useAppStore((s) => s.sendMessage);
  const isChatLoading = useAppStore((s) => s.isChatLoading);
  const currentToolCall = useAppStore((s) => s.currentToolCall);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages, isChatLoading]);

  return (
    <div className="flex flex-col h-full bg-brand-dark/50">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-white/10">
        <div className="w-8 h-8 rounded-full bg-brand-teal/20 flex items-center justify-center">
          <Bot className="w-4 h-4 text-brand-teal" />
        </div>
        <div>
          <div className="text-sm font-semibold">Parafin AI</div>
          <div className="text-xs text-slate-400">Finansal asistanın</div>
        </div>
      </div>

      {/* Messages area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-4"
      >
        {chatMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <div className="w-16 h-16 rounded-full bg-brand-teal/10 flex items-center justify-center mb-4">
              <Bot className="w-8 h-8 text-brand-teal" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Selam! Ben Parafin</h3>
            <p className="text-sm text-slate-400 max-w-sm">
              Yapay zeka destekli finansal asistanın. Harcamalarını, birikim hedeflerini veya parayla ilgili her şeyi sorabilirsin!
            </p>

            {/* Suggested Prompts */}
            <div className="mt-6 space-y-2">
              {[
                "Bu ay markete ne kadar harcadım?",
                "Harcama dağılımım nasıl?",
                "Tatil için biraz para biriktirebilir misin?",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => sendMessage(suggestion)}
                  className="block w-full text-left text-sm px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-slate-300 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {chatMessages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}

        {isChatLoading && currentToolCall && (
          <ToolCallIndicator label={currentToolCall} />
        )}
      </div>

      {/* Input */}
      <ChatInput onSend={sendMessage} disabled={isChatLoading} />
    </div>
  );
}
