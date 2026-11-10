// Date-only values are "YYYY-MM-DD" strings in Thailand time (Asia/Bangkok).

const TZ = "Asia/Bangkok";

export function todayISO(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(now);
}

function toUTC(iso: string): Date {
  return new Date(`${iso}T00:00:00Z`);
}

export function addDays(iso: string, days: number): string {
  const d = toUTC(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function daysBetween(fromISO: string, toISO: string): number {
  return Math.round((toUTC(toISO).getTime() - toUTC(fromISO).getTime()) / 86_400_000);
}

export function isISODate(v: unknown): v is string {
  return typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(toUTC(v).getTime());
}

/** "พ. 12 พ.ย." */
export function formatThai(iso: string, opts: { weekday?: boolean } = { weekday: true }): string {
  return toUTC(iso).toLocaleDateString("th-TH", {
    timeZone: "UTC",
    weekday: opts.weekday ? "short" : undefined,
    day: "numeric",
    month: "short",
  });
}

/** "11–13 พ.ย." or "30 พ.ย. – 2 ธ.ค." */
export function formatRange(start: string, end: string): string {
  if (start === end) return formatThai(start, { weekday: false });
  const s = toUTC(start);
  const e = toUTC(end);
  if (s.getUTCMonth() === e.getUTCMonth()) {
    const month = e.toLocaleDateString("th-TH", { timeZone: "UTC", month: "short" });
    return `${s.getUTCDate()}–${e.getUTCDate()} ${month}`;
  }
  return `${formatThai(start, { weekday: false })} – ${formatThai(end, { weekday: false })}`;
}

/** "วันนี้", "พรุ่งนี้", "เมื่อวาน", "อีก 3 วัน", "เลยมา 2 วัน" */
export function relativeDay(iso: string, today = todayISO()): string {
  const diff = daysBetween(today, iso);
  if (diff === 0) return "วันนี้";
  if (diff === 1) return "พรุ่งนี้";
  if (diff === -1) return "เมื่อวาน";
  if (diff > 1) return `อีก ${diff} วัน`;
  return `เลยมา ${-diff} วัน`;
}

export function datesInRange(start: string, end: string): string[] {
  const out: string[] = [];
  for (let d = start; d <= end && out.length < 31; d = addDays(d, 1)) out.push(d);
  return out;
}
