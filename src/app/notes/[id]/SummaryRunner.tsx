"use client";

import { useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { generateSummary, retrySummary } from "@/app/actions/notes";
import { Spinner } from "@/components/ui";

/** Kicks off the AI summary when the page opens with a pending note. */
export function SummaryRunner({ noteId, status }: { noteId: string; status: string }) {
  const router = useRouter();
  const started = useRef(false);

  useEffect(() => {
    if (status === "PENDING" && !started.current) {
      started.current = true;
      generateSummary(noteId).finally(() => router.refresh());
    }
    if (status === "PROCESSING") {
      // Someone else is running it — poll until it's done.
      const t = setInterval(() => router.refresh(), 3000);
      return () => clearInterval(t);
    }
  }, [noteId, status, router]);

  return null;
}

export function RetryButton({ noteId, label = "ลองสรุปใหม่" }: { noteId: string; label?: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      className="btn-quiet"
      disabled={pending}
      onClick={() =>
        start(async () => {
          await retrySummary(noteId);
          router.refresh();
        })
      }
    >
      {pending ? (
        <>
          <Spinner /> AI กำลังอ่านรูป
        </>
      ) : (
        label
      )}
    </button>
  );
}
