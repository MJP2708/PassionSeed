"use client";

import { useActionState, useState } from "react";
import { addTask, type AddTaskState } from "@/app/actions/tasks";
import { SubmitButton } from "@/components/SubmitButton";
import { IconPlus } from "@/components/Icons";

export function AddTaskForm({ subjects, today }: { subjects: { id: string; name: string }[]; today: string }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState<AddTaskState, FormData>(async (prev, fd) => {
    const result = await addTask(prev, fd);
    if (result.ok) setOpen(false); // closing unmounts (and so clears) the form
    return result;
  }, {});

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex min-h-12 w-full items-center gap-2 rounded-xl border border-dashed border-rule-strong px-4 font-ui text-[15px] text-ink-soft transition-colors hover:border-ink hover:text-ink"
      >
        <IconPlus className="h-5 w-5" /> เพิ่มงานเอง
      </button>
    );
  }

  return (
    <form action={action} className="sheet space-y-4 p-4">
      <p className="font-ui text-[15px] font-semibold">เพิ่มงานเอง</p>
      <div>
        <label htmlFor="title" className="label">ชื่องาน</label>
        <input id="title" name="title" required maxLength={200} className="field" placeholder="เช่น ขอสไลด์จากเพื่อน" autoFocus />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="dueDate" className="label">วันส่ง</label>
          <input id="dueDate" name="dueDate" type="date" required defaultValue={today} className="field" />
        </div>
        <div>
          <label htmlFor="subjectId" className="label">วิชา</label>
          <select id="subjectId" name="subjectId" className="field" defaultValue="">
            <option value="">ไม่ระบุ</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>
      {state.error && <p role="alert" className="font-ui text-[14px] text-bad">{state.error}</p>}
      <div className="flex gap-2">
        <SubmitButton className="btn flex-1" pendingLabel="กำลังบันทึก">บันทึกงาน</SubmitButton>
        <button type="button" className="btn-quiet" onClick={() => setOpen(false)}>ยกเลิก</button>
      </div>
    </form>
  );
}
