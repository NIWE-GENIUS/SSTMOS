// src/pages/auth/BrandAside.jsx
import { Link } from 'react-router-dom';

export default function BrandAside({ className = '' }) {
  return (
    <aside className={`bg-blue-700 text-white flex flex-col justify-between p-8 ${className}`}>
      <div>
        <Link to="/" className="flex items-center gap-2 mb-10">
          <div className="w-9 h-9 rounded-lg bg-white/20 border border-white/30 flex items-center justify-center text-white font-bold">S</div>
          <span className="text-xl font-bold">SSTMOS</span>
        </Link>

        <h2 className="text-2xl font-bold leading-tight mb-3">
          Smart School Timetable Management
        </h2>
        <p className="text-sm text-blue-100 leading-relaxed mb-8">
          Automatically generate conflict-free timetables. Multi-tenant, secure, built for real schools.
        </p>

        <ul className="space-y-3 text-sm">
          {[
            'Automatic generation in seconds',
            'Zero conflicts across trainers, classes, rooms',
            'Multi-school isolation at database level',
            'Full audit trail of every change',
            'Draft, approve, publish workflow',
          ].map((f) => (
            <li key={f} className="flex items-start gap-2">
              <svg className="w-4 h-4 text-yellow-300 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-blue-50">{f}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-10 pt-6 border-t border-blue-400/30 text-xs">
        <div className="text-blue-200 mb-1">Designed &amp; developed by</div>
        <div className="font-bold text-white text-sm tracking-wide">HABUMUGISHA YASSON</div>
        <div className="text-blue-100 mt-0.5">Service Manager · Next Creatures Group Ltd</div>
        <div className="mt-2 space-y-0.5">
          <div><a href="tel:0791798333" className="hover:text-yellow-300">0791798333</a></div>
          <div><a href="mailto:habumugishayasson5@gmail.com" className="hover:text-yellow-300 break-all">habumugishayasson5@gmail.com</a></div>
        </div>
      </div>
    </aside>
  );
}