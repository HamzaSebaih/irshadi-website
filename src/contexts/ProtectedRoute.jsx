import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function UserRoute({ children }) { //this is general user Route In case if I need it I will add it here
  //however currently there is no use to it
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" />;
  }

  return children;
}


export function AdminRoute({ children }) { //this for admin route
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (user.role !== 'admin') {
    return <Navigate to="/unauthorized" />;
  }

  return children;
}


export function StudentRoute({ children }) { //this for student route
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (user.role !== 'student') {
    return <Navigate to="/unauthorized" />;
  }


  
  return children;
}
