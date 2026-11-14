// src/pages/auth/LoginForm.jsx
import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth, homeForRole } from '../../context/AuthContext';
import { extractError } from '../../lib/api';

export default function LoginForm() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const u = await login(email.trim(), password);
      const target = location.state?.from || homeForRole(u.roles);
      navigate(target, { replace: true });
    } catch (err) {
      setError(extractError(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      <Link to="/" className="inline-flex items-center gap-2 mb-8 text-sm text-gray-500 hover:text-blue-700">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to home
      </Link>

      <div className="lg:hidden flex items-center gap-2 mb-6">
        <div className="w-9 h-9 rounded-lg bg-blue-700 flex items-center justify-center text-white font-bold">S</div>
        <span className="text-xl font-bold text-blue-800">SSTMOS</span>
      </div>

      <h1 className="text-3xl font-bold text-gray-900 mb-2">Sign in</h1>
      <p className="text-sm text-gray-500 mb-8">Welcome back. Enter your credentials to continue.</p>

      {error && (
        <div className="mb-6 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="email" className="label">Email address</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input !border-gray-300 focus:!border-blue-500 focus:!ring-blue-500"
            placeholder="you@school.rw"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="password" className="label !mb-0">Password</label>
            <a href="#" className="text-xs text-blue-700 hover:underline">Forgot?</a>
          </div>
          <div className="relative">
            <input
              id="password"
              type={showPw ? 'text' : 'password'}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input !border-gray-300 focus:!border-blue-500 focus:!ring-blue-500 pr-12"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="absolute inset-y-0 right-0 px-3 text-gray-400 hover:text-gray-600"
              aria-label="Toggle password visibility"
            >
              {showPw ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full inline-flex items-center justify-center rounded-md px-4 py-3 bg-blue-700 text-white font-semibold text-sm hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <div className="mt-8 pt-6 border-t border-gray-200 text-center text-xs text-gray-500">
        Don't have an account? Contact your <strong className="text-gray-700">platform administrator</strong> to be onboarded.
      </div>

      <div className="mt-6 lg:hidden text-center text-xs text-gray-500">
        <div className="mb-1">Designed &amp; developed by</div>
        <div className="font-bold text-gray-900">HABUMUGISHA YASSON</div>
        <div>Service Manager · Next Creatures Group Ltd</div>
        <div className="mt-1">
          <a href="tel:0791798333" className="text-blue-700 hover:underline">0791798333</a>
          <span className="mx-2">·</span>
          <a href="mailto:habumugishayasson5@gmail.com" className="text-blue-700 hover:underline break-all">habumugishayasson5@gmail.com</a>
        </div>
      </div>
    </div>
  );
}