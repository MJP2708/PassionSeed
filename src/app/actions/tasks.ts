"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { isISODate } from "@/lib/dates";
import { SUBJECT_IDS } from "@/lib/timetable";

export async function setTaskDone(taskId: string, done: boolean) {
  const user = await requireUser("STUDENT");
  await db.task.updateMany({ where: { id: taskId, studentId: user.id }, data: { done } });
  revalidatePath("/tasks");
  revalidatePath("/");
}

export type AddTaskState = { error?: string; ok?: number };

export async function addTask(_prev: AddTaskState, formData: FormData): Promise<AddTaskState> {
  const user = await requireUser("STUDENT");
  const title = String(formData.get("title") ?? "").trim();
  const dueDate = String(formData.get("dueDate") ?? "");
  const subjectId = String(formData.get("subjectId") ?? "");

  if (!title) return { error: "กรุณาใส่ชื่องาน" };
  if (title.length > 200) return { error: "ชื่องานยาวเกินไป" };
  if (!isISODate(dueDate)) return { error: "กรุณาเลือกวันส่ง" };

  await db.task.create({
    data: {
      studentId: user.id,
      title,
      dueDate,
      subjectId: SUBJECT_IDS.includes(subjectId) ? subjectId : null,
      source: "MANUAL",
    },
  });
  revalidatePath("/tasks");
  revalidatePath("/");
  return { ok: Date.now() };
}
