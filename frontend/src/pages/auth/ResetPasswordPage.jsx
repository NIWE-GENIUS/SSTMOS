// src/pages/auth/ResetPasswordPage.jsx
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import { api, extractError } from '../../lib/api';
import BrandAside from './BrandAside';

export default function ResetPasswordPage() {
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const token = params.get('token');

    const [validating, setValidating] = useState(true);
    const [tokenValid, setTokenValid] = useState(false);
    const [accountEmail, setAccountEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [status, setStatus] = useState('idle');
    const [error, setError] = useState('');

    useEffect(() => {
        if (!token) { setValidating(false); setTokenValid(false); return; }
        api.get(`/auth/password-reset/validate?token=${encodeURIComponent(token)}`)
            .then(({ data }) => { setTokenValid(data.valid); setAccountEmail(data.email || ''); })
            .catch(() => setTokenValid(false))
            .finally(() => setValidating(false));
    }, [token]);

    async function handleSubmit(e) {
        e.preventDefault();
        if (password !== confirm) { setError('Passwords do not match'); return; }
        if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
        setError(''); setStatus('saving');
        try {
            await api.post('/auth/password-reset/complete', { token, newPassword: password });
            setStatus('success');
            setTimeout(() => navigate('/login', { replace: true }), 2000);
        } catch (err) {
            setError(extractError(err));
            setStatus('error');
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 grid grid-cols-1 lg:grid-cols-12">
            <BrandAside className="lg:col-span-3 hidden lg:flex" />
            <aside className="lg:col-span-4 hidden lg:flex flex-col border-r border-gray-200 bg-white p-8">
                <h2 className="text-lg font-bold text-gray-900 mb-3">Choose a strong password</h2>
                <p className="text-sm text-gray-600">Use at least 8 characters, including a mix of letters and numbers.</p>
            </aside>
            <main className="lg:col-span-5 flex items-center justify-center p-6 sm:p-12">
                <div className="w-full max-w-md">
                    {validating ? (
                        <div className="card text-center text-gray-500">Validating link…</div>
                    ) : !tokenValid ? (
                        <div className="card text-center">
                            <div className="w-14 h-14 rounded-full bg-red-100 text-red-700 flex items-center justify-center mx-auto mb-4">
                                <AlertCircle className="w-7 h-7" />
                            </div>
                            <h1 className="text-xl font-bold text-gray-900 mb-2">Invalid or expired link</h1>
                            <p className="text-sm text-gray-600 mb-6">
                                This password reset link is no longer valid. Please request a new one.
                            </p>
                            <Link to="/forgot-password" className="btn-primary">Request new link</Link>
                        </div>
                    ) : status === 'success' ? (
                        <div className="card text-center">
                            <div className="w-14 h-14 rounded-full bg-green-100 text-green-700 flex items-center justify-center mx-auto mb-4">
                                <CheckCircle2 className="w-7 h-7" />
                            </div>
                            <h1 className="text-xl font-bold text-gray-900 mb-2">Password reset</h1>
                            <p className="text-sm text-gray-600">Redirecting to login…</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="card">
                            <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center mb-4">
                                <Lock className="w-6 h-6" />
                            </div>
                            <h1 className="text-2xl font-bold text-gray-900 mb-2">Reset password</h1>
                            {accountEmail && <p className="text-sm text-gray-500 mb-6">For account: <strong>{accountEmail}</strong></p>}

                            {error && (
                                <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
                            )}

                            <div className="mb-4">
                                <label className="label">New password</label>
                                <input required type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="input" />
                            </div>
                            <div className="mb-6">
                                <label className="label">Confirm password</label>
                                <input required type="password" minLength={8} value={confirm} onChange={(e) => setConfirm(e.target.value)} className="input" />
                            </div>

                            <button type="submit" disabled={status === 'saving'} className="btn-primary !bg-blue-700 hover:!bg-blue-800 w-full">
                                {status === 'saving' ? 'Resetting…' : 'Reset password'}
                            </button>
                        </form>
                    )}
                </div>
            </main>
        </div>
    );
}