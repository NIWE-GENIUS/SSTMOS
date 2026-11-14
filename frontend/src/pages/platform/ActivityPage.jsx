// src/pages/platform/ActivityPage.jsx
import { useEffect, useState } from 'react';
import { api, extractError } from '../../lib/api';
import { PageHeader, ErrorBanner, Loading } from '../../components/ui';

export default function ActivityPage() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/dashboard/stats')
      .then(({ data }) => setStats(data))
      .catch((err) => setError(extractError(err)));
  }, []);

  return (
    <div>
      <PageHeader title="Activity Log" description="Recent platform administrator actions" />
      <ErrorBanner message={error} onDismiss={() => setError('')} />
      {!stats ? <Loading /> : (
        <div className="card">
          {stats.recentActivity.length === 0 ? (
            <div className="text-sm text-gray-500">No activity recorded.</div>
          ) : (
            <ul className="divide-y divide-gray-200 -mx-6">
              {stats.recentActivity.map((a, i) => (
                <li key={i} className="px-6 py-3 flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-gray-800">{a.action}</span>
                    {a.target_school_id && <span className="text-xs text-gray-500 ml-2">school {a.target_school_id.slice(0, 8)}…</span>}
                  </div>
                  <span className="text-xs text-gray-400">{new Date(a.created_at).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}