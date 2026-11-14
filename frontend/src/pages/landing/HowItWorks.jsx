// src/pages/landing/HowItWorks.jsx
const STEPS = [
  { n: 1, title: 'Platform admin registers your school', body: 'The platform administrator creates your school account, sets up your service agreement, and activates your access. Everything is contract-driven and auditable.' },
  { n: 2, title: 'Your DOS takes over', body: 'Your Director of Studies receives their first login, then configures your school\'s academic year, terms, classes, trainers, and modules.' },
  { n: 3, title: 'Configure the timetable format', body: 'Set your daily structure — start time, period length, sessions, breaks. The system calculates all period times automatically and previews the full day.' },
  { n: 4, title: 'Run the scheduling engine', body: 'Click generate. The engine considers every constraint — trainer availability, room types, weekly periods, sequences, split sessions — and produces a conflict-free draft.' },
  { n: 5, title: 'Review and publish', body: 'Review the master timetable, individual trainer schedules, and class schedules. Edit if needed. Submit for approval. Publish when ready.' },
  { n: 6, title: 'Everyone stays in sync', body: 'Trainers, students, and administrators see their schedules automatically. When changes happen, all views update at once — no more version confusion.' },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-3 py-1 text-xs font-semibold text-blue-700 bg-blue-50 rounded-full mb-3 uppercase tracking-wide">
            How it works
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
            From <span className="text-blue-700">zero</span> to published timetable
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Six steps. No spreadsheets. No conflict-checking by hand.
          </p>
        </div>
        <div className="space-y-8">
          {STEPS.map((s) => (
            <div key={s.n} className="flex gap-5">
              <span className="w-12 h-12 rounded-full bg-blue-700 text-white flex items-center justify-center font-bold shrink-0 shadow-md">
                {s.n}
              </span>
              <div className="pt-2">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{s.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}