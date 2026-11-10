"use client";

import { useActionState, useState } from "react";
import { replyRequest, type ReplyState } from "@/app/actions/teacher";
import { addDays, formatThai } from "@/lib/dates";

export type RequestView = {
  id: string;
  topics: string | null;
  workType: string;
  originalDueDate: string | null;
  extensionStatus: string;
  absenceEnd: string;
};

const WORK_TYPES = [
  { value: "NONE", label: "ไม่มีงาน" },
  { value: "WORKSHEET", label: "ใบงาน" },
  { value: "QUIZ", label: "สอบย่อย" },
];

export function ReplyForm({ req }: { req: RequestView }) {
  const [state, action, pending] = useActionState<ReplyState, FormData>(replyRequest, {});
  const [workType, setWorkType] = useState(req.workType);
  const [due, setDue] = useState(req.originalDueDate ?? addDays(req.absenceEnd, 3));
  const [ext, setExt] = useState(req.extensionStatus === "REQUESTED" ? "" : req.extensionStatus);
  const askedExtension = req.extensionStatus !== "NONE";

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="requestId" value={req.id} />
      <div>
        <label htmlFor={`topics-${req.id}`} className="label">หัวข้อที่สอนระหว่างที่นักเรียนไม่อยู่</label>
        <textarea id={`topics-${req.id}`} name="topics" rows={2} required defaultValue={req.topics ?? ""} className="field" placeholder="เช่น สมดุลเคมี, หลักของเลอชาเตอลิเอ" />
      </div>

      <fieldset>
        <legend className="label">งานที่ต้องตามส่ง</legend>
        <div className="grid grid-cols-3 gap-2">
          {WORK_TYPES.map((w) => (
            <label key={w.value} className="flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-line px-2 has-[:checked]:border-ink has-[:checked]:bg-paper">
              <input type="radio" name="workType" value={w.value} checked={workType === w.value} onChange={() => setWorkType(w.value)} className="accent-ink" />
              {w.label}
            </label>
          ))}
        </div>
      </fieldset>

      {workType !== "NONE" && (
        <div>
          <label htmlFor={`due-${req.id}`} className="label">วันส่งเดิม</label>
          <input id={`due-${req.id}`} name="originalDueDate" type="date" required value={due} onChange={(e) => setDue(e.target.value)} className="field" />
        </div>
      )}

      {askedExtension && (
        <fieldset>
          <legend className="label">นักเรียนขอเลื่อนส่ง +3 วัน</legend>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: "APPROVED", label: "อนุมัติ" },
              { value: "DENIED", label: "ไม่อนุมัติ" },
            ].map((o) => (
              <label key={o.value} className="flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-line px-2 has-[:checked]:border-ink has-[:checked]:bg-paper">
                <input type="radio" name="extension" value={o.value} checked={ext === o.value} onChange={() => setExt(o.value)} required className="accent-ink" />
                {o.label}
              </label>
            ))}
          </div>
          {workType !== "NONE" && ext === "APPROVED" && due && (
            <p className="mt-1 text-sm text-muted">วันส่งใหม่: {formatThai(addDays(due, 3))}</p>
          )}
        </fieldset>
      )}

      {state.error && <p role="alert" className="text-bad">{state.error}</p>}
      {state.savedAt && !state.error && <p role="status" className="text-ok">บันทึกแล้ว ส่งให้นักเรียนแล้ว ✓</p>}
      <button type="submit" className="btn w-full" disabled={pending}>
        {pending ? "กำลังบันทึก…" : "ส่งคำตอบ"}
      </button>
    </form>
  );
}
