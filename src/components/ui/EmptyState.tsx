"use client";

import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  iconColor?: string;
}

export default function EmptyState({ icon: Icon, title, description, iconColor = "text-slate-500" }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8 px-4">
      <div className="w-12 h-12 rounded-2xl bg-white/[0.04] flex items-center justify-center mb-3">
        <Icon className={`w-6 h-6 ${iconColor}`} />
      </div>
      <p className="text-sm font-medium text-slate-400 mb-1">{title}</p>
      <p className="text-xs text-slate-600 text-center max-w-[220px] leading-relaxed">{description}</p>
    </div>
  );
}
