// src/pages/landing/Features.jsx
const FEATURES = [
  { icon: '⚡', title: 'Automatic generation', body: 'Constraint-based scheduling engine produces a complete weekly timetable in seconds — respecting every trainer, room, and module requirement.' },
  { icon: '🛡️', title: 'Zero conflicts', body: 'Trainers, classes, rooms, and labs are never double-booked. Hard constraints are enforced at both the database and application level.' },
  { icon: '🏢', title: 'Multi-tenant architecture', body: 'Each school is fully isolated. Data is separated at the database level with PostgreSQL row-level security — not just application filters.' },
  { icon: '👥', title: 'Role-based access', body: 'Platform admin, DOS, Head Teacher, Trainer, and Student roles each see only what they need — with fine-grained permission controls.' },
  { icon: '📊', title: 'Rich reporting', body: 'Trainer workload, class distribution, module coverage, room utilization, and free periods — all exportable to PDF and Excel.' },
  { icon: '🕐', title: 'Version control', body: 'Drafts, approvals, and published versions. Full audit trail of every change. Restore previous versions safely.' },
  { icon: '🧩', title: 'Handles real complexity', body: 'Sequences of 1–3 consecutive periods, split sessions around breaks, daily occurrence rules, and practical lab requirements.' },
  { icon: '🔒', title: 'Enterprise security', body: 'JWT authentication, secure password hashing, rate limiting, CSRF protection, and comprehensive audit logging.' },
  { icon: '📱', title: 'Responsive interface', body: 'Works beautifully on desktop, tablet, and mobile. Print-ready timetables. Instant search and filters.' },
];

export default function Features() {
  return (
    <section id="features" className="py-24">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-3 py-1 text-xs font-semibold text-blue-700 bg-blue-50 rounded-full mb-3 uppercase tracking-wide">
            Features
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
            Everything you need to run <span className="text-blue-700">timetables</span>
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            From configuration to publication — SSTMOS covers every part of the scheduling workflow.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg hover:border-blue-200 transition-all">
              <div className="w-11 h-11 rounded-lg bg-blue-50 flex items-center justify-center mb-4 text-xl">
                {f.icon}
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}