// src/pages/auth/ForgotPasswordPage.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { api, extractError } from '../../lib/api';
import BrandAside from './BrandAside';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState('idle');
    const [error, setError] = useState('');

    async function handleSubmit(e) {
        e.preventDefault();
        setError(''); setStatus('sending');
        try {
            await api.post('/auth/password-reset/request', { email });
            setStatus('sent');
        } catch (err) {
            setError(extractError(err));
            setStatus('error');
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 grid grid-cols-1 lg:grid-cols-12">
            <BrandAside className="lg:col-span-3 hidden lg:flex" />
            <aside className="lg:col-span-4 hidden lg:flex flex-col border-r border-gray-200 bg-white p-8">
                <h2 className="text-lg font-bold text-gray-900 mb-3">Reset your password</h2>
                <p className="text-sm text-gray-600 mb-4">
                    Enter the email address associated with your SSTMOS account.
                    We will send you a secure link to reset your password.
                </p>
                <p className="text-sm text-gray-600">
                    The link expires in <strong>30 minutes</strong> for security reasons.
                </p>
            </aside>
            <main className="lg:col-span-5 flex items-center justify-center p-6 sm:p-12">
                <div className="w-full max-w-md">
                    <Link to="/login" className="inline-flex items-center gap-2 mb-8 text-sm text-gray-500 hover:text-blue-700">
                        <ArrowLeft className="w-4 h-4" /> Back to login
                    </Link>

                    {status === 'sent' ? (
                        <div className="card text-center">
                            <div className="w-14 h-14 rounded-full bg-green-100 text-green-700 flex items-center justify-center mx-auto mb-4">
                                <CheckCircle2 className="w-7 h-7" />
                            </div>
                            <h1 className="text-xl font-bold text-gray-900 mb-2">Check your email</h1>
                            <p className="text-sm text-gray-600 mb-6">
                                If an account exists for <strong>{email}</strong>, we've sent a password reset link.
                                It expires in 30 minutes.
                            </p>
                            <Link to="/login" className="btn-secondary">Back to login</Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="card">
                            <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center mb-4">
                                <Mail className="w-6 h-6" />
                            </div>
                            <h1 className="text-2xl font-bold text-gray-900 mb-2">Forgot password?</h1>
                            <p className="text-sm text-gray-500 mb-6">
                                Enter your account email and we'll send you a reset link.
                            </p>

                            {error && (
                                <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                                    {error}
                                </div>
                            )}

                            <div className="mb-6">
                                <label className="label">Email address</label>
                                <input
                                    required
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="input"
                                    placeholder="you@school.rw"
                                />
                            </div>

                            <button type="submit" disabled={status === 'sending'} className="btn-primary !bg-blue-700 hover:!bg-blue-800 w-full">
                                {status === 'sending' ? 'Sending…' : 'Send reset link'}
                            </button>
                        </form>
                    )}
                </div>
            </main>
        </div>
    );
}