"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconBuddy, IconHome, IconPlan, IconTasks } from "./Icons";

const ITEMS = [
  { href: "/", label: "หน้าหลัก", Icon: IconHome },
  { href: "/plan", label: "วางแผน", Icon: IconPlan },
  { href: "/tasks", label: "ตามงาน", Icon: IconTasks },
  { href: "/buddy", label: "บัดดี้", Icon: IconBuddy },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="เมนูหลัก"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-rule bg-paper/92 backdrop-blur-md"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto grid max-w-[34rem] grid-cols-4 px-2">
        {ITEMS.map(({ href, label, Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href) || (href === "/buddy" && pathname.startsWith("/notes"));
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`relative flex min-h-[60px] flex-col items-center justify-center gap-0.5 font-ui text-[12.5px] transition-colors ${active ? "font-semibold text-ink" : "text-muted hover:text-ink"}`}
              >
                <span aria-hidden className={`absolute top-0 h-[3px] w-8 rounded-b-full bg-ink transition-opacity ${active ? "opacity-100" : "opacity-0"}`} />
                <Icon className="h-[22px] w-[22px]" strokeWidth={active ? 2.1 : 1.75} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
