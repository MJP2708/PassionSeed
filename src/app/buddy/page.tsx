import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { addDays, formatRange, formatThai, todayISO } from "@/lib/dates";
import { Meter, PageHeader, SectionLabel, Status } from "@/components/ui";
import { IconArrow } from "@/components/Icons";
import { UploadForm } from "./UploadForm";

export const metadata = { title: "บัดดี้ · PassionSeed" };

const GOAL_HOURS = 10;

function NoteStatus({ status }: { status: string }) {
  if (status === "READY") return <Status tone="ok">สรุปพร้อม</Status>;
  if (status === "ERROR") return <Status tone="wait">ดูรูปต้นฉบับ</Status>;
  return <Status tone="ink">AI กำลังสรุป</Status>;
}

export default async function BuddyPage() {
  const user = await requireUser();
  if (user.role === "TEACHER") return <p className="pt-6">หน้านี้สำหรับนักเรียนและบัดดี้</p>;
  return user.role === "BUDDY" ? <BuddyView userId={user.id} /> : <StudentNotes userId={user.id} />;
}

async function BuddyView({ userId }: { userId: string }) {
  const today = todayISO();
  const [me, absences, uploads] = await Promise.all([
    db.user.findUniqueOrThrow({ where: { id: userId } }),
    // Classmates who are away now or were away in the last 2 weeks.
    db.absence.findMany({
      where: { endDate: { gte: addDays(today, -14) }, startDate: { lte: addDays(today, 1) } },
      include: { student: true, requests: { include: { subject: true }, orderBy: { subject: { sortOrder: "asc" } } } },
      orderBy: { startDate: "desc" },
    }),
    db.noteUpload.findMany({
      where: { buddyId: userId },
      include: { subject: true, absence: { include: { student: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  const hours = me.volunteerHours;
  const left = Math.max(0, Math.ceil((GOAL_HOURS - hours) / 0.5));

  return (
    <div className="space-y-8">
      <PageHeader kicker="บัดดี้" title={`สวัสดี ${me.nickname}`}>
        ช่วยเพื่อนที่ไปแข่ง ด้วยการถ่ายรูปกระดานหรือโน้ตในคาบเรียน
      </PageHeader>

      <section aria-labelledby="hours" className="space-y-2.5">
        <div className="flex items-end justify-between gap-3">
          <h2 id="hours" className="font-ui text-[15px] font-medium">ชั่วโมงจิตอาสา</h2>
          <p className="text-[34px] leading-none tabular-nums">
            {hours}<span className="text-[18px] text-muted"> / {GOAL_HOURS} ชม.</span>
          </p>
        </div>
        <Meter value={Math.min(hours * 2, GOAL_HOURS * 2)} max={GOAL_HOURS * 2} label="ชั่วโมงจิตอาสา เทียบกับเป้า 10 ชั่วโมง" />
        <p className="meta">
          {left === 0 ? "ครบเป้าแล้ว ขอบคุณมาก" : `ส่งโน้ต 1 ครั้ง = 0.5 ชม. · อีก ${left} ครั้งครบเป้า`}
        </p>
      </section>

      <UploadForm
        today={today}
        absences={absences.map((a) => ({
          id: a.id,
          studentName: a.student.nickname,
          eventName: a.eventName,
          startDate: a.startDate,
          endDate: a.endDate,
          subjects: a.requests.map((r) => ({ id: r.subject.id, name: r.subject.name })),
        }))}
      />

      <section aria-labelledby="mine">
        <SectionLabel id="mine" aside={uploads.length ? `${uploads.length} ครั้ง` : undefined}>โน้ตที่ส่งไปแล้ว</SectionLabel>
        {uploads.length === 0 && <p className="meta py-3">ยังไม่ได้ส่งโน้ต</p>}
        <ul className="divide-y divide-rule">
          {uploads.map((n) => (
            <li key={n.id}>
              <Link href={`/notes/${n.id}`} className="-mx-2 flex min-h-16 items-center gap-3 rounded-xl px-2 py-3 transition-colors hover:bg-sheet">
                <span className="min-w-0 flex-1">
                  <span className="block text-[17.5px]">{n.subject.name}</span>
                  <span className="meta block">คาบ {formatThai(n.date)} · ให้ {n.absence.student.nickname}</span>
                </span>
                <NoteStatus status={n.summaryStatus} />
                <IconArrow className="h-4 w-4 text-muted" />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

async function StudentNotes({ userId }: { userId: string }) {
  const absences = await db.absence.findMany({
    where: { studentId: userId },
    include: {
      notes: { include: { subject: true, buddy: true }, orderBy: [{ date: "asc" }, { createdAt: "asc" }] },
      requests: { include: { subject: true }, orderBy: { subject: { sortOrder: "asc" } } },
    },
    orderBy: { startDate: "desc" },
  });

  return (
    <div className="space-y-8">
      <PageHeader title="โน้ตจากบัดดี้">เพื่อนถ่ายรูปโน้ตมาให้ พร้อมสรุปโดย AI</PageHeader>
      {absences.length === 0 && <p className="meta">ยังไม่มีการขาดเรียน</p>}
      {absences.map((a) => {
        const waiting = a.requests.filter((r) => !a.notes.some((n) => n.subjectId === r.subjectId));
        return (
          <section key={a.id} aria-labelledby={`a-${a.id}`}>
            <SectionLabel id={`a-${a.id}`} aside={formatRange(a.startDate, a.endDate)}>{a.eventName}</SectionLabel>
            <ul className="divide-y divide-rule">
              {a.notes.map((n) => (
                <li key={n.id}>
                  <Link href={`/notes/${n.id}`} className="-mx-2 flex min-h-16 items-center gap-3 rounded-xl px-2 py-3 transition-colors hover:bg-sheet">
                    <span className="min-w-0 flex-1">
                      <span className="block text-[17.5px]">{n.subject.name}</span>
                      <span className="meta block">คาบ {formatThai(n.date)} · จาก {n.buddy.nickname}</span>
                    </span>
                    <NoteStatus status={n.summaryStatus} />
                    <IconArrow className="h-4 w-4 text-muted" />
                  </Link>
                </li>
              ))}
              {waiting.map((r) => (
                <li key={r.id} className="flex min-h-16 items-center justify-between gap-3 py-3">
                  <span className="text-[17.5px] text-muted">{r.subject.name}</span>
                  <Status tone="wait">รอบัดดี้</Status>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
