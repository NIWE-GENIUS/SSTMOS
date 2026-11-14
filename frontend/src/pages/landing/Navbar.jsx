// src/pages/landing/Navbar.jsx
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
  const [mobileMenu, setMobileMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
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
    <header className={`sticky top-0 z-40 bg-white/95 backdrop-blur transition-shadow ${scrolled ? 'shadow-sm' : 'border-b border-gray-100'}`}>
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-700 flex items-center justify-center text-white font-bold text-sm">S</div>
          <span className="text-xl font-bold text-blue-800">SSTMOS</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <a key={l.label} href={l.href} className="text-sm text-gray-600 hover:text-blue-700 font-medium transition-colors">
              {l.label}
            </a>
          ))}
          <Link to="/contact" className="text-sm text-gray-600 hover:text-blue-700 font-medium transition-colors">
            Contact
          </Link>
          <Link to="/login" className="btn-primary !bg-blue-700 hover:!bg-blue-800">
            Sign in
          </Link>
        </nav>

        <button
          className="md:hidden text-gray-700"
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

      {mobileMenu && (
        <div className="md:hidden border-t border-gray-100 bg-white">
          <div className="px-6 py-4 space-y-3">
            {links.map((l) => (
              <a key={l.label} href={l.href} onClick={() => setMobileMenu(false)} className="block text-sm text-gray-700 hover:text-blue-700">
                {l.label}
              </a>
            ))}
            <Link to="/contact" onClick={() => setMobileMenu(false)} className="block text-sm text-gray-700 hover:text-blue-700">
              Contact
            </Link>
            <Link to="/login" onClick={() => setMobileMenu(false)} className="btn-primary !bg-blue-700 hover:!bg-blue-800 w-full block text-center">
              Sign in
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}