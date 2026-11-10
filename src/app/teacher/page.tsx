import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { formatRange, formatThai } from "@/lib/dates";
import { ReplyForm } from "./ReplyForm";

export const metadata = { title: "คำขอจากนักเรียน · PassionSeed" };

const EXT_LABEL: Record<string, string> = { APPROVED: "อนุมัติเลื่อน +3 วัน", DENIED: "ไม่อนุมัติเลื่อน" };
const WORK_LABEL: Record<string, string> = { NONE: "ไม่มีงาน", WORKSHEET: "ใบงาน", QUIZ: "สอบย่อย" };

export default async function TeacherPage() {
  const user = await requireUser("TEACHER");
  const requests = await db.teacherRequest.findMany({
    include: { subject: true, absence: { include: { student: true } } },
    orderBy: [{ absence: { startDate: "desc" } }, { subject: { sortOrder: "asc" } }],
  });
  const pending = requests.filter((r) => r.status === "PENDING");
  const replied = requests.filter((r) => r.status === "REPLIED");

  const header = (r: (typeof requests)[number]) => (
    <div className="space-y-0.5">
      <p className="flex flex-wrap items-baseline justify-between gap-x-2">
        <span className="text-lg">{r.subject.name}</span>
        <span className="text-sm text-muted">{r.subject.teacherName}</span>
      </p>
      <p>
        {r.absence.student.nickname} ({r.absence.student.name}) · {r.absence.student.classroom}
      </p>
      <p className="text-sm text-muted">
        {r.absence.eventName} · ขาด {formatRange(r.absence.startDate, r.absence.endDate)}
        {r.absence.letterUrl && (
          <>
            {" · "}
            <a href={r.absence.letterUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">ดูจดหมาย</a>
          </>
        )}
      </p>
    </div>
  );

  const view = (r: (typeof requests)[number]) => ({
    id: r.id,
    topics: r.topics,
    workType: r.workType,
    originalDueDate: r.originalDueDate,
    extensionStatus: r.extensionStatus,
    absenceEnd: r.absence.endDate,
  });

  return (
    <div className="space-y-6 py-3">
      <div>
        <h1 className="text-2xl">คำขอจากนักเรียน</h1>
        <p className="text-muted">
          สวัสดี {user.nickname} · <span className="text-sm">เดโม: บัญชีนี้ตอบแทนครูได้ทุกวิชา</span>
        </p>
      </div>

      <section aria-labelledby="pending" className="space-y-3">
        <h2 id="pending" className="flex items-center gap-2 text-lg">
          {pending.length > 0 ? <span className="chip-hl">รอตอบ {pending.length}</span> : "รอตอบ"}
        </h2>
        {pending.length === 0 && <p className="text-muted">ตอบครบทุกคำขอแล้ว</p>}
        {pending.map((r) => (
          <article key={r.id} className="card space-y-4 border-ink">
            {header(r)}
            <ReplyForm req={view(r)} />
          </article>
        ))}
      </section>

      <section aria-labelledby="replied" className="space-y-3">
        <h2 id="replied" className="text-lg">ตอบแล้ว ({replied.length})</h2>
        {replied.map((r) => (
          <details key={r.id} className="card group">
            <summary className="flex min-h-11 cursor-pointer list-none flex-col gap-1">
              {header(r)}
              <span className="flex flex-wrap gap-1.5 text-sm">
                <span className="chip">{WORK_LABEL[r.workType]}</span>
                {r.dueDate && <span className="chip">ส่ง {formatThai(r.dueDate)}</span>}
                {EXT_LABEL[r.extensionStatus] && <span className="chip">{EXT_LABEL[r.extensionStatus]}</span>}
                <span className="ml-auto text-muted group-open:hidden">แก้ไข ▾</span>
              </span>
            </summary>
            <div className="mt-4 border-t border-line pt-4">
              <ReplyForm req={view(r)} />
            </div>
          </details>
        ))}
      </section>
    </div>
  );
}
