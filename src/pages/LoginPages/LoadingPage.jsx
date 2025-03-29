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
    console.log("test2")
    if (!user) {
      navigate("/login");
    } else if (!loadingExtra) {
      // Once extra info is loaded, navigate based on role
      if (extraInfo?.role === "admin") {
        navigate('/adminHomePage');
      } else if(extraInfo?.role==="student") {
        navigate('/studentHomePage');
      }
    }
  }, [user, loadingExtra, extraInfo, navigate]);


  return   <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
  <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
  <p className="mt-4 text-lg font-semibold text-gray-700">Loading...</p>
  </div>;;
};

export default LoadingPage;