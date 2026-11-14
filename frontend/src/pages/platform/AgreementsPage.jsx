// src/pages/platform/AgreementsPage.jsx
import { useEffect, useState } from 'react';
import { api, extractError } from '../../lib/api';
import { PageHeader, ErrorBanner, Loading } from '../../components/ui';
import StatusBadge from '../../components/StatusBadge';

export default function AgreementsPage() {
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/schools', { params: { status: 'active', pageSize: 100 } }),
      api.get('/schools', { params: { status: 'suspended', pageSize: 100 } }),
      api.get('/schools', { params: { status: 'expired', pageSize: 100 } }),
    ])
      .then(([a, s, e]) => setSchools([...a.data.data, ...s.data.data, ...e.data.data]))
      .catch((err) => setError(extractError(err)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHeader title="Agreements & Subscriptions" description="Monitor active service periods across all schools" />
      <ErrorBanner message={error} onDismiss={() => setError('')} />

      {loading ? <Loading /> : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase">
              <tr>
                <th className="px-6 py-3">School</th>
                <th className="px-6 py-3">Code</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Activated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {schools.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">No subscribed schools yet.</td></tr>
              ) : schools.map((s) => (
                <tr key={s.id}>
                  <td className="px-6 py-3 font-medium text-gray-900">{s.name}</td>
                  <td className="px-6 py-3 font-mono text-xs text-gray-600">{s.code}</td>
                  <td className="px-6 py-3"><StatusBadge status={s.status} /></td>
                  <td className="px-6 py-3 text-gray-600">{s.activated_at ? new Date(s.activated_at).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}