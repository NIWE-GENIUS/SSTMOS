// src/pages/dos/UsersPage.jsx
import { useEffect, useState } from 'react';
import { api, extractError } from '../../lib/api';
import { PageHeader, ErrorBanner, Loading, EmptyState } from '../../components/ui';
import Modal from '../../components/Modal';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ fullName: '', email: '', password: '', role: 'trainer' });

  function load() {
    setLoading(true);
    api.get('/school/users')
      .then(({ data }) => setUsers(data.data || []))
      .catch((err) => setError(extractError(err)))
      .finally(() => setLoading(false));
  }
  useEffect(load, []);

  async function handleAdd(e) {
    e.preventDefault(); setError('');
    try {
      await api.post('/school/users', form);
      setShowAdd(false); setForm({ fullName: '', email: '', password: '', role: 'trainer' }); load();
    } catch (err) { setError(extractError(err)); }
  }

  return (
    <div>
      <PageHeader title="School Users" action={<button onClick={() => setShowAdd(true)} className="btn-primary">+ Add user</button>} />
      <ErrorBanner message={error} onDismiss={() => setError('')} />

      {loading ? <Loading /> : users.length === 0 ? (
        <div className="card"><EmptyState title="No users yet" /></div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b text-left text-xs font-medium text-gray-500 uppercase">
              <tr>
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3">Roles</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="px-6 py-3 font-medium">{u.full_name}</td>
                  <td className="px-6 py-3 text-gray-600">{u.email}</td>
                  <td className="px-6 py-3 text-xs">{(u.roles || []).join(', ')}</td>
                  <td className="px-6 py-3"><span className="badge-green">{u.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add user" footer={
        <>
          <button onClick={() => setShowAdd(false)} className="btn-secondary">Cancel</button>
          <button type="submit" form="user-form" className="btn-primary">Create</button>
        </>
      }>
        <form id="user-form" onSubmit={handleAdd} className="space-y-3">
          {error && <div className="rounded bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</div>}
          <div><label className="label">Full name *</label><input required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="input" /></div>
          <div><label className="label">Email *</label><input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input" /></div>
          <div><label className="label">Password *</label><input required minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="input" /></div>
          <div>
            <label className="label">Role *</label>
            <select required value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="input">
              <option value="head_teacher">Head Teacher</option>
              <option value="deputy_head_teacher">Deputy Head Teacher</option>
              <option value="trainer">Trainer</option>
              <option value="student">Student</option>
            </select>
          </div>
        </form>
      </Modal>
    </div>
  );
}