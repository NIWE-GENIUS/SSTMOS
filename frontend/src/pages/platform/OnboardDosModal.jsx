// src/pages/platform/OnboardDosModal.jsx
import { useState } from 'react';
import { api, extractError } from '../../lib/api';
import Modal from '../../components/Modal';

export default function OnboardDosModal({ open, onClose, schoolId, onDone }) {
  const [form, setForm] = useState({ email: '', fullName: '', password: '', username: '', phone: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function update(f, v) { setForm((p) => ({ ...p, [f]: v })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setSubmitting(true);
    try {
      await api.post(`/school/${schoolId}/onboarding`, { ...form, role: 'dos' });
      onDone(); onClose();
      setForm({ email: '', fullName: '', password: '', username: '', phone: '' });
    } catch (err) { setError(extractError(err)); }
    finally { setSubmitting(false); }
  }

  return (
    <Modal open={open} onClose={onClose} title="Onboard first DOS" size="md" footer={
      <>
        <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
        <button type="submit" form="dos-form" disabled={submitting} className="btn-primary">
          {submitting ? 'Creating…' : 'Create DOS account'}
        </button>
      </>
    }>
      <form id="dos-form" onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</div>}
        <p className="text-sm text-gray-600">
          The Director of Studies will manage academic structure, trainers, modules, and timetable generation for this school.
        </p>
        <div>
          <label className="label">Full name *</label>
          <input required value={form.fullName} onChange={(e) => update('fullName', e.target.value)} className="input" />
        </div>
        <div>
          <label className="label">Email *</label>
          <input required type="email" value={form.email} onChange={(e) => update('email', e.target.value)} className="input" />
        </div>
        <div>
          <label className="label">Initial password * (min 8 chars)</label>
          <input required minLength={8} type="text" value={form.password} onChange={(e) => update('password', e.target.value)} className="input" placeholder="Will be shared with DOS to log in" />
        </div>
        <div>
          <label className="label">Username (optional — defaults from email)</label>
          <input value={form.username} onChange={(e) => update('username', e.target.value)} className="input" />
        </div>
        <div>
          <label className="label">Phone (optional)</label>
          <input value={form.phone} onChange={(e) => update('phone', e.target.value)} className="input" />
        </div>
      </form>
    </Modal>
  );
}