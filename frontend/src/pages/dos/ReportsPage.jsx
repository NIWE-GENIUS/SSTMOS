// src/pages/dos/ReportsPage.jsx
import { useEffect, useState } from 'react';
import { api, extractError } from '../../lib/api';
import { PageHeader, ErrorBanner, Loading, EmptyState } from '../../components/ui';
import { FileText, Download, Search, Filter, ShieldAlert, BarChart3, Users, Clock, PieChart } from 'lucide-react';
import * as XLSX from 'xlsx';

const TABS = [
  { key: 'workload', label: 'Trainer Workload', icon: Users },
  { key: 'coverage', label: 'Module Coverage', icon: BarChart3 },
  { key: 'rooms', label: 'Room Utilization', icon: PieChart },
];

export default function ReportsPage() {
  const [tab, setTab] = useState('workload');
  const [data, setData] = useState([]);
  const [versions, setVersions] = useState([]);
  const [versionId, setVersionId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    api.get('/timetable/versions').then(({ data }) => {
      setVersions(data.data || []);
      const published = (data.data || []).find((v) => v.status === 'published');
      if (published) setVersionId(published.id);
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    const url = tab === 'workload'
      ? '/reports/trainer-workload'
      : tab === 'coverage'
        ? `/reports/module-coverage?versionId=${versionId || ''}`
        : `/reports/room-utilization?versionId=${versionId || ''}`;
    api.get(url)
      .then(({ data }) => setData(data.data || data))
      .catch((err) => setError(extractError(err)))
      .finally(() => setLoading(false));
  }, [tab, versionId]);

  // Export Logic
  function exportExcel() {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Report');
    XLSX.writeFile(wb, `${tab}_report_${Date.now()}.xlsx`);
  }

  // Filter Data
  const filteredData = data.filter(row => {
    if (!searchTerm) return true;
    const text = Object.values(row).join(' ').toLowerCase();
    return text.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Reports & Analytics" 
        description="Monitor workload, coverage, and room utilization" 
        action={
          <button onClick={exportExcel} className="btn-secondary text-sm flex items-center gap-2">
            <Download className="w-4 h-4" /> Export Excel
          </button>
        }
      />
      <ErrorBanner message={error} onDismiss={() => setError('')} />

      {/* Analytics Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card flex items-center gap-4 border-l-4 border-l-indigo-500">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg"><Users className="w-6 h-6" /></div>
          <div>
            <div className="text-sm text-slate-500 font-medium">Active Trainers</div>
            <div className="text-2xl font-bold text-slate-900">{filteredData.length || 0}</div>
          </div>
        </div>
        <div className="card flex items-center gap-4 border-l-4 border-l-emerald-500">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg"><Clock className="w-6 h-6" /></div>
          <div>
            <div className="text-sm text-slate-500 font-medium">Total Scheduled Periods</div>
            <div className="text-2xl font-bold text-slate-900">
              {filteredData.reduce((acc, curr) => acc + (curr.scheduled_periods || curr.scheduled_count || 0), 0)}
            </div>
          </div>
        </div>
        <div className="card flex items-center gap-4 border-l-4 border-l-amber-500">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg"><ShieldAlert className="w-6 h-6" /></div>
          <div>
            <div className="text-sm text-slate-500 font-medium">Unresolved Conflicts</div>
            <div className="text-2xl font-bold text-slate-900">0</div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="card p-0 overflow-hidden border-slate-200">
        
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 bg-slate-50">
          <div className="flex gap-2">
            {TABS.map(t => {
              const Icon = t.icon;
              return (
                <button 
                  key={t.key} 
                  onClick={() => setTab(t.key)} 
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${tab === t.key ? 'bg-white text-indigo-700 shadow-sm border border-slate-200' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  <Icon className="w-4 h-4" /> {t.label}
                </button>
              )
            })}
          </div>
          
          <div className="flex items-center gap-3">
            {tab !== 'workload' && versions.length > 0 && (
              <select value={versionId} onChange={(e) => setVersionId(e.target.value)} className="input text-sm py-1.5 max-w-[200px]">
                {versions.map((v) => <option key={v.id} value={v.id}>Version {v.version_number} ({v.status})</option>)}
              </select>
            )}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search reports..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="input pl-9 text-sm py-1.5 w-64"
              />
            </div>
          </div>
        </div>

        {/* Content Table */}
        {loading ? <Loading /> : filteredData.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-medium text-slate-900">No data available</h3>
            <p className="text-sm text-slate-500 mt-1">Generate and publish a timetable first.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-white border-b border-slate-200 text-xs uppercase text-slate-500 font-semibold">
                {tab === 'workload' && (
                  <tr><th className="px-6 py-4">Trainer</th><th className="px-6 py-4">Staff #</th><th className="px-6 py-4">Scheduled</th><th className="px-6 py-4">Max Cap</th><th className="px-6 py-4">Classes</th><th className="px-6 py-4">Modules</th></tr>
                )}
                {tab === 'coverage' && (
                  <tr><th className="px-6 py-4">Class</th><th className="px-6 py-4">Module</th><th className="px-6 py-4">Required</th><th className="px-6 py-4">Scheduled</th><th className="px-6 py-4">Gap</th></tr>
                )}
                {tab === 'rooms' && (
                  <tr><th className="px-6 py-4">Room</th><th className="px-6 py-4">Type</th><th className="px-6 py-4">Capacity</th><th className="px-6 py-4">Scheduled Uses</th></tr>
                )}
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tab === 'workload' && filteredData.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">{d.full_name}</td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">{d.staff_number}</td>
                    <td className="px-6 py-4"><span className="badge bg-indigo-100 text-indigo-800">{d.scheduled_periods} periods</span></td>
                    <td className="px-6 py-4 text-slate-600">{d.max_weekly_periods || '—'}</td>
                    <td className="px-6 py-4 text-slate-600">{d.classes_taught}</td>
                    <td className="px-6 py-4 text-slate-600">{d.modules_taught}</td>
                  </tr>
                ))}
                {tab === 'coverage' && filteredData.map((d, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">{d.class_name}</td>
                    <td className="px-6 py-4 text-slate-600">{d.code} — {d.name}</td>
                    <td className="px-6 py-4 text-slate-600">{d.required_periods}</td>
                    <td className="px-6 py-4 text-slate-600">{d.scheduled_periods}</td>
                    <td className="px-6 py-4">
                      <span className={`badge ${d.gap === 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                        {d.gap === 0 ? 'Perfect' : `Missing ${d.gap}`}
                      </span>
                    </td>
                  </tr>
                ))}
                {tab === 'rooms' && filteredData.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">{d.name}</td>
                    <td className="px-6 py-4 text-slate-600">{d.room_type}</td>
                    <td className="px-6 py-4 text-slate-600">{d.capacity}</td>
                    <td className="px-6 py-4 text-slate-600">{d.scheduled_count} slots</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}