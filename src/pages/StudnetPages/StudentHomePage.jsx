import { useNavigate } from "react-router-dom";
// import { useAuth } from "../../contexts/AuthContext";
import { useExtraInfo } from "../../contexts/BackEndContext";

const StudentHomePage = () => {
    // const { user } = useAuth(); //this is used to get the token from the current user to send it to the backend
    const { extraInfo } = useExtraInfo();
    const navigate = useNavigate(); 
    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="bg-white shadow-lg rounded-2xl p-10 w-full max-w-7xl h-[90vh] flex flex-col justify-between">
                <div>
                    <h2 className="text-4xl font-bold text-gray-800 mb-10">Home Page</h2>

                    <div className="space-y-8 text-xl">
                        <h3 className="text-2xl font-semibold text-gray-700">Current Student Info:</h3>
                        <p className="text-gray-700">
                            <span className="font-medium text-gray-900">Name:</span> {extraInfo.name ?? "No Data"}
                        </p>
                        <p className="text-gray-700">
                            <span className="font-medium text-gray-900">Current Progress:</span> {extraInfo.hours.completed ?? "No Data"}
                        </p>
                        <p className="text-gray-700">
                            <span className="font-medium text-gray-900">Last Update of Academic Records:</span> {extraInfo.last_updated ?? "No Data"}
                        </p>
                    </div>
                </div>

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
