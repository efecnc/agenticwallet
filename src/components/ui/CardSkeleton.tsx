"use client";

interface CardSkeletonProps {
  lines?: number;
  showHeader?: boolean;
  height?: string;
}

export default function CardSkeleton({ lines = 3, showHeader = true, height }: CardSkeletonProps) {
  return (
    <div className="rounded-2xl bg-white/[0.03] p-5" style={height ? { minHeight: height } : undefined} role="status" aria-label="Yükleniyor">
      {showHeader && (
        <div className="skeleton-text w-28 h-3.5 mb-4" />
      )}
      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="skeleton-circle w-10 h-10 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="skeleton-text w-3/4" />
              <div className="skeleton-text-sm w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
