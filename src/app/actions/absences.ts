"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { daysBetween, isISODate } from "@/lib/dates";
import { IMAGE_TYPES, saveUpload } from "@/lib/storage";
import { SUBJECT_IDS } from "@/lib/timetable";

export type PlanResult = { ok: true } | { ok: false; error: string };

const LETTER_TYPES = [...IMAGE_TYPES, "application/pdf"] as string[];

export async function createAbsence(formData: FormData): Promise<PlanResult> {
  const user = await requireUser("STUDENT");
  const eventName = String(formData.get("eventName") ?? "").trim();
  const startDate = String(formData.get("startDate") ?? "");
  const endDate = String(formData.get("endDate") ?? "");
  const wantsExtension = formData.get("wantsExtension") === "on";
  const subjectIds = [...new Set(formData.getAll("subjects").map(String))].filter((s) => SUBJECT_IDS.includes(s));
  const letter = formData.get("letter");

  if (!eventName) return { ok: false, error: "กรุณาใส่ชื่องานแข่งขัน" };
  if (eventName.length > 120) return { ok: false, error: "ชื่องานยาวเกินไป" };
  if (!isISODate(startDate) || !isISODate(endDate)) return { ok: false, error: "กรุณาเลือกวันที่ให้ครบ" };
  if (endDate < startDate) return { ok: false, error: "วันสุดท้ายต้องไม่อยู่ก่อนวันแรก" };
  if (daysBetween(startDate, endDate) > 13) return { ok: false, error: "วางแผนได้ครั้งละไม่เกิน 14 วัน" };
  if (subjectIds.length === 0) return { ok: false, error: "กรุณาเลือกวิชาที่ขาดอย่างน้อย 1 วิชา" };

  let letterUrl: string | null = null;
  if (letter instanceof File && letter.size > 0) {
    if (!LETTER_TYPES.includes(letter.type)) return { ok: false, error: "จดหมายต้องเป็นรูปหรือ PDF" };
    if (letter.size > 3.5 * 1024 * 1024) return { ok: false, error: "ไฟล์จดหมายใหญ่เกิน 3.5MB" };
    try {
      letterUrl = await saveUpload(letter, "letters");
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "อัปโหลดจดหมายไม่สำเร็จ" };
    }
  }

  await db.absence.create({
    data: {
      studentId: user.id,
      eventName,
      startDate,
      endDate,
      letterUrl,
      wantsExtension,
      requests: {
        create: subjectIds.map((subjectId) => ({
          subjectId,
          extensionStatus: wantsExtension ? "REQUESTED" : "NONE",
        })),
      },
    },
  });

  revalidatePath("/");
  revalidatePath("/plan");
  revalidatePath("/teacher");
  return { ok: true };
}
