// src/pages/landing/Stats.jsx
export default function Stats() {
  const stats = [
    { value: '11', label: 'Teaching periods per day (default)' },
    { value: '0', label: 'Double-bookings possible' },
    { value: '5', label: 'User roles supported' },
    { value: '<60s', label: 'Timetable generation time' },
  ];
  return (
    <section className="bg-gray-50 border-y border-gray-100 py-14">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-4xl font-bold text-blue-700">{s.value}</div>
              <div className="text-sm text-gray-500 mt-2">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}