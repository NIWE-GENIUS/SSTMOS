// src/components/timetable/TimetableBreakRow.jsx
import { Coffee } from 'lucide-react';

export default function TimetableBreakRow({ breakData, colSpan }) {
  return (
    <tr className="bg-slate-100 print:bg-gray-200">
      <td className="border border-slate-200 p-1 text-center text-[10px] font-mono text-slate-500">
        {breakData.start_time.slice(0,5)}
      </td>
      <td colSpan={colSpan} className="border border-slate-200 p-1 text-center text-xs font-bold text-slate-500 uppercase tracking-widest bg-slate-50">
        <span className="inline-flex items-center gap-1 bg-white px-3 py-1 rounded-full border shadow-sm">
          <Coffee className="w-3.5 h-3.5" /> {breakData.name}
        </span>
      </td>
    </tr>
  );
}