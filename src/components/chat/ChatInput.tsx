"use client";

import { useState, useRef } from "react";
import { Send } from "lucide-react";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export default function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  function handleSubmit() {
    const trimmed = input.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setInput("");
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <div className="flex items-end gap-2 p-4 border-t border-white/10">
      <textarea
        ref={inputRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Parafin'e bir şey sor..."
        disabled={disabled}
        rows={1}
        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 resize-none focus:outline-none focus:border-brand-teal/50 focus:ring-1 focus:ring-brand-teal/20 disabled:opacity-50"
        style={{ minHeight: "44px", maxHeight: "120px" }}
        onInput={(e) => {
          const target = e.target as HTMLTextAreaElement;
          target.style.height = "auto";
          target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
        }}
      />
      <button
        onClick={handleSubmit}
        disabled={disabled || !input.trim()}
        className="w-11 h-11 bg-brand-teal hover:bg-emerald-400 disabled:bg-white/10 disabled:text-slate-500 text-white rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
      >
        <Send className="w-4 h-4" />
      </button>
    </div>
  );
}
