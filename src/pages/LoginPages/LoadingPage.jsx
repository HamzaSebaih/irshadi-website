import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
//this page is used to load the user extra info before redirecting him to the home page
const LoadingPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    if (user?.rule === "admin") {  //if he is an admin take him to admin home page
        navigate('/adminHomePage');
    }
    else if(user){ //if he is not an admin then most likely or surely he is a student or future admin
        //then take him to student home page
        navigate('/studentHomePage')
    }
    else{ //in case if someone tried to go to student home page if not logged in
         navigate("/login")
    }


  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"> 
            {/* this tailwindcss line of code will set animited loading within the page */}
        </div>
        <p className="mt-4 text-lg font-semibold text-gray-700">Loading...</p>
    </div>



  );
};

export default LoadingPage;