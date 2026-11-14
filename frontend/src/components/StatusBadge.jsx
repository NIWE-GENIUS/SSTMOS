// src/components/StatusBadge.jsx
const COLORS = {
  active: 'badge-green',
  pending: 'badge-yellow',
  suspended: 'badge-red',
  expired: 'badge-red',
  deactivated: 'badge-gray',
};

export default function StatusBadge({ status }) {
  return <span className={COLORS[status] || 'badge-gray'}>{status}</span>;
}