// frontend/src/pages/platform/ContactMessagesPage.jsx
import { useEffect, useState } from 'react';
import { Mail, MessageSquare, Send, Search, Filter, Eye, CheckCircle2 } from 'lucide-react';
import { api, extractError } from '../../lib/api';
import { PageHeader, ErrorBanner, Loading } from '../../components/ui';
import Modal from '../../components/Modal';

export default function ContactMessagesPage() {
    const [stats, setStats] = useState({ total: 0, pending: 0, replied: 0 });
    const [data, setData] = useState({ data: [], pagination: {} });
    const [filters, setFilters] = useState({ status: '', search: '', page: 1 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selected, setSelected] = useState(null);
    const [replyText, setReplyText] = useState('');
    const [replySending, setReplySending] = useState(false);

    function load() {
        setLoading(true);
        Promise.all([
            api.get('/contact/stats'),
            api.get('/contact', { params: { ...filters, pageSize: 20 } }),
        ]).then(([s, l]) => {
            setStats(s.data);
            setData(l.data);
        }).catch(err => setError(extractError(err)))
          .finally(() => setLoading(false));
    }

    useEffect(load, [filters]);

    function openMessage(id) {
        api.get(`/contact/${id}`)
            .then(({ data }) => { setSelected(data); setReplyText(''); })
            .catch(err => setError(extractError(err)));
    }

    async function sendReply() {
        if (!replyText.trim()) return;
        setReplySending(true);
        try {
            await api.post(`/contact/${selected.id}/reply`, { replyBody: replyText });
            setReplyText('');
            await openMessage(selected.id);
            load();
        } catch (err) { setError(extractError(err)); }
        finally { setReplySending(false); }
    }

    return (
        <div>
            <PageHeader title="Contact Messages" description="Manage inquiries from schools and visitors" />
            <ErrorBanner message={error} onDismiss={() => setError('')} />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="card border-l-4 border-l-blue-500"><div className="text-sm text-gray-500">Total</div><div className="text-2xl font-bold">{stats.total}</div></div>
                <div className="card border-l-4 border-l-yellow-500"><div className="text-sm text-gray-500">Pending</div><div className="text-2xl font-bold text-yellow-600">{stats.pending}</div></div>
                <div className="card border-l-4 border-l-green-500"><div className="text-sm text-gray-500">Replied</div><div className="text-2xl font-bold text-green-600">{stats.replied}</div></div>
            </div>

            <div className="card mb-4 flex gap-3">
                <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" placeholder="Search by name, email, subject, reference…" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })} className="input pl-9" />
                </div>
                <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })} className="input w-40">
                    <option value="">All statuses</option>
                    <option value="pending">Pending</option>
                    <option value="replied">Replied</option>
                    <option value="closed">Closed</option>
                    <option value="spam">Spam</option>
                </select>
            </div>

            {loading ? <Loading /> : (
                <div className="card p-0 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs uppercase text-gray-500 font-semibold">Reference</th>
                                <th className="px-4 py-3 text-left text-xs uppercase text-gray-500 font-semibold">From</th>
                                <th className="px-4 py-3 text-left text-xs uppercase text-gray-500 font-semibold">Subject</th>
                                <th className="px-4 py-3 text-left text-xs uppercase text-gray-500 font-semibold">Status</th>
                                <th className="px-4 py-3 text-left text-xs uppercase text-gray-500 font-semibold">Date</th>
                                <th className="px-4 py-3"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {data.data.map((m) => (
                                <tr key={m.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => openMessage(m.id)}>
                                    <td className="px-4 py-3 font-mono text-xs">{m.reference_number}</td>
                                    <td className="px-4 py-3">
                                        <div className="font-medium">{m.sender_name}</div>
                                        <div className="text-xs text-gray-500">{m.sender_email}</div>
                                    </td>
                                    <td className="px-4 py-3">{m.subject}</td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                                            m.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                            m.status === 'replied' ? 'bg-green-100 text-green-800' :
                                            m.status === 'spam' ? 'bg-red-100 text-red-800' :
                                            'bg-gray-100 text-gray-700'
                                        }`}>{m.status}</span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-500 text-xs">{new Date(m.created_at).toLocaleDateString()}</td>
                                    <td className="px-4 py-3 text-right"><Eye className="w-4 h-4 text-gray-400 inline" /></td>
                                </tr>
                            ))}
                            {data.data.length === 0 && (
                                <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-500">No messages yet.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {selected && (
                <Modal open={true} onClose={() => setSelected(null)} title={`Message ${selected.reference_number}`} size="xl">
                    <div className="space-y-4">
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="text-xs text-gray-500 uppercase font-semibold mb-2">From</div>
                            <div className="font-medium">{selected.sender_name}</div>
                            <div className="text-sm text-gray-600">{selected.sender_email}</div>
                            <div className="text-xs text-gray-500 mt-2">{new Date(selected.created_at).toLocaleString()}</div>
                        </div>

                        <div>
                            <div className="text-xs text-gray-500 uppercase font-semibold mb-2">Subject</div>
                            <div className="font-medium">{selected.subject}</div>
                        </div>

                        <div>
                            <div className="text-xs text-gray-500 uppercase font-semibold mb-2">Message</div>
                            <div className="bg-white border rounded-lg p-4 text-sm whitespace-pre-wrap">{selected.message}</div>
                        </div>

                        {selected.replies.length > 0 && (
                            <div>
                                <div className="text-xs text-gray-500 uppercase font-semibold mb-2">Conversation History</div>
                                <div className="space-y-2">
                                    {selected.replies.map((r) => (
                                        <div key={r.id} className="bg-green-50 border-l-4 border-green-500 rounded-r-lg p-3">
                                            <div className="text-xs text-gray-600 mb-1">
                                                <strong>{r.admin_name || 'Admin'}</strong> · {new Date(r.created_at).toLocaleString()}
                                                {r.email_sent && <span className="ml-2 text-green-700"><CheckCircle2 className="w-3 h-3 inline" /> Email sent</span>}
                                                {r.email_error && <span className="ml-2 text-red-700">Email failed</span>}
                                            </div>
                                            <div className="text-sm whitespace-pre-wrap">{r.reply_body}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="label">Your reply</label>
                            <textarea rows={5} value={replyText} onChange={(e) => setReplyText(e.target.value)} className="input" placeholder="Write your response…" />
                            <p className="text-xs text-gray-500 mt-1">The visitor will receive this by email.</p>
                        </div>

                        <div className="flex justify-end gap-2">
                            <button onClick={() => setSelected(null)} className="btn-secondary">Close</button>
                            <button onClick={sendReply} disabled={replySending || !replyText.trim()} className="btn-primary !bg-green-600 hover:!bg-green-700">
                                <Send className="w-4 h-4 mr-2 inline" />
                                {replySending ? 'Sending…' : 'Send Reply'}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}