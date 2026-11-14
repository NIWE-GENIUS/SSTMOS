// src/pages/landing/Hero.jsx
import { Link } from 'react-router-dom';

export default function Hero() {
  return (
    <section className="bg-blue-700 text-white relative overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-white blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-blue-300 blur-3xl" />
      </div>

      <div className="relative max-w-6xl mx-auto px-6 py-24 sm:py-32 text-center">
        <span className="inline-block px-4 py-1.5 text-xs font-semibold text-blue-100 bg-blue-600/50 rounded-full mb-8 uppercase tracking-wider border border-blue-400/30">
          Built for technical & vocational schools
        </span>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight max-w-4xl mx-auto">
          <span className="text-white">Smart School Timetable</span>{' '}
          <span className="text-yellow-300">Management</span>{' '}
          <span className="text-white">&</span>{' '}
          <span className="text-yellow-300">Optimization</span>
        </h1>

        <p className="mt-8 text-lg sm:text-xl text-blue-100 max-w-2xl mx-auto leading-relaxed">
          Automatically generate <strong className="text-white font-semibold">conflict-free timetables</strong> for your school.
          Multi-tenant, secure, and built to handle the <strong className="text-white font-semibold">real complexity</strong> of technical education.
        </p>

        <div className="mt-12 flex flex-col sm:flex-row justify-center gap-3">
          <Link
            to="/login"
            className="inline-flex items-center justify-center rounded-md px-8 py-3 bg-white text-blue-700 font-semibold text-base hover:bg-blue-50 transition-colors shadow-lg"
          >
            Sign in to your school
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
          <a
            href="#how-it-works"
            className="inline-flex items-center justify-center rounded-md px-8 py-3 bg-blue-600/40 text-white font-semibold text-base hover:bg-blue-600/60 transition-colors border border-blue-400/40"
          >
            See how it works
          </a>
        </div>

        <p className="mt-8 text-xs text-blue-200">
          No credit card required · Free 1-month trial for qualifying schools
        </p>
      </div>
    </section>
  );
}