"use client";

export default function ProgressBar({
  current,
  total,
}: {
  current: number;
  total: number;
}) {
  return (
    <div className="w-full animate-fade-in">
      {/* Label row */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-muted tracking-wide uppercase">
          Question {current} of {total}
        </span>
        <span className="text-xs font-semibold text-primary tabular-nums">
          {Math.round((current / total) * 100)}%
        </span>
      </div>

      {/* Segmented bar */}
      <div className="flex gap-1.5">
        {Array.from({ length: total }, (_, i) => {
          const isComplete = i < current - 1;
          const isCurrent = i === current - 1;

          return (
            <div
              key={i}
              className="h-1.5 flex-1 rounded-full overflow-hidden bg-mint"
            >
              <div
                className={`h-full rounded-full progress-segment ${
                  isComplete
                    ? "bg-primary w-full"
                    : isCurrent
                    ? "bg-primary w-full animate-breathe"
                    : "w-0"
                }`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
