import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { formatThai } from "@/lib/dates";
import { parseSummary } from "@/lib/summary-schema";
import { Meter, SectionLabel } from "@/components/ui";
import { IconBack, IconExternal, IconSpark } from "@/components/Icons";
import { RetryButton, SummaryRunner } from "./SummaryRunner";

const CONFIDENCE = {
  high: { level: 3, label: "อ่านได้ชัด", note: "" },
  medium: { level: 2, label: "อ่านได้บางส่วน", note: "บางส่วนอ่านไม่ออก เปิดรูปจริงประกอบด้วย" },
  low: { level: 1, label: "อ่านได้น้อย", note: "รูปไม่ชัดเป็นส่วนใหญ่ ใช้รูปจริงเป็นหลัก และขอให้เพื่อนถ่ายใหม่" },
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
  const canRerun = photos.some((u) => !u.toLowerCase().endsWith(".svg"));
  const summary = note.summaryStatus === "READY" ? parseSummary(note.summaryJson) : null;
  const busy = note.summaryStatus === "PENDING" || note.summaryStatus === "PROCESSING";
  const error =
    note.summaryStatus === "ERROR"
      ? note.summaryError ?? "สรุปไม่สำเร็จ"
      : note.summaryStatus === "READY" && !summary
        ? "ข้อมูลสรุปเสียหาย ลองสรุปใหม่"
        : null;
  const conf = summary ? CONFIDENCE[summary.confidence] : null;

  return (
    <article className="space-y-7">
      <SummaryRunner noteId={note.id} status={note.summaryStatus} />

      <header className="space-y-1 pt-3">
        <Link href="/buddy" className="-ml-1 mb-1 inline-flex min-h-11 items-center gap-1.5 px-1 font-ui text-[14px] text-muted hover:text-ink">
          <IconBack className="h-4 w-4" /> โน้ตทั้งหมด
        </Link>
        <p className="meta">คาบ {formatThai(note.date)} · โน้ตจาก {note.buddy.nickname} ถึง {note.absence.student.nickname}</p>
        <h1 className="text-[30px] leading-tight">{note.subject.name}</h1>
      </header>

      <p className="flex items-start gap-2.5 border-l-[3px] border-ink py-0.5 pl-3 font-ui text-[14.5px] leading-snug">
        <IconSpark className="mt-0.5 h-[18px] w-[18px] shrink-0" />
        <span>
          AI ช่วยสรุป · เทียบกับรูปโน้ตจริงเสมอ{" "}
          <a href="#photos" className="whitespace-nowrap font-medium underline decoration-1 underline-offset-4">ดูรูปจริง</a>
        </span>
      </p>

      {note.emphasis && (
        <figure className="space-y-1">
          <figcaption className="meta">{note.buddy.nickname} บอกว่าครูเน้น</figcaption>
          <blockquote className="text-[19px] leading-snug">“{note.emphasis}”</blockquote>
        </figure>
      )}

      {busy && (
        <div role="status" aria-live="polite" className="space-y-4">
          <p className="flex items-center gap-2 font-ui text-[15px]">
            <IconSpark className="h-[18px] w-[18px] animate-pulse" /> AI กำลังอ่านรูปโน้ต ใช้เวลาราว 10–40 วินาที
          </p>
          <div className="space-y-2.5" aria-hidden>
            {[92, 78, 85, 60].map((w, i) => (
              <div key={i} className="skeleton h-4" style={{ width: `${w}%` }} />
            ))}
          </div>
        </div>
      )}

      {error && (
        <div role="alert" className="space-y-3 rounded-2xl border border-bad/40 bg-sheet p-4">
          <p className="font-ui text-[15px] font-medium text-bad">{error}</p>
          <p className="meta">รูปโน้ตต้นฉบับยังอยู่ด้านล่าง อ่านจากรูปได้เลย</p>
          {canRerun && <RetryButton noteId={note.id} />}
        </div>
      )}

      {summary && conf && (
        <div className="space-y-8">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between font-ui text-[14px]">
              <span className="text-muted">AI อ่านรูปได้</span>
              <span className={`font-medium ${summary.confidence === "low" ? "marker" : ""}`}>{conf.label}</span>
            </div>
            <Meter value={conf.level} max={3} label={`ความมั่นใจของ AI: ${conf.label}`} />
            {conf.note && <p className="meta">{conf.note}</p>}
          </div>

          <section aria-labelledby="covered">
            <SectionLabel id="covered">เรียนอะไรไปบ้าง</SectionLabel>
            {summary.covered.length ? (
              <ol className="mt-1 divide-y divide-rule">
                {summary.covered.map((c, i) => (
                  <li key={i} className="flex gap-3 py-2.5">
                    <span className="w-6 shrink-0 pt-0.5 font-ui text-[13px] tabular-nums text-muted">{String(i + 1).padStart(2, "0")}</span>
                    <span className="text-[17.5px] leading-snug">{c}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="meta py-2">AI อ่านเนื้อหาจากรูปไม่ออก</p>
            )}
          </section>

          {summary.keyTerms.length > 0 && (
            <section aria-labelledby="terms">
              <SectionLabel id="terms">คำสำคัญ · สูตร</SectionLabel>
              <ul className="mt-2.5 flex flex-wrap gap-2">
                {summary.keyTerms.map((k, i) => (
                  <li key={i} className="rounded-lg border border-rule-strong bg-sheet px-2.5 py-1 text-[16px] leading-snug">{k}</li>
                ))}
              </ul>
            </section>
          )}

          {summary.questionsToAsk.length > 0 && (
            <section aria-labelledby="ask">
              <SectionLabel id="ask">ถามครูหรือเพื่อนเพิ่ม</SectionLabel>
              <ul className="mt-1 divide-y divide-rule">
                {summary.questionsToAsk.map((q, i) => (
                  <li key={i} className="flex gap-3 py-2.5">
                    <span aria-hidden className="w-6 shrink-0 pt-0.5 font-ui text-[15px] font-semibold">?</span>
                    <span className="text-[17.5px] leading-snug">{q}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {canRerun && (
            <div className="flex justify-end">
              <RetryButton noteId={note.id} label="ให้ AI สรุปใหม่" />
            </div>
          )}
        </div>
      )}

      <section id="photos" aria-labelledby="ph" className="scroll-mt-20">
        <SectionLabel id="ph" aside={`${photos.length} รูป`}>รูปโน้ตต้นฉบับ</SectionLabel>
        <ul className="mt-2.5 grid grid-cols-2 gap-3">
          {photos.map((url, i) => (
            <li key={url}>
              <a href={url} target="_blank" rel="noopener noreferrer" className="group block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`รูปโน้ตที่ ${i + 1}`} className="aspect-[4/3] w-full rounded-xl border border-rule bg-sheet object-cover transition-opacity group-hover:opacity-90" />
                <span className="meta mt-1.5 flex items-center gap-1">
                  รูปที่ {i + 1} · เปิดขนาดเต็ม <IconExternal className="h-3.5 w-3.5" />
                </span>
              </a>
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}
