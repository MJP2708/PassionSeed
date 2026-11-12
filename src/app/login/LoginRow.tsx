"use client";

import { useFormStatus } from "react-dom";
import { Spinner } from "@/components/ui";
import { IconArrow } from "@/components/Icons";

export function LoginRow({ initial, name, meta, current }: { initial: string; name: string; meta: string; current: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-current={current ? "true" : undefined}
      className="flex min-h-[68px] w-full items-center gap-3.5 px-4 py-3 text-left transition-colors hover:bg-paper active:bg-rule/50"
    >
      <span aria-hidden className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[18px] ${current ? "bg-ink text-paper" : "border border-rule-strong bg-paper"}`}>
        {initial}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[18px] leading-tight">{name}</span>
        <span className="meta block truncate">{meta}</span>
      </span>
      {pending ? (
        <Spinner className="h-5 w-5 text-ink" />
      ) : current ? (
        <span className="font-ui text-[13px] text-muted">กำลังใช้</span>
      ) : (
        <IconArrow className="h-5 w-5 text-muted" />
      )}
    </button>
  );
}
