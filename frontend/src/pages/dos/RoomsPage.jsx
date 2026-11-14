// src/pages/dos/RoomsPage.jsx
import { useEffect, useState } from 'react';
import { api, extractError } from '../../lib/api';
import { PageHeader, ErrorBanner, Loading, EmptyState } from '../../components/ui';
import Modal from '../../components/Modal';

export default function RoomsPage() {
  const [rooms, setRooms] = useState([]);
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ roomTypeId: '', name: '', location: '', capacity: 30 });

  function load() {
    setLoading(true);
    Promise.all([api.get('/rooms/rooms'), api.get('/rooms/types')])
      .then(([r, t]) => { setRooms(r.data.data || r.data); setTypes(t.data.data || t.data); })
      .catch((err) => setError(extractError(err)))
      .finally(() => setLoading(false));
  }
  useEffect(load, []);

  async function handleAdd(e) {
    e.preventDefault();
    setError('');
    try {
      await api.post('/rooms/rooms', form);
      setShowAdd(false);
      setForm({ roomTypeId: '', name: '', location: '', capacity: 30 });
      load();
    } catch (err) { setError(extractError(err)); }
  }

  return (
    <div>
      <PageHeader title="Rooms & Facilities" action={<button onClick={() => setShowAdd(true)} className="btn-primary">+ Add room</button>} />
      <ErrorBanner message={error} onDismiss={() => setError('')} />

      {loading ? <Loading /> : rooms.length === 0 ? (
        <div className="card"><EmptyState title="No rooms yet" description="Add classrooms, labs, and workshops" /></div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b text-left text-xs font-medium text-gray-500 uppercase">
              <tr>
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3">Capacity</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rooms.map((r) => (
                <tr key={r.id}>
                  <td className="px-6 py-3 font-medium text-gray-900">{r.name}</td>
                  <td className="px-6 py-3 text-gray-600">{r.room_type_name || r.room_type_code}</td>
                  <td className="px-6 py-3 text-gray-600">{r.capacity}</td>
                  <td className="px-6 py-3"><span className="badge-green">{r.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add room" footer={
        <>
          <button onClick={() => setShowAdd(false)} className="btn-secondary">Cancel</button>
          <button type="submit" form="room-form" className="btn-primary">Save</button>
        </>
      }>
        <form id="room-form" onSubmit={handleAdd} className="space-y-3">
          {error && <div className="rounded bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</div>}
          <div>
            <label className="label">Room type *</label>
            <select required value={form.roomTypeId} onChange={(e) => setForm({ ...form, roomTypeId: e.target.value })} className="input">
              <option value="">Select type…</option>
              {types.map((t) => <option key={t.id} value={t.id}>{t.name}{t.school_id ? '' : ' (system)'}</option>)}
            </select>
          </div>
          <div><label className="label">Name *</label><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" /></div>
          <div><label className="label">Location</label><input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="input" /></div>
          <div><label className="label">Capacity</label><input type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: parseInt(e.target.value, 10) || 0 })} className="input" /></div>
        </form>
      </Modal>
    </div>
  );
}