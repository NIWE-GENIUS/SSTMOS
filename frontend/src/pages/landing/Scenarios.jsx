// src/pages/landing/Scenarios.jsx
const SCENARIOS = [
  { title: 'The triple-period lab', body: 'A networking practical requires 3 consecutive periods in the networking lab. Only one lab exists. SSTMOS schedules it once per week per class, never overlapping, and flags if the constraint can\'t be met.' },
  { title: 'The morning break split', body: 'One period of Mathematics before morning break, one after — as a single logical occurrence. Your DOS configures the split pattern once, SSTMOS handles the two segments.' },
  { title: 'The over-committed trainer', body: 'A trainer is qualified for 4 modules across 5 classes. The engine spreads their load evenly, respects their 20-period weekly cap, and flags if assignments would exceed it.' },
  { title: 'The shared lab crisis', body: 'Two classes need the same computer lab at the same time. SSTMOS won\'t double-book — it schedules one, delays the other, and reports the delay so the DOS can decide.' },
  { title: 'The mid-term change', body: 'A trainer resigns mid-term. The DOS assigns a replacement. The published timetable updates instantly across master, trainer, and class views — no re-download needed.' },
  { title: 'The O/A-Level mix', body: 'One school runs both O-Level and A-Level. Classes, trainers, and modules span both. SSTMOS treats them as separate educational levels with shared scheduling resources.' },
];

export default function Scenarios() {
  return (
    <section className="py-24">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-3 py-1 text-xs font-semibold text-blue-700 bg-blue-50 rounded-full mb-3 uppercase tracking-wide">
            Built for real schools
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
            Scenarios SSTMOS was <span className="text-blue-700">designed for</span>
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            These aren't edge cases — they're the everyday reality of technical education. SSTMOS handles them natively.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {SCENARIOS.map((s) => (
            <div key={s.title} className="bg-white rounded-xl border border-gray-200 p-6 hover:border-blue-200 hover:shadow-md transition-all">
              <h3 className="text-base font-semibold text-gray-900 mb-2">{s.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}