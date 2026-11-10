import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { formatRange, todayISO } from "@/lib/dates";
import { TIMETABLE } from "@/lib/timetable";
import { PlanForm } from "./PlanForm";

export const metadata = { title: "วางแผนการขาดเรียน · PassionSeed" };

export default async function PlanPage() {
  const user = await requireUser("STUDENT");
  const absences = await db.absence.findMany({
    where: { studentId: user.id },
    include: { requests: true },
    orderBy: { startDate: "desc" },
  });

  return (
    <div className="space-y-5 py-3">
      <div>
        <h1 className="text-2xl">วางแผนการขาดเรียน</h1>
        <p className="text-muted">บอกครูล่วงหน้า แล้วให้เพื่อนช่วยจดโน้ตระหว่างที่ไม่อยู่</p>
      </div>
      <PlanForm today={todayISO()} subjects={TIMETABLE.map((s) => ({ ...s }))} />

      {absences.length > 0 && (
        <section aria-labelledby="past" className="space-y-2">
          <h2 id="past" className="text-lg">ที่วางแผนไว้แล้ว</h2>
          <ul className="space-y-2">
            {absences.map((a) => {
              const replied = a.requests.filter((r) => r.status === "REPLIED").length;
              return (
                <li key={a.id} className="card">
                  <p>{a.eventName}</p>
                  <p className="text-sm text-muted">
                    {formatRange(a.startDate, a.endDate)} · ครูตอบแล้ว {replied}/{a.requests.length}
                    {a.letterUrl && (
                      <>
                        {" · "}
                        <a href={a.letterUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">จดหมาย</a>
                      </>
                    )}
                  </p>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
