// src/pages/dos/TrainersPage.jsx
import { useEffect, useState } from 'react';
import { Plus, Eye, Pencil, Trash2, X, UserCircle2, BookOpen } from 'lucide-react';
import { api, extractError } from '../../lib/api';
import Modal from '../../components/Modal';

const EMPLOYMENT_TYPES = [
    { value: 'full_time', label: 'Full-time' },
    { value: 'part_time', label: 'Part-time' },
    { value: 'contract',  label: 'Contract' },
];

function camel(obj) {
    if (!obj) return {};
    return Object.fromEntries(
        Object.entries(obj).map(([k, v]) => [k.replace(/_([a-z])/g, (_, c) => c.toUpperCase()), v])
    );
}

export default function TrainersPage() {
    const [trainers, setTrainers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [modal, setModal] = useState(null);
    const [selected, setSelected] = useState(null);

    // Dependencies used by the form (modules, classes, active year)
    const [modules, setModules] = useState([]);
    const [classes, setClasses] = useState([]);
    const [activeYear, setActiveYear] = useState(null);

    function load() {
        setLoading(true);
        api.get('/trainers')
            .then(({ data }) => setTrainers(data.data || []))
            .catch((err) => setError(extractError(err)))
            .finally(() => setLoading(false));
    }

    function loadDependencies() {
        Promise.all([
            api.get('/modules').catch(() => ({ data: { data: [] } })),
            api.get('/academic/classes').catch(() => ({ data: { data: [] } })),
            api.get('/academic/academic-years').catch(() => ({ data: { data: [] } })),
        ]).then(([m, c, y]) => {
            setModules(m.data.data || []);
            setClasses(c.data.data || []);
            const active = (y.data.data || []).find((yr) => yr.is_active) || (y.data.data || [])[0];
            setActiveYear(active || null);
        });
    }

    useEffect(() => { load(); loadDependencies(); }, []);

    function openCreate() { setSelected(null); setModal('create'); }
    function openEdit(t)   { setSelected(t);    setModal('edit');   }
    function openView(t)   { setSelected(t);    setModal('view');   }
    function openDelete(t) { setSelected(t);    setModal('delete'); }

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Trainers</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        {trainers.length} {trainers.length === 1 ? 'trainer' : 'trainers'} registered
                    </p>
                </div>
                <button
                    onClick={openCreate}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium"
                >
                    <Plus className="w-4 h-4" /> Add trainer
                </button>
            </div>

            {error && (
                <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-center justify-between">
                    <span>{error}</span>
                    <button onClick={() => setError('')}><X className="w-4 h-4" /></button>
                </div>
            )}

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-sm text-gray-500">Loading…</div>
                ) : trainers.length === 0 ? (
                    <div className="p-12 text-center">
                        <UserCircle2 className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                        <div className="text-sm font-medium text-gray-700">No trainers yet</div>
                        <p className="text-xs text-gray-500 mt-1">Click &quot;Add trainer&quot; to register the first one</p>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Staff #</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Specialization</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Employment</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-600 w-32">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {trainers.map((t) => (
                                <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-3">
                                        <div className="font-medium text-gray-900">{t.full_name}</div>
                                        {t.email && <div className="text-xs text-gray-500">{t.email}</div>}
                                    </td>
                                    <td className="px-6 py-3 font-mono text-xs text-gray-600">{t.staff_number}</td>
                                    <td className="px-6 py-3 text-gray-600">{t.specialization || '—'}</td>
                                    <td className="px-6 py-3 text-gray-600 capitalize">
                                        {(t.employment_status || '').replace('_', ' ')}
                                    </td>
                                    <td className="px-6 py-3">
                                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                                            t.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                                        }`}>
                                            {t.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <button onClick={() => openView(t)} className="p-1.5 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50" title="View">
                                                <Eye className="w-3.5 h-3.5" />
                                            </button>
                                            <button onClick={() => openEdit(t)} className="p-1.5 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100" title="Edit">
                                                <Pencil className="w-3.5 h-3.5" />
                                            </button>
                                            <button onClick={() => openDelete(t)} className="p-1.5 rounded text-gray-400 hover:text-red-600 hover:bg-red-50" title="Delete">
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <TrainerFormModal
                open={modal === 'create' || modal === 'edit'}
                isEdit={modal === 'edit'}
                initial={selected}
                modules={modules}
                classes={classes}
                activeYear={activeYear}
                onClose={() => setModal(null)}
                onSaved={() => { load(); loadDependencies(); }}
                onError={setError}
            />
            <TrainerViewModal
                open={modal === 'view'}
                trainer={selected}
                onClose={() => setModal(null)}
            />
            <DeleteModal
                open={modal === 'delete'}
                trainer={selected}
                onClose={() => setModal(null)}
                onDeleted={load}
                onError={setError}
            />
        </div>
    );
}

// ============================================================
// CREATE / EDIT modal (with teaching assignments)
// ============================================================
function TrainerFormModal({ open, isEdit, initial, modules, classes, activeYear, onClose, onSaved, onError }) {
    const [form, setForm] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState('');
    const [enableLimits, setEnableLimits] = useState(false);
    const [limits, setLimits] = useState({ maxWeeklyPeriods: 20, minWeeklyPeriods: 0, maxConsecutivePeriods: 4 });
    const [assignments, setAssignments] = useState([]); // [{ moduleId, classId, weeklyPeriods }]

    useEffect(() => {
        if (open) {
            const base = camel(initial) || {};
            setForm({
                fullName: base.fullName || '',
                staffNumber: base.staffNumber || '',
                email: base.email || '',
                phone: base.phone || '',
                employmentStatus: base.employmentStatus || 'full_time',
                specialization: base.specialization || '',
                academicQualifications: base.academicQualifications || '',
                professionalQualifications: base.professionalQualifications || '',
                status: base.status || 'active',
            });
            setEnableLimits(!!initial?.max_weekly_periods);
            if (initial?.max_weekly_periods) {
                setLimits({
                    maxWeeklyPeriods: initial.max_weekly_periods,
                    minWeeklyPeriods: initial.min_weekly_periods ?? 0,
                    maxConsecutivePeriods: initial.max_consecutive_periods ?? 4,
                });
            } else {
                setLimits({ maxWeeklyPeriods: 20, minWeeklyPeriods: 0, maxConsecutivePeriods: 4 });
            }
            // On create, start with one blank assignment row. On edit, leave empty
            // (assignments are managed on the Modules page).
            setAssignments(isEdit ? [] : [{ moduleId: '', classId: '', weeklyPeriods: 4 }]);
            setFormError('');
        }
    }, [open, initial, isEdit]);

    function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }

    function updateAssignment(index, patch) {
        setAssignments((arr) => arr.map((a, i) => (i === index ? { ...a, ...patch } : a)));
    }
    function addAssignment() {
        setAssignments((arr) => [...arr, { moduleId: '', classId: '', weeklyPeriods: 4 }]);
    }
    function removeAssignment(index) {
        setAssignments((arr) => arr.filter((_, i) => i !== index));
    }

    async function submit(e) {
        e.preventDefault();
        setFormError('');
        setSubmitting(true);
        try {
            // 1. Create or update the trainer
            const payload = {
                fullName: form.fullName.trim(),
                staffNumber: form.staffNumber.trim(),
                email: form.email.trim() || null,
                phone: form.phone.trim() || null,
                employmentStatus: form.employmentStatus,
                specialization: form.specialization.trim() || null,
                academicQualifications: form.academicQualifications.trim() || null,
                professionalQualifications: form.professionalQualifications.trim() || null,
            };
            if (isEdit) {
                if (form.status !== initial.status) payload.status = form.status;
                await api.patch(`/trainers/${initial.id}`, payload);
            } else {
                const { data: created } = await api.post('/trainers', payload);

                // 2. Create the teaching assignments (create-only)
                const validAssignments = assignments.filter((a) => a.moduleId && a.classId && activeYear);
                const failures = [];
                for (const asn of validAssignments) {
                    try {
                        await api.post('/modules/assignments', {
                            moduleId: asn.moduleId,
                            classId: asn.classId,
                            trainerId: created.id,
                            academicYearId: activeYear.id,
                            weeklyPeriods: asn.weeklyPeriods || 4,
                        });
                        // Authorize the trainer for this module
                        await api.post(`/modules/${asn.moduleId}/authorize-trainer`, {
                            moduleId: asn.moduleId,
                        }).catch(() => {}); // non-fatal
                    } catch (err) {
                        const mod = modules.find((m) => m.id === asn.moduleId);
                        const cls = classes.find((c) => c.id === asn.classId);
                        failures.push(`${mod?.code || '?'} → ${cls?.name || '?'}: ${extractError(err)}`);
                    }
                }

                if (failures.length > 0) {
                    setFormError(
                        `Trainer created, but ${failures.length} assignment(s) failed:\n` +
                        failures.join('\n') +
                        '\n\nYou can retry these from the Modules page.'
                    );
                    onSaved();
                    // Don't close modal so user sees the error
                    setSubmitting(false);
                    return;
                }

                // 3. Workload limits (optional)
                if (enableLimits) {
                    await api.put(`/trainers/${created.id}/workload-limits`, limits).catch(() => {});
                }
            }

            onSaved();
            onClose();
        } catch (err) {
            const msg = extractError(err);
            setFormError(msg);
            onError(msg);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={isEdit ? 'Edit trainer' : 'Add trainer'}
            size="lg"
            footer={<>
                <button onClick={onClose} className="btn-secondary">Cancel</button>
                <button type="submit" form="trainer-form" disabled={submitting} className="btn-primary !bg-blue-600 hover:!bg-blue-700">
                    {submitting ? 'Saving…' : isEdit ? 'Save changes' : 'Create trainer'}
                </button>
            </>}
        >
            <form id="trainer-form" onSubmit={submit} className="space-y-4">
                {formError && (
                    <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700 whitespace-pre-line">
                        {formError}
                    </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                        <label className="label">Full name *</label>
                        <input required value={form.fullName || ''} onChange={(e) => set('fullName', e.target.value)} className="input" placeholder="Alice Trainer" />
                    </div>
                    <div>
                        <label className="label">Staff number *</label>
                        <input required value={form.staffNumber || ''} onChange={(e) => set('staffNumber', e.target.value)} className="input" placeholder="T-001" />
                    </div>
                    <div>
                        <label className="label">Employment status *</label>
                        <select value={form.employmentStatus || 'full_time'} onChange={(e) => set('employmentStatus', e.target.value)} className="input">
                            {EMPLOYMENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="label">Email</label>
                        <input type="email" value={form.email || ''} onChange={(e) => set('email', e.target.value)} className="input" placeholder="alice@school.rw" />
                    </div>
                    <div>
                        <label className="label">Phone</label>
                        <input value={form.phone || ''} onChange={(e) => set('phone', e.target.value)} className="input" placeholder="+250788000000" />
                    </div>
                    <div className="sm:col-span-2">
                        <label className="label">Specialization</label>
                        <input value={form.specialization || ''} onChange={(e) => set('specialization', e.target.value)} className="input" placeholder="Mathematics" />
                    </div>
                    <div className="sm:col-span-2">
                        <label className="label">Academic qualifications</label>
                        <input value={form.academicQualifications || ''} onChange={(e) => set('academicQualifications', e.target.value)} className="input" placeholder="BSc Mathematics" />
                    </div>
                    <div className="sm:col-span-2">
                        <label className="label">Professional qualifications</label>
                        <input value={form.professionalQualifications || ''} onChange={(e) => set('professionalQualifications', e.target.value)} className="input" placeholder="Teaching Certificate" />
                    </div>

                    {isEdit && (
                        <div>
                            <label className="label">Status</label>
                            <select value={form.status || 'active'} onChange={(e) => set('status', e.target.value)} className="input">
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                    )}
                </div>

                {/* Teaching assignments (create only) */}
                {!isEdit && (
                    <div className="pt-4 border-t border-gray-200">
                        <div className="flex items-center justify-between mb-3">
                            <div>
                                <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                    <BookOpen className="w-4 h-4 text-blue-600" />
                                    Teaching assignments
                                </h4>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Which modules will this trainer teach, and in which classes?
                                </p>
                            </div>
                            <button type="button" onClick={addAssignment} className="text-xs text-blue-700 hover:underline inline-flex items-center gap-1">
                                <Plus className="w-3 h-3" /> Add
                            </button>
                        </div>

                        {!activeYear && (
                            <div className="rounded bg-yellow-50 border border-yellow-200 px-3 py-2 text-xs text-yellow-800 mb-3">
                                No active academic year found. Assignments require one. Create an active academic year first.
                            </div>
                        )}

                        {modules.length === 0 || classes.length === 0 ? (
                            <div className="rounded bg-yellow-50 border border-yellow-200 px-3 py-2 text-xs text-yellow-800">
                                {modules.length === 0 && 'No modules registered. '}
                                {classes.length === 0 && 'No classes registered. '}
                                Create modules and classes first, or skip this section and assign later from the Modules page.
                            </div>
                        ) : assignments.length === 0 ? (
                            <div className="text-xs text-gray-500 italic">No assignments added. Click "+ Add" to add one.</div>
                        ) : (
                            <div className="space-y-2">
                                {assignments.map((asn, i) => (
                                    <div key={i} className="grid grid-cols-12 gap-2 items-end">
                                        <div className="col-span-5">
                                            <label className="label text-xs">Module</label>
                                            <select
                                                value={asn.moduleId}
                                                onChange={(e) => updateAssignment(i, { moduleId: e.target.value })}
                                                className="input text-sm"
                                            >
                                                <option value="">Select module…</option>
                                                {modules.map((m) => (
                                                    <option key={m.id} value={m.id}>
                                                        {m.code} — {m.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="col-span-4">
                                            <label className="label text-xs">Class</label>
                                            <select
                                                value={asn.classId}
                                                onChange={(e) => updateAssignment(i, { classId: e.target.value })}
                                                className="input text-sm"
                                            >
                                                <option value="">Select class…</option>
                                                {classes.map((c) => (
                                                    <option key={c.id} value={c.id}>{c.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="col-span-2">
                                            <label className="label text-xs">Periods/wk</label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={asn.weeklyPeriods}
                                                onChange={(e) => updateAssignment(i, { weeklyPeriods: parseInt(e.target.value, 10) || 1 })}
                                                className="input text-sm"
                                            />
                                        </div>
                                        <div className="col-span-1">
                                            <button
                                                type="button"
                                                onClick={() => removeAssignment(i)}
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                                                title="Remove"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {isEdit && (
                    <div className="pt-3 border-t border-gray-200 text-xs text-gray-500 italic">
                        To add or remove this trainer's module assignments, go to the Modules page.
                    </div>
                )}

                {/* Workload limits */}
                <div className="pt-4 border-t border-gray-200">
                    <label className="flex items-center gap-2 text-sm text-gray-700 font-medium">
                        <input
                            type="checkbox"
                            checked={enableLimits}
                            onChange={(e) => setEnableLimits(e.target.checked)}
                            className="rounded"
                        />
                        Configure workload limits (optional)
                    </label>
                    {enableLimits && (
                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                                <label className="label text-xs">Max weekly periods</label>
                                <input type="number" min="1" value={limits.maxWeeklyPeriods} onChange={(e) => setLimits({ ...limits, maxWeeklyPeriods: parseInt(e.target.value, 10) || 1 })} className="input" />
                            </div>
                            <div>
                                <label className="label text-xs">Min weekly periods</label>
                                <input type="number" min="0" value={limits.minWeeklyPeriods} onChange={(e) => setLimits({ ...limits, minWeeklyPeriods: parseInt(e.target.value, 10) || 0 })} className="input" />
                            </div>
                            <div>
                                <label className="label text-xs">Max consecutive periods</label>
                                <input type="number" min="1" max="11" value={limits.maxConsecutivePeriods} onChange={(e) => setLimits({ ...limits, maxConsecutivePeriods: parseInt(e.target.value, 10) || 4 })} className="input" />
                            </div>
                        </div>
                    )}
                </div>
            </form>
        </Modal>
    );
}

// ============================================================
// VIEW modal
// ============================================================
function TrainerViewModal({ open, trainer, onClose }) {
    if (!trainer) return null;

    const fields = [
        ['Full name', trainer.full_name],
        ['Staff number', trainer.staff_number],
        ['Email', trainer.email],
        ['Phone', trainer.phone],
        ['Employment', (trainer.employment_status || '').replace('_', ' ')],
        ['Specialization', trainer.specialization],
        ['Academic qualifications', trainer.academic_qualifications],
        ['Professional qualifications', trainer.professional_qualifications],
        ['Status', trainer.status],
        ['Created', trainer.created_at ? new Date(trainer.created_at).toLocaleString() : '—'],
    ];

    return (
        <Modal open={open} onClose={onClose} title="Trainer details" size="lg" footer={<>
            <button onClick={onClose} className="btn-secondary">Close</button>
        </>}>
            <div className="space-y-4">
                <div className="flex items-center gap-4 pb-4 border-b border-gray-200">
                    <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xl font-bold">
                        {trainer.full_name?.charAt(0) || '?'}
                    </div>
                    <div>
                        <div className="text-lg font-semibold text-gray-900">{trainer.full_name}</div>
                        <div className="text-sm text-gray-500">{trainer.specialization || 'No specialization set'}</div>
                    </div>
                </div>

                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                    {fields.map(([label, value]) => (
                        <div key={label}>
                            <dt className="text-xs text-gray-500 uppercase tracking-wide font-medium">{label}</dt>
                            <dd className="mt-0.5 text-gray-900">{value || '—'}</dd>
                        </div>
                    ))}
                </dl>

                {trainer.max_weekly_periods != null ? (
                    <div className="pt-4 border-t border-gray-200">
                        <h4 className="text-sm font-semibold text-gray-900 mb-2">Workload limits</h4>
                        <dl className="grid grid-cols-3 gap-3 text-sm">
                            <div><dt className="text-xs text-gray-500">Max weekly</dt><dd className="font-medium text-gray-900 mt-0.5">{trainer.max_weekly_periods}</dd></div>
                            <div><dt className="text-xs text-gray-500">Min weekly</dt><dd className="font-medium text-gray-900 mt-0.5">{trainer.min_weekly_periods ?? '—'}</dd></div>
                            <div><dt className="text-xs text-gray-500">Max consecutive</dt><dd className="font-medium text-gray-900 mt-0.5">{trainer.max_consecutive_periods ?? '—'}</dd></div>
                        </dl>
                    </div>
                ) : (
                    <div className="pt-4 border-t border-gray-200 text-xs text-gray-500 italic">
                        No workload limits configured for this trainer.
                    </div>
                )}
            </div>
        </Modal>
    );
}

// ============================================================
// DELETE modal
// ============================================================
function DeleteModal({ open, trainer, onClose, onDeleted, onError }) {
    const [submitting, setSubmitting] = useState(false);
    const [err, setErr] = useState('');
    useEffect(() => { if (open) setErr(''); }, [open]);

    async function handleDelete() {
        if (!trainer) return;
        setSubmitting(true);
        setErr('');
        try {
            await api.delete(`/trainers/${trainer.id}`);
            onDeleted();
            onClose();
        } catch (error) {
            const msg = extractError(error);
            setErr(msg);
            onError(msg);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <Modal open={open} onClose={onClose} title="Delete trainer" footer={<>
            <button onClick={onClose} className="btn-secondary">Cancel</button>
            <button onClick={handleDelete} disabled={submitting} className="btn-danger">
                {submitting ? 'Deleting…' : 'Delete permanently'}
            </button>
        </>}>
            <div className="space-y-3">
                {err && <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{err}</div>}
                <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-800">
                    <strong>Warning:</strong> Deleting <strong>{trainer?.full_name}</strong> is permanent. Their qualifications, availability, and workload limits will also be removed.
                    <br /><br />
                    If the trainer has active module assignments, deletion will be blocked — set them to <em>inactive</em> instead.
                </div>
            </div>
        </Modal>
    );
}