"use client";

import { useOptimistic, useTransition } from "react";
import { setTaskDone } from "@/app/actions/tasks";
import { GROUP_LABEL, groupTasks, type GroupKey } from "@/lib/tasks";
import { formatThai, relativeDay } from "@/lib/dates";
import { Meter, SectionLabel } from "@/components/ui";
import { IconCheck } from "@/components/Icons";

export type TaskView = {
  id: string;
  title: string;
  dueDate: string;
  done: boolean;
  extended: boolean;
  source: string;
  subjectName: string | null;
};

const ORDER: GroupKey[] = ["urgent", "week", "later", "done"];
const EMPTY: Record<GroupKey, string> = {
  urgent: "ไม่มีงานด่วน เยี่ยมมาก",
  week: "ไม่มีงานสัปดาห์นี้",
  later: "",
  done: "ยังไม่มีงานที่เสร็จ",
};

export function TaskList({ tasks, today }: { tasks: TaskView[]; today: string }) {
  const [optimistic, setOptimistic] = useOptimistic(tasks, (state, change: { id: string; done: boolean }) =>
    state.map((t) => (t.id === change.id ? { ...t, done: change.done } : t)),
  );
  const [, startTransition] = useTransition();

  const toggle = (id: string, done: boolean) =>
    startTransition(async () => {
      setOptimistic({ id, done });
      await setTaskDone(id, done);
    });

  const groups = groupTasks(optimistic, today);
  const doneCount = groups.done.length;

  return (
    <div className="space-y-8">
      <div className="space-y-2.5" aria-live="polite">
        <p className="flex items-baseline justify-between">
          <span className="font-ui text-[15px] font-medium">ตามทันแล้ว</span>
          <span className="text-[34px] leading-none tabular-nums">
            {doneCount}<span className="text-[20px] text-muted">/{optimistic.length}</span>
          </span>
        </p>
        <Meter value={doneCount} max={optimistic.length} label="จำนวนงานที่ตามทันแล้ว" />
      </div>

      {ORDER.map((key) => {
        const list = groups[key];
        if (key === "later" && list.length === 0) return null;
        return (
          <section key={key} aria-labelledby={`h-${key}`}>
            <SectionLabel id={`h-${key}`} aside={`${list.length} งาน`}>
              {key === "urgent" ? <span className="marker">{GROUP_LABEL[key]}</span> : GROUP_LABEL[key]}
            </SectionLabel>
            {list.length === 0 ? (
              <p className="meta py-3">{EMPTY[key]}</p>
            ) : (
              <ul className="divide-y divide-rule">
                {list.map((t) => (
                  <li key={t.id}>
                    <TaskRow task={t} today={today} urgent={key === "urgent"} onToggle={toggle} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}

function TaskRow({
  task: t,
  today,
  urgent,
  onToggle,
}: {
  task: TaskView;
  today: string;
  urgent: boolean;
  onToggle: (id: string, done: boolean) => void;
}) {
  const rel = relativeDay(t.dueDate, today);
  return (
    <label className="group -mx-2 flex min-h-[64px] cursor-pointer items-start gap-3.5 rounded-xl px-2 py-3.5 transition-colors hover:bg-sheet">
      <input
        type="checkbox"
        checked={t.done}
        onChange={(e) => onToggle(t.id, e.target.checked)}
        className="peer sr-only"
      />
      <span
        aria-hidden
        className="mt-0.5 flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full border-2 border-ink transition-colors peer-checked:bg-ink peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ink"
      >
        <IconCheck className={`h-4 w-4 text-paper transition-transform duration-150 ${t.done ? "scale-100" : "scale-0"}`} strokeWidth={2.6} />
      </span>
      <span className="min-w-0 flex-1">
        <span className={`block text-[17.5px] leading-snug transition-colors ${t.done ? "text-muted line-through decoration-1" : ""}`}>
          {t.title}
        </span>
        <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 font-ui text-[13.5px] text-muted">
          {t.subjectName && <span className="text-ink-soft">{t.subjectName}</span>}
          {t.subjectName && <span aria-hidden>·</span>}
          <span>ส่ง {formatThai(t.dueDate)}</span>
          {!t.done && (
            <span className={urgent ? "marker font-medium text-ink" : ""}>{rel}</span>
          )}
          {t.extended && <span className="tag">เลื่อนแล้ว +3 วัน</span>}
          {t.source === "MANUAL" && <span className="text-[12.5px]">· เพิ่มเอง</span>}
        </span>
      </span>
    </label>
  );
}
