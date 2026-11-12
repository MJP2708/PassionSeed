import Link from "next/link";
import { IconSwap, Mark } from "./Icons";
import { initialOf } from "@/lib/initial";

const ROLE_LABEL: Record<string, string> = { STUDENT: "นักเรียน", BUDDY: "บัดดี้", TEACHER: "ครู" };

export function Header({ user }: { user: { nickname: string; role: string } | null }) {
  return (
    <header
      className="sticky top-0 z-10 flex items-center justify-between gap-3 bg-paper/90 px-5 py-2.5 backdrop-blur-md"
      style={{ paddingTop: "max(0.625rem, env(safe-area-inset-top))" }}
    >
      <Link href="/" className="-ml-1 flex min-h-11 items-center gap-1.5 px-1 text-[19px]">
        <Mark className="h-[22px] w-[22px] text-ink" />
        <span>PassionSeed</span>
      </Link>
      <Link
        href="/login"
        className="flex min-h-11 items-center gap-2 rounded-full py-1 pr-3 pl-1 font-ui text-[14px] transition-colors hover:bg-rule/60"
        aria-label={user ? `ผู้ใช้ปัจจุบัน ${user.nickname} (${ROLE_LABEL[user.role]}) — สลับผู้ใช้` : "เลือกผู้ใช้"}
      >
        {user ? (
          <>
            <span aria-hidden className="flex h-8 w-8 items-center justify-center rounded-full bg-ink font-sans text-[15px] text-paper">
              {initialOf(user.nickname)}
            </span>
            <span className="leading-tight">
              <span className="block font-medium">{user.nickname}</span>
              <span className="block text-[12px] text-muted">{ROLE_LABEL[user.role]}</span>
            </span>
            <IconSwap className="ml-0.5 h-4 w-4 text-muted" />
          </>
        ) : (
          <span className="px-2">เลือกผู้ใช้</span>
        )}
      </Link>
    </header>
  );
}
