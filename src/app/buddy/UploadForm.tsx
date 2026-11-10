"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { uploadNotes } from "@/app/actions/notes";
import { prepareImage } from "@/lib/prepare-file";
import { datesInRange, formatThai } from "@/lib/dates";

export type AbsenceOption = {
  id: string;
  studentName: string;
  eventName: string;
  startDate: string;
  endDate: string;
  subjects: { id: string; name: string }[];
};

type Photo = { file: File; url: string };

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
    const room = 5 - photos.length;
    if (list.length > room) setError("อัปโหลดได้สูงสุด 5 รูป");
    setBusy("preparing");
    const files = await Promise.all(Array.from(list).slice(0, room).map(prepareImage));
    setPhotos((prev) => [...prev, ...files.map((file) => ({ file, url: URL.createObjectURL(file) }))]);
    setBusy("");
  }

  function removePhoto(i: number) {
    setPhotos((prev) => prev.filter((_, j) => j !== i));
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    if (!photos.length) return setError("กรุณาเพิ่มรูปอย่างน้อย 1 รูป");
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
    return <p className="card text-muted">ตอนนี้ยังไม่มีเพื่อนที่ขาดเรียน</p>;
  }

  return (
    <form onSubmit={submit} className="card space-y-4">
      <h2 className="text-lg">ส่งโน้ตให้เพื่อน</h2>

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
          <label htmlFor="date" className="label">วันที่เรียน</label>
          <select id="date" name="date" className="field" value={date} onChange={(e) => setDate(e.target.value)}>
            {days.map((d) => (
              <option key={d} value={d}>{formatThai(d)}</option>
            ))}
          </select>
        </div>
      </div>

      <fieldset>
        <legend className="label">รูปกระดาน / โน้ต (1–5 รูป)</legend>
        {photos.length > 0 && (
          <ul className="mb-2 grid grid-cols-3 gap-2">
            {photos.map((p, i) => (
              <li key={p.url} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt={`รูปที่ ${i + 1}`} className="aspect-square w-full rounded-xl border border-line object-cover" />
                <button
                  type="button"
                  onClick={() => removePhoto(i)}
                  className="absolute right-1 top-1 flex h-11 w-11 items-center justify-center rounded-full bg-ink/80 text-paper"
                  aria-label={`ลบรูปที่ ${i + 1}`}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
        {photos.length < 5 && (
          <label className="btn-ghost w-full cursor-pointer border-dashed">
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
            {busy === "preparing" ? "กำลังเตรียมรูป…" : "📷 ถ่ายรูปหรือเลือกจากเครื่อง"}
          </label>
        )}
        <p className="mt-1 text-sm text-muted">{photos.length}/5 รูป · ถ่ายให้ตรงและสว่าง AI จะอ่านได้ดีขึ้น</p>
      </fieldset>

      <div>
        <label htmlFor="emphasis" className="label">
          ครูเน้นอะไรเป็นพิเศษ? <span className="text-muted">(ไม่บังคับ)</span>
        </label>
        <textarea id="emphasis" name="emphasis" rows={3} maxLength={1000} className="field" placeholder="เช่น ครูบอกว่าข้อนี้ออกสอบ" />
      </div>

      {error && <p role="alert" className="text-bad">{error}</p>}

      <button type="submit" className="btn w-full" disabled={busy !== ""}>
        {busy === "uploading" ? "กำลังอัปโหลด…" : "ส่งโน้ต (+0.5 ชม. จิตอาสา)"}
      </button>
    </form>
  );
}
