// src/pages/dos/AcademicPage.jsx
import { useEffect, useState } from 'react';
import { Plus, Trash2, Pencil, X, Calendar, BookOpen, GraduationCap, Users, CalendarDays, UserGroup, Palette } from 'lucide-react';
import { api, extractError } from '../../lib/api';

// ----- Theme per entity -----
const TABS = [
  { key: 'years',    label: 'Academic Years',    endpoint: '/academic/academic-years',     color: 'blue',    icon: Calendar },
  { key: 'terms',    label: 'Terms',             endpoint: '/academic/terms',              color: 'cyan',    icon: CalendarDays },
  { key: 'levels',   label: 'Educational Levels',endpoint: '/academic/educational-levels', color: 'purple',  icon: GraduationCap },
  { key: 'classes',  label: 'Classes',           endpoint: '/academic/classes',            color: 'green',   icon: BookOpen },
  { key: 'groups',   label: 'Student Groups',    endpoint: '/academic/student-groups',     color: 'orange',  icon: UserGroup },
  { key: 'holidays', label: 'Holidays',          endpoint: '/academic/holidays',           color: 'rose',    icon: Calendar },
  { key: 'events',   label: 'Calendar Events',   endpoint: '/academic/calendar-events',    color: 'amber',   icon: Palette },
];

const THEME = {
  blue:   { bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200',   header: 'bg-blue-600',   hover: 'hover:bg-blue-50',   ring: 'focus:ring-blue-500 focus:border-blue-500',   pill: 'bg-blue-100 text-blue-800' },
  cyan:   { bg: 'bg-cyan-50',   text: 'text-cyan-700',   border: 'border-cyan-200',   header: 'bg-cyan-600',   hover: 'hover:bg-cyan-50',   ring: 'focus:ring-cyan-500 focus:border-cyan-500',   pill: 'bg-cyan-100 text-cyan-800' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', header: 'bg-purple-600', hover: 'hover:bg-purple-50', ring: 'focus:ring-purple-500 focus:border-purple-500', pill: 'bg-purple-100 text-purple-800' },
  green:  { bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-200',  header: 'bg-green-600',  hover: 'hover:bg-green-50',  ring: 'focus:ring-green-500 focus:border-green-500',  pill: 'bg-green-100 text-green-800' },
  orange: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', header: 'bg-orange-600', hover: 'hover:bg-orange-50', ring: 'focus:ring-orange-500 focus:border-orange-500', pill: 'bg-orange-100 text-orange-800' },
  rose:   { bg: 'bg-rose-50',   text: 'text-rose-700',   border: 'border-rose-200',   header: 'bg-rose-600',   hover: 'hover:bg-rose-50',   ring: 'focus:ring-rose-500 focus:border-rose-500',   pill: 'bg-rose-100 text-rose-800' },
  amber:  { bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200',  header: 'bg-amber-600',  hover: 'hover:bg-amber-50',  ring: 'focus:ring-amber-500 focus:border-amber-500',  pill: 'bg-amber-100 text-amber-800' },
};

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function AcademicPage() {
  const [tab, setTab] = useState('years');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);

  // Dependencies for dropdowns
  const [years, setYears] = useState([]);
  const [levels, setLevels] = useState([]);
  const [classes, setClasses] = useState([]);
  const [terms, setTerms] = useState([]);

  const activeTab = TABS.find((t) => t.key === tab);
  const theme = THEME[activeTab.color];

  function load() {
    setLoading(true);
    setError('');
    api.get(activeTab.endpoint)
      .then(({ data }) => setItems(data.data || []))
      .catch((err) => setError(extractError(err)))
      .finally(() => setLoading(false));
  }

  function loadDependencies() {
    Promise.all([
      api.get('/academic/academic-years').catch(() => ({ data: { data: [] } })),
      api.get('/academic/educational-levels').catch(() => ({ data: { data: [] } })),
      api.get('/academic/classes').catch(() => ({ data: { data: [] } })),
      api.get('/academic/terms').catch(() => ({ data: { data: [] } })),
    ]).then(([y, l, c, t]) => {
      setYears(y.data.data || []);
      setLevels(l.data.data || []);
      setClasses(c.data.data || []);
      setTerms(t.data.data || []);
    });
  }

  useEffect(() => { loadDependencies(); }, []);
  useEffect(() => { load(); setShowForm(false); setEditItem(null); }, [tab]);

  async function handleDelete(id) {
    if (!window.confirm('Delete this item? This cannot be undone.')) return;
    try {
      await api.delete(`${activeTab.endpoint}/${id}`);
      load();
    } catch (err) { setError(extractError(err)); }
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Academic Structure</h1>
        <p className="text-sm text-gray-500 mt-1">
          Configure years, terms, levels, classes, groups, holidays and calendar events
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6 overflow-x-auto">
        <nav className="-mb-px flex gap-1">
          {TABS.map((t) => {
            const Icon = t.icon;
            const th = THEME[t.color];
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`whitespace-nowrap py-3 px-4 border-b-2 text-sm font-medium flex items-center gap-2 transition-colors ${
                  active
                    ? `${th.text} border-current`
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {t.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${theme.pill} text-xs font-medium`}>
          <activeTab.icon className="w-3.5 h-3.5" />
          {items.length} {items.length === 1 ? 'item' : 'items'}
        </div>
        <button
          onClick={() => { setShowForm(true); setEditItem(null); }}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-md ${theme.header} text-white text-sm font-medium hover:opacity-90 transition-opacity`}
        >
          <Plus className="w-4 h-4" />
          Add {activeTab.label.replace(/s$/, '')}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-red-500 hover:text-red-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <AcademicForm
          tab={tab}
          theme={theme}
          editItem={editItem}
          deps={{ years, levels, classes, terms }}
          onCancel={() => { setShowForm(false); setEditItem(null); }}
          onSaved={() => { setShowForm(false); setEditItem(null); load(); loadDependencies(); }}
          onError={setError}
        />
      )}

      {/* Table */}
      <div className={`bg-white rounded-xl border ${theme.border} overflow-hidden`}>
        {loading ? (
          <div className="p-8 text-center text-sm text-gray-500">Loading…</div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center">
            <activeTab.icon className={`w-12 h-12 mx-auto ${theme.text} opacity-30 mb-3`} />
            <div className="text-sm font-medium text-gray-700">No {activeTab.label.toLowerCase()} yet</div>
            <p className="text-xs text-gray-500 mt-1">Click &quot;Add {activeTab.label.replace(/s$/, '')}&quot; to get started</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className={`${theme.bg} border-b ${theme.border}`}>
              <tr>
                {renderHeaders(tab, theme)}
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-600 w-24"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item) => (
                <tr key={item.id} className={`${theme.hover} transition-colors`}>
                  {renderRow(tab, item, theme)}
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => { setEditItem(item); setShowForm(true); }}
                        className="p-1.5 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                        title="Edit"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 rounded text-gray-400 hover:text-red-600 hover:bg-red-50"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ---------- Row rendering ----------

function renderHeaders(tab, theme) {
  const headers = {
    years:    ['Name', 'Start', 'End', 'Status'],
    terms:    ['Name', 'Year', 'Start', 'End', 'Status'],
    levels:   ['Name', 'Code', 'Status'],
    classes:  ['Name', 'Level', 'Trade', 'Students', 'Status'],
    groups:   ['Name', 'Class', 'Capacity'],
    holidays: ['Name', 'Start', 'End'],
    events:   ['Name', 'Type', 'Start', 'End', 'Affects TT'],
  };
  return headers[tab].map((h) => (
    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
      {h}
    </th>
  ));
}

function renderRow(tab, item, theme) {
  const badge = (text, cls = theme.pill) => (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>{text}</span>
  );
  const active = (v) => badge(v ? 'Active' : 'Inactive', v ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600');

  switch (tab) {
    case 'years':
      return (<>
        <td className="px-4 py-3 font-medium text-gray-900">{item.name}</td>
        <td className="px-4 py-3 text-gray-600">{fmtDate(item.start_date)}</td>
        <td className="px-4 py-3 text-gray-600">{fmtDate(item.end_date)}</td>
        <td className="px-4 py-3">{active(item.is_active)}</td>
      </>);
    case 'terms': {
      const yearName = (typeof item === 'object' && item.academic_year_id) ? '' : ''; // not joined; show id later
      return (<>
        <td className="px-4 py-3 font-medium text-gray-900">{item.name}</td>
        <td className="px-4 py-3 text-gray-600 text-xs">{item.academic_year_id?.slice(0, 8) || '—'}</td>
        <td className="px-4 py-3 text-gray-600">{fmtDate(item.start_date)}</td>
        <td className="px-4 py-3 text-gray-600">{fmtDate(item.end_date)}</td>
        <td className="px-4 py-3">{active(item.is_active)}</td>
      </>);
    }
    case 'levels':
      return (<>
        <td className="px-4 py-3 font-medium text-gray-900">{item.name}</td>
        <td className="px-4 py-3 text-gray-600 font-mono text-xs">{item.code}</td>
        <td className="px-4 py-3">{active(item.is_active)}</td>
      </>);
    case 'classes':
      return (<>
        <td className="px-4 py-3 font-medium text-gray-900">{item.name}</td>
        <td className="px-4 py-3 text-gray-600 text-xs">{item.educational_level_id?.slice(0, 8) || '—'}</td>
        <td className="px-4 py-3 text-gray-600">{item.trade_specialization || '—'}</td>
        <td className="px-4 py-3 text-gray-600">{item.student_count ?? '—'}</td>
        <td className="px-4 py-3">{item.status === 'active' ? badge('Active', 'bg-green-100 text-green-800') : badge('Inactive', 'bg-gray-100 text-gray-600')}</td>
      </>);
    case 'groups':
      return (<>
        <td className="px-4 py-3 font-medium text-gray-900">{item.name}</td>
        <td className="px-4 py-3 text-gray-600 text-xs">{item.class_id?.slice(0, 8) || '—'}</td>
        <td className="px-4 py-3 text-gray-600">{item.capacity ?? '—'}</td>
      </>);
    case 'holidays':
      return (<>
        <td className="px-4 py-3 font-medium text-gray-900">{item.name}</td>
        <td className="px-4 py-3 text-gray-600">{fmtDate(item.start_date)}</td>
        <td className="px-4 py-3 text-gray-600">{fmtDate(item.end_date)}</td>
      </>);
    case 'events':
      return (<>
        <td className="px-4 py-3 font-medium text-gray-900">{item.name}</td>
        <td className="px-4 py-3 text-gray-600 capitalize">{item.event_type}</td>
        <td className="px-4 py-3 text-gray-600">{fmtDate(item.start_date)}</td>
        <td className="px-4 py-3 text-gray-600">{fmtDate(item.end_date)}</td>
        <td className="px-4 py-3">{item.affects_timetable ? badge('Yes', 'bg-red-100 text-red-700') : badge('No', 'bg-gray-100 text-gray-600')}</td>
      </>);
    default: return null;
  }
}

// ---------- Form ----------

function AcademicForm({ tab, theme, editItem, deps, onCancel, onSaved, onError }) {
  const [form, setForm] = useState(() => buildInitial(tab, editItem));
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { setForm(buildInitial(tab, editItem)); }, [tab, editItem]);

  function set(field, value) { setForm((f) => ({ ...f, [field]: value })); }

  async function submit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const endpoint = TABS.find((t) => t.key === tab).endpoint;
      const payload = filterPayload(tab, form);
      if (editItem?.id) {
        await api.patch(`${endpoint}/${editItem.id}`, payload);
      } else {
        await api.post(endpoint, payload);
      }
      onSaved();
    } catch (err) {
      onError(extractError(err));
    } finally {
      setSubmitting(false);
    }
  }

  const inputCls = `input ${theme.ring}`;

  return (
    <form onSubmit={submit} className={`mb-6 rounded-xl border ${theme.border} bg-white p-6`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-base font-semibold ${theme.text}`}>
          {editItem ? 'Edit' : 'New'} {TABS.find((t) => t.key === tab).label.replace(/s$/, '')}
        </h3>
        <button type="button" onClick={onCancel} className="text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {tab === 'years' && (<>
          <div className="sm:col-span-2">
            <label className="label">Year name *</label>
            <input required value={form.name || ''} onChange={(e) => set('name', e.target.value)} className={inputCls} placeholder="2026–2027" />
          </div>
          <div>
            <label className="label">Start date *</label>
            <input required type="date" value={form.startDate || ''} onChange={(e) => set('startDate', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="label">End date *</label>
            <input required type="date" value={form.endDate || ''} onChange={(e) => set('endDate', e.target.value)} className={inputCls} />
          </div>
          <label className="sm:col-span-2 flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={!!form.isActive} onChange={(e) => set('isActive', e.target.checked)} className="rounded" />
            Set as current / active academic year
          </label>
        </>)}

        {tab === 'terms' && (<>
          <div>
            <label className="label">Academic year *</label>
            <select required value={form.academicYearId || ''} onChange={(e) => set('academicYearId', e.target.value)} className={inputCls}>
              <option value="">Select year…</option>
              {deps.years.map((y) => <option key={y.id} value={y.id}>{y.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Term name *</label>
            <input required value={form.name || ''} onChange={(e) => set('name', e.target.value)} className={inputCls} placeholder="Term 1" />
          </div>
          <div>
            <label className="label">Start date *</label>
            <input required type="date" value={form.startDate || ''} onChange={(e) => set('startDate', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="label">End date *</label>
            <input required type="date" value={form.endDate || ''} onChange={(e) => set('endDate', e.target.value)} className={inputCls} />
          </div>
          <label className="sm:col-span-2 flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={!!form.isActive} onChange={(e) => set('isActive', e.target.checked)} className="rounded" />
            Set as active term
          </label>
        </>)}

        {tab === 'levels' && (<>
          <div>
            <label className="label">Level name *</label>
            <input required value={form.name || ''} onChange={(e) => set('name', e.target.value)} className={inputCls} placeholder="Level 4" />
          </div>
          <div>
            <label className="label">Level code *</label>
            <input required value={form.code || ''} onChange={(e) => set('code', e.target.value.toUpperCase())} className={inputCls} placeholder="L4" />
          </div>
          <div>
            <label className="label">Sort order</label>
            <input type="number" value={form.sortOrder || ''} onChange={(e) => set('sortOrder', parseInt(e.target.value, 10) || 0)} className={inputCls} placeholder="4" />
          </div>
        </>)}

        {tab === 'classes' && (<>
          <div>
            <label className="label">Educational level *</label>
            <select required value={form.educationalLevelId || ''} onChange={(e) => set('educationalLevelId', e.target.value)} className={inputCls}>
              <option value="">Select…</option>
              {deps.levels.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Academic year *</label>
            <select required value={form.academicYearId || ''} onChange={(e) => set('academicYearId', e.target.value)} className={inputCls}>
              <option value="">Select…</option>
              {deps.years.map((y) => <option key={y.id} value={y.id}>{y.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Class name *</label>
            <input required value={form.name || ''} onChange={(e) => set('name', e.target.value)} className={inputCls} placeholder="L4 SOD" />
          </div>
          <div>
            <label className="label">Trade / specialization</label>
            <input value={form.tradeSpecialization || ''} onChange={(e) => set('tradeSpecialization', e.target.value)} className={inputCls} placeholder="Software Development" />
          </div>
          <div>
            <label className="label">Student count</label>
            <input type="number" min="0" value={form.studentCount || ''} onChange={(e) => set('studentCount', parseInt(e.target.value, 10) || 0)} className={inputCls} placeholder="30" />
          </div>
          <div>
            <label className="label">Status</label>
            <select value={form.status || 'active'} onChange={(e) => set('status', e.target.value)} className={inputCls}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </>)}

        {tab === 'groups' && (<>
          <div>
            <label className="label">Parent class *</label>
            <select required value={form.classId || ''} onChange={(e) => set('classId', e.target.value)} className={inputCls}>
              <option value="">Select class…</option>
              {deps.classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Group name *</label>
            <input required value={form.name || ''} onChange={(e) => set('name', e.target.value)} className={inputCls} placeholder="Group A" />
          </div>
          <div>
            <label className="label">Capacity</label>
            <input type="number" min="0" value={form.capacity || ''} onChange={(e) => set('capacity', parseInt(e.target.value, 10) || 0)} className={inputCls} placeholder="15" />
          </div>
        </>)}

        {tab === 'holidays' && (<>
          <div className="sm:col-span-2">
            <label className="label">Holiday name *</label>
            <input required value={form.name || ''} onChange={(e) => set('name', e.target.value)} className={inputCls} placeholder="Independence Day" />
          </div>
          <div>
            <label className="label">Start date *</label>
            <input required type="date" value={form.startDate || ''} onChange={(e) => set('startDate', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="label">End date *</label>
            <input required type="date" value={form.endDate || ''} onChange={(e) => set('endDate', e.target.value)} className={inputCls} />
          </div>
        </>)}

        {tab === 'events' && (<>
          <div className="sm:col-span-2">
            <label className="label">Event name *</label>
            <input required value={form.name || ''} onChange={(e) => set('name', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="label">Event type *</label>
            <select required value={form.eventType || 'meeting'} onChange={(e) => set('eventType', e.target.value)} className={inputCls}>
              <option value="meeting">Meeting</option>
              <option value="exam">Exam</option>
              <option value="sports">Sports</option>
              <option value="assembly">Assembly</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="label">Term (optional)</label>
            <select value={form.termId || ''} onChange={(e) => set('termId', e.target.value || null)} className={inputCls}>
              <option value="">None</option>
              {deps.terms.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Start date *</label>
            <input required type="date" value={form.startDate || ''} onChange={(e) => set('startDate', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="label">End date *</label>
            <input required type="date" value={form.endDate || ''} onChange={(e) => set('endDate', e.target.value)} className={inputCls} />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Notes</label>
            <textarea rows={2} value={form.notes || ''} onChange={(e) => set('notes', e.target.value)} className={inputCls} />
          </div>
          <label className="sm:col-span-2 flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={!!form.affectsTimetable} onChange={(e) => set('affectsTimetable', e.target.checked)} className="rounded" />
            This event affects the timetable
          </label>
        </>)}
      </div>

      <div className="mt-6 flex items-center justify-end gap-2">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={submitting} className={`inline-flex items-center gap-2 px-4 py-2 rounded-md ${theme.header} text-white text-sm font-medium hover:opacity-90 disabled:opacity-50`}>
          {submitting ? 'Saving…' : editItem ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  );
}

function buildInitial(tab, editItem) {
  if (editItem) {
    // Convert snake_case to camelCase for form fields
    const obj = {};
    Object.entries(editItem).forEach(([k, v]) => {
      const camel = k.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
      obj[camel] = v;
    });
    return obj;
  }
  return {};
}

function filterPayload(tab, form) {
  const allowed = {
    years:    ['name', 'startDate', 'endDate', 'isActive'],
    terms:    ['academicYearId', 'name', 'startDate', 'endDate', 'isActive'],
    levels:   ['name', 'code', 'sortOrder', 'isActive'],
    classes:  ['educationalLevelId', 'academicYearId', 'name', 'tradeSpecialization', 'studentCount', 'status'],
    groups:   ['classId', 'name', 'capacity'],
    holidays: ['name', 'startDate', 'endDate'],
    events:   ['name', 'eventType', 'termId', 'startDate', 'endDate', 'affectsTimetable', 'notes'],
  };
  const out = {};
  for (const k of allowed[tab]) {
    if (form[k] !== undefined) out[k] = form[k];
  }
  return out;
}