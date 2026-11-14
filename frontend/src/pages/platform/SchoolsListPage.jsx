// src/pages/platform/SchoolsListPage.jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, extractError } from '../../lib/api';
import Modal from '../../components/Modal';
import StatusBadge from '../../components/StatusBadge';

const COUNTRIES = [
  { code: 'RW', name: 'Rwanda' },
  { code: 'KE', name: 'Kenya' },
  { code: 'UG', name: 'Uganda' },
  { code: 'TZ', name: 'Tanzania' },
  { code: 'BI', name: 'Burundi' },
  { code: 'CD', name: 'DR Congo' },
];
const SCHOOL_TYPES = ['technical', 'vocational', 'secondary', 'combined'];

function RegisterSchoolModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState({
    name: '', shortCode: '', schoolType: 'technical', country: 'RW',
    province: '', district: '', physicalAddress: '',
    officialEmail: '', telephone: '', notes: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function update(field, value) { setForm((f) => ({ ...f, [field]: value })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setSubmitting(true);
    try {
      const { data } = await api.post('/schools', form);
      onCreated(data);
      onClose();
    } catch (err) {
      setError(extractError(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Register a new school"
      size="lg"
      footer={
        <>
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" form="register-school-form" disabled={submitting} className="btn-primary">
            {submitting ? 'Registering…' : 'Register school'}
          </button>
        </>
      }
    >
      <form id="register-school-form" onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="label">School name *</label>
            <input required value={form.name} onChange={(e) => update('name', e.target.value)} className="input" placeholder="Green Hills Technical School" />
          </div>
          <div>
            <label className="label">Short code *</label>
            <input required value={form.shortCode} onChange={(e) => update('shortCode', e.target.value.toUpperCase())} className="input" placeholder="GHT-01" />
          </div>
          <div>
            <label className="label">School type *</label>
            <select required value={form.schoolType} onChange={(e) => update('schoolType', e.target.value)} className="input">
              {SCHOOL_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Country *</label>
            <select required value={form.country} onChange={(e) => update('country', e.target.value)} className="input">
              {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Province</label>
            <input value={form.province} onChange={(e) => update('province', e.target.value)} className="input" placeholder="Kigali" />
          </div>
          <div>
            <label className="label">District</label>
            <input value={form.district} onChange={(e) => update('district', e.target.value)} className="input" placeholder="Gasabo" />
          </div>
          <div>
            <label className="label">Telephone</label>
            <input value={form.telephone} onChange={(e) => update('telephone', e.target.value)} className="input" placeholder="+250788000000" />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Physical address</label>
            <input value={form.physicalAddress} onChange={(e) => update('physicalAddress', e.target.value)} className="input" placeholder="KG 123 St, Kigali" />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Official email *</label>
            <input required type="email" value={form.officialEmail} onChange={(e) => update('officialEmail', e.target.value)} className="input" placeholder="admin@school.rw" />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Notes</label>
            <textarea value={form.notes} onChange={(e) => update('notes', e.target.value)} className="input" rows={2} placeholder="Optional internal notes" />
          </div>
        </div>
      </form>
    </Modal>
  );
}

export default function SchoolsListPage() {
  const [data, setData] = useState({ data: [], pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 } });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [showRegister, setShowRegister] = useState(false);

  function load() {
    setLoading(true);
    api
      .get('/schools', { params: { page, pageSize: 20, search: search || undefined, status: status || undefined } })
      .then(({ data }) => setData(data))
      .catch((err) => setError(extractError(err)))
      .finally(() => setLoading(false));
  }

  useEffect(load, [page, status]);

  function handleSearch(e) {
    e.preventDefault();
    setPage(1);
    load();
  }

  const pagination = data.pagination || {};

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Schools</h1>
          <p className="text-sm text-gray-500 mt-1">{pagination.total || 0} total</p>
        </div>
        <button onClick={() => setShowRegister(true)} className="btn-primary">+ Register school</button>
      </div>

      <div className="card mb-4">
        <form onSubmit={handleSearch} className="flex flex-wrap gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, code…"
            className="input flex-1 min-w-[240px]"
          />
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="input w-40">
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="expired">Expired</option>
            <option value="deactivated">Deactivated</option>
          </select>
          <button type="submit" className="btn-secondary">Search</button>
        </form>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 mb-4">{error}</div>
      )}

      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase">
            <tr>
              <th className="px-6 py-3">School</th>
              <th className="px-6 py-3">Code</th>
              <th className="px-6 py-3">Type</th>
              <th className="px-6 py-3">Country</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">Loading…</td></tr>
            ) : data.data.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">No schools yet.</td></tr>
            ) : (
              data.data.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 font-medium text-gray-900">{s.name}</td>
                  <td className="px-6 py-3 font-mono text-xs text-gray-600">{s.code}</td>
                  <td className="px-6 py-3 text-gray-600 capitalize">{s.school_type}</td>
                  <td className="px-6 py-3 text-gray-600">{s.country}</td>
                  <td className="px-6 py-3"><StatusBadge status={s.status} /></td>
                  <td className="px-6 py-3 text-right">
                    <Link to={`/platform/schools/${s.id}`} className="text-brand-600 hover:underline text-sm">View</Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
          <div>Page {pagination.page} of {pagination.totalPages}</div>
          <div className="space-x-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={pagination.page <= 1} className="btn-secondary">Previous</button>
            <button onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))} disabled={pagination.page >= pagination.totalPages} className="btn-secondary">Next</button>
          </div>
        </div>
      )}

      <RegisterSchoolModal
        open={showRegister}
        onClose={() => setShowRegister(false)}
        onCreated={() => { load(); }}
      />
    </div>
  );
}