"use client";

const colorMap: Record<string, string> = {
  groceries: "bg-green-500/20 text-green-400",
  rent: "bg-red-500/20 text-red-400",
  salary: "bg-emerald-500/20 text-emerald-400",
  subscription: "bg-purple-500/20 text-purple-400",
  coffee: "bg-amber-500/20 text-amber-400",
  dining: "bg-orange-500/20 text-orange-400",
  transport: "bg-blue-500/20 text-blue-400",
  shopping: "bg-pink-500/20 text-pink-400",
  utilities: "bg-cyan-500/20 text-cyan-400",
  income: "bg-emerald-500/20 text-emerald-400",
  expense: "bg-red-500/20 text-red-400",
  transfer: "bg-blue-500/20 text-blue-400",
  default: "bg-slate-500/20 text-slate-400",
};

export default function Badge({ label }: { label: string }) {
  const colorClass = colorMap[label.toLowerCase()] || colorMap.default;

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colorClass}`}
    >
      {label}
    </span>
  );
}
