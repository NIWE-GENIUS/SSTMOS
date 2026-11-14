// src/pages/landing/FAQ.jsx
import { useState } from 'react';

const ITEMS = [
  { q: 'How is SSTMOS different from Excel-based scheduling?', a: 'Excel requires you to manually track every constraint and cross-check every assignment. SSTMOS automatically detects conflicts across trainers, classes, and rooms, enforces your institution\'s rules, and produces a validated draft in seconds.' },
  { q: 'What happens if my school has practical labs?', a: 'SSTMOS models practical modules distinctly from theoretical ones. You specify which room types a module requires, and the engine only assigns that module to suitable, available facilities.' },
  { q: 'Can I handle consecutive periods and split sessions?', a: 'Yes. Every module can be configured for 1, 2, or 3 consecutive periods (no more than 3). Split-session patterns let you schedule one segment before a break and one after — treating it as a single daily occurrence.' },
  { q: 'How does the multi-tenant isolation work?', a: 'Every table that stores school-owned data has a school_id column. PostgreSQL row-level security policies filter every query by the authenticated user\'s school. Even if application code had a bug, the database itself would refuse to return another school\'s records.' },
  { q: 'What happens when my service agreement expires?', a: 'Your data remains intact — nothing is deleted. Access becomes read-only so you can still view and export your data. You can renew at any time to restore full functionality.' },
  { q: 'Can multiple schools share the same login page?', a: 'Yes. Users log in with their email and password, and the system identifies which school they belong to automatically. There is one login URL for everyone.' },
  { q: 'What if my timetable cannot be scheduled?', a: 'SSTMOS never silently produces an incomplete or invalid timetable. The system identifies exactly which lessons are unscheduled, explains why, and suggests adjustments.' },
  { q: 'Can I export timetables and reports?', a: 'Yes. Master, trainer, and class timetables are all exportable as PDF and Excel files. Reports — workload, coverage, room utilization — are also exportable.' },
];

export default function FAQ() {
  const [open, setOpen] = useState(null);
  return (
    <section id="faq" className="py-24">
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="inline-block px-3 py-1 text-xs font-semibold text-blue-700 bg-blue-50 rounded-full mb-3 uppercase tracking-wide">
            FAQ
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
            Questions we <span className="text-blue-700">get asked</span>
          </h2>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 px-6">
          {ITEMS.map((item, i) => (
            <div key={i} className="border-b border-gray-200 last:border-b-0">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full py-5 flex items-center justify-between text-left hover:text-blue-700"
              >
                <span className="font-medium text-gray-900">{item.q}</span>
                <svg
                  className={`w-5 h-5 text-gray-400 transition-transform shrink-0 ml-4 ${open === i ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {open === i && <div className="pb-5 text-sm text-gray-600 leading-relaxed">{item.a}</div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}