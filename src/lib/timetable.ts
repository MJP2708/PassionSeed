// Hard-coded timetable for the demo (no real timetable import).
export const TIMETABLE = [
  { id: "math", name: "คณิตศาสตร์", teacherName: "อ.สมชาย รัตนวงศ์", days: "จ. พ. ศ." },
  { id: "physics", name: "ฟิสิกส์", teacherName: "อ.ประเสริฐ ทองดี", days: "จ. พฤ." },
  { id: "chem", name: "เคมี", teacherName: "อ.วิไลวรรณ ศรีสุข", days: "อ. พฤ." },
  { id: "english", name: "ภาษาอังกฤษ", teacherName: "T. Kanokwan Phunphon", days: "อ. พ. ศ." },
  { id: "social", name: "สังคมศึกษา", teacherName: "อ.ธนพล แก้วมณี", days: "พ. ศ." },
] as const;

export type SubjectId = (typeof TIMETABLE)[number]["id"];
export const SUBJECT_IDS = TIMETABLE.map((s) => s.id) as string[];
