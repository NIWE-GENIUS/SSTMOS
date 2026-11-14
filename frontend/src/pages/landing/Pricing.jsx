// src/pages/landing/Pricing.jsx
import { Link } from 'react-router-dom';

const PLANS = [
  {
    name: 'Trial', price: 'Free', period: '1 month', description: 'For schools evaluating the platform',
    features: ['Up to 4 classes', 'Up to 15 trainers', 'Up to 5 rooms', 'Automatic generation', 'Email support'],
    cta: 'Request access',
  },
  {
    name: 'Standard', price: 'Contact us', period: '12 months', description: 'For typical secondary/technical schools',
    features: ['Up to 20 classes', 'Up to 60 trainers', 'Up to 30 rooms', 'Automatic generation & manual editing', 'PDF & Excel exports', 'Email + phone support'],
    highlighted: true, cta: 'Talk to sales',
  },
  {
    name: 'Premium', price: 'Contact us', period: '12 months', description: 'For large institutions & multi-campus',
    features: ['Up to 100 classes', 'Up to 500 trainers', 'Up to 200 rooms', 'Priority scheduling', 'Custom reports', 'Priority support', 'Onboarding assistance'],
    cta: 'Talk to sales',
  },
];

export default function Pricing() {
  return (
    <section id="pricing" className="py-24 bg-gray-50">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-3 py-1 text-xs font-semibold text-blue-700 bg-blue-50 rounded-full mb-3 uppercase tracking-wide">
            Pricing
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
            Simple, <span className="text-blue-700">transparent</span> pricing
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Every plan includes the full platform — the difference is scale and support.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {PLANS.map((p) => (
            <div
              key={p.name}
              className={`rounded-2xl p-8 bg-white ${p.highlighted ? 'border-2 border-blue-600 shadow-xl relative' : 'border border-gray-200'}`}
            >
              {p.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full">
                  MOST POPULAR
                </div>
              )}
              <h3 className="text-xl font-bold text-gray-900">{p.name}</h3>
              <p className="text-sm text-gray-500 mt-1">{p.description}</p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-gray-900">{p.price}</span>
                {p.period && <span className="text-sm text-gray-500">{p.period}</span>}
              </div>
              <ul className="mt-6 space-y-3">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                    <svg className="w-4 h-4 text-green-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                to="/contact"
                className={`mt-8 block text-center w-full ${p.highlighted ? 'btn-primary !bg-blue-700 hover:!bg-blue-800' : 'btn-secondary'}`}
              >
                {p.cta}
              </Link>
            </div>
          ))}
        </div>
        <p className="text-center text-sm text-gray-500 mt-10">
          All plans include automatic timetable generation, multi-user access, and unlimited timetable versions.
        </p>
      </div>
    </section>
  );
}