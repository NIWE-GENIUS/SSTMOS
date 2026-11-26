// src/pages/platform/SchoolRegistrationsPage.jsx
import { useEffect, useState } from 'react';
import { Building2, CheckCircle2, XCircle, Eye, Search } from 'lucide-react';
import { api, extractError } from '../../lib/api';
import { PageHeader, ErrorBanner, Loading } from '../../components/ui';
import Modal from '../../components/Modal';

export default function SchoolRegistrationsPage() {
    const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
    const [data, setData] = useState({ data: [], pagination: {} });
    const [filters, setFilters] = useState({ status: 'pending', search: '', page: 1 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selected, setSelected] = useState(null);
    const [rejectReason, setRejectReason] = useState('');
    const [processing, setProcessing] = useState(false);

    function load() {
        setLoading(true);
        Promise.all([
            api.get('/school-registrations/stats'),
            api.get('/school-registrations', { params: filters }),
        ]).then(([s, l]) => {
            setStats(s.data);
            setData(l.data);
        }).catch(err => setError(extractError(err)))
          .finally(() => setLoading(false));
    }

    useEffect(load, [filters]);

    function openRequest(id) {
        api.get(`/school-registrations/${id}`)
            .then(({ data }) => { setSelected(data); setRejectReason(''); })
            .catch(err => setError(extractError(err)));
    }

    async function approve() {
        if (!selected) return;
        setProcessing(true);
        try {
            const { data: result } = await api.post(`/school-registrations/${selected.id}/approve`);
            alert(`School created: ${result.schoolCode}\nContact: ${result.email}\nThey received a welcome email.`);
            setSelected(null);
            load();
        } catch (err) { setError(extractError(err)); }
        finally { setProcessing(false); }
    }

    async function reject() {
        if (!selected) return;
        setProcessing(true);
        try {
            await api.post(`/school-registrations/${selected.id}/reject`, { reason: rejectReason });
            setSelected(null);
            load();
        } catch (err) { setError(extractError(err)); }
        finally { setProcessing(false); }
    }

    return (
        <div>
            <PageHeader title="School Registrations" description="Review and approve schools requesting access" />
            <ErrorBanner message={error} onDismiss={() => setError('')} />

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <div className="card border-l-4 border-l-gray-400"><div className="text-sm text-gray-500">Total</div><div className="text-2xl font-bold">{stats.total}</div></div>
                <div className="card border-l-4 border-l-yellow-500"><div className="text-sm text-gray-500">Pending</div><div className="text-2xl font-bold text-yellow-600">{stats.pending}</div></div>
                <div className="card border-l-4 border-l-green-500"><div className="text-sm text-gray-500">Approved</div><div className="text-2xl font-bold text-green-600">{stats.approved}</div></div>
                <div className="card border-l-4 border-l-red-500"><div className="text-sm text-gray-500">Rejected</div><div className="text-2xl font-bold text-red-600">{stats.rejected}</div></div>
            </div>

            <div className="card mb-4 flex gap-3">
                <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" placeholder="Search school, contact…" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })} className="input pl-9" />
                </div>
                <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })} className="input w-40">
                    <option value="">All</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                </select>
            </div>

            {loading ? <Loading /> : (
                <div className="card p-0 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs uppercase text-gray-500">Ref</th>
                                <th className="px-4 py-3 text-left text-xs uppercase text-gray-500">School</th>
                                <th className="px-4 py-3 text-left text-xs uppercase text-gray-500">Contact</th>
                                <th className="px-4 py-3 text-left text-xs uppercase text-gray-500">Status</th>
                                <th className="px-4 py-3 text-left text-xs uppercase text-gray-500">Date</th>
                                <th className="px-4 py-3"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {data.data.map((r) => (
                                <tr key={r.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => openRequest(r.id)}>
                                    <td className="px-4 py-3 font-mono text-xs">{r.reference_number}</td>
                                    <td className="px-4 py-3">
                                        <div className="font-medium">{r.school_name}</div>
                                        <div className="text-xs text-gray-500">{r.country} · {r.school_type}</div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="text-sm">{r.contact_full_name}</div>
                                        <div className="text-xs text-gray-500">{r.contact_email}</div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                                            r.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                            r.status === 'approved' ? 'bg-green-100 text-green-800' :
                                            'bg-red-100 text-red-800'
                                        }`}>{r.status}</span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-500 text-xs">{new Date(r.created_at).toLocaleDateString()}</td>
                                    <td className="px-4 py-3"><Eye className="w-4 h-4 text-gray-400" /></td>
                                </tr>
                            ))}
                            {data.data.length === 0 && (
                                <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-500">No registrations.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {selected && (
                <Modal open={true} onClose={() => setSelected(null)} title={`Registration ${selected.reference_number}`} size="lg">
                    <div className="space-y-4">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h3 className="font-bold text-blue-900 mb-2">{selected.school_name}</h3>
                            <div className="grid grid-cols-2 gap-2 text-sm text-blue-800">
                                <div><strong>Type:</strong> {selected.school_type}</div>
                                <div><strong>Country:</strong> {selected.country}</div>
                                <div><strong>Email:</strong> {selected.official_email}</div>
                                <div><strong>Phone:</strong> {selected.telephone || '—'}</div>
                            </div>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4">
                            <h3 className="font-bold text-gray-800 mb-2">Contact Person</h3>
                            <div className="text-sm text-gray-700 space-y-1">
                                <div><strong>Name:</strong> {selected.contact_full_name}</div>
                                <div><strong>Email:</strong> {selected.contact_email}</div>
                                <div><strong>Phone:</strong> {selected.contact_phone || '—'}</div>
                                <div><strong>Role:</strong> {selected.contact_role || '—'}</div>
                            </div>
                        </div>

                        {selected.status === 'pending' && (
                            <>
                                <div className="rounded-md bg-green-50 border border-green-200 p-3 text-sm text-green-800">
                                    <strong>Approving</strong> will create the school, create the DOS account,
                                    and send a welcome email to <strong>{selected.contact_email}</strong>.
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={approve} disabled={processing} className="btn-primary !bg-green-600 hover:!bg-green-700 flex-1">
                                        <CheckCircle2 className="w-4 h-4 mr-2 inline" /> Approve Registration
                                    </button>
                                    <button onClick={reject} disabled={processing} className="btn-danger flex-1">
                                        <XCircle className="w-4 h-4 mr-2 inline" /> Reject
                                    </button>
                                </div>
                                <div>
                                    <label className="label">Rejection reason (optional)</label>
                                    <textarea rows={2} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} className="input" placeholder="Reason if rejecting…" />
                                </div>
                            </>
                        )}

                        {selected.status !== 'pending' && (
                            <div className={`rounded-md p-3 text-sm ${selected.status === 'approved' ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>
                                This request has been <strong>{selected.status}</strong>.
                                {selected.rejected_reason && <p className="mt-1">Reason: {selected.rejected_reason}</p>}
                            </div>
                        )}

                        <div className="flex justify-end">
                            <button onClick={() => setSelected(null)} className="btn-secondary">Close</button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}