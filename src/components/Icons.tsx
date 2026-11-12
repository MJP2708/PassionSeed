// Hand-picked stroke icons (24px grid, 1.75 stroke) so the UI doesn't lean on emoji.
import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;
const base = (p: P) => ({
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  ...p,
});

export const IconHome = (p: P) => (
  <svg {...base(p)}><path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5.5h-5V20H5a1 1 0 0 1-1-1z" /></svg>
);
export const IconPlan = (p: P) => (
  <svg {...base(p)}><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M8 3v4M16 3v4M4 10h16M12 13v4M10 15h4" /></svg>
);
export const IconTasks = (p: P) => (
  <svg {...base(p)}><path d="m4.5 7 1.8 1.8L9.5 5.5M4.5 15l1.8 1.8 3.2-3.3M13 7.5h6.5M13 15.5h6.5" /></svg>
);
export const IconBuddy = (p: P) => (
  <svg {...base(p)}><circle cx="9" cy="8.5" r="3.2" /><path d="M3.5 19.5a5.5 5.5 0 0 1 11 0M15.5 5.6a3.2 3.2 0 0 1 0 5.8M20.5 19.5a5.5 5.5 0 0 0-3.4-5.1" /></svg>
);
export const IconCamera = (p: P) => (
  <svg {...base(p)}><path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2l1.4-2h6.2l1.4 2h2A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5z" /><circle cx="12" cy="13" r="3.3" /></svg>
);
export const IconClip = (p: P) => (
  <svg {...base(p)}><path d="m19 11.5-7 7a4.6 4.6 0 0 1-6.5-6.5l7.4-7.4a3 3 0 0 1 4.3 4.3l-7.3 7.3a1.5 1.5 0 0 1-2.1-2.1l6.6-6.6" /></svg>
);
export const IconSpark = (p: P) => (
  <svg {...base(p)}><path d="M12 3.5c.5 4.3 1.9 6.1 6 6.5-4.1.5-5.5 2.2-6 6.5-.5-4.3-1.9-6-6-6.5 4.1-.4 5.5-2.2 6-6.5ZM18.5 15.5c.2 1.6.8 2.3 2.3 2.5-1.5.2-2.1.9-2.3 2.5-.2-1.6-.8-2.3-2.3-2.5 1.5-.2 2.1-.9 2.3-2.5Z" /></svg>
);
export const IconArrow = (p: P) => (
  <svg {...base(p)}><path d="M5 12h14M13.5 6.5 19 12l-5.5 5.5" /></svg>
);
export const IconBack = (p: P) => (
  <svg {...base(p)}><path d="M19 12H5M10.5 6.5 5 12l5.5 5.5" /></svg>
);
export const IconCheck = (p: P) => (
  <svg {...base(p)}><path d="m5.5 12.5 4 4 9-9.5" /></svg>
);
export const IconPlus = (p: P) => (
  <svg {...base(p)}><path d="M12 5v14M5 12h14" /></svg>
);
export const IconX = (p: P) => (
  <svg {...base(p)}><path d="M6.5 6.5l11 11M17.5 6.5l-11 11" /></svg>
);
export const IconSwap = (p: P) => (
  <svg {...base(p)}><path d="M7 7.5h11.5M15.5 4.5l3 3-3 3M17 16.5H5.5M8.5 13.5l-3 3 3 3" /></svg>
);
export const IconExternal = (p: P) => (
  <svg {...base(p)}><path d="M10 5.5H6A1.5 1.5 0 0 0 4.5 7v11A1.5 1.5 0 0 0 6 19.5h11a1.5 1.5 0 0 0 1.5-1.5v-4M14 4.5h5.5V10M19.5 4.5 11 13" /></svg>
);
/** Brand mark: a seed with one sprouting leaf. */
export const Mark = (p: P) => (
  <svg viewBox="0 0 24 24" aria-hidden {...p}>
    <path d="M12 21c0-4.5 0-7 0-9.5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" fill="none" />
    <path d="M12 12.2c-.3-3.9 1.7-6.6 6.6-7.2.4 4.5-2.1 7.1-6.6 7.2Z" fill="currentColor" />
    <path d="M11.8 14.6c-3.7.2-6-1.5-6.4-5 3.6-.2 6 1.6 6.4 5Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
  </svg>
);
