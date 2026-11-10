import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { formatThai } from "@/lib/dates";
import { parseSummary } from "@/lib/summary-schema";
import { RetryButton, SummaryRunner } from "./SummaryRunner";

const CONFIDENCE = {
  high: { label: "อ่านได้ชัด", note: "" },
  medium: { label: "อ่านได้บางส่วน", note: "บางส่วนอ่านไม่ออก ควรเปิดรูปจริงประกอบ" },
  low: { label: "อ่านได้น้อย", note: "รูปไม่ชัดหรืออ่านไม่ออกเป็นส่วนใหญ่ ใช้รูปจริงเป็นหลักและขอเพื่อนถ่ายใหม่" },
} as const;

export default async function NotePage({ params }: PageProps<"/notes/[id]">) {
  const { id } = await params;
  const user = await requireUser();
  const note = await db.noteUpload.findUnique({
    where: { id },
    include: { subject: true, buddy: true, absence: { include: { student: true } } },
  });
  if (!note) notFound();
  if (user.role === "STUDENT" && note.absence.studentId !== user.id) notFound();

  const photos: string[] = JSON.parse(note.photoUrls);
  const summary = note.summaryStatus === "READY" ? parseSummary(note.summaryJson) : null;
  const canRerun = photos.some((u) => !u.toLowerCase().endsWith(".svg"));
  const busy = note.summaryStatus === "PENDING" || note.summaryStatus === "PROCESSING";
  const error =
    note.summaryStatus === "ERROR"
      ? note.summaryError ?? "สรุปไม่สำเร็จ"
      : note.summaryStatus === "READY" && !summary
        ? "ข้อมูลสรุปเสียหาย ลองสรุปใหม่"
        : null;

  return (
    <div className="space-y-5 py-3">
      <SummaryRunner noteId={note.id} status={note.summaryStatus} />
      <Link href="/buddy" className="inline-flex min-h-11 items-center text-muted">← โน้ตทั้งหมด</Link>

      <div>
        <h1 className="text-2xl">{note.subject.name}</h1>
        <p className="text-muted">
          คาบวันที่ {formatThai(note.date)} · โน้ตจาก {note.buddy.nickname} ให้ {note.absence.student.nickname}
        </p>
      </div>

      <p className="rounded-xl border border-ink px-3 py-2">
        <span aria-hidden>✨ </span>AI ช่วยสรุป · เทียบกับรูปโน้ตจริงเสมอ{" "}
        <a href="#photos" className="underline underline-offset-4">ดูรูปต้นฉบับ ↓</a>
      </p>

      {note.emphasis && (
        <section className="card" aria-labelledby="emph">
          <h2 id="emph" className="text-sm text-muted">{note.buddy.nickname} บอกว่าครูเน้น</h2>
          <p className="text-lg">“{note.emphasis}”</p>
        </section>
      )}

      {busy && (
        <div className="card flex items-center gap-3" role="status" aria-live="polite">
          <span aria-hidden className="h-5 w-5 animate-spin rounded-full border-2 border-line border-t-ink" />
          <span>AI กำลังอ่านรูปโน้ต… ใช้เวลาประมาณ 10–40 วินาที</span>
        </div>
      )}

      {error && (
        <div className="card space-y-3 border-bad" role="alert">
          <p className="text-bad">{error}</p>
          <p className="text-muted">ดูรูปโน้ตต้นฉบับด้านล่างแทนได้เลย</p>
          <RetryButton noteId={note.id} />
        </div>
      )}

      {summary && (
        <article className="space-y-4" aria-label="สรุปโดย AI">
          <div className="flex flex-wrap items-center gap-2">
            <span className={summary.confidence === "low" ? "chip-hl" : "chip"}>
              ความมั่นใจ: {CONFIDENCE[summary.confidence].label}
            </span>
            {CONFIDENCE[summary.confidence].note && (
              <span className="text-sm text-muted">{CONFIDENCE[summary.confidence].note}</span>
            )}
          </div>

          <section className="card space-y-2" aria-labelledby="covered">
            <h2 id="covered" className="text-lg">เรียนอะไรไปบ้าง</h2>
            {summary.covered.length ? (
              <ul className="list-disc space-y-1 pl-5">
                {summary.covered.map((c, i) => <li key={i}>{c}</li>)}
              </ul>
            ) : (
              <p className="text-muted">AI อ่านเนื้อหาจากรูปไม่ออก</p>
            )}
          </section>

          {summary.keyTerms.length > 0 && (
            <section className="card space-y-2" aria-labelledby="terms">
              <h2 id="terms" className="text-lg">คำสำคัญ / สูตร</h2>
              <ul className="flex flex-wrap gap-2">
                {summary.keyTerms.map((k, i) => <li key={i} className="chip text-base">{k}</li>)}
              </ul>
            </section>
          )}

          {summary.questionsToAsk.length > 0 && (
            <section className="card space-y-2" aria-labelledby="ask">
              <h2 id="ask" className="text-lg">คำถามที่ควรถามครูหรือเพื่อน</h2>
              <ul className="list-disc space-y-1 pl-5">
                {summary.questionsToAsk.map((q, i) => <li key={i}>{q}</li>)}
              </ul>
            </section>
          )}

          {canRerun && (
            <div className="flex justify-end">
              <RetryButton noteId={note.id} label="สรุปใหม่อีกครั้ง" />
            </div>
          )}
        </article>
      )}

      <section id="photos" aria-labelledby="ph" className="scroll-mt-20 space-y-2">
        <h2 id="ph" className="text-lg">รูปโน้ตต้นฉบับ ({photos.length})</h2>
        <ul className="grid grid-cols-2 gap-2">
          {photos.map((url, i) => (
            <li key={url}>
              <a href={url} target="_blank" rel="noopener noreferrer" className="block" aria-label={`เปิดรูปที่ ${i + 1} ขนาดเต็ม`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`รูปโน้ตที่ ${i + 1}`} className="aspect-[4/3] w-full rounded-xl border border-line bg-card object-cover" />
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
