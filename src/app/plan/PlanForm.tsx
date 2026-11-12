"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createAbsence } from "@/app/actions/absences";
import { prepareImage } from "@/lib/prepare-file";
import { SectionLabel, Spinner } from "@/components/ui";
import { IconCheck, IconClip } from "@/components/Icons";

type Subject = { id: string; name: string; teacherName: string; days: string };

function TickBox() {
  return (
    <span
      aria-hidden
      className="flex h-[24px] w-[24px] shrink-0 items-center justify-center rounded-[7px] border-2 border-ink transition-colors peer-checked:bg-ink peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ink [&>svg]:scale-0 peer-checked:[&>svg]:scale-100"
    >
      <IconCheck className="h-4 w-4 text-paper transition-transform duration-150" strokeWidth={2.6} />
    </span>
  );
}

export function PlanForm({ subjects, today }: { subjects: Subject[]; today: string }) {
  const router = useRouter();
  const [startDate, setStartDate] = useState(today);
  const [letterName, setLetterName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    if (fd.getAll("subjects").length === 0) return setError("เลือกวิชาที่จะขาดอย่างน้อย 1 วิชา");
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
    <form onSubmit={submit} className="space-y-8">
      <section className="space-y-4" aria-labelledby="s-event">
        <SectionLabel id="s-event">ไปแข่งอะไร เมื่อไหร่</SectionLabel>
        <div>
          <label htmlFor="eventName" className="label">ชื่องานแข่งขัน / กิจกรรม</label>
          <input id="eventName" name="eventName" required maxLength={120} className="field" placeholder="เช่น แข่งตอบปัญหาวิทยาศาสตร์ระดับประเทศ" />
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
            จดหมายขออนุญาต <span className="font-normal text-muted">(ไม่บังคับ · รูปหรือ PDF)</span>
          </span>
          <label className="flex min-h-12 cursor-pointer items-center gap-2.5 rounded-[11px] border border-dashed border-rule-strong bg-sheet px-3.5 font-ui text-[15px] transition-colors hover:border-ink has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ink">
            <input
              id="letter"
              name="letter"
              type="file"
              accept="image/*,application/pdf"
              aria-labelledby="letter-label"
              className="sr-only"
              onChange={(e) => setLetterName(e.target.files?.[0]?.name ?? "")}
            />
            <IconClip className="h-5 w-5 shrink-0 text-muted" />
            <span className={`truncate ${letterName ? "text-ink" : "text-muted"}`}>{letterName || "แนบไฟล์จดหมาย"}</span>
          </label>
        </div>
      </section>

      <fieldset aria-describedby="subjects-hint">
        <legend className="w-full">
          <SectionLabel>วิชาที่จะขาด</SectionLabel>
        </legend>
        <p id="subjects-hint" className="meta mb-1">ระบบจะส่งคำขอไปหาครูแต่ละวิชาให้อัตโนมัติ</p>
        <div className="divide-y divide-rule">
          {subjects.map((s) => (
            <label key={s.id} className="-mx-2 flex min-h-[60px] cursor-pointer items-center gap-3.5 rounded-xl px-2 py-2.5 transition-colors hover:bg-sheet">
              <input type="checkbox" name="subjects" value={s.id} defaultChecked className="peer sr-only" />
              <TickBox />
              <span className="min-w-0 flex-1">
                <span className="block text-[17.5px] leading-snug">{s.name}</span>
                <span className="meta block">{s.teacherName} · เรียน {s.days}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="sheet flex cursor-pointer items-center gap-3.5 px-4 py-3.5">
        <input type="checkbox" name="wantsExtension" defaultChecked className="peer sr-only" />
        <TickBox />
        <span>
          <span className="block text-[17.5px] leading-snug">ขอเลื่อนส่งงาน +3 วัน</span>
          <span className="meta block">ครูแต่ละวิชาจะเป็นคนอนุมัติ</span>
        </span>
      </label>

      {error && <p role="alert" className="font-ui text-[14px] text-bad">{error}</p>}
      <button type="submit" className="btn min-h-14 w-full text-[16.5px]" disabled={busy}>
        {busy ? (
          <>
            <Spinner /> กำลังส่งคำขอ
          </>
        ) : (
          "ส่งคำขอถึงครู"
        )}
      </button>
    </form>
  );
}
