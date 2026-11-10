import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { addDays, formatRange, formatThai, todayISO } from "@/lib/dates";
import { ProgressBar } from "@/components/ProgressBar";
import { NoteStatus } from "@/components/NoteStatus";
import { UploadForm } from "./UploadForm";

export const metadata = { title: "บัดดี้ · PassionSeed" };

const GOAL_HOURS = 10;

export default async function BuddyPage() {
  const user = await requireUser();
  if (user.role === "TEACHER") return <p className="py-6">หน้านี้สำหรับนักเรียนและบัดดี้</p>;
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

  return (
    <div className="space-y-5 py-3">
      <div>
        <h1 className="text-2xl">สวัสดี {me.nickname} 👋</h1>
        <p className="text-muted">ช่วยเพื่อนที่ไปแข่ง ด้วยการส่งรูปโน้ตในคาบเรียน</p>
      </div>

      <section className="card space-y-2" aria-labelledby="hours">
        <h2 id="hours" className="flex items-baseline justify-between">
          <span>ชั่วโมงจิตอาสา</span>
          <span className="text-2xl">{hours} <span className="text-base text-muted">/ {GOAL_HOURS} ชม.</span></span>
        </h2>
        <ProgressBar value={Math.min(hours, GOAL_HOURS)} max={GOAL_HOURS} label="ชั่วโมงจิตอาสาเทียบกับเป้า 10 ชั่วโมง" />
        <p className="text-sm text-muted">
          {hours >= GOAL_HOURS ? "ครบเป้าแล้ว ขอบคุณมาก!" : `อัปโหลด 1 ครั้ง = 0.5 ชม. · อีก ${Math.ceil((GOAL_HOURS - hours) / 0.5)} ครั้งครบเป้า`}
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

      <section aria-labelledby="mine" className="space-y-2">
        <h2 id="mine" className="text-lg">โน้ตที่ส่งไปแล้ว</h2>
        {uploads.length === 0 && <p className="text-muted">ยังไม่มี</p>}
        <ul className="space-y-2">
          {uploads.map((n) => (
            <li key={n.id}>
              <Link href={`/notes/${n.id}`} className="card flex min-h-11 items-center justify-between gap-2">
                <span>
                  <span className="block">{n.subject.name} · {formatThai(n.date)}</span>
                  <span className="block text-sm text-muted">ให้ {n.absence.student.nickname}</span>
                </span>
                <NoteStatus status={n.summaryStatus} />
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
    <div className="space-y-5 py-3">
      <div>
        <h1 className="text-2xl">โน้ตจากบัดดี้</h1>
        <p className="text-muted">เพื่อนส่งรูปโน้ตมาให้ พร้อมสรุปโดย AI</p>
      </div>
      {absences.length === 0 && <p className="card text-muted">ยังไม่มีการขาดเรียน</p>}
      {absences.map((a) => {
        const waiting = a.requests.filter((r) => !a.notes.some((n) => n.subjectId === r.subjectId));
        return (
          <section key={a.id} className="space-y-2" aria-labelledby={`a-${a.id}`}>
            <h2 id={`a-${a.id}`} className="text-lg">
              {a.eventName} <span className="text-base text-muted">· {formatRange(a.startDate, a.endDate)}</span>
            </h2>
            <ul className="space-y-2">
              {a.notes.map((n) => (
                <li key={n.id}>
                  <Link href={`/notes/${n.id}`} className="card flex min-h-11 items-center justify-between gap-2">
                    <span>
                      <span className="block">{n.subject.name} · {formatThai(n.date)}</span>
                      <span className="block text-sm text-muted">จาก {n.buddy.nickname}</span>
                    </span>
                    <NoteStatus status={n.summaryStatus} />
                  </Link>
                </li>
              ))}
              {waiting.map((r) => (
                <li key={r.id} className="card flex items-center justify-between text-muted">
                  <span>{r.subject.name}</span>
                  <span className="chip">รอบัดดี้</span>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
