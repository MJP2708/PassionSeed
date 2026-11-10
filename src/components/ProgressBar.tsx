export function ProgressBar({ value, max, label }: { value: number; max: number; label: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      className="h-3 w-full overflow-hidden rounded-full border border-line bg-paper"
    >
      <div className="h-full rounded-full bg-ink transition-[width] duration-500" style={{ width: `${pct}%` }} />
    </div>
  );
}
