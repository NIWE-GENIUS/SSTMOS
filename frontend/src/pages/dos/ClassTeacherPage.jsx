import { useEffect, useState } from 'react';
import { api, extractError } from '../../lib/api';
import { PageHeader, ErrorBanner } from '../../components/ui';
import { UserCheck } from 'lucide-react';

export default function ClassTeacherPage() {
  const [assignments, setAssignments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [years, setYears] = useState([]);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ classId: '', trainerId: '', academicYearId: '' });

  function load() {
    Promise.all([
      api.get('/class-teachers').catch(() => ({ data: { data: [] } })),
      api.get('/academic/classes').catch(() => ({ data: { data: [] } })),
      api.get('/trainers').catch(() => ({ data: { data: [] } })),
      api.get('/academic/academic-years').catch(() => ({ data: { data: [] } })),
    ]).then(([a, c, t, y]) => {
      setAssignments(a.data.data || []);
      setClasses(c.data.data || []);
      setTrainers(t.data.data || []);
      setYears(y.data.data || []);
      const activeYear = (y.data.data || []).find(yr => yr.is_active);
      if (activeYear) setForm(f => ({ ...f, academicYearId: activeYear.id }));
    });
  }

  useEffect(load, []);

  async function handleAssign(e) {
    e.preventDefault();
    setError('');
    try {
      await api.post('/class-teachers', form);
      setForm({ ...form, classId: '', trainerId: '' });
      load();
    } catch (err) { setError(extractError(err)); }
  }

  return (
    <div>
      <PageHeader title="Class Teachers" description="Assign a representative teacher to each class" />
      <ErrorBanner message={error} onDismiss={() => setError('')} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card">
          <h2 className="font-semibold mb-4 flex items-center gap-2"><UserCheck className="w-5 h-5 text-blue-600"/> New Assignment</h2>
          <form onSubmit={handleAssign} className="space-y-3">
            <div>
              <label className="label">Academic Year</label>
              <select required value={form.academicYearId} onChange={e => setForm({...form, academicYearId: e.target.value})} className="input">
                <option value="">Select Year…</option>
                {years.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Class</label>
              <select required value={form.classId} onChange={e => setForm({...form, classId: e.target.value})} className="input">
                <option value="">Select Class…</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Teacher</label>
              <select required value={form.trainerId} onChange={e => setForm({...form, trainerId: e.target.value})} className="input">
                <option value="">Select Teacher…</option>
                {trainers.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
              </select>
            </div>
            <button type="submit" className="btn-primary !bg-blue-600 w-full">Assign Teacher</button>
          </form>
        </div>

        <div className="card lg:col-span-2 p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left">Class</th>
                <th className="px-4 py-3 text-left">Teacher</th>
                <th className="px-4 py-3 text-left">Year</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {assignments.map(a => (
                <tr key={a.id}>
                  <td className="px-4 py-3 font-medium">{a.class_name}</td>
                  <td className="px-4 py-3">{a.trainer_name}</td>
                  <td className="px-4 py-3 text-gray-500">{a.year_name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}