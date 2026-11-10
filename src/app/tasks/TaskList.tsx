"use client";

import { useOptimistic, useTransition } from "react";
import { setTaskDone } from "@/app/actions/tasks";
import { GROUP_LABEL, groupTasks, type GroupKey } from "@/lib/tasks";
import { formatThai, relativeDay } from "@/lib/dates";
import { ProgressBar } from "@/components/ProgressBar";

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
    <div className="space-y-6">
      <div className="card space-y-2">
        <p className="text-lg" aria-live="polite">
          ตามทันแล้ว <span className="text-2xl">{doneCount}/{optimistic.length}</span>
        </p>
        <ProgressBar value={doneCount} max={optimistic.length} label="ความคืบหน้าการตามงาน" />
      </div>

      {ORDER.map((key) => {
        const list = groups[key];
        if (key === "later" && list.length === 0) return null;
        return (
          <section key={key} aria-labelledby={`h-${key}`} className="space-y-2">
            <h2 id={`h-${key}`} className="flex items-center gap-2 text-lg">
              {key === "urgent" ? <span className="chip-hl">{GROUP_LABEL[key]}</span> : GROUP_LABEL[key]}
              <span className="text-sm text-muted">({list.length})</span>
            </h2>
            {list.length === 0 ? (
              <p className="text-muted">{key === "urgent" ? "ไม่มีงานด่วน เยี่ยมมาก 🎉" : key === "done" ? "ยังไม่มีงานที่เสร็จ" : "ไม่มีงาน"}</p>
            ) : (
              <ul className="space-y-2">
                {list.map((t) => (
                  <li key={t.id}>
                    <label
                      className={`card flex cursor-pointer items-start gap-3 ${key === "urgent" ? "border-ink" : ""}`}
                    >
                      <input
                        type="checkbox"
                        checked={t.done}
                        onChange={(e) => toggle(t.id, e.target.checked)}
                        className="mt-0.5 h-7 w-7 shrink-0 cursor-pointer accent-ink"
                      />
                      <span className="min-w-0 flex-1">
                        <span className={`block ${t.done ? "text-muted line-through" : ""}`}>{t.title}</span>
                        <span className="mt-1 flex flex-wrap items-center gap-1.5 text-sm text-muted">
                          {t.subjectName && <span className="chip">{t.subjectName}</span>}
                          <span>
                            ส่ง {formatThai(t.dueDate)}
                            {!t.done && ` · ${relativeDay(t.dueDate, today)}`}
                          </span>
                          {t.extended && <span className="chip border-ink">เลื่อนแล้ว +3 วัน</span>}
                          {t.source === "MANUAL" && <span className="text-xs">· เพิ่มเอง</span>}
                        </span>
                      </span>
                    </label>
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
