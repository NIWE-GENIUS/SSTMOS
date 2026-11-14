// src/pages/LegalPage.jsx
import { Link } from 'react-router-dom';
import Navbar from './landing/Navbar';
import Footer from './landing/Footer';

const CONTENT = {
  privacy: {
    title: 'Privacy Policy',
    updated: 'November 2026',
    sections: [
      { h: 'Data we collect', p: 'SSTMOS collects only the information you or your school administrator provides: user names, emails, phone numbers, and academic records. We do not collect analytics or tracking data beyond necessary server logs.' },
      { h: 'How we use it', p: 'Data is used exclusively to operate the timetable management platform for your school. We never share your data with third parties, advertisers, or other schools.' },
      { h: 'Multi-tenant isolation', p: 'Each school\'s data is isolated at the database level using PostgreSQL row-level security. Even if our application code had a defect, the database itself prevents one school from accessing another school\'s records.' },
      { h: 'Data retention', p: 'Your data remains on the platform for as long as your service agreement is active. After termination, data is retained for a grace period for export, then securely deleted.' },
      { h: 'Contact', p: 'For privacy inquiries, contact HABUMUGISHA YASSON at habumugishayasson5@gmail.com or 0791798333.' },
    ],
  },
  terms: {
    title: 'Terms of Service',
    updated: 'November 2026',
    sections: [
      { h: 'Service description', p: 'SSTMOS provides web-based timetable management and optimization for schools. Access is granted per school through a signed service agreement with the platform administrator.' },
      { h: 'Account responsibility', p: 'Each school is responsible for the actions of its users. Do not share credentials. Report any unauthorized access immediately.' },
      { h: 'Acceptable use', p: 'The platform may only be used for legitimate scheduling and management purposes of your school. Attempts to access other schools\' data, reverse engineer the system, or disrupt service are strictly prohibited.' },
      { h: 'Service availability', p: 'We target 99% uptime but do not guarantee uninterrupted service. Scheduled maintenance will be announced in advance.' },
      { h: 'Termination', p: 'Either party may terminate the service agreement per the terms in the signed contract. Data remains exportable for 30 days after termination.' },
    ],
  },
  'data-protection': {
    title: 'Data Protection',
    updated: 'November 2026',
    sections: [
      { h: 'Security measures', p: 'SSTMOS uses industry-standard security: bcrypt password hashing, JWT tokens with short expiry, rate limiting on authentication, HTTPS in production, and full audit logging of every data access.' },
      { h: 'Access control', p: 'Role-based access control ensures each user sees only the data their role permits. Platform administrators can inspect school data but every access is logged.' },
      { h: 'Backups', p: 'All data is backed up daily. Backups are encrypted and stored separately from primary data. Restore testing is performed monthly.' },
      { h: 'Your rights', p: 'You have the right to access, correct, and export your data at any time. You may request deletion of your account subject to the terms of your service agreement.' },
      { h: 'Reporting', p: 'Report any suspected data incident to HABUMUGISHA YASSON at habumugishayasson5@gmail.com or 0791798333 immediately.' },
    ],
  },
};

export default function LegalPage({ type }) {
  const data = CONTENT[type];
  if (!data) return null;

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <section className="bg-blue-700 text-white">
        <div className="max-w-4xl mx-auto px-6 py-16 text-center">
          <h1 className="text-4xl font-bold mb-2">{data.title}</h1>
          <p className="text-blue-100">Last updated: {data.updated}</p>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-6 py-16">
        <div className="prose max-w-none space-y-8">
          {data.sections.map((s) => (
            <div key={s.h}>
              <h2 className="text-xl font-bold text-gray-900 mb-3">{s.h}</h2>
              <p className="text-gray-700 leading-relaxed">{s.p}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">Questions about this page?</h3>
            <p className="text-sm text-blue-800 mb-3">
              Contact the developer directly:
            </p>
            <div className="space-y-1 text-sm">
              <div className="font-bold text-gray-900">HABUMUGISHA YASSON</div>
              <div className="text-gray-700">Service Manager · Next Creatures Group Ltd</div>
              <div><a href="tel:0791798333" className="text-blue-700 hover:underline">0791798333</a></div>
              <div><a href="mailto:habumugishayasson5@gmail.com" className="text-blue-700 hover:underline break-all">habumugishayasson5@gmail.com</a></div>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <Link to="/" className="text-sm text-blue-700 hover:underline">← Back to home</Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}