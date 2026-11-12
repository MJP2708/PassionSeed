"use client";

import { useFormStatus } from "react-dom";
import type { ReactNode } from "react";
import { Spinner } from "./ui";

/** Submit button that shows its own pending state the instant it's pressed. */
export function SubmitButton({
  children,
  pendingLabel,
  className = "btn w-full",
  disabled,
}: {
  children: ReactNode;
  pendingLabel?: ReactNode;
  className?: string;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending || disabled} aria-busy={pending || undefined}>
      {pending ? (
        <>
          <Spinner />
          {pendingLabel ?? children}
        </>
      ) : (
        children
      )}
    </button>
  );
}
