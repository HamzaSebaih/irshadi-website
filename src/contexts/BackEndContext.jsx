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
      setExtraInfo(null); 
      setLoadingExtra(false); 
      return; 
    }

    setLoadingExtra(true); // Set loading true before fetch

    const fetchExtraInfo = async () => {
      try {
        const token = await user.getIdToken(); 
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
        const data = await response.json(); 
        setExtraInfo(data); 
      } catch (error) {
        console.error("Error fetching extra info:", error); 
        setExtraInfo(null); 
      } finally {
        setUpdatedState(false); 
        setLoadingExtra(false); 
      }
    };

    fetchExtraInfo(); 
  }, [user, updatedState]); 

  // memoize the context value
  const value = useMemo(() => ({
    extraInfo,
    loadingExtra,
    setUpdatedState
  }), [extraInfo, loadingExtra]); 

  return (
    <ExtraInfoContext.Provider value={value}>
      {/* conditionally render based on loading state */}
      {loadingExtra ? ( //
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
          <p className="mt-4 text-base font-medium text-gray-600">Loading...</p>
        </div>
      ) : (
        children
      )}
    </ExtraInfoContext.Provider>
  );
};

export default ExtraInfoContext;