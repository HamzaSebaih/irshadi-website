import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useExtraInfo } from './BackEndContext';

export function UserRoute({ children }) { //this is general user Route In case if I need it I will add it here
  //however currently there is no use to it
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" />;
  }

  return children;
}


export function AdminRoute({ children }) { //this for admin route
  const { extraInfo } = useExtraInfo();
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (extraInfo.role !== 'admin') {
    return <Navigate to="/unauthorized" />;
  }

  return children;
}


export function StudentRoute({ children }) { //this for student route
  const { user } = useAuth();
  const { extraInfo } = useExtraInfo();

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (extraInfo.role !== 'student') {
    return <Navigate to="/unauthorized" />;
  }


  
  return children;
}
