import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { switchUser } from "@/app/actions/session";
import { PageHeader, SectionLabel } from "@/components/ui";
import { LoginRow } from "./LoginRow";
import { initialOf } from "@/lib/initial";

const GROUPS = [
  { role: "STUDENT", title: "นักเรียนที่ไปแข่ง" },
  { role: "BUDDY", title: "บัดดี้ · เพื่อนที่ช่วยจดโน้ต" },
  { role: "TEACHER", title: "ครู" },
] as const;

export default async function LoginPage() {
  const [users, current] = await Promise.all([
    db.user.findMany({ orderBy: { createdAt: "asc" } }),
    getCurrentUser(),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader kicker="เดโม · ไม่มีการล็อกอินจริง" title="วันนี้ใช้งานในฐานะใคร?">
        เลือกหนึ่งคนเพื่อดูแอปจากมุมของเขา สลับได้ตลอดจากมุมขวาบน
      </PageHeader>
      {GROUPS.map((g) => {
        const list = users.filter((u) => u.role === g.role);
        if (!list.length) return null;
        return (
          <section key={g.role} aria-labelledby={`g-${g.role}`}>
            <SectionLabel id={`g-${g.role}`}>{g.title}</SectionLabel>
            <div className="sheet mt-2 divide-y divide-rule overflow-hidden">
              {list.map((u) => (
                <form key={u.id} action={switchUser}>
                  <input type="hidden" name="userId" value={u.id} />
                  <LoginRow
                    initial={initialOf(u.nickname)}
                    name={u.nickname}
                    current={current?.id === u.id}
                    meta={[u.name, u.classroom, u.role === "BUDDY" ? `จิตอาสา ${u.volunteerHours} ชม.` : null].filter(Boolean).join(" · ")}
                  />
                </form>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
