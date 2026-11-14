// src/components/timetable/TimetableToolbar.jsx
import { Layout, Maximize, Printer, RefreshCw, Eye, EyeOff, Type, DoorOpen } from 'lucide-react';

export default function TimetableToolbar({ 
  density, setDensity, 
  showRoom, setShowRoom, 
  showCode, setShowCode 
}) {
  return (
    <div className="bg-white border-b border-slate-200 p-2 flex items-center justify-between print:hidden">
      <div className="flex gap-2">
        <button 
          onClick={() => setDensity(density === 'compact' ? 'comfortable' : 'compact')}
          className="btn-secondary text-xs flex items-center gap-1 px-3 py-1.5"
        >
          <Layout className="w-3.5 h-3.5" /> {density === 'compact' ? 'Comfortable' : 'Compact'}
        </button>
        
        <button onClick={() => setShowRoom(!showRoom)} className="btn-secondary text-xs flex items-center gap-1 px-3 py-1.5">
          {showRoom ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />} Rooms
        </button>
        
        <button onClick={() => setShowCode(!showCode)} className="btn-secondary text-xs flex items-center gap-1 px-3 py-1.5">
          {showCode ? <Type className="w-3.5 h-3.5" /> : <Type className="w-3.5 h-3.5 opacity-50" />} Codes
        </button>
      </div>

      <div className="flex gap-2">
        <button className="btn-secondary text-xs flex items-center gap-1 px-3 py-1.5 text-indigo-600 border-indigo-200 bg-indigo-50 hover:bg-indigo-100">
          <RefreshCw className="w-3.5 h-3.5" /> Quick Re-validate
        </button>
        <button onClick={() => window.print()} className="btn-secondary text-xs flex items-center gap-1 px-3 py-1.5">
          <Printer className="w-3.5 h-3.5" /> Print Preview
        </button>
      </div>
    </div>
  );
}