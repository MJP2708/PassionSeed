// Small server-safe building blocks shared by every page.
import type { ReactNode } from "react";

/** Section heading that reads like a printed planner label with a rule. */
export function SectionLabel({ children, id, aside }: { children: ReactNode; id?: string; aside?: ReactNode }) {
  return (
    <div className="mb-1 flex items-center gap-3">
      <h2 id={id} className="font-ui text-[14px] font-semibold text-ink">{children}</h2>
      <span aria-hidden className="h-px flex-1 bg-rule" />
      {aside && <span className="meta">{aside}</span>}
    </div>
  );
}

/** Segmented meter: one segment per unit (tasks, teachers, half-hours). */
export function Meter({ value, max, label, className = "" }: { value: number; max: number; label: string; className?: string }) {
  const safeMax = Math.max(max, 1);
  const segmented = safeMax <= 24;
  return (
    <div
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      className={`flex h-2 w-full gap-[3px] ${className}`}
    >
      {segmented ? (
        Array.from({ length: safeMax }, (_, i) => (
          <span
            key={i}
            className={`h-full flex-1 rounded-full transition-colors duration-300 ${i < value ? "bg-ink" : "bg-rule"}`}
          />
        ))
      ) : (
        <span className="relative h-full flex-1 overflow-hidden rounded-full bg-rule">
          <span className="absolute inset-y-0 left-0 rounded-full bg-ink" style={{ width: `${(value / safeMax) * 100}%` }} />
        </span>
      )}
    </div>
  );
}

export function Spinner({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <span aria-hidden className={`inline-block animate-spin rounded-full border-2 border-current border-r-transparent ${className}`} />
  );
}

/** Status line with a small dot — used instead of a pile of chips. */
export function Status({ tone, children }: { tone: "ok" | "wait" | "ink"; children: ReactNode }) {
  const dot = tone === "ok" ? "bg-ok" : tone === "ink" ? "bg-ink" : "border border-muted bg-transparent";
  const text = tone === "ok" ? "text-ok" : tone === "ink" ? "text-ink" : "text-muted";
  return (
    <span className={`inline-flex items-center gap-1.5 font-ui text-[13.5px] ${text}`}>
      <span aria-hidden className={`h-2 w-2 shrink-0 rounded-full ${dot}`} />
      {children}
    </span>
  );
}

export function PageHeader({ kicker, title, children }: { kicker?: ReactNode; title: ReactNode; children?: ReactNode }) {
  return (
    <header className="space-y-1 pt-5">
      {kicker && <p className="meta">{kicker}</p>}
      <h1 className="text-[30px] leading-[1.15] tracking-tight">{title}</h1>
      {children && <p className="max-w-prose font-ui text-[15px] text-muted">{children}</p>}
    </header>
  );
}
