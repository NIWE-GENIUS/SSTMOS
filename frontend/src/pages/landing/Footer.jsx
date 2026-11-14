// src/pages/landing/Footer.jsx
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-blue-700 flex items-center justify-center text-white font-bold text-sm">S</div>
              <span className="text-xl font-bold text-blue-800">SSTMOS</span>
            </Link>
            <p className="text-sm text-gray-500 leading-relaxed mb-4">
              Smart School Timetable Management &amp; Optimization System. Built for technical and vocational schools.
            </p>
            <div className="text-xs text-gray-500">
              <div className="mb-1">Designed &amp; developed by</div>
              <div className="font-bold text-gray-900 text-sm">HABUMUGISHA YASSON</div>
              <div>Service Manager · Next Creatures Group Ltd</div>
              <div className="mt-1.5 space-y-0.5">
                <div><a href="tel:0791798333" className="text-blue-700 hover:underline">0791798333</a></div>
                <div><a href="mailto:habumugishayasson5@gmail.com" className="text-blue-700 hover:underline break-all">habumugishayasson5@gmail.com</a></div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Product</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><a href="/#features" className="hover:text-blue-700">Features</a></li>
              <li><a href="/#roles" className="hover:text-blue-700">Roles</a></li>
              <li><a href="/#how-it-works" className="hover:text-blue-700">How it works</a></li>
              <li><a href="/#pricing" className="hover:text-blue-700">Pricing</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Resources</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><a href="/#faq" className="hover:text-blue-700">FAQ</a></li>
              <li><Link to="/contact" className="hover:text-blue-700">Contact</Link></li>
              <li><Link to="/login" className="hover:text-blue-700">Sign in</Link></li>
              <li><a href="mailto:habumugishayasson5@gmail.com" className="hover:text-blue-700">Support</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Legal</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><Link to="/privacy" className="hover:text-blue-700">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-blue-700">Terms of Service</Link></li>
              <li><Link to="/data-protection" className="hover:text-blue-700">Data Protection</Link></li>
            </ul>
          </div>
        </div>

        {/* Developer advert strip */}
        <div className="border-t border-gray-100 pt-6 mb-6">
          <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 text-sm">
            <span className="text-gray-700">Built with care by </span>
            <span className="font-bold text-gray-900">HABUMUGISHA YASSON</span>
            <span className="text-gray-700"> · Service Manager at </span>
            <span className="font-semibold text-blue-800">Next Creatures Group Ltd</span>
            <span className="text-gray-700"> · </span>
            <a href="tel:0791798333" className="text-blue-700 hover:underline font-medium">0791798333</a>
            <span className="text-gray-700"> · </span>
            <a href="mailto:habumugishayasson5@gmail.com" className="text-blue-700 hover:underline font-medium break-all">habumugishayasson5@gmail.com</a>
          </div>
        </div>

        <div className="pt-6 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-gray-500">
          <div>© {new Date().getFullYear()} SSTMOS. All rights reserved.</div>
          <div>Powered by Next Creatures Group Ltd</div>
        </div>
      </div>
    </footer>
  );
}