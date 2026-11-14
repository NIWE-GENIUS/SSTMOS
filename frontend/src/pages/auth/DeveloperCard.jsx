// src/pages/auth/DeveloperCard.jsx
export default function DeveloperCard({ className = '' }) {
  return (
    <div className={`bg-gradient-to-br from-blue-50 to-blue-100 p-8 overflow-y-auto ${className}`}>
      <div className="inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold text-blue-800 bg-white rounded-full mb-4 uppercase tracking-wide shadow-sm">
        <span>👨‍💻</span>
        <span>Lead Developer &amp; Service Manager</span>
      </div>

      <h3 className="text-lg font-bold text-gray-900 leading-tight mb-1">
        HABUMUGISHA YASSON
      </h3>
      <p className="text-sm text-blue-800 font-medium mb-4">
        Service Manager · Next Creatures Group Ltd
      </p>

      <p className="text-sm text-gray-700 leading-relaxed mb-5">
        Architect and lead developer of SSTMOS. Reach out directly for onboarding, custom work,
        or any technical question about the platform.
      </p>

      <div className="space-y-2">
        <a
          href="tel:0791798333"
          className="flex items-center gap-3 p-3 rounded-lg bg-white hover:bg-blue-50 transition-colors group shadow-sm"
        >
          <div className="w-9 h-9 rounded-lg bg-blue-700 text-white flex items-center justify-center shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </div>
          <div>
            <div className="text-[10px] text-gray-500 uppercase tracking-wide font-semibold">Call</div>
            <div className="text-sm font-bold text-gray-900 group-hover:text-blue-700 mt-0.5">0791798333</div>
          </div>
        </a>

        <a
          href="mailto:habumugishayasson5@gmail.com"
          className="flex items-center gap-3 p-3 rounded-lg bg-white hover:bg-blue-50 transition-colors group shadow-sm"
        >
          <div className="w-9 h-9 rounded-lg bg-blue-700 text-white flex items-center justify-center shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="min-w-0">
            <div className="text-[10px] text-gray-500 uppercase tracking-wide font-semibold">Email</div>
            <div className="text-sm font-bold text-gray-900 group-hover:text-blue-700 mt-0.5 break-all">
              habumugishayasson5@gmail.com
            </div>
          </div>
        </a>
      </div>

      <p className="text-[11px] text-gray-500 mt-4 leading-relaxed">
        For urgent school onboarding, please call directly. Email is typically answered within 24 hours on business days.
      </p>
    </div>
  );
}