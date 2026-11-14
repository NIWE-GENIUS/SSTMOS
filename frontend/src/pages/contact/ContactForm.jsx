// src/pages/contact/ContactForm.jsx
import { useState } from 'react';

export default function ContactForm() {
  const [form, setForm] = useState({ name: '', email: '', school: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  function update(field, value) { setForm((f) => ({ ...f, [field]: value })); }

  function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!form.name || !form.email || !form.message) {
      setError('Please fill in all required fields.');
      return;
    }
    // For now, open the user's mail client with a pre-filled email to the developer
    const subject = encodeURIComponent(`SSTMOS inquiry from ${form.name}${form.school ? ' (' + form.school + ')' : ''}`);
    const body = encodeURIComponent(
      `Name: ${form.name}\nEmail: ${form.email}\nSchool: ${form.school || '(not provided)'}\n\n${form.message}`
    );
    window.location.href = `mailto:habumugishayasson5@gmail.com?subject=${subject}&body=${body}`;
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <div className="w-14 h-14 rounded-full bg-green-100 text-green-700 flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Message ready to send</h3>
        <p className="text-sm text-gray-600 mb-6">
          Your email client should have opened. If it didn't, reach us directly at{' '}
          <a href="mailto:habumugishayasson5@gmail.com" className="text-blue-700 hover:underline">
            habumugishayasson5@gmail.com
          </a>.
        </p>
        <button
          onClick={() => { setSubmitted(false); setForm({ name: '', email: '', school: '', message: '' }); }}
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
      <p className="text-sm text-gray-500 mb-6">We'll get back to you as soon as possible.</p>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="label">Your name *</label>
          <input
            required
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            className="input"
            placeholder="Jane Doe"
          />
        </div>
        <div>
          <label className="label">Email *</label>
          <input
            required
            type="email"
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
            className="input"
            placeholder="you@school.rw"
          />
        </div>
      </div>

      <div className="mb-4">
        <label className="label">School name</label>
        <input
          value={form.school}
          onChange={(e) => update('school', e.target.value)}
          className="input"
          placeholder="Optional"
        />
      </div>

      <div className="mb-6">
        <label className="label">Message *</label>
        <textarea
          required
          value={form.message}
          onChange={(e) => update('message', e.target.value)}
          rows={6}
          className="input"
          placeholder="Tell us about your school and what you need..."
        />
      </div>

      <button type="submit" className="btn-primary !bg-blue-700 hover:!bg-blue-800 w-full">
        Send message
      </button>
    </form>
  );
}