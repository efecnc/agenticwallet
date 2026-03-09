"use client";

import { useState, useRef } from "react";
import { ArrowUp, Search, PiggyBank, BarChart3, Flame, Sparkles, Heart } from "lucide-react";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  showSuggestions?: boolean;
}

const quickActions = [
  { label: "Harcama", icon: Search, message: "Bu ay toplam ne kadar harcadım?" },
  { label: "Biriktir", icon: PiggyBank, message: "Tatil için biraz para biriktirmek istiyorum, önerir misin?" },
  { label: "Analiz", icon: BarChart3, message: "Harcamalarımı analiz et, nerede tasarruf edebilirim?" },
  { label: "Roast", icon: Flame, message: "[ROAST_MODE] Roast my spending habits" },
  { label: "Motive", icon: Sparkles, message: "[MOTIVATION_MODE] Motivate me about my finances" },
  { label: "Abi", icon: Heart, message: "[ABI_MODE] Abi/Abla, finansal durumum nasıl?" },
];

export default function ChatInput({ onSend, disabled, showSuggestions }: ChatInputProps) {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  function handleSubmit() {
    const trimmed = input.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setInput("");
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  const hasInput = input.trim().length > 0;

  return (
    <div className="flex-shrink-0">
      {/* Quick action chips — above input */}
      {showSuggestions && (
        <div className="px-4 pb-2">
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hidden pb-0.5" role="toolbar" aria-label="Hızlı eylemler">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.label}
                  onClick={() => onSend(action.message)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.04] hover:bg-white/[0.08] rounded-full text-[11px] text-slate-400 hover:text-slate-200 font-medium whitespace-nowrap transition-all flex-shrink-0 hover:scale-[1.02] active:scale-[0.98] focus-ring"
                  aria-label={action.label}
                >
                  <Icon className="w-3 h-3" aria-hidden="true" />
                  {action.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-4 pb-4 pt-1">
        <div className="flex items-end gap-2 bg-white/[0.05] rounded-2xl px-4 py-2 border border-transparent focus-within:bg-white/[0.07] focus-within:border-brand-teal/20 focus-within:shadow-[0_0_15px_rgba(16,185,129,0.06)] transition-all duration-300">
          <label className="sr-only" htmlFor="chat-input">Mesajını yaz</label>
          <textarea
            id="chat-input"
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Parafin'e sor..."
            disabled={disabled}
            rows={1}
            className="flex-1 bg-transparent text-sm text-white placeholder-slate-600 resize-none focus:outline-none disabled:opacity-40 py-1 leading-relaxed"
            style={{ minHeight: "28px", maxHeight: "80px" }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = "auto";
              target.style.height = `${Math.min(target.scrollHeight, 80)}px`;
            }}
          />
          <button
            onClick={handleSubmit}
            disabled={disabled || !hasInput}
            className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200 focus-ring ${
              hasInput && !disabled
                ? "bg-brand-teal text-white shadow-md shadow-brand-teal/20 hover:shadow-lg hover:shadow-brand-teal/30 hover:bg-emerald-400 active:scale-95"
                : "text-slate-700"
            }`}
            aria-label="Mesaj gönder"
          >
            <ArrowUp className="w-4 h-4" strokeWidth={2.5} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
