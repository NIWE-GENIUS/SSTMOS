// src/pages/dos/TimetableConfigPage.jsx
import { useEffect, useState } from 'react';
import { api, extractError } from '../../lib/api';
import { PageHeader, ErrorBanner } from '../../components/ui';
import { Save, Clock, Eye, EyeOff, Palette } from 'lucide-react';
import TimetableGrid from "../../components/timetable/TimetableGrid";
export default function TimetableConfigPage() {
  const [active, setActive] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  
  const [spec, setSpec] = useState({
    name: 'Standard Daily Timetable',
    startTime: '08:00',
    periodDurationMinutes: 40,
    sessions: [
      { name: 'Morning Session', periods: 3, color: '#3b82f6' }, // Blue
      { name: 'Late Morning', periods: 3, color: '#10b981' },    // Green
      { name: 'Afternoon Session', periods: 3, color: '#f59e0b' },// Orange
      { name: 'Late Afternoon', periods: 2, color: '#8b5cf6' }, // Purple
    ],
    breaks: [
      { name: 'BREAK', afterPeriod: 3, durationMinutes: 10 },
      { name: 'LUNCH', afterPeriod: 6, durationMinutes: 60 },
      { name: 'BREAK', afterPeriod: 9, durationMinutes: 10 },
    ],
  });

  function loadActive() {
    api.get('/timetable-config/formats/active')
      .then(({ data }) => { setActive(data); setShowPreview(false); })
      .catch(() => setActive(null));
  }

  useEffect(loadActive, []);

  async function handleBuild(e) {
    e.preventDefault();
    setError(''); setSubmitting(true);
    try {
      await api.post('/timetable-config/formats/build', spec);
      loadActive();
    } catch (err) { setError(extractError(err)); }
    finally { setSubmitting(false); }
  }

  return (
    <div>
      <PageHeader title="Timetable Configuration" description="Define the school's daily structure and session colors" />
      <ErrorBanner message={error} onDismiss={() => setError('')} />

      {active && (
        <div className="mb-10 space-y-6">
          <div className="card border-emerald-200 bg-emerald-50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-emerald-700" />
                <h2 className="text-lg font-semibold text-emerald-900">Active Format: {active.format.name}</h2>
              </div>
              <button onClick={() => setShowPreview(!showPreview)} className="btn-secondary text-sm flex items-center gap-2">
                {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {showPreview ? 'Hide Format' : 'View Format'}
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm mb-2 text-emerald-800">
              <div><div className="opacity-75">Start time</div><div className="font-medium">{active.format.start_time}</div></div>
              <div><div className="opacity-75">Period length</div><div className="font-medium">{active.format.period_duration_minutes} min</div></div>
              <div><div className="opacity-75">Total periods</div><div className="font-medium">{active.format.total_periods}</div></div>
              <div><div className="opacity-75">Closing time</div><div className="font-medium">{active.periods[active.periods.length - 1]?.end_time}</div></div>
            </div>
          </div>

          {showPreview && (
            <div className="animate-in fade-in slide-in-from-top-4 duration-300">
              <TimetableGrid entries={[]} periods={active.periods} breaks={active.breaks} sessions={active.sessions} title="Structure Preview" />
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleBuild} className="card space-y-6 border-t-4 border-indigo-500">
        <h2 className="text-lg font-semibold border-b pb-2 flex items-center gap-2"><Palette className="w-5 h-5 text-indigo-500"/> Build New Format</h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div><label className="label">Name</label><input required value={spec.name} onChange={(e) => setSpec({ ...spec, name: e.target.value })} className="input" /></div>
          <div><label className="label">Start time (HH:MM)</label><input required value={spec.startTime} onChange={(e) => setSpec({ ...spec, startTime: e.target.value })} className="input" /></div>
          <div><label className="label">Period length (min)</label><input required type="number" value={spec.periodDurationMinutes} onChange={(e) => setSpec({ ...spec, periodDurationMinutes: parseInt(e.target.value, 10) })} className="input" /></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Sessions</h3>
            <div className="space-y-3">
              {spec.sessions.map((s, i) => (
                <div key={i} className="flex gap-2 items-center bg-slate-50 p-2 rounded border border-slate-200">
                  <span className="text-xs font-mono text-slate-400 w-4">{i+1}</span>
                  <input value={s.name} onChange={(e) => { const arr = [...spec.sessions]; arr[i].name = e.target.value; setSpec({ ...spec, sessions: arr }); }} className="input text-sm flex-1" placeholder="Session name" />
                  
                  {/* COLOR PICKER */}
                  <input type="color" value={s.color || '#3b82f6'} onChange={(e) => { const arr = [...spec.sessions]; arr[i].color = e.target.value; setSpec({ ...spec, sessions: arr }); }} className="w-8 h-8 p-0 border-0 rounded cursor-pointer" title="Session Color" />
                  
                  <input type="number" min="1" value={s.periods} onChange={(e) => { const arr = [...spec.sessions]; arr[i].periods = parseInt(e.target.value, 10) || 1; setSpec({ ...spec, sessions: arr }); }} className="input w-20 text-sm" placeholder="Periods" />
                  <button type="button" onClick={() => setSpec({ ...spec, sessions: spec.sessions.filter((_, j) => j !== i) })} className="text-red-500 hover:bg-red-50 p-2 rounded">×</button>
                </div>
              ))}
              <button type="button" onClick={() => setSpec({ ...spec, sessions: [...spec.sessions, { name: 'New Session', periods: 1, color: '#3b82f6' }] })} className="text-sm text-indigo-600 font-medium hover:underline">+ Add session</button>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Breaks</h3>
            <div className="space-y-3">
              {spec.breaks.map((b, i) => (
                <div key={i} className="flex gap-2 items-center bg-slate-50 p-2 rounded border border-slate-200">
                  <input value={b.name} onChange={(e) => { const arr = [...spec.breaks]; arr[i].name = e.target.value; setSpec({ ...spec, breaks: arr }); }} className="input text-sm w-24" placeholder="Name" />
                  <div className="flex items-center gap-1 text-xs text-slate-500">after P<input type="number" min="1" value={b.afterPeriod} onChange={(e) => { const arr = [...spec.breaks]; arr[i].afterPeriod = parseInt(e.target.value, 10) || 1; setSpec({ ...spec, breaks: arr }); }} className="input w-14 text-sm" /></div>
                  <input type="number" min="1" value={b.durationMinutes} onChange={(e) => { const arr = [...spec.breaks]; arr[i].durationMinutes = parseInt(e.target.value, 10) || 10; setSpec({ ...spec, breaks: arr }); }} className="input w-20 text-sm" placeholder="Min" />
                  <button type="button" onClick={() => setSpec({ ...spec, breaks: spec.breaks.filter((_, j) => j !== i) })} className="text-red-500 hover:bg-red-50 p-2 rounded">×</button>
                </div>
              ))}
              <button type="button" onClick={() => setSpec({ ...spec, breaks: [...spec.breaks, { name: 'Break', afterPeriod: 1, durationMinutes: 15 }] })} className="text-sm text-indigo-600 font-medium hover:underline">+ Add break</button>
            </div>
          </div>
        </div>

        <div className="bg-indigo-50 p-4 rounded text-sm text-indigo-900 flex justify-between items-center">
          <span>Total teaching periods per day:</span>
          <strong className="text-xl">{spec.sessions.reduce((s, x) => s + Number(x.periods), 0)}</strong>
        </div>

        <button type="submit" disabled={submitting} className="btn-primary !bg-indigo-600 hover:!bg-indigo-700 w-full py-3">
          <Save className="w-5 h-5 mr-2" />
          {submitting ? 'Building and activating…' : 'Build and Activate Format'}
        </button>
      </form>
    </div>
  );
}