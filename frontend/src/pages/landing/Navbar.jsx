// src/pages/landing/Navbar.jsx
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export default function Navbar() {
  const [mobileMenu, setMobileMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { theme, toggle } = useTheme();
  const onLanding = location.pathname === '/';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // When on contact/other pages, anchor links jump back to landing sections
  const anchor = (hash) => (onLanding ? hash : `/${hash}`);

  const links = [
    { label: 'Features', href: anchor('#features') },
    { label: 'Roles', href: anchor('#roles') },
    { label: 'How it works', href: anchor('#how-it-works') },
    { label: 'Pricing', href: anchor('#pricing') },
    { label: 'FAQ', href: anchor('#faq') },
  ];

  return (
    <header
      className={`sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur transition-all ${
        scrolled
          ? 'shadow-sm dark:shadow-slate-800/50'
          : 'border-b border-gray-100 dark:border-slate-800'
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-700 dark:bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
            S
          </div>
          <span className="text-xl font-bold text-blue-800 dark:text-blue-400">SSTMOS</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className="text-sm text-gray-600 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-400 font-medium transition-colors"
            >
              {l.label}
            </a>
          ))}
          <Link
            to="/contact"
            className="text-sm text-gray-600 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-400 font-medium transition-colors"
          >
            Contact
          </Link>

          {/* Theme toggle button */}
          <button
            onClick={toggle}
            className="p-2 rounded-md text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Toggle theme"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>

          <Link
            to="/signup"
            className="text-sm text-gray-600 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-400 font-medium transition-colors"
          >
            Register
          </Link>
          <Link
            to="/login"
            className="btn-primary !bg-blue-700 hover:!bg-blue-800 dark:!bg-blue-600 dark:hover:!bg-blue-500"
          >
            Sign in
          </Link>
        </nav>

        {/* Mobile buttons */}
        <div className="md:hidden flex items-center gap-2">
          <button
            onClick={toggle}
            className="p-2 rounded-md text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <button
            className="text-gray-700 dark:text-slate-300"
            onClick={() => setMobileMenu((v) => !v)}
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenu ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {mobileMenu && (
        <div className="md:hidden border-t border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="px-6 py-4 space-y-3">
            {links.map((l) => (
              <a
                key={l.label}
                href={l.href}
                onClick={() => setMobileMenu(false)}
                className="block text-sm text-gray-700 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-400"
              >
                {l.label}
              </a>
            ))}
            <Link
              to="/contact"
              onClick={() => setMobileMenu(false)}
              className="block text-sm text-gray-700 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-400"
            >
              Contact
            </Link>
            <Link
              to="/signup"
              onClick={() => setMobileMenu(false)}
              className="block text-sm text-gray-700 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-400"
            >
              Register your school
            </Link>
            <Link
              to="/login"
              onClick={() => setMobileMenu(false)}
              className="btn-primary !bg-blue-700 hover:!bg-blue-800 w-full block text-center"
            >
              Sign in
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}