import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { formatRange, formatThai } from "@/lib/dates";
import { PageHeader, SectionLabel } from "@/components/ui";
import { ReplyForm } from "./ReplyForm";

export const metadata = { title: "คำขอจากนักเรียน · PassionSeed" };

const EXT_LABEL: Record<string, string> = { APPROVED: "เลื่อน +3 วัน", DENIED: "ไม่เลื่อน" };
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
    <div className="space-y-1">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
        <h3 className="text-[20px] leading-snug">{r.subject.name}</h3>
        <span className="meta">{r.subject.teacherName}</span>
      </div>
      <p className="font-ui text-[15px]">
        {r.absence.student.nickname} <span className="text-muted">· {r.absence.student.name} · {r.absence.student.classroom}</span>
      </p>
      <p className="meta">
        {r.absence.eventName} · ขาด {formatRange(r.absence.startDate, r.absence.endDate)}
        {r.absence.letterUrl && (
          <>
            {" · "}
            <a href={r.absence.letterUrl} target="_blank" rel="noopener noreferrer" className="text-ink underline decoration-1 underline-offset-4">ดูจดหมาย</a>
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
    <div className="space-y-9">
      <PageHeader kicker={`${user.nickname} · เดโม: ตอบแทนครูได้ทุกวิชา`} title="คำขอจากนักเรียน">
        บอกว่าสอนอะไรไป มีงานอะไร และจะให้เลื่อนส่งหรือไม่ ระบบจะใส่ลงรายการงานของนักเรียนให้เอง
      </PageHeader>

      <section aria-labelledby="pending" className="space-y-3">
        <SectionLabel id="pending" aside={pending.length ? undefined : "ครบแล้ว"}>
          {pending.length > 0 ? <span className="marker">รอตอบ {pending.length} คำขอ</span> : "รอตอบ"}
        </SectionLabel>
        {pending.length === 0 && <p className="meta">ตอบครบทุกคำขอแล้ว</p>}
        {pending.map((r) => (
          <article key={r.id} className="sheet space-y-5 p-4 sm:p-5">
            {header(r)}
            <div className="border-t border-rule pt-5">
              <ReplyForm req={view(r)} />
            </div>
          </article>
        ))}
      </section>

      <section aria-labelledby="replied">
        <SectionLabel id="replied" aside={`${replied.length} คำขอ`}>ตอบแล้ว</SectionLabel>
        <div className="divide-y divide-rule">
          {replied.map((r) => (
            <details key={r.id} className="group py-1">
              <summary className="-mx-2 flex min-h-11 cursor-pointer list-none flex-col gap-2 rounded-xl px-2 py-3 transition-colors hover:bg-sheet [&::-webkit-details-marker]:hidden">
                {header(r)}
                <span className="flex flex-wrap items-center gap-x-2 gap-y-1 font-ui text-[13.5px]">
                  <span className="tag">{WORK_LABEL[r.workType]}</span>
                  {r.dueDate && <span className="tag">ส่ง {formatThai(r.dueDate)}</span>}
                  {EXT_LABEL[r.extensionStatus] && <span className="tag">{EXT_LABEL[r.extensionStatus]}</span>}
                  <span className="ml-auto text-muted underline decoration-1 underline-offset-4 group-open:hidden">แก้ไข</span>
                </span>
              </summary>
              <div className="pt-3 pb-4">
                <ReplyForm req={view(r)} />
              </div>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
