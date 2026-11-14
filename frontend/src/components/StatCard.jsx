// src/components/StatCard.jsx
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function StatCard({
  icon: Icon,
  label,
  value,
  tone = 'default',
  trend,
  trendLabel,
  href,
}) {
  const tones = {
    default: { ring: 'ring-gray-200', bg: 'bg-gray-50', text: 'text-gray-700' },
    blue:    { ring: 'ring-blue-200',  bg: 'bg-blue-50',  text: 'text-blue-700' },
    green:   { ring: 'ring-green-200', bg: 'bg-green-50', text: 'text-green-700' },
    yellow:  { ring: 'ring-yellow-200', bg: 'bg-yellow-50', text: 'text-yellow-700' },
    red:     { ring: 'ring-red-200',   bg: 'bg-red-50',   text: 'text-red-700' },
    orange:  { ring: 'ring-orange-200', bg: 'bg-orange-50', text: 'text-orange-700' },
    purple:  { ring: 'ring-purple-200', bg: 'bg-purple-50', text: 'text-purple-700' },
  };
  const t = tones[tone] || tones.default;

  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow ${href ? 'cursor-pointer' : ''}`}>
      <div className="flex items-start justify-between">
        <div className={`w-11 h-11 rounded-lg ${t.bg} ${t.text} flex items-center justify-center ring-1 ${t.ring}`}>
          <Icon className="w-5 h-5" strokeWidth={2} />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-medium ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {trend >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            <span>{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
      <div className="mt-4">
        <div className="text-2xl font-bold text-gray-900">{value ?? '—'}</div>
        <div className="text-xs text-gray-500 mt-1">{label}</div>
        {trendLabel && <div className="text-[10px] text-gray-400 mt-0.5">{trendLabel}</div>}
      </div>
    </div>
  );
}