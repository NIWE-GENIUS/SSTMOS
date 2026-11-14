// src/pages/dos/ModulesPage.jsx
import { useEffect, useState } from 'react';
import { api, extractError } from '../../lib/api';
import { PageHeader, ErrorBanner, Loading, EmptyState, TabBar } from '../../components/ui';
import Modal from '../../components/Modal';

const TABS = [
  { key: 'catalog', label: 'Modules' },
  { key: 'assignments', label: 'Assignments' },
];

export default function ModulesPage() {
  const [tab, setTab] = useState('catalog');
  const [modules, setModules] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [years, setYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null); // 'module' | 'assignment'

  function load() {
    setLoading(true);
    Promise.all([
      api.get('/modules'),
      api.get('/modules/assignments').catch(() => ({ data: { data: [] } })),
      api.get('/academic/classes').catch(() => ({ data: { data: [] } })),
      api.get('/trainers').catch(() => ({ data: { data: [] } })),
      api.get('/academic/academic-years').catch(() => ({ data: { data: [] } })),
    ]).then(([m, a, c, t, y]) => {
      setModules(m.data.data || m.data);
      setAssignments(a.data.data || []);
      setClasses(c.data.data || []);
      setTrainers(t.data.data || []);
      setYears(y.data.data || []);
    }).catch((err) => setError(extractError(err)))
      .finally(() => setLoading(false));
  }
  useEffect(load, []);

  return (
    <div>
      <PageHeader
        title="Modules"
        action={<button onClick={() => setModal(tab === 'catalog' ? 'module' : 'assignment')} className="btn-primary">
          + Add {tab === 'catalog' ? 'module' : 'assignment'}
        </button>}
      />
      <TabBar tabs={TABS} active={tab} onChange={setTab} />
      <ErrorBanner message={error} onDismiss={() => setError('')} />

      {loading ? <Loading /> : tab === 'catalog' ? (
        <ModuleList modules={modules} />
      ) : (
        <AssignmentList assignments={assignments} />
      )}

      <ModuleModal
        open={modal === 'module'}
        onClose={() => setModal(null)}
        onDone={load}
      />
      <AssignmentModal
        open={modal === 'assignment'}
        onClose={() => setModal(null)}
        onDone={load}
        modules={modules}
        classes={classes}
        trainers={trainers}
        years={years}
      />
    </div>
  );
}

function ModuleList({ modules }) {
  if (modules.length === 0) return <div className="card"><EmptyState title="No modules yet" /></div>;
  return (
    <div className="card p-0 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b text-left text-xs font-medium text-gray-500 uppercase">
          <tr>
            <th className="px-6 py-3">Code</th>
            <th className="px-6 py-3">Name</th>
            <th className="px-6 py-3">Type</th>
            <th className="px-6 py-3">Weekly periods</th>
            <th className="px-6 py-3">Sequence</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {modules.map((m) => (
            <tr key={m.id}>
              <td className="px-6 py-3 font-mono text-xs">{m.code}</td>
              <td className="px-6 py-3 font-medium">{m.name}</td>
              <td className="px-6 py-3 capitalize">{m.module_type}</td>
              <td className="px-6 py-3">{m.weekly_periods_required}</td>
              <td className="px-6 py-3">{m.sequence_length}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AssignmentList({ assignments }) {
  if (assignments.length === 0) return <div className="card"><EmptyState title="No assignments yet" description="Assign a trainer to a module + class" /></div>;
  return (
    <div className="card p-0 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b text-left text-xs font-medium text-gray-500 uppercase">
          <tr>
            <th className="px-6 py-3">Class</th>
            <th className="px-6 py-3">Module</th>
            <th className="px-6 py-3">Trainer</th>
            <th className="px-6 py-3">Weekly</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {assignments.map((a) => (
            <tr key={a.id}>
              <td className="px-6 py-3 font-medium">{a.class_name}</td>
              <td className="px-6 py-3">{a.module_code} — {a.module_name}</td>
              <td className="px-6 py-3">{a.trainer_name}</td>
              <td className="px-6 py-3">{a.weekly_periods}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ModuleModal({ open, onClose, onDone }) {
  const [levels, setLevels] = useState([]);
  const [form, setForm] = useState({ code: '', name: '', moduleType: 'theoretical', weeklyPeriodsRequired: 4, sequenceLength: 1, splitSessionPattern: 'none', priority: 5 });
  const [error, setError] = useState('');
  useEffect(() => { api.get('/academic/educational-levels').then(({ data }) => setLevels(data.data || [])).catch(() => {}); }, [open]);
  async function submit(e) {
    e.preventDefault(); setError('');
    try { await api.post('/modules', form); onDone(); onClose(); setForm({ code: '', name: '', moduleType: 'theoretical', weeklyPeriodsRequired: 4, sequenceLength: 1, splitSessionPattern: 'none', priority: 5 }); }
    catch (err) { setError(extractError(err)); }
  }
  return (
    <Modal open={open} onClose={onClose} title="Add module" footer={<>
      <button onClick={onClose} className="btn-secondary">Cancel</button>
      <button type="submit" form="mod-form" className="btn-primary">Create</button>
    </>}>
      <form id="mod-form" onSubmit={submit} className="space-y-3">
        {error && <div className="rounded bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</div>}
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Code *</label><input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} className="input" /></div>
          <div><label className="label">Name *</label><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" /></div>
          <div>
            <label className="label">Educational level</label>
            <select value={form.educationalLevelId || ''} onChange={(e) => setForm({ ...form, educationalLevelId: e.target.value || null })} className="input">
              <option value="">Any</option>
              {levels.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Type</label>
            <select value={form.moduleType} onChange={(e) => setForm({ ...form, moduleType: e.target.value })} className="input">
              <option value="theoretical">Theoretical</option>
              <option value="practical">Practical</option>
            </select>
          </div>
          <div><label className="label">Weekly periods *</label><input required type="number" min="1" max="40" value={form.weeklyPeriodsRequired} onChange={(e) => setForm({ ...form, weeklyPeriodsRequired: parseInt(e.target.value, 10) || 1 })} className="input" /></div>
          <div>
            <label className="label">Sequence length</label>
            <select value={form.sequenceLength} onChange={(e) => setForm({ ...form, sequenceLength: parseInt(e.target.value, 10) })} className="input">
              <option value="1">1 (single)</option>
              <option value="2">2 (double)</option>
              <option value="3">3 (triple)</option>
            </select>
          </div>
          <div>
            <label className="label">Split session</label>
            <select value={form.splitSessionPattern} onChange={(e) => setForm({ ...form, splitSessionPattern: e.target.value })} className="input">
              <option value="none">None</option>
              <option value="morning_break">Around morning break</option>
              <option value="lunch">Around lunch</option>
              <option value="afternoon_break">Around afternoon break</option>
            </select>
          </div>
          <div><label className="label">Priority (1-10)</label><input type="number" min="1" max="10" value={form.priority} onChange={(e) => setForm({ ...form, priority: parseInt(e.target.value, 10) || 5 })} className="input" /></div>
        </div>
      </form>
    </Modal>
  );
}

function AssignmentModal({ open, onClose, onDone, modules, classes, trainers, years }) {
  const [form, setForm] = useState({ moduleId: '', classId: '', trainerId: '', academicYearId: '', weeklyPeriods: 4 });
  const [error, setError] = useState('');
  async function submit(e) {
    e.preventDefault(); setError('');
    try {
      const mod = modules.find((m) => m.id === form.moduleId);
      await api.post('/modules/assignments', { ...form, weeklyPeriods: form.weeklyPeriods || (mod && mod.weekly_periods_required) });
      await api.post(`/modules/${form.moduleId}/authorize-trainer`, { moduleId: form.moduleId }).catch(() => {});
      onDone(); onClose(); setForm({ moduleId: '', classId: '', trainerId: '', academicYearId: '', weeklyPeriods: 4 });
    } catch (err) { setError(extractError(err)); }
  }
  return (
    <Modal open={open} onClose={onClose} title="Assign trainer to module" footer={<>
      <button onClick={onClose} className="btn-secondary">Cancel</button>
      <button type="submit" form="asn-form" className="btn-primary">Create</button>
    </>}>
      <form id="asn-form" onSubmit={submit} className="space-y-3">
        {error && <div className="rounded bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</div>}
        <div>
          <label className="label">Module *</label>
          <select required value={form.moduleId} onChange={(e) => setForm({ ...form, moduleId: e.target.value })} className="input">
            <option value="">Select…</option>
            {modules.map((m) => <option key={m.id} value={m.id}>{m.code} — {m.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Class *</label>
          <select required value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value })} className="input">
            <option value="">Select…</option>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Trainer *</label>
          <select required value={form.trainerId} onChange={(e) => setForm({ ...form, trainerId: e.target.value })} className="input">
            <option value="">Select…</option>
            {trainers.map((t) => <option key={t.id} value={t.id}>{t.full_name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Academic year *</label>
          <select required value={form.academicYearId} onChange={(e) => setForm({ ...form, academicYearId: e.target.value })} className="input">
            <option value="">Select…</option>
            {years.map((y) => <option key={y.id} value={y.id}>{y.name}</option>)}
          </select>
        </div>
        <div><label className="label">Weekly periods</label><input type="number" min="1" value={form.weeklyPeriods} onChange={(e) => setForm({ ...form, weeklyPeriods: parseInt(e.target.value, 10) || 1 })} className="input" /></div>
      </form>
    </Modal>
  );
}