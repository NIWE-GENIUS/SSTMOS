// src/layouts/AuthLayout.jsx
export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 to-gray-100 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-brand-700">SSTMOS</h1>
          <p className="text-sm text-gray-500 mt-1">Smart School Timetable Management</p>
        </div>
        {children}
      </div>
    </div>
  );
}