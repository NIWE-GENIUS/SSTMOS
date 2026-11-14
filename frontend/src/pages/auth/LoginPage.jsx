// src/pages/auth/LoginPage.jsx
import { Navigate } from 'react-router-dom';
import { useAuth, homeForRole } from '../../context/AuthContext';
import BrandAside from './BrandAside';
import InfoAside from './InfoAside';
import DeveloperCard from './DeveloperCard';
import LoginForm from './LoginForm';

export default function LoginPage() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to={homeForRole(user.roles)} replace />;

  return (
    <div className="min-h-screen bg-gray-50 grid grid-cols-1 lg:grid-cols-12">
      {/* LEFT ASIDE — brand, top to bottom */}
      <BrandAside className="lg:col-span-3 hidden lg:flex" />

      {/* MIDDLE — two asides stacked vertically (InfoAside + DeveloperCard) */}
      <aside className="lg:col-span-4 hidden lg:flex flex-col border-r border-gray-200">
        <InfoAside className="flex-1" />
        <DeveloperCard className="flex-1 border-t border-gray-200" />
      </aside>

      {/* RIGHT — login form */}
      <main className="lg:col-span-5 flex items-center justify-center p-6 sm:p-12">
        <LoginForm />
      </main>
    </div>
  );
}