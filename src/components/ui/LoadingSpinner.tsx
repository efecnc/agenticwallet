"use client";

export default function LoadingSpinner({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "w-4 h-4 border",
    md: "w-6 h-6 border-2",
    lg: "w-10 h-10 border-2",
  };

  return (
    <div
      className={`${sizeClasses[size]} border-white/10 border-t-brand-teal rounded-full animate-spin`}
      role="status"
      aria-label="Yükleniyor"
    />
  );
}
