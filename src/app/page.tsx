import Link from "next/link";
import { redirect } from "next/navigation";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { addDays, daysBetween, formatRange, formatThai, relativeDay, todayISO } from "@/lib/dates";
import { ProgressBar } from "@/components/ProgressBar";

export default async function Home({ searchParams }: PageProps<"/">) {
  const user = await requireUser();
  if (user.role === "BUDDY") redirect("/buddy");
  if (user.role === "TEACHER") redirect("/teacher");
  const { planned } = await searchParams;

  const today = todayISO();
  const include = {
    requests: { include: { subject: true }, orderBy: { subject: { sortOrder: "asc" as const } } },
    notes: { orderBy: { createdAt: "desc" as const } },
  };
  // Current or next upcoming absence; otherwise the most recent one.
  const absence =
    (await db.absence.findFirst({ where: { studentId: user.id, endDate: { gte: today } }, include, orderBy: { startDate: "asc" } })) ??
    (await db.absence.findFirst({ where: { studentId: user.id }, include, orderBy: { endDate: "desc" } }));
  const tasks = await db.task.findMany({ where: { studentId: user.id } });

  const done = tasks.filter((t) => t.done).length;
  const urgent = tasks.filter((t) => !t.done && t.dueDate <= addDays(today, 1)).length;

  const summary = (
    <>
      <Link href="/plan" className="btn min-h-14 w-full text-lg">+ วางแผนการขาดเรียน</Link>

      <Link href="/tasks" className="card flex items-center justify-between gap-3">
        <div className="flex-1 space-y-2">
          <div className="flex items-baseline justify-between">
            <span>ตามทันแล้ว</span>
            <span className="text-xl">{done}/{tasks.length}</span>
          </div>
          <ProgressBar value={done} max={tasks.length} label="ความคืบหน้าการตามงาน" />
          {urgent > 0 && <span className="chip-hl">ด่วน {urgent} งาน · ภายในพรุ่งนี้</span>}
        </div>
        <span aria-hidden className="text-muted">→</span>
      </Link>
    </>
  );

  return (
    <div className="space-y-5 py-3">
      <div>
        <h1 className="text-2xl">สวัสดี {user.nickname} 👋</h1>
        <p className="text-muted">วันนี้ {formatThai(today)}</p>
      </div>

      {planned && (
        <p role="status" className="card border-ok text-ok">ส่งคำขอถึงครูแล้ว รอครูตอบกลับได้เลย ✓</p>
      )}

      {absence ? (
        <AbsenceCard absence={absence} today={today} tasks={tasks}>
          {summary}
        </AbsenceCard>
      ) : (
        <>
          <div className="card text-muted">ยังไม่มีแผนการขาดเรียน ถ้าจะไปแข่ง กดปุ่มด้านล่างเพื่อบอกครูล่วงหน้า</div>
          {summary}
        </>
      )}
    </div>
  );
}

type AbsenceWithAll = Prisma.AbsenceGetPayload<{
  include: { requests: { include: { subject: true } }; notes: true };
}>;

function AbsenceCard({
  absence,
  today,
  tasks,
  children,
}: {
  children: React.ReactNode;
  absence: AbsenceWithAll;
  today: string;
  tasks: { subjectId: string | null; dueDate: string; done: boolean }[];
}) {
  const total = absence.requests.length;
  const replied = absence.requests.filter((r) => r.status === "REPLIED").length;
  const days = daysBetween(absence.startDate, absence.endDate) + 1;
  const ongoing = absence.startDate <= today && today <= absence.endDate;
  const upcoming = absence.startDate > today;
  const label = ongoing
    ? `กำลังขาดเรียน · วันที่ ${daysBetween(absence.startDate, today) + 1} จาก ${days}`
    : upcoming
      ? `ขาดเรียนครั้งถัดไป · ${relativeDay(absence.startDate, today)}`
      : "ขาดเรียนครั้งล่าสุด";
  const soon = addDays(today, 2);

  return (
    <section className="space-y-4" aria-labelledby="absence">
      <div className="card space-y-3">
        <p className="text-sm text-muted">{label}</p>
        <h2 id="absence" className="text-xl">{absence.eventName}</h2>
        <p>{formatRange(absence.startDate, absence.endDate)} · {days} วัน</p>
        <div className="space-y-1">
          <p className="flex justify-between text-sm">
            <span>ครูตอบแล้ว</span>
            <span>{replied}/{total}</span>
          </p>
          <ProgressBar value={replied} max={total} label="จำนวนครูที่ตอบแล้ว" />
        </div>
      </div>

      {children}

      <div className="space-y-2">
        <h2 className="text-lg">รายวิชา</h2>
        <ul className="space-y-2">
          {absence.requests.map((r) => {
            const notes = absence.notes.filter((n) => n.subjectId === r.subjectId);
            const ready = notes.find((n) => n.summaryStatus === "READY");
            const latest = ready ?? notes[0];
            const dueSoon = tasks
              .filter((t) => t.subjectId === r.subjectId && !t.done && t.dueDate <= soon)
              .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];
            return (
              <li key={r.id} className="card space-y-2">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-lg">{r.subject.name}</span>
                  <span className="text-sm text-muted">{r.subject.teacherName}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {dueSoon && <span className="chip-hl">งานส่ง{relativeDay(dueSoon.dueDate, today)}</span>}
                  {ready ? (
                    <span className="chip border-ok text-ok">สรุปพร้อมแล้ว</span>
                  ) : notes.length ? (
                    <span className="chip">ได้โน้ตแล้ว</span>
                  ) : (
                    <span className="chip">รอบัดดี้</span>
                  )}
                  {r.status === "PENDING" ? <span className="chip">รอครูตอบ</span> : r.workType === "NONE" ? <span className="chip">ไม่มีงาน</span> : null}
                  {r.extensionStatus === "APPROVED" && r.workType !== "NONE" && <span className="chip">เลื่อนแล้ว +3 วัน</span>}
                </div>
                {r.topics && <p className="text-sm text-muted">ครูสอน: {r.topics}</p>}
                {latest && (
                  <Link href={`/notes/${latest.id}`} className="inline-flex min-h-11 items-center underline underline-offset-4">
                    {ready ? "อ่านสรุปโน้ต →" : "ดูรูปโน้ต →"}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
