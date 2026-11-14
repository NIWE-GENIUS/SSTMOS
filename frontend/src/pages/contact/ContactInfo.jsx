// src/pages/contact/ContactInfo.jsx
const DEVELOPER = {
  name: 'HABUMUGISHA YASSON',
  phone: '0791798333',
  email: 'habumugishayasson5@gmail.com',
};

export default function ContactInfo() {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 bg-blue-50 px-3 py-1 rounded-full w-fit mb-4 uppercase tracking-wide">
          <span>👨‍💻</span><span>Lead Developer</span>
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-1">{DEVELOPER.name}</h3>
        <p className="text-sm text-gray-500 mb-5">Full-stack architect & system developer</p>

        <div className="space-y-3">
          <a
            href={`tel:${DEVELOPER.phone}`}
            className="flex items-start gap-3 p-3 rounded-lg hover:bg-blue-50 transition-colors group"
          >
            <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wide font-medium">Phone</div>
              <div className="text-sm font-medium text-gray-900 group-hover:text-blue-700 mt-0.5">{DEVELOPER.phone}</div>
            </div>
          </a>

          <a
            href={`mailto:${DEVELOPER.email}`}
            className="flex items-start gap-3 p-3 rounded-lg hover:bg-blue-50 transition-colors group"
          >
            <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="min-w-0">
              <div className="text-xs text-gray-500 uppercase tracking-wide font-medium">Email</div>
              <div className="text-sm font-medium text-gray-900 group-hover:text-blue-700 mt-0.5 break-all">{DEVELOPER.email}</div>
            </div>
          </a>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-3">Response time</h3>
        <p className="text-sm text-gray-600 leading-relaxed">
          We typically respond within <strong className="text-gray-900">24 hours</strong> on business days.
          For urgent school onboarding requests, please call directly.
        </p>
      </div>

      <div className="bg-blue-50 rounded-xl border border-blue-100 p-6">
        <h3 className="text-base font-semibold text-blue-900 mb-2">Already a user?</h3>
        <p className="text-sm text-blue-800 leading-relaxed mb-3">
          If your school is already onboarded, sign in to access your dashboard.
        </p>
        <a
          href="/login"
          className="inline-flex items-center justify-center rounded-md px-4 py-2 bg-blue-700 text-white text-sm font-medium hover:bg-blue-800 transition-colors"
        >
          Sign in
        </a>
      </div>
    </div>
  );
}