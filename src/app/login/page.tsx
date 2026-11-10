import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { switchUser } from "@/app/actions/session";

const GROUPS = [
  { role: "STUDENT", title: "นักเรียน (ขาดเรียนไปแข่ง)" },
  { role: "BUDDY", title: "บัดดี้ (เพื่อนที่ช่วยจดโน้ต)" },
  { role: "TEACHER", title: "ครู" },
] as const;

export default async function LoginPage() {
  const [users, current] = await Promise.all([
    db.user.findMany({ orderBy: { createdAt: "asc" } }),
    getCurrentUser(),
  ]);

  return (
    <div className="space-y-6 py-4">
      <div>
        <h1 className="text-2xl">เลือกผู้ใช้สำหรับเดโม</h1>
        <p className="text-muted">ไม่มีการล็อกอินจริง กดเลือกเพื่อสลับมุมมองได้ตลอดเวลา</p>
      </div>
      {GROUPS.map((g) => {
        const list = users.filter((u) => u.role === g.role);
        if (!list.length) return null;
        return (
          <section key={g.role} aria-labelledby={`g-${g.role}`} className="space-y-2">
            <h2 id={`g-${g.role}`} className="text-lg text-muted">{g.title}</h2>
            {list.map((u) => (
              <form key={u.id} action={switchUser}>
                <input type="hidden" name="userId" value={u.id} />
                <button
                  type="submit"
                  className="card flex min-h-16 w-full items-center justify-between text-left transition active:scale-[.99]"
                  aria-current={current?.id === u.id ? "true" : undefined}
                >
                  <span>
                    <span className="block text-lg">{u.nickname}</span>
                    <span className="block text-sm text-muted">
                      {u.name}{u.classroom ? ` · ${u.classroom}` : ""}
                      {u.role === "BUDDY" ? ` · จิตอาสา ${u.volunteerHours} ชม.` : ""}
                    </span>
                  </span>
                  {current?.id === u.id ? <span className="chip">กำลังใช้</span> : <span aria-hidden className="text-muted">→</span>}
                </button>
              </form>
            ))}
          </section>
        );
      })}
    </div>
  );
}
