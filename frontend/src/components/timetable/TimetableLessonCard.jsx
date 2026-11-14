// src/components/timetable/TimetableLessonCard.jsx
import { MonitorPlay, BookOpen, MapPin } from 'lucide-react';

export default function TimetableLessonCard({ entry, moduleColor, sessionColor, density, showRoom, showCode, onClick }) {
  const isPractical = entry.module_type === 'practical';
  
  return (
    <div 
      onClick={onClick}
      className="h-full w-full p-2 cursor-pointer transition-all hover:ring-2 hover:ring-indigo-400 rounded-md group relative overflow-hidden"
      style={{ 
        backgroundColor: `${sessionColor}20`, // 20% opacity of session color for subtle background
        borderLeft: `4px solid ${moduleColor}` 
      }}
    >
      <div className="flex flex-col h-full justify-between">
        <div>
          <div className="flex items-start justify-between gap-1">
            <div className="font-bold text-slate-900 leading-tight text-xs line-clamp-2">
              {entry.module_name}
            </div>
            {isPractical ? (
              <MonitorPlay className="w-3.5 h-3.5 text-indigo-600 shrink-0" title="Practical" />
            ) : (
              <BookOpen className="w-3.5 h-3.5 text-slate-400 shrink-0" title="Theory" />
            )}
          </div>
          
          {showCode && (
            <div className="text-[10px] font-semibold text-slate-500 mt-0.5">{entry.module_code}</div>
          )}
        </div>

        <div className="mt-1">
          <div className="text-[11px] font-medium text-slate-700 truncate">{entry.trainer_name}</div>
          {showRoom && entry.room_name && (
            <div className="text-[10px] text-slate-500 flex items-center gap-0.5 mt-0.5 truncate">
              <MapPin className="w-3 h-3" /> {entry.room_name}
            </div>
          )}
        </div>
      </div>

      {/* Hover overlay for quick click info */}
      <div className="absolute inset-0 bg-white/90 opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs font-bold text-indigo-700 transition-opacity">
        View Details
      </div>
    </div>
  );
}