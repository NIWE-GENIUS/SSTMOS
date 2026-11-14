// src/components/timetable/SessionLegend.jsx
export default function SessionLegend({ sessions = [] }) {
  if (!sessions.length) return null;
  return (
    <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 flex items-center gap-4 overflow-x-auto print:hidden">
      <span className="text-xs font-bold text-slate-500 uppercase shrink-0">Session Colors:</span>
      {sessions.map(s => (
        <div key={s.id} className="flex items-center gap-1.5 shrink-0">
          <span className="w-3 h-3 rounded-full border border-slate-300 shadow-sm" style={{ backgroundColor: s.color }}></span>
          <span className="text-xs text-slate-700">{s.name}</span>
        </div>
      ))}
    </div>
  );
}