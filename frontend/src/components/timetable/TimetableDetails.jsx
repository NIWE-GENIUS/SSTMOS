// src/components/timetable/TimetableDetails.jsx
import { X, BookOpen, User, MapPin, Clock, Calendar, AlignLeft } from 'lucide-react';

export default function TimetableDetails({ lesson, session, onClose }) {
  if (!lesson) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 p-6 text-white relative">
          <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 rounded-full p-1">
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 text-indigo-200 text-xs font-semibold uppercase tracking-wider mb-1">
            <BookOpen className="w-4 h-4" /> {lesson.module_type === 'practical' ? 'Practical Session' : 'Theory Session'}
          </div>
          <h2 className="text-2xl font-bold">{lesson.module_name}</h2>
          <p className="text-indigo-100 text-sm mt-1">{lesson.module_code}</p>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium">Trainer</div>
              <div className="font-semibold text-slate-900">{lesson.trainer_name}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div className="text-xs text-slate-500 font-medium mb-1 flex items-center gap-1"><Clock className="w-3 h-3"/> Time</div>
              <div className="text-sm font-semibold text-slate-900">P{lesson.period_number} ({lesson.start_time.slice(0,5)} - {lesson.end_time.slice(0,5)})</div>
            </div>
            
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div className="text-xs text-slate-500 font-medium mb-1 flex items-center gap-1"><MapPin className="w-3 h-3"/> Location</div>
              <div className="text-sm font-semibold text-slate-900">{lesson.room_name || 'No Room Assigned'}</div>
            </div>
          </div>

          {session && (
            <div className="flex items-center gap-2 p-3 rounded-lg border border-slate-200" style={{ backgroundColor: `${session.color}15` }}>
              <Calendar className="w-4 h-4" style={{ color: session.color }} />
              <span className="text-sm font-medium text-slate-700">Scheduled during: <span className="font-bold">{session.name}</span></span>
            </div>
          )}

          {lesson.sequence_length > 1 && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
              <AlignLeft className="w-4 h-4 text-amber-600 mt-0.5" />
              <div className="text-xs text-amber-800">
                <strong>Sequence Lesson:</strong> This lesson spans {lesson.sequence_length} consecutive periods. 
              </div>
            </div>
          )}
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button onClick={onClose} className="btn-secondary">Close Details</button>
        </div>
      </div>
    </div>
  );
}