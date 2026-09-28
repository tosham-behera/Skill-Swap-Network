import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './useAuth.js';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="auth-page">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <p className="auth-sub">Loading…</p>
        </div>
        <span className="sr-only">Loading your account</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}
