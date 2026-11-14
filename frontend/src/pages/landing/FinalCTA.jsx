// src/pages/landing/FinalCTA.jsx
import { Link } from 'react-router-dom';

export default function FinalCTA() {
  return (
    <section className="py-24 bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
          Ready to make timetabling <span className="text-blue-700">effortless</span>?
        </h2>
        <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
          Sign in with the credentials your platform administrator shared — or request access if your school is considering SSTMOS.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row justify-center gap-3">
          <Link to="/login" className="btn-primary !bg-blue-700 hover:!bg-blue-800 text-base px-8 py-3">
            Sign in to your school
          </Link>
          <Link to="/contact" className="btn-secondary text-base px-8 py-3">
            Contact us
          </Link>
        </div>
      </div>
    </section>
  );
}