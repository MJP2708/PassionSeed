"use client";

import { useActionState, useState } from "react";
import { replyRequest, type ReplyState } from "@/app/actions/teacher";
import { addDays, formatThai } from "@/lib/dates";
import { SubmitButton } from "@/components/SubmitButton";

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
  const [state, action] = useActionState<ReplyState, FormData>(replyRequest, {});
  const [workType, setWorkType] = useState(req.workType);
  const [due, setDue] = useState(req.originalDueDate ?? addDays(req.absenceEnd, 3));
  const [ext, setExt] = useState(req.extensionStatus === "REQUESTED" ? "" : req.extensionStatus);
  const askedExtension = req.extensionStatus !== "NONE";
  const hasWork = workType !== "NONE";

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="requestId" value={req.id} />
      <div>
        <label htmlFor={`topics-${req.id}`} className="label">สอนอะไรไประหว่างที่นักเรียนไม่อยู่</label>
        <textarea id={`topics-${req.id}`} name="topics" rows={2} required defaultValue={req.topics ?? ""} className="field resize-none" placeholder="เช่น สมดุลเคมี, หลักของเลอชาเตอลิเอ" />
      </div>

      <fieldset>
        <legend className="label">งานที่ต้องตามส่ง</legend>
        <div className="seg grid-cols-3">
          {WORK_TYPES.map((w) => (
            <label key={w.value}>
              <input type="radio" name="workType" value={w.value} checked={workType === w.value} onChange={() => setWorkType(w.value)} className="sr-only" />
              {w.label}
            </label>
          ))}
        </div>
      </fieldset>

      {hasWork && (
        <div>
          <label htmlFor={`due-${req.id}`} className="label">กำหนดส่งเดิม</label>
          <input id={`due-${req.id}`} name="originalDueDate" type="date" required value={due} onChange={(e) => setDue(e.target.value)} className="field" />
        </div>
      )}

      {askedExtension && (
        <fieldset>
          <legend className="label">นักเรียนขอเลื่อนส่ง +3 วัน</legend>
          <div className="seg grid-cols-2">
            {[
              { value: "APPROVED", label: "อนุมัติ" },
              { value: "DENIED", label: "ไม่อนุมัติ" },
            ].map((o) => (
              <label key={o.value}>
                <input type="radio" name="extension" value={o.value} checked={ext === o.value} onChange={() => setExt(o.value)} required className="sr-only" />
                {o.label}
              </label>
            ))}
          </div>
          {hasWork && ext === "APPROVED" && due && (
            <p className="meta mt-2">
              ส่งใหม่ได้ถึง <span className="font-medium text-ink">{formatThai(addDays(due, 3))}</span>
            </p>
          )}
        </fieldset>
      )}

      {state.error && <p role="alert" className="font-ui text-[14px] text-bad">{state.error}</p>}
      {state.savedAt && !state.error && (
        <p role="status" className="flex items-center gap-2 font-ui text-[14px] text-ok">
          <span aria-hidden className="h-2 w-2 rounded-full bg-ok" /> ส่งถึงนักเรียนแล้ว
        </p>
      )}
      <SubmitButton pendingLabel="กำลังส่ง">ส่งคำตอบ</SubmitButton>
    </form>
  );
}
