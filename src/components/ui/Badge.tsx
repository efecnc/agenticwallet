"use client";

const colorMap: Record<string, { bg: string; text: string }> = {
  groceries: { bg: "bg-green-500/10", text: "text-green-400" },
  rent: { bg: "bg-red-500/10", text: "text-red-400" },
  salary: { bg: "bg-emerald-500/10", text: "text-emerald-400" },
  subscription: { bg: "bg-purple-500/10", text: "text-purple-400" },
  coffee: { bg: "bg-amber-500/10", text: "text-amber-400" },
  dining: { bg: "bg-orange-500/10", text: "text-orange-400" },
  transport: { bg: "bg-blue-500/10", text: "text-blue-400" },
  shopping: { bg: "bg-pink-500/10", text: "text-pink-400" },
  utilities: { bg: "bg-cyan-500/10", text: "text-cyan-400" },
  income: { bg: "bg-emerald-500/10", text: "text-emerald-400" },
  expense: { bg: "bg-red-500/10", text: "text-red-400" },
  transfer: { bg: "bg-blue-500/10", text: "text-blue-400" },
};

const defaultColor = { bg: "bg-slate-500/10", text: "text-slate-400" };

const labelMap: Record<string, string> = {
  groceries: "Market",
  rent: "Kira",
  salary: "Maaş",
  subscription: "Abonelik",
  coffee: "Kahve",
  dining: "Yemek",
  transport: "Ulaşım",
  shopping: "Alışveriş",
  utilities: "Fatura",
  income: "Gelir",
  expense: "Gider",
  transfer: "Transfer",
};

export default function Badge({ label }: { label: string }) {
  const colors = colorMap[label.toLowerCase()] || defaultColor;
  const displayLabel = labelMap[label.toLowerCase()] || label;

  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${colors.bg} ${colors.text}`}
      role="status"
    >
      {displayLabel}
    </span>
  );
}
