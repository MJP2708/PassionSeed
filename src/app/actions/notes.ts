"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { isISODate } from "@/lib/dates";
import { IMAGE_TYPES, saveUpload } from "@/lib/storage";

export type UploadResult = { ok: true; id: string } | { ok: false; error: string };

const MAX_PHOTOS = 5;
const MAX_BYTES = 3.5 * 1024 * 1024;

export async function uploadNotes(formData: FormData): Promise<UploadResult> {
  const buddy = await requireUser("BUDDY");
  const absenceId = String(formData.get("absenceId") ?? "");
  const subjectId = String(formData.get("subjectId") ?? "");
  const date = String(formData.get("date") ?? "");
  const emphasis = String(formData.get("emphasis") ?? "").trim().slice(0, 1000) || null;
  const photos = formData.getAll("photos").filter((p): p is File => p instanceof File && p.size > 0);

  const absence = await db.absence.findUnique({ where: { id: absenceId }, include: { requests: true } });
  if (!absence) return { ok: false, error: "ไม่พบการขาดเรียนนี้" };
  if (!absence.requests.some((r) => r.subjectId === subjectId)) return { ok: false, error: "กรุณาเลือกวิชา" };
  if (!isISODate(date) || date < absence.startDate || date > absence.endDate) {
    return { ok: false, error: "วันที่ต้องอยู่ในช่วงที่เพื่อนขาดเรียน" };
  }
  if (photos.length < 1 || photos.length > MAX_PHOTOS) return { ok: false, error: "อัปโหลดรูปได้ 1–5 รูป" };
  for (const p of photos) {
    if (!(IMAGE_TYPES as readonly string[]).includes(p.type)) {
      return { ok: false, error: `ไฟล์ "${p.name}" ไม่ใช่รูปที่รองรับ (JPG, PNG, WEBP)` };
    }
    if (p.size > MAX_BYTES) return { ok: false, error: `รูป "${p.name}" ใหญ่เกินไป` };
  }

  let urls: string[];
  try {
    urls = await Promise.all(photos.map((p) => saveUpload(p, `notes/${absence.id}`)));
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "อัปโหลดไม่สำเร็จ" };
  }

  const [note] = await db.$transaction([
    db.noteUpload.create({
      data: { absenceId, subjectId, buddyId: buddy.id, date, emphasis, photoUrls: JSON.stringify(urls) },
    }),
    db.user.update({ where: { id: buddy.id }, data: { volunteerHours: { increment: 0.5 } } }),
  ]);

  revalidatePath("/buddy");
  revalidatePath("/");
  return { ok: true, id: note.id };
}

// ---- AI summary -----------------------------------------------------------

const STALE_MS = 3 * 60 * 1000; // a PROCESSING row older than this is considered stuck

/** Runs the AI summary for a note once. Safe to call from several viewers. */
export async function generateSummary(noteId: string): Promise<void> {
  await requireUser();
  const note = await db.noteUpload.findUnique({ where: { id: noteId }, include: { subject: true } });
  if (!note) return;

  const stuck = note.summaryStatus === "PROCESSING" && Date.now() - note.updatedAt.getTime() > STALE_MS;
  if (note.summaryStatus !== "PENDING" && !stuck) return;

  // Claim the job atomically so two open tabs don't both call Claude.
  const claimed = await db.noteUpload.updateMany({
    where: { id: noteId, summaryStatus: note.summaryStatus, updatedAt: note.updatedAt },
    data: { summaryStatus: "PROCESSING", summaryError: null },
  });
  if (claimed.count === 0) return;

  const { loadImage } = await import("@/lib/storage");
  const { summarizeNotes } = await import("@/lib/summarize");
  let result: Awaited<ReturnType<typeof summarizeNotes>>;
  try {
    const urls: string[] = JSON.parse(note.photoUrls);
    const images = await Promise.all(urls.map(loadImage));
    result = await summarizeNotes({ images, subjectName: note.subject.name, date: note.date, emphasis: note.emphasis });
  } catch (e) {
    console.error("[generateSummary]", e);
    result = { ok: false, error: "โหลดรูปไม่สำเร็จ ลองใหม่อีกครั้ง" };
  }

  await db.noteUpload.update({
    where: { id: noteId },
    data: result.ok
      ? { summaryStatus: "READY", summaryJson: JSON.stringify(result.summary), summaryError: null }
      : { summaryStatus: "ERROR", summaryError: result.error },
  });
  revalidatePath(`/notes/${noteId}`);
  revalidatePath("/buddy");
  revalidatePath("/");
}

export async function retrySummary(noteId: string): Promise<void> {
  await requireUser();
  await db.noteUpload.updateMany({
    where: { id: noteId, summaryStatus: { in: ["ERROR", "READY"] } },
    data: { summaryStatus: "PENDING", summaryError: null },
  });
  await generateSummary(noteId);
}
