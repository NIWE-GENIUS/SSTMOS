// src/pages/dos/DosDashboard.jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Circle, ArrowRight } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

export default function DosDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    hasYear: false, hasClasses: false, hasFormat: false,
    hasTrainers: false, hasModules: false, hasAssignments: false, hasRooms: false
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/academic/academic-years').catch(() => ({ data: { data: [] } })),
      api.get('/academic/classes').catch(() => ({ data: { data: [] } })),
      api.get('/timetable-config/formats/active').catch(() => ({ data: null })),
      api.get('/trainers').catch(() => ({ data: { data: [] } })),
      api.get('/modules').catch(() => ({ data: { data: [] } })),
      api.get('/modules/assignments').catch(() => ({ data: { data: [] } })),
      api.get('/rooms/rooms').catch(() => ({ data: { data: [] } })),
    ]).then(([y, c, f, t, m, a, r]) => {
      setStats({
        hasYear: (y.data.data || []).some(yr => yr.is_active),
        hasClasses: (c.data.data || []).length > 0,
        hasFormat: !!f.data,
        hasTrainers: (t.data.data || []).length > 0,
        hasModules: (m.data.data || []).length > 0,
        hasAssignments: (a.data.data || []).length > 0,
        hasRooms: (r.data.data || []).length > 0,
      });
    }).finally(() => setLoading(false));
  }, []);

  const checklist = [
    { key: 'hasYear', label: 'Active Academic Year', desc: 'Set current year in Academic Structure', to: '/dos/academic' },
    { key: 'hasClasses', label: 'Classes Registered', desc: 'Create classes like L4 SOD', to: '/dos/academic' },
    { key: 'hasFormat', label: 'Timetable Format', desc: 'Define periods and breaks', to: '/dos/timetable-config' },
    { key: 'hasRooms', label: 'Rooms & Labs', desc: 'Add classrooms and practical labs', to: '/dos/rooms' },
    { key: 'hasTrainers', label: 'Trainers', desc: 'Register teaching staff', to: '/dos/trainers' },
    { key: 'hasModules', label: 'Modules', desc: 'Register subjects to be taught', to: '/dos/modules' },
    { key: 'hasAssignments', label: 'Teaching Assignments', desc: 'Link Trainer + Module + Class', to: '/dos/modules' },
  ];

  const completed = checklist.filter(c => stats[c.key]).length;
  const progress = Math.round((completed / checklist.length) * 100);

  const quickLinks = [
    { to: '/dos/academic', title: 'Academic Structure', desc: 'Years, terms, classes, groups' },
    { to: '/dos/timetable-config', title: 'Timetable Format', desc: 'Configure periods, sessions and breaks' },
    { to: '/dos/rooms', title: 'Rooms & Labs', desc: 'Manage physical facilities' },
    { to: '/dos/trainers', title: 'Trainers', desc: 'Register staff and set availability' },
    { to: '/dos/modules', title: 'Modules', desc: 'Catalog modules and assignments' },
    { to: '/dos/generate', title: 'Generate Timetable', desc: 'Run the scheduling engine' },
    { to: '/dos/timetable', title: 'Timetables', desc: 'Review, approve and publish versions' },
    { to: '/dos/reports', title: 'Reports', desc: 'Workload, coverage and utilization' },
    { to: '/dos/users', title: 'School Users', desc: 'Manage accounts and roles' },
  ];

  if (loading) return <div className="p-8 text-gray-500">Loading dashboard…</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome, {user.fullName}</h1>
        <p className="text-sm text-gray-500 mt-1">Director of Studies Workspace</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Setup Checklist */}
        <div className="lg:col-span-1 card bg-white border-blue-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Setup Progress</h2>
            <span className={`text-2xl font-bold ${progress === 100 ? 'text-green-600' : 'text-blue-600'}`}>{progress}%</span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
            <div className={`h-2 rounded-full transition-all ${progress === 100 ? 'bg-green-500' : 'bg-blue-600'}`} style={{ width: `${progress}%` }}></div>
          </div>

          <div className="space-y-3">
            {checklist.map((item) => {
              const isDone = stats[item.key];
              return (
                <Link key={item.key} to={item.to} className="flex items-start gap-3 group">
                  <div className="mt-0.5 shrink-0">
                    {isDone ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                      <Circle className="w-5 h-5 text-gray-300 group-hover:text-blue-400" />
                    )}
                  </div>
                  <div>
                    <div className={`text-sm font-medium ${isDone ? 'text-gray-900 line-through decoration-gray-300' : 'text-gray-700 group-hover:text-blue-600'}`}>
                      {item.label}
                    </div>
                    <div className="text-xs text-gray-500">{item.desc}</div>
                  </div>
                </Link>
              );
            })}
          </div>

          {progress === 100 && (
            <div className="mt-6 p-3 bg-green-50 border border-green-200 rounded-lg text-center">
              <p className="text-sm text-green-800 font-medium mb-2">You are ready to generate!</p>
              <Link to="/dos/generate" className="btn-primary !bg-green-600 hover:!bg-green-700 w-full">
                Go to Generator <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
          )}
        </div>

        {/* Quick Links */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {quickLinks.map((c) => (
            <Link key={c.to} to={c.to} className="card bg-white hover:shadow-md hover:border-blue-300 transition-all border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center justify-between">
                {c.title}
                <ArrowRight className="w-4 h-4 text-gray-300" />
              </h3>
              <p className="text-xs text-gray-500 mt-1">{c.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}