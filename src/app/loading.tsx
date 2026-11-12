// Shown instantly on every navigation while the server renders the page.
export default function Loading() {
  return (
    <div className="space-y-7 pt-5" role="status" aria-label="กำลังโหลด">
      <div className="space-y-2.5">
        <div className="skeleton h-3.5 w-24" />
        <div className="skeleton h-8 w-48" />
      </div>
      <div className="skeleton h-32 w-full rounded-2xl" />
      <div className="space-y-1">
        <div className="skeleton mb-3 h-3.5 w-28" />
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 border-b border-rule py-4">
            <div className="skeleton h-6 w-6 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-4" style={{ width: `${70 - i * 9}%` }} />
              <div className="skeleton h-3 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
