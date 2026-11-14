// src/pages/platform/SchoolDetailPage.jsx
import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Building2, Mail, Phone, MapPin, Calendar,
  CheckCircle2, Pause, RotateCw, Ban, UserPlus, AlertTriangle,
} from 'lucide-react';
import { api, extractError } from '../../lib/api';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import OnboardDosModal from './OnboardDosModal';

function fmt(date) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}
function todayPlus(months) {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

export default function SchoolDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [school, setSchool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null); // activate | suspend | deactivate | renew | onboard
  const [actionError, setActionError] = useState('');

  function load() {
    setLoading(true);
    api.get(`/schools/${id}`)
      .then(({ data }) => setSchool(data))
      .catch((err) => setError(extractError(err)))
      .finally(() => setLoading(false));
  }
  useEffect(load, [id]);

  async function performAction(endpoint, body = null) {
    setActionError('');
    try {
      await api.post(`/schools/${id}/${endpoint}`, body || {});
      setModal(null);
      load();
    } catch (err) { setActionError(extractError(err)); }
  }

  if (loading) return <div className="text-sm text-gray-500">Loading…</div>;
  if (error) return <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>;
  if (!school) return null;

  const sub = school.subscription;

  return (
    <div>
      <button onClick={() => navigate('/platform/schools')} className="inline-flex items-center gap-1 text-sm text-blue-700 hover:underline mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to schools
      </button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{school.name}</h1>
            <StatusBadge status={school.status} />
          </div>
          <p className="text-sm text-gray-500 mt-1 font-mono">{school.code} · {school.short_code}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {school.status === 'pending' && (
            <ActionButton icon={CheckCircle2} label="Activate" onClick={() => setModal('activate')} primary />
          )}
          {school.status === 'active' && (
            <>
              <ActionButton icon={UserPlus} label="Onboard DOS" onClick={() => setModal('onboard')} primary />
              <ActionButton icon={RotateCw} label="Renew" onClick={() => setModal('renew')} />
              <ActionButton icon={Pause} label="Suspend" onClick={() => setModal('suspend')} />
              <ActionButton icon={Ban} label="Deactivate" onClick={() => setModal('deactivate')} danger />
            </>
          )}
          {school.status === 'suspended' && (
            <>
              <ActionButton icon={RotateCw} label="Reactivate" onClick={() => setModal('renew')} primary />
              <ActionButton icon={Ban} label="Deactivate" onClick={() => setModal('deactivate')} danger />
            </>
          )}
          {school.status === 'expired' && (
            <ActionButton icon={RotateCw} label="Renew" onClick={() => setModal('renew')} primary />
          )}
        </div>
      </div>

      {/* Action error banner */}
      {actionError && (
        <div className="mb-6 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column — school info + contacts */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2 mb-5">
              <Building2 className="w-4 h-4 text-blue-600" /> School information
            </h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
              <Field label="School type" value={<span className="capitalize">{school.school_type}</span>} />
              <Field label="Country" value={school.country} />
              <Field label="Province" value={school.province} />
              <Field label="District" value={school.district} />
              <Field label="Physical address" value={school.physical_address} span={2} />
              <Field label="Official email" value={<span className="inline-flex items-center gap-1"><Mail className="w-3.5 h-3.5 text-gray-400" />{school.official_email}</span>} />
              <Field label="Telephone" value={<span className="inline-flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-gray-400" />{school.telephone || '—'}</span>} />
              <Field label="Registered" value={fmt(school.registration_date)} />
              <Field label="Activated" value={fmt(school.activated_at)} />
              {school.notes && <Field label="Notes" value={school.notes} span={2} />}
            </dl>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-5">Contacts</h2>
            {school.contacts?.length > 0 ? (
              <ul className="divide-y divide-gray-100 -mx-6">
                {school.contacts.map((c, i) => (
                  <li key={i} className="px-6 py-3">
                    <div className="text-sm font-medium text-gray-900">
                      {c.full_name} <span className="text-xs text-gray-500 font-normal capitalize">({c.contact_type.replace('_', ' ')})</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">{c.email || '—'} · {c.phone || '—'}</div>
                  </li>
                ))}
              </ul>
            ) : <div className="text-sm text-gray-400">No contacts yet.</div>}
          </div>
        </div>

        {/* Right column — subscription */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2 mb-4">
              <Calendar className="w-4 h-4 text-blue-600" /> Subscription
            </h2>
            {sub ? (
              <dl className="space-y-3 text-sm">
                <Field label="Status" value={<StatusBadge status={sub.status} />} />
                <Field label="Activation" value={fmt(sub.activation_date)} />
                <Field label="Expiration" value={fmt(sub.expiration_date)} />
                {sub.grace_period_until && <Field label="Grace until" value={fmt(sub.grace_period_until)} />}
              </dl>
            ) : <div className="text-sm text-gray-400">Not subscribed yet — activate to begin.</div>}
          </div>
        </div>
      </div>

      {/* Modals */}
      <ActivateModal open={modal === 'activate'} onClose={() => setModal(null)} schoolId={id} onDone={load} onError={setActionError} />
      <SuspendModal open={modal === 'suspend'} onClose={() => setModal(null)} schoolId={id} onDone={load} onError={setActionError} />
      <DeactivateModal open={modal === 'deactivate'} onClose={() => setModal(null)} schoolId={id} onDone={load} onError={setActionError} />
      <RenewModal open={modal === 'renew'} onClose={() => setModal(null)} schoolId={id} currentExpiry={sub?.expiration_date} onDone={load} onError={setActionError} />
      <OnboardDosModal open={modal === 'onboard'} onClose={() => setModal(null)} schoolId={id} onDone={load} />
    </div>
  );
}

function Field({ label, value, span }) {
  return (
    <div className={span === 2 ? 'sm:col-span-2' : ''}>
      <dt className="text-xs text-gray-500 uppercase tracking-wide font-medium">{label}</dt>
      <dd className="mt-1 text-sm text-gray-900">{value || '—'}</dd>
    </div>
  );
}

function ActionButton({ icon: Icon, label, onClick, primary, danger }) {
  const cls = primary
    ? 'btn-primary !bg-blue-700 hover:!bg-blue-800 text-sm'
    : danger
      ? 'btn-danger text-sm'
      : 'btn-secondary text-sm';
  return (
    <button onClick={onClick} className={cls}>
      <Icon className="w-4 h-4 mr-1.5" /> {label}
    </button>
  );
}

// ---------- Modals ----------

function ActivateModal({ open, onClose, schoolId, onDone }) {
  const [activationDate, setActivationDate] = useState(new Date().toISOString().slice(0, 10));
  const [expirationDate, setExpirationDate] = useState(todayPlus(12));
  const [gracePeriodUntil, setGracePeriodUntil] = useState('');
  const [agreementReference, setAgreementReference] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit(e) {
    e.preventDefault(); setError(''); setSubmitting(true);
    try {
      await api.post(`/schools/${schoolId}/activate`, {
        activationDate, expirationDate,
        gracePeriodUntil: gracePeriodUntil || undefined,
        agreementReference: agreementReference || undefined,
      });
      onDone(); onClose();
    } catch (err) { setError(extractError(err)); }
    finally { setSubmitting(false); }
  }
  return (
    <Modal open={open} onClose={onClose} title="Activate school" footer={<>
      <button onClick={onClose} className="btn-secondary">Cancel</button>
      <button type="submit" form="act-form" disabled={submitting} className="btn-primary !bg-blue-700 hover:!bg-blue-800">
        {submitting ? 'Activating…' : 'Activate'}
      </button>
    </>}>
      <form id="act-form" onSubmit={submit} className="space-y-4">
        {error && <ErrorBox message={error} />}
        <div><label className="label">Activation date *</label><input required type="date" value={activationDate} onChange={(e) => setActivationDate(e.target.value)} className="input" /></div>
        <div><label className="label">Expiration date *</label><input required type="date" value={expirationDate} onChange={(e) => setExpirationDate(e.target.value)} className="input" /></div>
        <div><label className="label">Grace period until (optional)</label><input type="date" value={gracePeriodUntil} onChange={(e) => setGracePeriodUntil(e.target.value)} className="input" /></div>
        <div><label className="label">Agreement reference (optional)</label><input value={agreementReference} onChange={(e) => setAgreementReference(e.target.value)} className="input" placeholder="AGR-2026-001" /></div>
      </form>
    </Modal>
  );
}

function SuspendModal({ open, onClose, schoolId, onDone }) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  async function submit(e) {
    e.preventDefault(); setError(''); setSubmitting(true);
    try { await api.post(`/schools/${schoolId}/suspend`, { reason: reason || undefined }); onDone(); onClose(); }
    catch (err) { setError(extractError(err)); }
    finally { setSubmitting(false); }
  }
  return (
    <Modal open={open} onClose={onClose} title="Suspend school" footer={<>
      <button onClick={onClose} className="btn-secondary">Cancel</button>
      <button type="submit" form="sus-form" disabled={submitting} className="btn-danger">
        {submitting ? 'Suspending…' : 'Suspend'}
      </button>
    </>}>
      <form id="sus-form" onSubmit={submit} className="space-y-4">
        {error && <ErrorBox message={error} />}
        <p className="text-sm text-gray-600">Suspending blocks login for all users in this school. Data is preserved. Can be reactivated by renewing.</p>
        <div><label className="label">Reason (optional)</label><textarea value={reason} onChange={(e) => setReason(e.target.value)} className="input" rows={2} /></div>
      </form>
    </Modal>
  );
}

function DeactivateModal({ open, onClose, schoolId, onDone }) {
  const [reason, setReason] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  async function submit(e) {
    e.preventDefault();
    if (confirm !== 'DEACTIVATE') { setError('Type DEACTIVATE to confirm'); return; }
    setError(''); setSubmitting(true);
    try { await api.post(`/schools/${schoolId}/deactivate`, { reason: reason || undefined }); onDone(); onClose(); }
    catch (err) { setError(extractError(err)); }
    finally { setSubmitting(false); }
  }
  return (
    <Modal open={open} onClose={onClose} title="Deactivate school — permanent" footer={<>
      <button onClick={onClose} className="btn-secondary">Cancel</button>
      <button type="submit" form="deact-form" disabled={submitting || confirm !== 'DEACTIVATE'} className="btn-danger">
        {submitting ? 'Deactivating…' : 'Permanently deactivate'}
      </button>
    </>}>
      <form id="deact-form" onSubmit={submit} className="space-y-4">
        {error && <ErrorBox message={error} />}
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-800">
          <strong>Warning:</strong> This permanently disables the school. Users can no longer log in. Data remains for legal/audit but access is closed. Deactivation cannot be reversed from the UI.
        </div>
        <div><label className="label">Reason (required for audit)</label><textarea required value={reason} onChange={(e) => setReason(e.target.value)} className="input" rows={2} /></div>
        <div>
          <label className="label">Type <code className="bg-gray-100 px-1 rounded">DEACTIVATE</code> to confirm</label>
          <input value={confirm} onChange={(e) => setConfirm(e.target.value.toUpperCase())} className="input" placeholder="DEACTIVATE" />
        </div>
      </form>
    </Modal>
  );
}

function RenewModal({ open, onClose, schoolId, currentExpiry, onDone }) {
  const [newExpirationDate, setNewExpirationDate] = useState(todayPlus(12));
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  useEffect(() => {
    if (currentExpiry) {
      const d = new Date(currentExpiry);
      d.setMonth(d.getMonth() + 12);
      setNewExpirationDate(d.toISOString().slice(0, 10));
    }
  }, [currentExpiry, open]);
  async function submit(e) {
    e.preventDefault(); setError(''); setSubmitting(true);
    try { await api.post(`/schools/${schoolId}/renew`, { newExpirationDate }); onDone(); onClose(); }
    catch (err) { setError(extractError(err)); }
    finally { setSubmitting(false); }
  }
  return (
    <Modal open={open} onClose={onClose} title="Renew subscription" footer={<>
      <button onClick={onClose} className="btn-secondary">Cancel</button>
      <button type="submit" form="ren-form" disabled={submitting} className="btn-primary !bg-blue-700 hover:!bg-blue-800">
        {submitting ? 'Renewing…' : 'Renew'}
      </button>
    </>}>
      <form id="ren-form" onSubmit={submit} className="space-y-4">
        {error && <ErrorBox message={error} />}
        <div><label className="label">Current expiration</label><div className="text-sm text-gray-700">{fmt(currentExpiry)}</div></div>
        <div><label className="label">New expiration date *</label><input required type="date" value={newExpirationDate} onChange={(e) => setNewExpirationDate(e.target.value)} className="input" /></div>
      </form>
    </Modal>
  );
}

function ErrorBox({ message }) {
  return <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{message}</div>;
}