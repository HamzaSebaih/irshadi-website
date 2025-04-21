import React from 'react';
import { useNavigate } from 'react-router-dom';
import {useAuth} from "../../contexts/AuthContext";
import { ArrowLeft } from 'lucide-react';

export default function Unverified() {
  const navigate = useNavigate();
  const user = useAuth();
  const {logout} = useAuth();
  logout(user)


  const handleReturn = async () => {
         navigate('/');  
  };

  // Handle browser back button
  React.useEffect(() => {
    const handlePopState = async () => {
      navigate('/');
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [user, navigate]);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-white text-center px-4">
      <button
        onClick={handleReturn}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-8"
      >
        <ArrowLeft size={24} />
        <span className="text-lg font-medium">Go back</span>
      </button>

      <h1 className="text-2xl font-semibold text-gray-800">
        Please verify your email address
      </h1>
    </div>
  );
}
