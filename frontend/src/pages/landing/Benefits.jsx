// src/pages/landing/Benefits.jsx
export default function Benefits() {
  const benefits = [
    { label: 'Time saved per term', value: '40+ hours' },
    { label: 'Conflicts per term', value: 'Zero' },
    { label: 'Timetable versions tracked', value: 'Unlimited' },
    { label: 'Data isolation guarantees', value: '100%' },
  ];

  return (
    <section className="py-24 bg-blue-700 text-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold leading-tight">
            What schools <span className="text-yellow-300">gain</span> from SSTMOS
          </h2>
          <p className="mt-4 text-lg text-blue-100">
            Time saved. Conflicts eliminated. Transparency gained.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((b) => (
            <div key={b.label} className="bg-blue-600/50 rounded-xl p-6 text-center backdrop-blur border border-blue-400/30">
              <div className="text-3xl font-bold">{b.value}</div>
              <div className="text-sm text-blue-100 mt-2">{b.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}