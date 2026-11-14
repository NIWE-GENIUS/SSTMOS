// src/routes/RoleRoute.jsx
import { Navigate } from 'react-router-dom';
import { useAuth, homeForRole } from '../context/AuthContext';

export default function RoleRoute({ roles, children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;

  const userRoles = user.roles || [];
  const ok = roles.some((r) => userRoles.includes(r));
  if (!ok) return <Navigate to={homeForRole(userRoles)} replace />;

  return children;
}