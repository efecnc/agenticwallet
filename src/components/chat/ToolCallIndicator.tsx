"use client";

import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

export default function ToolCallIndicator({ label }: { label: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2 px-4 py-2 bg-brand-teal/10 border border-brand-teal/20 rounded-xl text-brand-teal text-sm max-w-fit"
    >
      <Loader2 className="w-4 h-4 animate-spin" />
      <span>{label}</span>
    </motion.div>
  );
}
