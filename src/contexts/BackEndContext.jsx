// ./contexts/BackEndContext.jsx

import { createContext, useContext, useState, useEffect, useMemo } from "react"; // Import useMemo
import { useAuth } from "./AuthContext";

const backendIp = "http://127.0.0.1:5000";
const ExtraInfoContext = createContext();

export const useExtraInfo = () => useContext(ExtraInfoContext);

export const ExtraInfoProvider = ({ children }) => {
    const { user } = useAuth();
    const [extraInfo, setExtraInfo] = useState(null);
    const [loadingExtra, setLoadingExtra] = useState(true);
    const [updatedState, setUpdatedState] = useState(false);

    useEffect(() => {
        // If there's no authenticated user then clear the extra info.
        if (!user) {
            setExtraInfo(null); //
            setLoadingExtra(false); //
            return; //
        }

        setLoadingExtra(true); // Set loading true before fetch

        const fetchExtraInfo = async () => {
            try {
                const token = await user.getIdToken(); //
                const response = await fetch(`${backendIp}/login`, { //
                    method: "POST", //
                    headers: { //
                        "Authorization": `${token}`, //
                        "Content-Type": "application/json", //
                    },
                });
                if (!response.ok) { //
                    throw new Error(`HTTP error! Status: ${response.status}`); //
                }
                const data = await response.json(); //
                setExtraInfo(data); //
            } catch (error) {
                console.error("Error fetching extra info:", error); //
                setExtraInfo(null); //
            } finally {
                setUpdatedState(false); //
                setLoadingExtra(false); //
            }
        };

        fetchExtraInfo(); //
    }, [user, updatedState]); //

    // Memoize the context value
    const value = useMemo(() => ({
        extraInfo,
        loadingExtra,
        setUpdatedState
    }), [extraInfo, loadingExtra]); // Dependencies only need to be the state values

    return (
        // Pass the memoized value object
        <ExtraInfoContext.Provider value={value}>
            {/* Conditionally render based on loading state */}
            {loadingExtra ? ( //
                <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="mt-4 text-lg font-semibold text-gray-700">Loading...</p>
                </div> //
            ) : (
                children
            )}
        </ExtraInfoContext.Provider>
    );
};

export default ExtraInfoContext;