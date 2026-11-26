// src/pages/auth/SignUpPage.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import { api, extractError } from '../../lib/api';
import BrandAside from './BrandAside';

const COUNTRIES = [
    { code: 'RW', name: 'Rwanda' },
    { code: 'KE', name: 'Kenya' },
    { code: 'UG', name: 'Uganda' },
    { code: 'TZ', name: 'Tanzania' },
    { code: 'BI', name: 'Burundi' },
    { code: 'CD', name: 'DR Congo' },
    { code: 'OTHER', name: 'Other' },
];

const SCHOOL_TYPES = ['technical', 'vocational', 'secondary', 'combined'];

export default function SignUpPage() {
    const [form, setForm] = useState({
        schoolName: '', schoolType: 'technical', country: 'RW', province: '', district: '',
        physicalAddress: '', officialEmail: '', telephone: '',
        contactFullName: '', contactEmail: '', contactPhone: '', contactRole: 'Director of Studies',
        password: '', confirmPassword: '',
    });
    const [status, setStatus] = useState('idle');
    const [reference, setReference] = useState('');
    const [error, setError] = useState('');

    function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        if (form.password !== form.confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        if (form.password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }
        setStatus('sending');
        try {
            const { data } = await api.post('/school-registrations', form);
            setReference(data.referenceNumber);
            setStatus('sent');
        } catch (err) {
            setError(extractError(err));
            setStatus('error');
        }
    }

    if (status === 'sent') {
        return (
            <div className="min-h-screen bg-gray-50 grid grid-cols-1 lg:grid-cols-12">
                <BrandAside className="lg:col-span-3 hidden lg:flex" />
                <main className="lg:col-span-9 flex items-center justify-center p-6 sm:p-12">
                    <div className="w-full max-w-xl card text-center">
                        <div className="w-16 h-16 rounded-full bg-green-100 text-green-700 flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 className="w-8 h-8" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Registration submitted</h1>
                        <p className="text-sm text-gray-600 mb-4">
                            Thank you for registering <strong>{form.schoolName}</strong> on SSTMOS.
                        </p>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                            <div className="text-xs text-blue-700 uppercase tracking-wide font-semibold mb-1">Reference number</div>
                            <div className="text-lg font-mono text-blue-900">{reference}</div>
                        </div>
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-left">
                            <h3 className="text-sm font-semibold text-yellow-900 mb-2">What happens next?</h3>
                            <ol className="text-sm text-yellow-800 space-y-1 list-decimal list-inside">
                                <li>Our admin team will review your registration (usually within 24 hours).</li>
                                <li>We'll contact you at <strong>{form.contactEmail}</strong> with our decision.</li>
                                <li>Once approved, you'll receive an email with login instructions.</li>
                            </ol>
                        </div>
                        <Link to="/" className="btn-secondary">Back to home</Link>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 grid grid-cols-1 lg:grid-cols-12">
            <BrandAside className="lg:col-span-3 hidden lg:flex" />
            <aside className="lg:col-span-3 hidden lg:flex flex-col border-r border-gray-200 bg-white p-8">
                <h2 className="text-lg font-bold text-gray-900 mb-3">Register your school</h2>
                <p className="text-sm text-gray-600 mb-4">
                    Fill in your school details and create your Director of Studies account.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <h3 className="text-sm font-semibold text-blue-900 mb-2">What happens after?</h3>
                    <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
                        <li>Admin reviews your request</li>
                        <li>You receive approval email</li>
                        <li>You log in and set up your timetable</li>
                    </ul>
                </div>
                <p className="text-xs text-gray-500 mt-auto">Already registered? <Link to="/login" className="text-blue-700 hover:underline">Sign in</Link></p>
            </aside>
            <main className="lg:col-span-6 flex items-start justify-center p-6 sm:p-12 overflow-y-auto">
                <div className="w-full max-w-2xl">
                    <Link to="/login" className="inline-flex items-center gap-2 mb-6 text-sm text-gray-500 hover:text-blue-700">
                        <ArrowLeft className="w-4 h-4" /> Back to login
                    </Link>

                    <form onSubmit={handleSubmit} className="card space-y-5">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center">
                                <Building2 className="w-6 h-6" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">Register your school</h1>
                                <p className="text-sm text-gray-500">Create your account to request platform access</p>
                            </div>
                        </div>

                        {error && (
                            <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> {error}
                            </div>
                        )}

                        <div>
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3 pb-2 border-b">School Information</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="sm:col-span-2">
                                    <label className="label">School name *</label>
                                    <input required value={form.schoolName} onChange={(e) => set('schoolName', e.target.value)} className="input" placeholder="Green Hills Technical School" />
                                </div>
                                <div>
                                    <label className="label">School type *</label>
                                    <select value={form.schoolType} onChange={(e) => set('schoolType', e.target.value)} className="input">
                                        {SCHOOL_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="label">Country *</label>
                                    <select value={form.country} onChange={(e) => set('country', e.target.value)} className="input">
                                        {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="label">Province</label>
                                    <input value={form.province} onChange={(e) => set('province', e.target.value)} className="input" />
                                </div>
                                <div>
                                    <label className="label">District</label>
                                    <input value={form.district} onChange={(e) => set('district', e.target.value)} className="input" />
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="label">Physical address</label>
                                    <input value={form.physicalAddress} onChange={(e) => set('physicalAddress', e.target.value)} className="input" />
                                </div>
                                <div>
                                    <label className="label">School email *</label>
                                    <input required type="email" value={form.officialEmail} onChange={(e) => set('officialEmail', e.target.value)} className="input" placeholder="info@school.rw" />
                                </div>
                                <div>
                                    <label className="label">School telephone</label>
                                    <input value={form.telephone} onChange={(e) => set('telephone', e.target.value)} className="input" />
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3 pb-2 border-b">Your Information (DOS account)</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="sm:col-span-2">
                                    <label className="label">Your full name *</label>
                                    <input required value={form.contactFullName} onChange={(e) => set('contactFullName', e.target.value)} className="input" placeholder="Jean Paul Doe" />
                                </div>
                                <div>
                                    <label className="label">Your email * (login)</label>
                                    <input required type="email" value={form.contactEmail} onChange={(e) => set('contactEmail', e.target.value)} className="input" />
                                </div>
                                <div>
                                    <label className="label">Your phone</label>
                                    <input value={form.contactPhone} onChange={(e) => set('contactPhone', e.target.value)} className="input" />
                                </div>
                                <div>
                                    <label className="label">Your role</label>
                                    <select value={form.contactRole} onChange={(e) => set('contactRole', e.target.value)} className="input">
                                        <option>Director of Studies</option>
                                        <option>Head Teacher</option>
                                        <option>Administrator</option>
                                        <option>IT Coordinator</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3 pb-2 border-b">Account Password</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="label">Password * (min 8 chars)</label>
                                    <input required type="password" minLength={8} value={form.password} onChange={(e) => set('password', e.target.value)} className="input" />
                                </div>
                                <div>
                                    <label className="label">Confirm password *</label>
                                    <input required type="password" minLength={8} value={form.confirmPassword} onChange={(e) => set('confirmPassword', e.target.value)} className="input" />
                                </div>
                            </div>
                        </div>

                        <button type="submit" disabled={status === 'sending'} className="btn-primary !bg-blue-700 hover:!bg-blue-800 w-full py-3">
                            {status === 'sending' ? 'Submitting registration…' : 'Submit Registration'}
                        </button>
                        <p className="text-xs text-gray-500 text-center">
                            By registering, you agree that our admin team may contact you via the email or phone provided.
                        </p>
                    </form>
                </div>
            </main>
        </div>
    );
}