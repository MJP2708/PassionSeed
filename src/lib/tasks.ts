import { addDays, todayISO } from "./dates";

export type GroupKey = "urgent" | "week" | "later" | "done";

export const GROUP_LABEL: Record<GroupKey, string> = {
  urgent: "ด่วน · พรุ่งนี้",
  week: "สัปดาห์นี้",
  later: "หลังจากนั้น",
  done: "เสร็จแล้ว",
};

export function groupOf(task: { dueDate: string; done: boolean }, today = todayISO()): GroupKey {
  if (task.done) return "done";
  if (task.dueDate <= addDays(today, 1)) return "urgent"; // overdue, today, tomorrow
  if (task.dueDate <= addDays(today, 7)) return "week";
  return "later";
}

export function groupTasks<T extends { dueDate: string; done: boolean }>(tasks: T[], today = todayISO()) {
  const groups: Record<GroupKey, T[]> = { urgent: [], week: [], later: [], done: [] };
  const sorted = [...tasks].sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  for (const t of sorted) groups[groupOf(t, today)].push(t);
  return groups;
}
