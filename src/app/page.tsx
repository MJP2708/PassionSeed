import Link from "next/link";
import { redirect } from "next/navigation";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { addDays, daysBetween, dayOf, formatThai, monthShort, relativeDay, todayISO } from "@/lib/dates";
import { Meter, PageHeader, SectionLabel, Status } from "@/components/ui";
import { IconArrow, IconPlus } from "@/components/Icons";

const absenceInclude = {
  requests: { include: { subject: true }, orderBy: { subject: { sortOrder: "asc" } } },
  notes: { orderBy: { createdAt: "desc" } },
} satisfies Prisma.AbsenceInclude;

type AbsenceWithAll = Prisma.AbsenceGetPayload<{ include: typeof absenceInclude }>;
type TaskLite = { subjectId: string | null; dueDate: string; done: boolean };

export default async function Home({ searchParams }: PageProps<"/">) {
  const user = await requireUser();
  if (user.role === "BUDDY") redirect("/buddy");
  if (user.role === "TEACHER") redirect("/teacher");
  const { planned } = await searchParams;
  const today = todayISO();

  // One round of parallel queries: current/next absence, latest past absence, tasks.
  const [upcoming, latest, tasks] = await Promise.all([
    db.absence.findFirst({ where: { studentId: user.id, endDate: { gte: today } }, include: absenceInclude, orderBy: { startDate: "asc" } }),
    db.absence.findFirst({ where: { studentId: user.id }, include: absenceInclude, orderBy: { endDate: "desc" } }),
    db.task.findMany({ where: { studentId: user.id }, select: { subjectId: true, dueDate: true, done: true } }),
  ]);
  const absence = upcoming ?? latest;

  const done = tasks.filter((t) => t.done).length;
  const urgent = tasks.filter((t) => !t.done && t.dueDate <= addDays(today, 1)).length;

  return (
    <div className="space-y-8">
      <PageHeader kicker={formatThai(today)} title={`สวัสดี ${user.nickname}`} />

      {planned && (
        <p role="status" className="sheet flex items-center gap-2 px-4 py-3 font-ui text-[15px]">
          <span aria-hidden className="h-2 w-2 rounded-full bg-ok" />
          ส่งคำขอถึงครูแล้ว รอครูตอบกลับได้เลย
        </p>
      )}

      {absence ? (
        <AbsenceTicket absence={absence} today={today} />
      ) : (
        <div className="rounded-2xl border border-dashed border-rule-strong px-5 py-6 text-center">
          <p className="text-[18px]">ยังไม่มีแผนการขาดเรียน</p>
          <p className="meta mt-1">ถ้าจะไปแข่ง บอกครูล่วงหน้าได้ที่ปุ่มด้านล่าง</p>
        </div>
      )}

      <div className="space-y-3">
        <Link href="/plan" className="btn min-h-14 w-full text-[16.5px]">
          <IconPlus className="h-5 w-5" /> วางแผนการขาดเรียน
        </Link>

        <Link href="/tasks" className="group flex items-center gap-4 rounded-2xl border border-rule px-4 py-4 transition-colors hover:bg-sheet">
          <div className="min-w-0 flex-1 space-y-2.5">
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-ui text-[15px] font-medium">ตามทันแล้ว</span>
              <span className="text-[26px] leading-none tabular-nums">
                {done}<span className="text-[17px] text-muted">/{tasks.length}</span>
              </span>
            </div>
            <Meter value={done} max={tasks.length} label="จำนวนงานที่ตามทันแล้ว" />
            {urgent > 0 ? (
              <p className="font-ui text-[14px]"><span className="marker font-medium">ด่วน {urgent} งาน</span> ต้องส่งภายในพรุ่งนี้</p>
            ) : (
              <p className="meta">ไม่มีงานด่วน</p>
            )}
          </div>
          <IconArrow className="h-5 w-5 shrink-0 text-muted transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {absence && <SubjectList absence={absence} today={today} tasks={tasks} />}
    </div>
  );
}

function AbsenceTicket({ absence, today }: { absence: AbsenceWithAll; today: string }) {
  const total = absence.requests.length;
  const replied = absence.requests.filter((r) => r.status === "REPLIED").length;
  const days = daysBetween(absence.startDate, absence.endDate) + 1;
  const ongoing = absence.startDate <= today && today <= absence.endDate;
  const status = ongoing
    ? `กำลังขาดเรียน · วันที่ ${daysBetween(absence.startDate, today) + 1} จาก ${days}`
    : absence.startDate > today
      ? `ขาดเรียนครั้งถัดไป · ${relativeDay(absence.startDate, today)}`
      : "ขาดเรียนครั้งล่าสุด";
  const sameMonth = monthShort(absence.startDate) === monthShort(absence.endDate);

  return (
    <section aria-labelledby="absence" className="sheet grid grid-cols-[auto_1fr] overflow-hidden">
      {/* date stub, like the torn-off part of a ticket */}
      <div className="flex min-w-[92px] flex-col items-center justify-center border-r border-dashed border-rule-strong bg-paper px-3 py-4 text-center">
        <span className="text-[30px] leading-none tabular-nums">
          {dayOf(absence.startDate)}
          {days > 1 && <span className="text-muted">–</span>}
          {days > 1 && (sameMonth ? dayOf(absence.endDate) : "")}
        </span>
        <span className="mt-1.5 font-ui text-[13px] text-muted">
          {sameMonth ? monthShort(absence.startDate) : `${monthShort(absence.startDate)} – ${dayOf(absence.endDate)} ${monthShort(absence.endDate)}`}
        </span>
        <span className="mt-2 font-ui text-[12px] text-muted">{days} วัน</span>
      </div>
      <div className="min-w-0 space-y-3 px-4 py-4">
        <div className="space-y-1">
          <Status tone={ongoing ? "ink" : "wait"}>{status}</Status>
          <h2 id="absence" className="text-[20px] leading-snug">{absence.eventName}</h2>
        </div>
        <div className="space-y-1.5">
          <p className="flex justify-between font-ui text-[13.5px]">
            <span className="text-muted">ครูตอบกลับแล้ว</span>
            <span className="font-medium tabular-nums">{replied}/{total}</span>
          </p>
          <Meter value={replied} max={total} label="จำนวนครูที่ตอบแล้ว" />
        </div>
      </div>
    </section>
  );
}

function SubjectList({ absence, today, tasks }: { absence: AbsenceWithAll; today: string; tasks: TaskLite[] }) {
  const soon = addDays(today, 2);
  return (
    <section aria-labelledby="subjects">
      <SectionLabel id="subjects" aside={`${absence.requests.length} วิชา`}>วิชาที่ขาด</SectionLabel>
      <ul className="divide-y divide-rule">
        {absence.requests.map((r) => {
          const notes = absence.notes.filter((n) => n.subjectId === r.subjectId);
          const ready = notes.find((n) => n.summaryStatus === "READY");
          const target = ready ?? notes[0];
          const dueSoon = tasks
            .filter((t) => t.subjectId === r.subjectId && !t.done && t.dueDate <= soon)
            .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];

          const body = (
            <>
              <div className="min-w-0 flex-1">
                <p className="text-[18px] leading-snug">{r.subject.name}</p>
                <p className="meta truncate">
                  {r.topics ? `สอน: ${r.topics}` : r.subject.teacherName}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1 text-right">
                {ready ? (
                  <Status tone="ok">สรุปพร้อม</Status>
                ) : notes.length ? (
                  <Status tone="ink">ได้โน้ตแล้ว</Status>
                ) : (
                  <Status tone="wait">รอบัดดี้</Status>
                )}
                {dueSoon ? (
                  <span className="font-ui text-[13.5px]"><span className="marker">ส่ง{relativeDay(dueSoon.dueDate, today)}</span></span>
                ) : r.status === "PENDING" ? (
                  <span className="meta">รอครูตอบ</span>
                ) : null}
              </div>
              {target && <IconArrow className="h-4 w-4 shrink-0 text-muted" />}
            </>
          );

          return (
            <li key={r.id}>
              {target ? (
                <Link href={`/notes/${target.id}`} className="-mx-2 flex min-h-[68px] items-center gap-3 rounded-xl px-2 py-3 transition-colors hover:bg-sheet">
                  {body}
                </Link>
              ) : (
                <div className="flex min-h-[68px] items-center gap-3 py-3">{body}</div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
