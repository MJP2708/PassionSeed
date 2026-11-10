"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createAbsence } from "@/app/actions/absences";
import { prepareImage } from "@/lib/prepare-file";

type Subject = { id: string; name: string; teacherName: string; days: string };

export function PlanForm({ subjects, today }: { subjects: Subject[]; today: string }) {
  const router = useRouter();
  const [startDate, setStartDate] = useState(today);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [letterName, setLetterName] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    if (fd.getAll("subjects").length === 0) return setError("กรุณาเลือกวิชาที่ขาดอย่างน้อย 1 วิชา");
    setBusy(true);
    try {
      const letter = fd.get("letter");
      if (letter instanceof File && letter.size > 0) fd.set("letter", await prepareImage(letter));
      const res = await createAbsence(fd);
      if (!res.ok) {
        setError(res.error);
        setBusy(false);
        return;
      }
      router.push("/?planned=1");
    } catch {
      setError("บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="card space-y-4">
        <div>
          <label htmlFor="eventName" className="label">ชื่องานแข่งขัน / กิจกรรม</label>
          <input id="eventName" name="eventName" required maxLength={120} className="field" placeholder="เช่น แข่งขันตอบปัญหาวิทยาศาสตร์ระดับประเทศ" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="startDate" className="label">วันแรกที่ขาด</label>
            <input id="startDate" name="startDate" type="date" required className="field" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div>
            <label htmlFor="endDate" className="label">วันสุดท้าย</label>
            <input id="endDate" name="endDate" type="date" required className="field" min={startDate} defaultValue={startDate} key={startDate} />
          </div>
        </div>
        <div>
          <span id="letter-label" className="label">
            จดหมายขออนุญาต <span className="text-muted">(ไม่บังคับ · รูปหรือ PDF)</span>
          </span>
          <label className="btn-ghost w-full cursor-pointer border-dashed has-[:focus-visible]:outline-3">
            <input
              id="letter"
              name="letter"
              type="file"
              accept="image/*,application/pdf"
              aria-labelledby="letter-label"
              className="sr-only"
              onChange={(e) => setLetterName(e.target.files?.[0]?.name ?? "")}
            />
            <span className="truncate">{letterName ? `📎 ${letterName}` : "📎 แนบไฟล์จดหมาย"}</span>
          </label>
        </div>
      </div>

      <fieldset className="card space-y-2">
        <legend className="float-left mb-2 w-full text-lg">วิชาที่จะขาด</legend>
        <p className="clear-both text-sm text-muted">ระบบจะส่งคำขอไปหาครูแต่ละวิชาให้อัตโนมัติ</p>
        {subjects.map((s) => (
          <label key={s.id} className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-line px-3 py-2 has-[:checked]:border-ink">
            <input type="checkbox" name="subjects" value={s.id} defaultChecked className="h-6 w-6 accent-ink" />
            <span className="flex-1">
              <span className="block">{s.name}</span>
              <span className="block text-sm text-muted">{s.teacherName} · เรียน {s.days}</span>
            </span>
          </label>
        ))}
      </fieldset>

      <label className="card flex cursor-pointer items-start gap-3">
        <input type="checkbox" name="wantsExtension" defaultChecked className="mt-1 h-6 w-6 accent-ink" />
        <span>
          <span className="block">ขอเลื่อนส่งงาน +3 วัน</span>
          <span className="block text-sm text-muted">ครูแต่ละวิชาจะอนุมัติหรือไม่ก็ได้</span>
        </span>
      </label>

      {error && <p role="alert" className="text-bad">{error}</p>}
      <button type="submit" className="btn w-full" disabled={busy}>
        {busy ? "กำลังส่งคำขอ…" : "ส่งคำขอถึงครู"}
      </button>
    </form>
  );
}
