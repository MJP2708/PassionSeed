export function NoteStatus({ status }: { status: string }) {
  if (status === "READY") return <span className="chip border-ok text-ok">สรุปพร้อมแล้ว</span>;
  if (status === "ERROR") return <span className="chip border-bad text-bad">สรุปไม่สำเร็จ · ดูรูปได้</span>;
  return <span className="chip">AI กำลังสรุป…</span>;
}
