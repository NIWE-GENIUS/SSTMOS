// src/pages/landing/Testimonials.jsx
const QUOTES = [
  { quote: 'What used to take our team two weeks of spreadsheets now takes an hour. The conflict detection alone saved us from so many issues.', name: 'Jean Paul M.', role: 'Director of Studies', school: 'Technical Secondary School' },
  { quote: 'The split-session feature is a game changer for our morning break. We finally got our mathematics distribution right without hand-tweaking.', name: 'Marie Claire K.', role: 'Head Teacher', school: 'Vocational Institute' },
  { quote: 'As a trainer, I love that I have my own personal timetable URL. I never have to ask the office for an update — it\'s always current.', name: 'Emmanuel R.', role: 'Trainer', school: 'Technical School' },
];

export default function Testimonials() {
  return (
    <section className="py-24">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-3 py-1 text-xs font-semibold text-blue-700 bg-blue-50 rounded-full mb-3 uppercase tracking-wide">
            Testimonials
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
            Trusted by <span className="text-blue-700">school leaders</span>
          </h2>
          <p className="mt-4 text-lg text-gray-600">Illustrative quotes from schools piloting SSTMOS.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {QUOTES.map((t) => (
            <div key={t.name} className="bg-white rounded-xl border border-gray-200 p-6">
              <svg className="w-8 h-8 text-blue-200 mb-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.996 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.984zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.432.917-3.995 3.638-3.995 5.849h3.983v10h-9.984z" />
              </svg>
              <p className="text-sm text-gray-700 leading-relaxed italic mb-6">"{t.quote}"</p>
              <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold">
                  {t.name.charAt(0)}
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">{t.name}</div>
                  <div className="text-xs text-gray-500">{t.role} · {t.school}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}