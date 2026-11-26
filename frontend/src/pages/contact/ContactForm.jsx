// src/pages/contact/ContactForm.jsx
import { useState } from 'react';
import { Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { api, extractError } from '../../lib/api';

export default function ContactForm() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState('idle');
  const [response, setResponse] = useState(null);
  const [error, setError] = useState('');

  function update(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setStatus('sending');
    try {
      const { data } = await api.post('/contact', form);
      setResponse(data);
      setStatus('success');
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch (err) {
      setError(extractError(err));
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 text-green-700 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Message received</h3>
        <p className="text-sm text-gray-600 mb-4">
          Your message has been sent to our team. Check your email for confirmation.
        </p>
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <div className="text-xs text-blue-700 uppercase tracking-wide font-semibold">Reference number</div>
          <div className="text-lg font-mono text-blue-900 mt-1">{response?.referenceNumber}</div>
        </div>
        <button
          onClick={() => { setStatus('idle'); setResponse(null); }}
          className="btn-secondary"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 sm:p-8">
      <h2 className="text-xl font-bold text-gray-900 mb-2">Send us a message</h2>
      <p className="text-sm text-gray-500 mb-6">We'll get back to you within 24 hours on business days.</p>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="label">Your name *</label>
          <input required value={form.name} onChange={(e) => update('name', e.target.value)} className="input" placeholder="Jane Doe" />
        </div>
        <div>
          <label className="label">Email address *</label>
          <input required type="email" value={form.email} onChange={(e) => update('email', e.target.value)} className="input" placeholder="you@school.rw" />
        </div>
      </div>

      <div className="mb-4">
        <label className="label">Subject *</label>
        <input required value={form.subject} onChange={(e) => update('subject', e.target.value)} className="input" placeholder="School registration inquiry" />
      </div>

      <div className="mb-6">
        <label className="label">Your message *</label>
        <textarea required rows={6} value={form.message} onChange={(e) => update('message', e.target.value)} className="input" placeholder="Tell us about your school and what you need..." />
        <p className="text-xs text-gray-500 mt-1">{form.message.length}/5000 characters</p>
      </div>

      <button
        type="submit"
        disabled={status === 'sending'}
        className="btn-primary !bg-blue-700 hover:!bg-blue-800 w-full"
      >
        {status === 'sending' ? 'Sending…' : (
          <><Send className="w-4 h-4 mr-2 inline" /> Send Message</>
        )}
      </button>

      <p className="text-xs text-gray-500 mt-4 text-center">
        By submitting, you agree to receive email replies from SSTMOS. We never share your email.
      </p>
    </form>
  );
}