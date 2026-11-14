// src/pages/landing/Roles.jsx
const ROLES = [
  {
    role: 'Platform Administrator', icon: '👑', color: 'blue',
    description: 'The top of the hierarchy. You manage the entire platform — every school, every subscription.',
    features: ['Register & activate schools', 'Manage service agreements', 'Monitor subscription expiry', 'Cross-school data inspection', 'Platform audit logs', 'Renew & suspend accounts'],
  },
  {
    role: 'Director of Studies', icon: '📋', color: 'green',
    description: 'The school\'s timetable owner. Configures academics, manages resources, generates schedules.',
    features: ['Configure daily timetable format', 'Manage academic years & classes', 'Register trainers & modules', 'Run automatic generation', 'Manual edit with validation', 'Publish approved timetables'],
  },
  {
    role: 'Head Teacher', icon: '🎓', color: 'purple',
    description: 'Oversight role. Reviews and approves timetables before they go live.',
    features: ['View master school timetable', 'Review workload reports', 'Approve pending timetables', 'Access school-wide analytics', 'Receive change notifications'],
  },
  {
    role: 'Deputy Head Teacher', icon: '📊', color: 'orange',
    description: 'Delegated oversight. Assigned permissions by the DOS for daily operations.',
    features: ['View master timetable', 'Access reports', 'Monitor trainer workloads', 'Track class schedules'],
  },
  {
    role: 'Trainer / Teacher', icon: '👨‍🏫', color: 'teal',
    description: 'Personal view. Sees exactly their own teaching schedule — no distractions.',
    features: ['Personal weekly timetable', 'Assigned classes & modules', 'Classroom / lab assignments', 'Change notifications', 'Submit availability'],
  },
  {
    role: 'Student', icon: '🎒', color: 'yellow',
    description: 'Simple, focused. Just the class timetable they need to navigate their week.',
    features: ['Class timetable view', 'Modules & periods', 'Room assignments', 'Timetable change alerts', 'Announcements'],
  },
];

const COLORS = {
  blue:   'bg-blue-50 text-blue-700 border-blue-100',
  green:  'bg-green-50 text-green-700 border-green-100',
  purple: 'bg-purple-50 text-purple-700 border-purple-100',
  orange: 'bg-orange-50 text-orange-700 border-orange-100',
  teal:   'bg-teal-50 text-teal-700 border-teal-100',
  yellow: 'bg-yellow-50 text-yellow-700 border-yellow-100',
};

export default function Roles() {
  return (
    <section id="roles" className="py-24 bg-gray-50">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-3 py-1 text-xs font-semibold text-blue-700 bg-blue-50 rounded-full mb-3 uppercase tracking-wide">
            Roles
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
            Designed for <span className="text-blue-700">every person</span> in the school
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Each role gets exactly the tools and information they need — nothing more, nothing less.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ROLES.map((r) => (
            <div key={r.role} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${COLORS[r.color]} text-xs font-medium mb-4`}>
                <span>{r.icon}</span><span>{r.role}</span>
              </div>
              <p className="text-sm text-gray-600 mb-4 leading-relaxed">{r.description}</p>
              <ul className="space-y-2">
                {r.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                    <svg className="w-4 h-4 text-green-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}