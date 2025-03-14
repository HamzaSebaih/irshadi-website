import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function AdminRoute({ children }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" />;
  }

  // if (user.role !== 'admin') {
  //   return <Navigate to="/unauthorized" />;
  // }

  return children;
}

export function UserRoute({ children }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" />;
  }

  // if (user.role !== 'user') {
  //   return <Navigate to="/unauthorized" />;
  // }

  return children;
}
