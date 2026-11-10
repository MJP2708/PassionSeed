"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { addDays, isISODate } from "@/lib/dates";

export type ReplyState = { error?: string; savedAt?: number };

const WORK_LABEL: Record<string, string> = { WORKSHEET: "ใบงาน", QUIZ: "สอบย่อย" };

export async function replyRequest(_prev: ReplyState, formData: FormData): Promise<ReplyState> {
  await requireUser("TEACHER");
  const requestId = String(formData.get("requestId") ?? "");
  const topics = String(formData.get("topics") ?? "").trim().slice(0, 1000);
  const workType = String(formData.get("workType") ?? "NONE");
  const originalDueDate = String(formData.get("originalDueDate") ?? "");
  const extension = String(formData.get("extension") ?? "");

  const request = await db.teacherRequest.findUnique({
    where: { id: requestId },
    include: { subject: true, absence: true, task: true },
  });
  if (!request) return { error: "ไม่พบคำขอนี้" };
  if (!topics) return { error: "กรุณาบอกหัวข้อที่สอน" };
  if (!["NONE", "WORKSHEET", "QUIZ"].includes(workType)) return { error: "ประเภทงานไม่ถูกต้อง" };
  const hasWork = workType !== "NONE";
  if (hasWork && !isISODate(originalDueDate)) return { error: "กรุณาเลือกวันส่งงาน" };

  let extensionStatus = request.extensionStatus;
  if (request.extensionStatus !== "NONE") {
    if (extension !== "APPROVED" && extension !== "DENIED") return { error: "กรุณาเลือกว่าอนุมัติการเลื่อนหรือไม่" };
    extensionStatus = extension;
  }
  const approved = extensionStatus === "APPROVED";
  const dueDate = hasWork ? (approved ? addDays(originalDueDate, 3) : originalDueDate) : null;

  await db.$transaction(async (tx) => {
    await tx.teacherRequest.update({
      where: { id: request.id },
      data: {
        status: "REPLIED",
        repliedAt: new Date(),
        topics,
        workType,
        originalDueDate: hasWork ? originalDueDate : null,
        dueDate,
        extensionStatus,
      },
    });

    if (!hasWork || !dueDate) {
      await tx.task.deleteMany({ where: { requestId: request.id } });
      return;
    }
    const firstTopic = topics.split(/[,\n]/)[0].trim().slice(0, 60);
    const title = `${WORK_LABEL[workType]}${request.subject.name}${firstTopic ? `: ${firstTopic}` : ""}`;
    await tx.task.upsert({
      where: { requestId: request.id },
      create: {
        studentId: request.absence.studentId,
        subjectId: request.subjectId,
        requestId: request.id,
        title,
        dueDate,
        extended: approved,
        source: "TEACHER",
      },
      // Keep the student's "done" tick when the teacher edits a reply.
      update: { title, dueDate, extended: approved },
    });
  });

  revalidatePath("/teacher");
  revalidatePath("/tasks");
  revalidatePath("/");
  return { savedAt: Date.now() };
}
