// src/pages/dos/TimetablePage.jsx
import { useEffect, useState } from 'react';
import { api, extractError } from '../../lib/api';
import { PageHeader, ErrorBanner, Loading, EmptyState } from '../../components/ui';
import TimetableGrid from '../../components/timetable/TimetableGrid';
import StatusBadge from '../../components/StatusBadge';
import { CheckCircle2, ShieldCheck, Send, Download, FileSpreadsheet, Filter, ChevronDown } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import * as XLSX from 'xlsx';

export default function TimetablePage() {
  const [versions, setVersions] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [entries, setEntries] = useState([]);
  const [format, setFormat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [viewMode, setViewMode] = useState('master'); 
  const [filterId, setFilterId] = useState('');
  const [classes, setClasses] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [classTeacher, setClassTeacher] = useState(null);
  const [showExportMenu, setShowExportMenu] = useState(false);

  function loadVersions() {
    setLoading(true);
    Promise.all([
      api.get('/timetable/versions'),
      api.get('/timetable-config/formats/active'),
      api.get('/academic/classes').catch(() => ({ data: { data: [] } })),
      api.get('/trainers').catch(() => ({ data: { data: [] } })),
    ]).then(([v, f, c, t]) => {
      setVersions(v.data.data || []);
      setFormat(f.data);
      setClasses(c.data.data || []);
      setTrainers(t.data.data || []);
      
      const published = (v.data.data || []).find(x => x.status === 'published');
      const target = published || (v.data.data || [])[0];
      if (target) {
        setSelectedId(target.id);
        loadEntries(target.id);
      }
    }).catch(err => setError(extractError(err)))
      .finally(() => setLoading(false));
  }

  function loadEntries(id) {
    setSelectedId(id);
    api.get(`/timetable/versions/${id}/entries`)
      .then(({ data }) => setEntries(data.data || []))
      .catch((err) => setError(extractError(err)));
  }

  useEffect(loadVersions, []);

  useEffect(() => {
    if (viewMode === 'class' && filterId) {
      api.get(`/timetable/views/class/${filterId}`)
        .then(({ data }) => setClassTeacher(data.classTeacher))
        .catch(() => setClassTeacher(null));
    } else {
      setClassTeacher(null);
    }
  }, [viewMode, filterId]);

  async function act(action) {
    try {
      if (action === 'submit') await api.post(`/timetable/versions/${selectedId}/submit`);
      else if (action === 'approve') await api.post(`/timetable/versions/${selectedId}/approve`, { decision: 'approved' });
      else if (action === 'publish') await api.post(`/timetable/versions/${selectedId}/publish`);
      loadVersions();
    } catch (err) { setError(extractError(err)); }
  }

  // --- ADVANCED EXPORT LOGIC ---
  function handleDownloadPDF(orientation) {
    setShowExportMenu(false);
    const element = document.getElementById('timetable-grid-container');
    
    // Ensure the element fits exactly on one A4 page
    const opt = {
      margin:       [5, 5, 5, 5], // 5mm margins
      filename:     `Timetable_${viewMode}_${orientation}.pdf`,
      image:        { type: 'jpeg', quality: 1 },
      html2canvas:  { scale: 2, useCORS: true, scrollY: 0 },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: orientation },
      pagebreak:    { mode: 'avoid-all' } // Forces everything onto one page
    };
    
    // Temporarily apply class to force scaling if needed
    element.classList.add('pdf-export-mode');
    
    html2pdf().set(opt).from(element).save().then(() => {
      element.classList.remove('pdf-export-mode');
    });
  }

  function handleDownloadExcel() {
    setShowExportMenu(false);
    const wsData = [['TIME', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']];
    displayEntries.forEach(e => {
      wsData.push([e.start_time, e.module_code, e.trainer_name, e.class_name, e.room_name]);
    });
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Timetable');
    XLSX.writeFile(wb, `Timetable_${viewMode}.xlsx`);
  }

  const selectedVersion = versions.find(v => v.id === selectedId);
  let displayEntries = entries;
  if (viewMode === 'class' && filterId) displayEntries = entries.filter(e => e.class_id === filterId);
  if (viewMode === 'trainer' && filterId) displayEntries = entries.filter(e => e.trainer_id === filterId);

  return (
    <div className="space-y-6">
      <PageHeader title="Timetables & Analytics" description="Review, analyze, and export schedules" />
      <ErrorBanner message={error} onDismiss={() => setError('')} />

      {loading ? <Loading /> : versions.length === 0 ? (
        <div className="card"><EmptyState title="No timetable versions yet" description="Go to Generate to create your first draft" /></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Sidebar: Versions */}
          <div className="card p-0 h-fit border-slate-200 shadow-sm">
            <h3 className="px-4 py-3 border-b border-slate-100 text-sm font-bold text-slate-800 bg-slate-50 flex items-center gap-2"><Filter className="w-4 h-4"/> Versions</h3>
            <ul className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
              {versions.map((v) => (
                <li key={v.id}>
                  <button onClick={() => loadEntries(v.id)} className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors ${selectedId === v.id ? 'bg-indigo-50 border-l-4 border-indigo-500' : 'border-l-4 border-transparent'}`}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-bold text-slate-900">v{v.version_number}</span>
                      <StatusBadge status={v.status} />
                    </div>
                    <div className="text-xs text-slate-500">{new Date(v.created_at).toLocaleDateString()}</div>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Main Area */}
          <div className="lg:col-span-3 space-y-4">
            
            {/* Controls */}
            <div className="flex flex-wrap items-center justify-between bg-white p-3 rounded-xl border border-slate-200 shadow-sm gap-3">
              <div className="flex gap-2">
                {['master', 'class', 'trainer'].map(m => (
                  <button key={m} onClick={() => { setViewMode(m); setFilterId(''); }} className={`px-3 py-1.5 text-sm font-medium rounded-md capitalize ${viewMode === m ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`}>{m} View</button>
                ))}
              </div>

              {viewMode === 'class' && (
                <select value={filterId} onChange={e => setFilterId(e.target.value)} className="input max-w-xs text-sm">
                  <option value="">Select Class…</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              )}
              {viewMode === 'trainer' && (
                <select value={filterId} onChange={e => setFilterId(e.target.value)} className="input max-w-xs text-sm">
                  <option value="">Select Trainer…</option>
                  {trainers.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
                </select>
              )}

              {/* EXPORT MENU */}
              <div className="relative ml-auto">
                <button onClick={() => setShowExportMenu(!showExportMenu)} className="btn-primary !bg-indigo-600 text-sm flex items-center gap-2">
                  <Download className="w-4 h-4" /> Export <ChevronDown className="w-3 h-3" />
                </button>
                {showExportMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50">
                    <button onClick={() => handleDownloadPDF('landscape')} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-indigo-500" /> PDF (A4 Landscape)
                    </button>
                    <button onClick={() => handleDownloadPDF('portrait')} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-indigo-500" /> PDF (A4 Portrait)
                    </button>
                    <div className="border-t border-slate-100 my-1"></div>
                    <button onClick={handleDownloadExcel} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-500" /> Excel (.xlsx)
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Workflow Actions */}
            <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-sm font-medium text-slate-700">Status: <span className="capitalize text-indigo-600">{selectedVersion?.status.replace('_', ' ')}</span></span>
              <div className="flex gap-2">
                {selectedVersion?.status === 'draft' && <button onClick={() => act('submit')} className="btn-primary !bg-indigo-600 text-sm"><Send className="w-4 h-4 mr-1"/> Submit</button>}
                {selectedVersion?.status === 'pending_approval' && <button onClick={() => act('approve')} className="btn-primary !bg-emerald-600 text-sm"><CheckCircle2 className="w-4 h-4 mr-1"/> Approve</button>}
                {selectedVersion?.status === 'approved' && <button onClick={() => act('publish')} className="btn-primary !bg-purple-600 text-sm"><ShieldCheck className="w-4 h-4 mr-1"/> Publish</button>}
              </div>
            </div>

            {/* The Grid */}
            <div id="timetable-grid-container" className="bg-slate-50 p-2 sm:p-4 rounded-xl">
              {displayEntries.length === 0 ? (
                <div className="card text-center py-12 text-slate-500 bg-white border border-slate-200 rounded-xl">No lessons scheduled for this view.</div>
              ) : format ? (
                <TimetableGrid 
                  entries={displayEntries} 
                  periods={format.periods} 
                  breaks={format.breaks} 
                  sessions={format.sessions}
                  classTeacher={classTeacher}
                  title={viewMode === 'master' ? 'MASTER SCHOOL TIMETABLE' : viewMode === 'class' ? `CLASS: ${classes.find(c => c.id === filterId)?.name}` : `TRAINER: ${trainers.find(t => t.id === filterId)?.full_name}`}
                />
              ) : null}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}