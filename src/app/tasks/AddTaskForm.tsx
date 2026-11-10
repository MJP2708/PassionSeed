"use client";

import { useActionState, useState } from "react";
import { addTask, type AddTaskState } from "@/app/actions/tasks";

export function AddTaskForm({ subjects, today }: { subjects: { id: string; name: string }[]; today: string }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<AddTaskState, FormData>(async (prev, fd) => {
    const result = await addTask(prev, fd);
    if (result.ok) setOpen(false); // closing unmounts (and so clears) the form
    return result;
  }, {});

  if (!open) {
    return (
      <button type="button" className="btn-ghost w-full" onClick={() => setOpen(true)}>
        + เพิ่มงานเอง
      </button>
    );
  }

  return (
    <form action={action} className="card space-y-3">
      <h2 className="text-lg">เพิ่มงานเอง</h2>
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
      {state.error && <p role="alert" className="text-bad">{state.error}</p>}
      <div className="flex gap-2">
        <button type="submit" className="btn flex-1" disabled={pending}>{pending ? "กำลังบันทึก…" : "บันทึก"}</button>
        <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>ยกเลิก</button>
      </div>
    </form>
  );
}
