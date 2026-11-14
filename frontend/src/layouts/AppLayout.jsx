// src/layouts/AppLayout.jsx
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_BY_ROLE = {
  platform_admin: [
    { to: '/platform', label: 'Dashboard', end: true },
    { to: '/platform/schools', label: 'Schools' },
    { to: '/platform/agreements', label: 'Agreements' },
    { to: '/platform/activity', label: 'Activity' },
  ],
  dos: [
    { to: '/dos', label: 'Dashboard', end: true },
    { to: '/dos/academic', label: 'Academic' },
    { to: '/dos/timetable-config', label: 'Timetable Config' },
    { to: '/dos/trainers', label: 'Trainers' },
    { to: '/dos/modules', label: 'Modules' },
    { to: '/dos/rooms', label: 'Rooms' },
    { to: '/dos/generate', label: 'Generate' },
    { to: '/dos/timetable', label: 'Timetable' },
    { to: '/dos/reports', label: 'Reports' },
    { to: '/dos/users', label: 'Users' },
  ],
  head_teacher: [
    { to: '/ht', label: 'Dashboard', end: true },
    { to: '/ht/timetable', label: 'Timetable' },
    { to: '/ht/reports', label: 'Reports' },
  ],
  trainer: [
    { to: '/trainer', label: 'Dashboard', end: true },
    { to: '/trainer/timetable', label: 'My Timetable' },
  ],
  student: [
    { to: '/student', label: 'My Timetable', end: true },
  ],
};

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const primaryRole = (user?.roles || [])[0] || 'dos';
  const navItems = NAV_BY_ROLE[primaryRole] || [];
  const roleLabel = primaryRole.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  async function handleLogout() {
    await logout();
    navigate('/', { replace: true });
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="px-6 py-5 border-b border-gray-200">
          <Link to="/" className="text-xl font-bold text-brand-700">SSTMOS</Link>
          <div className="text-xs text-gray-500 mt-1">{roleLabel}</div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-md text-sm font-medium ${
                  isActive
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-gray-200">
          <div className="text-sm font-medium text-gray-800 truncate">{user?.fullName}</div>
          <div className="text-xs text-gray-500 truncate mb-3">{user?.email}</div>
          <button onClick={handleLogout} className="btn-secondary w-full">Sign out</button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}