// ./pages/LoginPages/LoadingPage.jsx

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useExtraInfo } from '../../contexts/BackEndContext';

const LoadingPage = () => {
  const { extraInfo, loadingExtra } = useExtraInfo();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Handle navigation logic in useEffect
  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    if (!loadingExtra) {
      if (extraInfo?.role === "admin") {
        navigate('/adminHomePage');
      } else if (extraInfo?.role === "student") {
        navigate('/studentHomePage');
      } else {
        navigate('/unauthorized');
      }
    }
    // else: Still loading, wait for next effect run
  }, [user, loadingExtra, extraInfo, navigate]);

  // Render the loading spinner UI
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-4 text-lg font-semibold text-gray-700">Loading...</p>
    </div>
  );
};

export default LoadingPage;