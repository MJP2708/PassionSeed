"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { uploadNotes } from "@/app/actions/notes";
import { prepareImage } from "@/lib/prepare-file";
import { datesInRange, formatThai } from "@/lib/dates";
import { SectionLabel, Spinner } from "@/components/ui";
import { IconCamera, IconX } from "@/components/Icons";

export type AbsenceOption = {
  id: string;
  studentName: string;
  eventName: string;
  startDate: string;
  endDate: string;
  subjects: { id: string; name: string }[];
};

type Photo = { file: File; url: string };
const MAX = 5;

export function UploadForm({ absences, today }: { absences: AbsenceOption[]; today: string }) {
  const router = useRouter();
  const [absenceId, setAbsenceId] = useState(absences[0]?.id ?? "");
  const absence = absences.find((a) => a.id === absenceId);
  const days = useMemo(() => (absence ? datesInRange(absence.startDate, absence.endDate) : []), [absence]);
  const [subjectId, setSubjectId] = useState(absence?.subjects[0]?.id ?? "");
  const [date, setDate] = useState(days.includes(today) ? today : days[0] ?? "");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [busy, setBusy] = useState<"" | "preparing" | "uploading">("");
  const [error, setError] = useState("");

  useEffect(() => () => photos.forEach((p) => URL.revokeObjectURL(p.url)), [photos]);

  function pickAbsence(id: string) {
    setAbsenceId(id);
    const a = absences.find((x) => x.id === id);
    const d = a ? datesInRange(a.startDate, a.endDate) : [];
    setSubjectId(a?.subjects[0]?.id ?? "");
    setDate(d.includes(today) ? today : d[0] ?? "");
  }

  async function addPhotos(list: FileList | null) {
    if (!list?.length) return;
    setError("");
    const room = MAX - photos.length;
    if (list.length > room) setError(`ส่งได้สูงสุด ${MAX} รูป`);
    setBusy("preparing");
    const files = await Promise.all(Array.from(list).slice(0, room).map(prepareImage));
    setPhotos((prev) => [...prev, ...files.map((file) => ({ file, url: URL.createObjectURL(file) }))]);
    setBusy("");
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    if (!photos.length) return setError("เพิ่มรูปอย่างน้อย 1 รูป");
    const fd = new FormData(e.currentTarget);
    fd.delete("picker");
    photos.forEach((p) => fd.append("photos", p.file));
    setBusy("uploading");
    try {
      const res = await uploadNotes(fd);
      if (!res.ok) {
        setError(res.error);
        setBusy("");
        return;
      }
      router.push(`/notes/${res.id}`);
    } catch {
      setError("อัปโหลดไม่สำเร็จ ลองใหม่อีกครั้ง");
      setBusy("");
    }
  }

  if (!absences.length) {
    return <p className="rounded-2xl border border-dashed border-rule-strong px-5 py-6 text-center text-muted">ตอนนี้ยังไม่มีเพื่อนที่ขาดเรียน</p>;
  }

  return (
    <form onSubmit={submit} className="sheet space-y-6 p-4 sm:p-5" aria-labelledby="send-title">
      <h2 id="send-title" className="text-[21px]">ส่งโน้ตให้เพื่อน</h2>

      <fieldset className="space-y-3">
        <legend className="sr-only">เลือกเพื่อนและคาบเรียน</legend>
        <div>
          <label htmlFor="absenceId" className="label">เพื่อนที่ขาดเรียน</label>
          <select id="absenceId" name="absenceId" className="field" value={absenceId} onChange={(e) => pickAbsence(e.target.value)}>
            {absences.map((a) => (
              <option key={a.id} value={a.id}>{a.studentName} · {a.eventName}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="subjectId" className="label">วิชา</label>
            <select id="subjectId" name="subjectId" className="field" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
              {absence?.subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="date" className="label">คาบวันที่</label>
            <select id="date" name="date" className="field" value={date} onChange={(e) => setDate(e.target.value)}>
              {days.map((d) => (
                <option key={d} value={d}>{formatThai(d)}</option>
              ))}
            </select>
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend className="w-full">
          <SectionLabel aside={`${photos.length}/${MAX}`}>รูปกระดาน / โน้ต</SectionLabel>
        </legend>
        <ul className="mt-2 grid grid-cols-3 gap-2">
          {photos.map((p, i) => (
            <li key={p.url} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt={`รูปที่ ${i + 1}`} className="aspect-square w-full rounded-xl border border-rule object-cover" />
              <button
                type="button"
                onClick={() => setPhotos((prev) => prev.filter((_, j) => j !== i))}
                className="absolute -top-1.5 -right-1.5 flex h-11 w-11 items-center justify-center"
                aria-label={`ลบรูปที่ ${i + 1}`}
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink text-paper shadow">
                  <IconX className="h-3.5 w-3.5" strokeWidth={2.4} />
                </span>
              </button>
            </li>
          ))}
          {photos.length < MAX && (
            <li>
              <label className="flex aspect-square w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-rule-strong bg-paper font-ui text-[13.5px] text-ink-soft transition-colors hover:border-ink has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ink">
                <input
                  type="file"
                  name="picker"
                  accept="image/*"
                  multiple
                  className="sr-only"
                  onChange={(e) => {
                    addPhotos(e.target.files);
                    e.target.value = "";
                  }}
                />
                {busy === "preparing" ? <Spinner className="h-5 w-5" /> : <IconCamera className="h-6 w-6" />}
                {photos.length === 0 ? "ถ่าย / เลือกรูป" : "เพิ่มรูป"}
              </label>
            </li>
          )}
        </ul>
        <p className="meta mt-2">ถ่ายให้ตรงและสว่าง AI จะอ่านได้แม่นขึ้น</p>
      </fieldset>

      <div>
        <label htmlFor="emphasis" className="label">
          ครูเน้นอะไรเป็นพิเศษ? <span className="font-normal text-muted">(ไม่บังคับ)</span>
        </label>
        <textarea id="emphasis" name="emphasis" rows={2} maxLength={1000} className="field resize-none" placeholder="เช่น ครูบอกว่าข้อนี้ออกสอบ" />
      </div>

      {error && <p role="alert" className="font-ui text-[14px] text-bad">{error}</p>}

      <button type="submit" className="btn w-full" disabled={busy !== ""}>
        {busy === "uploading" ? (
          <>
            <Spinner /> กำลังส่งโน้ต
          </>
        ) : (
          <>ส่งโน้ต · รับ 0.5 ชม.</>
        )}
      </button>
    </form>
  );
}
