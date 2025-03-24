import { useNavigate } from "react-router-dom"; // ✅ Correct import
import { useAuth } from "../../contexts/AuthContext";
import { useEffect, useState } from "react";

const StudentHomePage = () => {
    const backendIp = "http://127.0.0.1:5000"; //this the ip domain for the backend
    const { user } = useAuth(); //this is used to get the token from the current user to send it to the backend
    const [userData, setUserData] = useState(null);
    const token = user.accessToken //we get the token here 

    useEffect(() => {
        if (!token) return; // Prevent fetching if token is missing
    
        const fetchData = async () => {
          try {
            const response = await fetch(`${backendIp}/login`, {
              method: "POST",
              headers: {
                "Authorization": `${token}`,
                "Content-Type": "application/json",
              },
            });
    
            if (!response.ok) {
              throw new Error(`HTTP error! Status: ${response.status}`);
            }
    
            const respObj = await response.json();
            setUserData(respObj);
          } catch (error) {
            console.error("Error fetching user data:", error);
          }
        };
    
        fetchData();
      }, [user]);

    const navigate = useNavigate(); // ✅ Correct way to use navigation

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="bg-white shadow-lg rounded-2xl p-10 w-full max-w-7xl h-[90vh] flex flex-col justify-between">
                <div>
                    <h2 className="text-4xl font-bold text-gray-800 mb-10">Home Page</h2>

                    <div className="space-y-8 text-xl">
                        <h3 className="text-2xl font-semibold text-gray-700">Current Student Info:</h3>
                        <p className="text-gray-700">
                            <span className="font-medium text-gray-900">Name:</span> {userData?.name}
                        </p>
                        <p className="text-gray-700">
                            <span className="font-medium text-gray-900">Current Progress:</span> {userData?.hours.total}
                        </p>
                        <p className="text-gray-700">
                            <span className="font-medium text-gray-900">Last Update of Academic Records:</span> {userData?.lastUpdate}
                        </p>
                    </div>
                </div>

                {/* ✅ Correct button navigation */}
                <div className="flex justify-center mt-10">
                    <button 
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-8 px-28 text-xl rounded-lg transition" 
                        onClick={() => navigate("/StudentImportRecordPage")}
                    >
                        Import Academic Records
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StudentHomePage;
