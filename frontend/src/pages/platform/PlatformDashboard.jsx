// src/pages/platform/PlatformDashboard.jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import {
  Building2, Users, AlertTriangle, Clock, CheckCircle2,
  Plus, ArrowRight, Activity, ShieldCheck, TrendingUp,
  CalendarClock, Ban,
} from 'lucide-react';
import { api, extractError } from '../../lib/api';
import StatCard from '../../components/StatCard';

const STATUS_COLORS = {
  active: '#10b981',
  pending: '#f59e0b',
  suspended: '#ef4444',
  expired: '#f97316',
  deactivated: '#6b7280',
};
const STATUS_LABELS = {
  active: 'Active',
  pending: 'Pending',
  suspended: 'Suspended',
  expired: 'Expired',
  deactivated: 'Deactivated',
};

export default function PlatformDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/dashboard/stats')
      .then(({ data }) => setData(data))
      .catch((err) => setError(extractError(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <DashboardSkeleton />;
  if (error) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
        {error}
      </div>
    );
  }

  const pieData = (data.schoolsByStatus || []).map((r) => ({
    name: STATUS_LABELS[r.status] || r.status,
    value: r.count,
    color: STATUS_COLORS[r.status] || '#9ca3af',
  }));

  const totalSchools = data.total_schools || 0;

  return (
    <div className="space-y-8">
      {/* ===================== HEADER ===================== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Platform Overview</h1>
          <p className="text-sm text-gray-500 mt-1">
            {totalSchools} schools registered · {data.active_schools || 0} currently active
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/platform/schools" className="btn-secondary text-sm">
            <Building2 className="w-4 h-4 mr-2" />
            Manage schools
          </Link>
          <Link to="/platform/schools?action=register" className="btn-primary !bg-blue-700 hover:!bg-blue-800 text-sm">
            <Plus className="w-4 h-4 mr-2" />
            Register school
          </Link>
        </div>
      </div>

      {/* ===================== ALERT BANNERS ===================== */}
      {data.overdue > 0 && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-medium text-red-900">{data.overdue} subscription{data.overdue > 1 ? 's' : ''} overdue</div>
            <div className="text-xs text-red-700 mt-0.5">
              These schools will be automatically marked expired. Renew them to restore access.
            </div>
          </div>
          <Link to="/platform/agreements" className="text-xs font-medium text-red-700 hover:underline whitespace-nowrap">
            View →
          </Link>
        </div>
      )}

      {/* ===================== STAT CARDS ===================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Building2} label="Total schools" value={data.total_schools} tone="blue" />
        <StatCard icon={CheckCircle2} label="Active" value={data.active_schools} tone="green" />
        <StatCard icon={Clock} label="Pending" value={data.pending_schools} tone="yellow" />
        <StatCard icon={Users} label="Total users" value={data.total_users} tone="purple" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Ban} label="Suspended" value={data.suspended_schools} tone="red" />
        <StatCard icon={AlertTriangle} label="Expired" value={data.expired_schools} tone="orange" />
        <StatCard icon={CalendarClock} label="Expiring soon" value={data.expiring_soon} tone="yellow" />
        <StatCard icon={ShieldCheck} label="Platform admins" value={data.platform_users} tone="default" />
      </div>

      {/* ===================== CHARTS ROW ===================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie chart — schools by status */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Schools by status</h2>
              <p className="text-xs text-gray-500 mt-0.5">Distribution across the platform</p>
            </div>
            <PieChart className="w-4 h-4 text-gray-400" />
          </div>
          {pieData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-sm text-gray-400">No schools yet</div>
          ) : (
            <div className="flex flex-col lg:flex-row items-center gap-4">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={2}
                    stroke="#fff"
                    strokeWidth={2}
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 min-w-[140px]">
                {pieData.map((s) => (
                  <div key={s.name} className="flex items-center justify-between text-xs gap-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-sm" style={{ background: s.color }} />
                      <span className="text-gray-600">{s.name}</span>
                    </div>
                    <span className="font-semibold text-gray-900 tabular-nums">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bar chart — registrations per month */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Schools registered</h2>
              <p className="text-xs text-gray-500 mt-0.5">Last 12 months</p>
            </div>
            <TrendingUp className="w-4 h-4 text-gray-400" />
          </div>
          {(!data.schoolsByMonth || data.schoolsByMonth.length === 0) ? (
            <div className="h-64 flex items-center justify-center text-sm text-gray-400">No registration data</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.schoolsByMonth} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
                  cursor={{ fill: '#eff6ff' }}
                />
                <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ===================== THREE-COLUMN ROW ===================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent schools */}
        <div className="bg-white rounded-xl border border-gray-200 lg:col-span-2">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">Recently registered</h2>
            <Link to="/platform/schools" className="text-xs text-blue-700 hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {data.recentSchools.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-gray-400">No schools yet</div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {data.recentSchools.map((s) => (
                <li key={s.id}>
                  <Link
                    to={`/platform/schools/${s.id}`}
                    className="px-6 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-gray-900 truncate">{s.name}</div>
                      <div className="text-xs text-gray-500 font-mono mt-0.5">{s.code}</div>
                    </div>
                    <StatusPill status={s.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Expiring soon */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-yellow-500" />
              Expiring soon
            </h2>
          </div>
          {data.expiringSubscriptions.length === 0 ? (
            <div className="px-6 py-8 text-center text-sm text-gray-400">No upcoming expirations</div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {data.expiringSubscriptions.map((s) => (
                <li key={s.id} className="px-6 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-gray-900 truncate">{s.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {new Date(s.expiration_date).toLocaleDateString()}
                      </div>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${
                      s.days_left <= 7 ? 'bg-red-100 text-red-700' :
                      s.days_left <= 30 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {s.days_left}d
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* ===================== ACTIVITY + USERS ===================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent activity */}
        <div className="bg-white rounded-xl border border-gray-200 lg:col-span-2">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600" />
              Recent activity
            </h2>
            <Link to="/platform/activity" className="text-xs text-blue-700 hover:underline">
              View all
            </Link>
          </div>
          {data.recentActivity.length === 0 ? (
            <div className="px-6 py-8 text-center text-sm text-gray-400">No activity yet</div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {data.recentActivity.slice(0, 8).map((a, i) => (
                <li key={i} className="px-6 py-3 flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-gray-800">
                      <span className="font-medium capitalize">{a.action}</span>
                      {a.school_name && <span className="text-gray-500"> · {a.school_name}</span>}
                    </div>
                    {a.details?.reason && (
                      <div className="text-xs text-gray-500 mt-0.5 truncate">{a.details.reason}</div>
                    )}
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap ml-3">
                    {new Date(a.created_at).toLocaleString(undefined, {
                      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                    })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Users by role */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-600" />
              Users by role
            </h2>
          </div>
          {data.usersByRole.length === 0 ? (
            <div className="px-6 py-8 text-center text-sm text-gray-400">No users</div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {data.usersByRole.map((r) => (
                <li key={r.role} className="px-6 py-2.5 flex items-center justify-between">
                  <span className="text-sm text-gray-700 capitalize">
                    {r.role.replace(/_/g, ' ')}
                  </span>
                  <span className="text-sm font-semibold text-gray-900 tabular-nums">{r.count}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusPill({ status }) {
  const map = {
    active: 'bg-green-100 text-green-700',
    pending: 'bg-yellow-100 text-yellow-700',
    suspended: 'bg-red-100 text-red-700',
    expired: 'bg-orange-100 text-orange-700',
    deactivated: 'bg-gray-100 text-gray-700',
  };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${map[status] || 'bg-gray-100 text-gray-700'}`}>
      {status}
    </span>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="h-8 w-64 bg-gray-200 rounded" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => <div key={i} className="h-32 bg-gray-100 rounded-xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-80 bg-gray-100 rounded-xl" />
        <div className="h-80 bg-gray-100 rounded-xl" />
      </div>
    </div>
  );
}