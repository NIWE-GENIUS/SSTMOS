// src/components/timetable/TimetableGrid.jsx
import { useMemo, useState } from 'react';
import { AlertTriangle, Route } from 'lucide-react';
import TimetableHeader from './TimetableHeader';
import TimetableToolbar from './TimetableToolbar';
import TimetableLessonCard from './TimetableLessonCard';
import TimetableBreakRow from './TimetableBreakRow';
import SessionLegend from './SessionLegend';
import TimetableDetails from './TimetableDetails';

// Stable color hash for modules
const MODULE_PALETTE = [
  '#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#EC4899', '#F43F5E'
];

function getModuleColor(code) {
  if (!code) return MODULE_PALETTE[0];
  let hash = 0;
  for (let i = 0; i < code.length; i++) hash = code.charCodeAt(i) + ((hash << 5) - hash);
  return MODULE_PALETTE[Math.abs(hash) % MODULE_PALETTE.length];
}

export default function TimetableGrid({ 
  entries = [], periods = [], breaks = [], sessions = [], 
  headerConfig = {}, classTeacher, workingDays = [1, 2, 3, 4, 5], version = {}
}) {
  const [density, setDensity] = useState('comfortable');
  const [showRoom, setShowRoom] = useState(true);
  const [showCode, setShowCode] = useState(true);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [conflicts, setConflicts] = useState([]);

  // Map day numbers to names
  const DAY_NAMES = { 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 4: 'Thursday', 5: 'Friday', 6: 'Saturday', 7: 'Sunday' };

  // 1. Detect Duplicates & Build Schedule
  const schedule = useMemo(() => {
    const grid = {};
    const dupes = [];
    
    entries.forEach(e => {
      const key = `${e.day_of_week}-${e.period_id || e.period_number}`;
      if (grid[key]) {
        dupes.push(`Conflict: Multiple lessons mapped to ${DAY_NAMES[e.day_of_week]} P${e.period_number}`);
      }
      grid[key] = e;
    });
    
    // Set conflicts outside of render to avoid infinite loop
    setTimeout(() => setConflicts([...new Set(dupes)]), 0);
    return grid;
  }, [entries]);

  // 2. Build Timeline (Interleaving periods and breaks)
  const timeline = useMemo(() => {
    const items = [];
    const sortedPeriods = [...periods].sort((a, b) => a.period_number - b.period_number);
    
    sortedPeriods.forEach(p => {
      items.push({ type: 'period', data: p });
      // Match break by the configured `afterPeriod` or sequence fallback
      const nextBreak = breaks.find(b => 
        b.after_period === p.period_number || 
        (b.start_time === p.end_time && !b.after_period)
      );
      if (nextBreak) items.push({ type: 'break', data: nextBreak });
    });
    return items;
  }, [periods, breaks]);

  const sessionMap = useMemo(() => {
    const map = {};
    sessions.forEach(s => map[s.id] = s);
    return map;
  }, [sessions]);

  return (
    <div className="space-y-4 w-full">
      {/* Path / Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm text-slate-500 font-medium px-2">
        <Route className="w-4 h-4" />
        <span>SSTMOS</span> <span className="text-slate-300">/</span>
        <span>{headerConfig.academicYear || 'Year'}</span> <span className="text-slate-300">/</span>
        <span>{headerConfig.term || 'Term'}</span> <span className="text-slate-300">/</span>
        <span className="text-indigo-600 font-bold">Timetable</span>
      </div>

      {/* Conflict Banner */}
      {conflicts.length > 0 && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Scheduling Conflicts Detected</p>
            <ul className="text-sm mt-1 list-disc list-inside">
              {conflicts.map((c, i) => <li key={i}>{c}</li>)}
            </ul>
            <p className="text-xs mt-2 text-red-600">Please regenerate or manually resolve before publishing.</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden print:shadow-none print:border-none">
        <TimetableHeader 
          config={headerConfig} 
          version={version} 
          classTeacher={classTeacher} 
        />

        <TimetableToolbar 
          density={density} setDensity={setDensity}
          showRoom={showRoom} setShowRoom={setShowRoom}
          showCode={showCode} setShowCode={setShowCode}
        />

        <SessionLegend sessions={sessions} />

        {/* The Grid */}
        <div className="overflow-x-auto print:overflow-visible">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-slate-800 text-white print:bg-slate-100 print:text-black">
                <th className="border border-slate-700 p-2 w-24 font-semibold text-xs uppercase print:border-slate-300">Time</th>
                {workingDays.map(dayNum => (
                  <th key={dayNum} className="border border-slate-700 p-2 font-semibold text-xs uppercase print:border-slate-300">
                    {DAY_NAMES[dayNum]}
                  </th>
                ))}
                {/* Weekend Rest Column */}
                {workingDays.length < 7 && (
                  <th className="border border-slate-700 p-2 font-semibold text-xs uppercase bg-slate-900 text-slate-400 print:bg-slate-100 print:text-slate-400">
                    Rest / Weekend
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {timeline.length === 0 ? (
                <tr><td colSpan={workingDays.length + 2} className="p-8 text-center text-slate-500">No periods configured.</td></tr>
              ) : timeline.map((item, idx) => {
                if (item.type === 'break') {
                  return <TimetableBreakRow key={`break-${idx}`} breakData={item.data} colSpan={workingDays.length + (workingDays.length < 7 ? 1 : 0)} />;
                }

                const p = item.data;
                const session = sessionMap[p.session_id] || {};
                const sessionColor = session.color || '#f8fafc';

                return (
                  <tr key={p.id} className={density === 'compact' ? 'h-16' : 'h-24'}>
                    <td className="border border-slate-200 p-2 text-center text-xs font-medium bg-slate-50 text-slate-600">
                      <div className="font-mono text-sm">{p.start_time.slice(0,5)}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">to {p.end_time.slice(0,5)}</div>
                    </td>
                    
                    {workingDays.map(dayNum => {
                      const entry = schedule[`${dayNum}-${p.id}`] || schedule[`${dayNum}-${p.period_number}`];
                      
                      return (
                        <td 
                          key={dayNum} 
                          className="border border-slate-200 p-1 transition-colors align-top"
                          style={{ backgroundColor: entry ? '#ffffff' : sessionColor }} // Apply session color only if empty
                        >
                          {entry ? (
                            <TimetableLessonCard 
                              entry={entry} 
                              moduleColor={getModuleColor(entry.module_code)}
                              sessionColor={sessionColor}
                              density={density}
                              showRoom={showRoom}
                              showCode={showCode}
                              onClick={() => setSelectedLesson(entry)}
                            />
                          ) : null}
                        </td>
                      );
                    })}

                    {/* Weekend Rest Cell */}
                    {workingDays.length < 7 && (
                      <td className="border border-slate-200 bg-slate-50/50 text-center align-middle text-xs text-slate-400 font-medium">
                        No Classes
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {/* Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 text-xs text-slate-500 flex justify-between">
          <span>Generated: {new Date().toLocaleDateString()}</span>
          <span>Version: {version.version_number || '1.0'} • SSTMOS</span>
        </div>
      </div>

      {selectedLesson && (
        <TimetableDetails 
          lesson={selectedLesson} 
          session={sessionMap[selectedLesson.session_id]}
          onClose={() => setSelectedLesson(null)} 
        />
      )}
    </div>
  );
}