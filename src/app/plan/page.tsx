import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { formatRange, todayISO } from "@/lib/dates";
import { TIMETABLE } from "@/lib/timetable";
import { PageHeader, SectionLabel, Status } from "@/components/ui";
import { PlanForm } from "./PlanForm";

export const metadata = { title: "วางแผนการขาดเรียน · PassionSeed" };

export default async function PlanPage() {
  const user = await requireUser("STUDENT");
  const absences = await db.absence.findMany({
    where: { studentId: user.id },
    include: { requests: { select: { status: true } } },
    orderBy: { startDate: "desc" },
  });

  return (
    <div className="space-y-8">
      <PageHeader title="วางแผนการขาดเรียน">บอกครูล่วงหน้า แล้วให้บัดดี้ช่วยจดโน้ตระหว่างที่ไม่อยู่</PageHeader>
      <PlanForm today={todayISO()} subjects={TIMETABLE.map((s) => ({ ...s }))} />

      {absences.length > 0 && (
        <section aria-labelledby="past">
          <SectionLabel id="past">ที่วางแผนไว้แล้ว</SectionLabel>
          <ul className="divide-y divide-rule">
            {absences.map((a) => {
              const replied = a.requests.filter((r) => r.status === "REPLIED").length;
              const all = replied === a.requests.length;
              return (
                <li key={a.id} className="flex min-h-16 items-center gap-3 py-3">
                  <span className="min-w-0 flex-1">
                    <span className="block text-[17.5px] leading-snug">{a.eventName}</span>
                    <span className="meta block">
                      {formatRange(a.startDate, a.endDate)}
                      {a.letterUrl && (
                        <>
                          {" · "}
                          <a href={a.letterUrl} target="_blank" rel="noopener noreferrer" className="underline decoration-1 underline-offset-4">จดหมาย</a>
                        </>
                      )}
                    </span>
                  </span>
                  <Status tone={all ? "ok" : "wait"}>ครูตอบ {replied}/{a.requests.length}</Status>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
