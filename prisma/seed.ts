import { db } from "../src/lib/db";
import { TIMETABLE } from "../src/lib/timetable";
import { addDays, todayISO } from "../src/lib/dates";

// Dates are relative to "today" so the demo always looks current.
const today = todayISO();
const d = (n: number) => addDays(today, n);

async function main() {
  await db.noteUpload.deleteMany();
  await db.task.deleteMany();
  await db.teacherRequest.deleteMany();
  await db.absence.deleteMany();
  await db.subject.deleteMany();
  await db.user.deleteMany();

  await db.subject.createMany({
    data: TIMETABLE.map((s, i) => ({ id: s.id, name: s.name, teacherName: s.teacherName, sortOrder: i })),
  });

  const student = await db.user.create({
    data: { id: "u-student", name: "ปภาวรินทร์ สุขเจริญ", nickname: "มายด์", role: "STUDENT", classroom: "ม.5/2" },
  });
  const buddy1 = await db.user.create({
    data: { id: "u-buddy1", name: "ธนกฤต วงศ์สวัสดิ์", nickname: "ต้นกล้า", role: "BUDDY", classroom: "ม.5/2", volunteerHours: 6 },
  });
  await db.user.create({
    data: { id: "u-buddy2", name: "ศิริกานต์ มณีรัตน์", nickname: "ใบเตย", role: "BUDDY", classroom: "ม.5/2", volunteerHours: 2.5 },
  });
  await db.user.create({
    data: { id: "u-teacher", name: "อ.สมชาย รัตนวงศ์", nickname: "ครูสมชาย", role: "TEACHER" },
  });

  // Absence: 3 days, started yesterday, ends tomorrow.
  const absence = await db.absence.create({
    data: {
      studentId: student.id,
      eventName: "แข่งขันหุ่นยนต์ระดับภาค (ภาคเหนือ)",
      startDate: d(-1),
      endDate: d(1),
      wantsExtension: true,
    },
  });

  // Math: replied, worksheet, extension approved → moved +3 days to tomorrow.
  const math = await db.teacherRequest.create({
    data: {
      absenceId: absence.id, subjectId: "math", status: "REPLIED", repliedAt: new Date(),
      topics: "ลำดับเรขาคณิต, อนุกรมเรขาคณิต, อนุกรมอนันต์",
      workType: "WORKSHEET", originalDueDate: d(-2), dueDate: d(1), extensionStatus: "APPROVED",
    },
  });
  // Physics: replied, quiz, extension denied.
  const physics = await db.teacherRequest.create({
    data: {
      absenceId: absence.id, subjectId: "physics", status: "REPLIED", repliedAt: new Date(),
      topics: "การเคลื่อนที่แบบโพรเจกไทล์",
      workType: "QUIZ", originalDueDate: d(4), dueDate: d(4), extensionStatus: "DENIED",
    },
  });
  // Chemistry: replied, worksheet (already done).
  const chem = await db.teacherRequest.create({
    data: {
      absenceId: absence.id, subjectId: "chem", status: "REPLIED", repliedAt: new Date(),
      topics: "สมดุลเคมี, หลักของเลอชาเตอลิเอ",
      workType: "WORKSHEET", originalDueDate: d(3), dueDate: d(6), extensionStatus: "APPROVED",
    },
  });
  // English: still waiting for the teacher.
  await db.teacherRequest.create({
    data: { absenceId: absence.id, subjectId: "english", extensionStatus: "REQUESTED" },
  });

  await db.task.createMany({
    data: [
      { studentId: student.id, subjectId: "math", requestId: math.id, title: "ใบงานคณิตศาสตร์: ลำดับและอนุกรมเรขาคณิต", dueDate: d(1), extended: true, source: "TEACHER" },
      { studentId: student.id, subjectId: "physics", requestId: physics.id, title: "สอบย่อยฟิสิกส์: โพรเจกไทล์", dueDate: d(4), source: "TEACHER" },
      { studentId: student.id, subjectId: "chem", requestId: chem.id, title: "ใบงานเคมี: สมดุลเคมี", dueDate: d(6), extended: true, done: true, source: "TEACHER" },
      { studentId: student.id, subjectId: "physics", title: "ขอสไลด์ฟิสิกส์จากใบเตย", dueDate: d(0), source: "MANUAL" },
      { studentId: student.id, subjectId: "social", title: "ส่งส่วนของตัวเองในรายงานกลุ่มสังคม", dueDate: d(5), source: "MANUAL" },
      { studentId: student.id, title: "ส่งใบรับรองการแข่งขันให้ครูที่ปรึกษา", dueDate: d(9), source: "MANUAL" },
      { studentId: student.id, subjectId: "english", title: "ท่องศัพท์ Unit 5", dueDate: d(-1), done: true, source: "MANUAL" },
    ],
  });

  // A ready-made summary so the demo works before an API key is set.
  await db.noteUpload.create({
    data: {
      absenceId: absence.id, subjectId: "math", buddyId: buddy1.id, date: d(-1),
      photoUrls: JSON.stringify(["/seed/math-board.svg"]),
      emphasis: "ครูบอกว่าเรื่องอนุกรมอนันต์ออกสอบกลางภาคแน่นอน",
      summaryStatus: "READY",
      summaryJson: JSON.stringify({
        covered: [
          "ลำดับเรขาคณิต: สูตรพจน์ทั่วไป aₙ = a₁·rⁿ⁻¹",
          "ตัวอย่าง 3, 6, 12, 24 มี r = 2 และ a₆ = 96",
          "อนุกรมเรขาคณิต: Sₙ = a₁(1 − rⁿ)/(1 − r) เมื่อ r ≠ 1",
          "อนุกรมอนันต์: S∞ = a₁/(1 − r) เมื่อ |r| < 1",
        ],
        keyTerms: ["อัตราส่วนร่วม (r)", "พจน์ทั่วไป (aₙ)", "อนุกรมเรขาคณิต", "อนุกรมอนันต์"],
        questionsToAsk: [
          "ถ้า r ติดลบ ต้องระวังเครื่องหมายตรงไหนบ้าง?",
          "จะรู้ได้อย่างไรว่าอนุกรมอนันต์ลู่เข้าหรือลู่ออก?",
        ],
        confidence: "high",
      }),
    },
  });

  console.log(`Seeded demo data (today = ${today}).`);
}

main()
  .then(() => db.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
