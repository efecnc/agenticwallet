"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export default function ErrorState({ message = "Bir hata oluştu", onRetry }: ErrorStateProps) {
  return (
    <div className="rounded-2xl bg-white/[0.03] p-5">
      <div className="flex flex-col items-center justify-center py-6 px-4">
        <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center mb-3">
          <AlertTriangle className="w-6 h-6 text-red-400" />
        </div>
        <p className="text-sm font-medium text-slate-400 mb-1">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-3 flex items-center gap-1.5 px-4 py-2 bg-white/[0.06] hover:bg-white/[0.1] rounded-xl text-xs font-semibold text-slate-300 transition-colors focus-ring"
            aria-label="Tekrar dene"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Tekrar Dene
          </button>
        )}
      </div>
    </div>
  );
}
