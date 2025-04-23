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
        setTimeout(() => { //this will fix the issue where it's loading forever
          window.location.reload(); //in case the fetch failed it will reload the page every 1.5 second 
        }, 1500); // 1.5 seconds delay
      }
    }
    // else: Still loading, wait for next effect run
  }, [user, loadingExtra, extraInfo, navigate]);

  // Render the loading spinner UI
  return (
    // Use consistent background
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100">
       {/* Use theme color for spinner and consistent size */}
      <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
       {/* Consistent text styling */}
      <p className="mt-4 text-base font-medium text-gray-600">Loading...</p>
    </div>
  );
};

export default LoadingPage;