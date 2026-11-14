// src/pages/dos/GeneratePage.jsx
import { useEffect, useState } from 'react';
import { api, extractError } from '../../lib/api';
import { PageHeader, ErrorBanner } from '../../components/ui';
import { Play, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function GeneratePage() {
  const [years, setYears] = useState([]);
  const [format, setFormat] = useState(null);
  const [form, setForm] = useState({ academicYearId: '', formatId: '' });
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/academic/academic-years').catch(() => ({ data: { data: [] } })),
      api.get('/timetable-config/formats/active').catch(() => ({ data: null })),
    ]).then(([y, f]) => {
      const loadedYears = y.data.data || [];
      setYears(loadedYears);
      setFormat(f.data);
      
      const activeYear = loadedYears.find(yr => yr.is_active) || loadedYears[0];
      setForm({ 
        academicYearId: activeYear?.id || '', 
        formatId: f.data?.format?.id || '' 
      });
    });
  }, []);

  async function handleRun(e) {
    e.preventDefault();
    setError(''); setResult(null); setSubmitting(true);
    try {
      // 1. Create a new draft version
      const { data: v } = await api.post('/timetable/versions', {
        academicYearId: form.academicYearId,
        timetableFormatId: form.formatId,
        changeDescription: 'Generated via engine',
      });

      // 2. Run the scheduler
      const { data: job } = await api.post('/generation/run', {
        academicYearId: form.academicYearId,
        formatId: form.formatId,
        timetableVersionId: v.id,
      });
      
      setResult({ ...job, versionId: v.id });
    } catch (err) { 
      setError(extractError(err)); 
    } finally { 
      setSubmitting(false); 
    }
  }

  return (
    <div>
      <PageHeader title="Generate Timetable" description="Run the scheduling engine to produce a draft" />
      <ErrorBanner message={error} onDismiss={() => setError('')} />

      {!format ? (
        <div className="card text-sm text-gray-600 bg-yellow-50 border-yellow-200">
          Configure an active timetable format first (Timetable Format page).
        </div>
      ) : (
        <form onSubmit={handleRun} className="card space-y-4 max-w-2xl">
          <div>
            <label className="label">Academic year *</label>
            <select required value={form.academicYearId} onChange={(e) => setForm({ ...form, academicYearId: e.target.value })} className="input">
              <option value="">Select…</option>
              {years.map((y) => <option key={y.id} value={y.id}>{y.name} {y.is_active && '(Active)'}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Format</label>
            <div className="text-sm text-gray-700 font-medium">{format.format.name} · {format.format.total_periods} periods</div>
          </div>
          <button type="submit" disabled={submitting} className="btn-primary !bg-blue-600 hover:!bg-blue-700 w-full py-3">
            <Play className="w-5 h-5 mr-2" />
            {submitting ? 'Generating…' : 'Run Generator'}
          </button>
        </form>
      )}

      {result && (
        <div className="card mt-6 border-green-200">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
            <h2 className="text-lg font-semibold text-green-900">Generation Complete</h2>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm mb-6">
            <div className="bg-gray-50 p-3 rounded-lg border"><div className="text-gray-500 text-xs">Required</div><div className="font-bold text-lg">{result.result.summary.totalRequired}</div></div>
            <div className="bg-green-50 p-3 rounded-lg border border-green-200"><div className="text-green-700 text-xs">Scheduled</div><div className="font-bold text-lg text-green-800">{result.result.summary.scheduled}</div></div>
            <div className={`p-3 rounded-lg border ${result.result.summary.unscheduled > 0 ? 'bg-red-50 border-red-200' : 'bg-gray-50'}`}>
              <div className={`text-xs ${result.result.summary.unscheduled > 0 ? 'text-red-700' : 'text-gray-500'}`}>Unscheduled</div>
              <div className={`font-bold text-lg ${result.result.summary.unscheduled > 0 ? 'text-red-800' : 'text-gray-800'}`}>{result.result.summary.unscheduled}</div>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200"><div className="text-blue-700 text-xs">Status</div><div className="font-bold text-sm text-blue-800 mt-1">{result.result.summary.fullyScheduled ? 'Perfect Fit' : 'Needs Review'}</div></div>
          </div>

          {result.result.unassigned.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-red-700 mb-2 flex items-center gap-1"><AlertTriangle className="w-4 h-4"/> Unassigned Lessons</h3>
              <ul className="text-sm space-y-1 bg-red-50 p-3 rounded border border-red-100">
                {result.result.unassigned.map((u, i) => (
                  <li key={i} className="text-red-800"><strong>{u.module}</strong> for {u.class}: {u.reason}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex justify-end">
             <a href="/dos/timetable" className="btn-primary !bg-indigo-600 hover:!bg-indigo-700">View Timetable &rarr;</a>
          </div>
        </div>
      )}
    </div>
  );
}