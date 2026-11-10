import Link from "next/link";

const ROLE_LABEL: Record<string, string> = { STUDENT: "นักเรียน", BUDDY: "บัดดี้", TEACHER: "ครู" };

export function Header({ user }: { user: { nickname: string; role: string } | null }) {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-line bg-paper/95 px-4 py-2 backdrop-blur">
      <Link href="/" className="flex min-h-11 items-center gap-2 text-lg">
        <span aria-hidden className="text-2xl">🌱</span>
        <span>PassionSeed</span>
      </Link>
      <Link
        href="/login"
        className="flex min-h-11 items-center gap-2 rounded-xl border border-line bg-card px-3 text-sm"
        aria-label={user ? `ผู้ใช้ปัจจุบัน ${user.nickname} (${ROLE_LABEL[user.role]}) — สลับผู้ใช้` : "เลือกผู้ใช้"}
      >
        {user ? (
          <>
            <span>{user.nickname}</span>
            <span className="text-muted">· {ROLE_LABEL[user.role]}</span>
            <span aria-hidden className="text-muted">⇄</span>
          </>
        ) : (
          "เลือกผู้ใช้"
        )}
      </Link>
    </header>
  );
}
