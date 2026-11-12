import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { todayISO } from "@/lib/dates";
import { PageHeader } from "@/components/ui";
import { TaskList } from "./TaskList";
import { AddTaskForm } from "./AddTaskForm";

export const metadata = { title: "ตามงาน · PassionSeed" };

export default async function TasksPage() {
  const user = await requireUser("STUDENT");
  const [tasks, subjects] = await Promise.all([
    db.task.findMany({ where: { studentId: user.id }, include: { subject: true }, orderBy: { dueDate: "asc" } }),
    db.subject.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);
  const today = todayISO();

  return (
    <div className="space-y-7">
      <PageHeader title="ตามงาน">งานทุกวิชารวมไว้ที่เดียว เรียงตามวันส่ง</PageHeader>
      <TaskList
        today={today}
        tasks={tasks.map((t) => ({
          id: t.id,
          title: t.title,
          dueDate: t.dueDate,
          done: t.done,
          extended: t.extended,
          source: t.source,
          subjectName: t.subject?.name ?? null,
        }))}
      />
      <AddTaskForm subjects={subjects.map((s) => ({ id: s.id, name: s.name }))} today={today} />
    </div>
  );
}
