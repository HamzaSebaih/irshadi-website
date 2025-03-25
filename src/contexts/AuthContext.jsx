import { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../firebase';
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';

const AuthContext = createContext(); // any component inside the AuthProvider will have access to this context.

export const useAuth = () => useContext(AuthContext); // This makes it easier to use the context 

export function AuthProvider({ children }) {
  const backendIp = "http://127.0.0.1:5000"; //this the ip domain for the backend
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const token = await firebaseUser.getIdToken(); // get the Firebase auth token
          const response = await fetch(`${backendIp}/login`, {  // fetch additional user data from the backend
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

          // append respObj to the Firebase user object and update state
          setUser({ ...firebaseUser, ...respObj });
        } catch (error) {
          console.error("Error fetching user data:", error);
          // if fetch fails insted of whole failure it will only set the user to the Firebase auth object
          setUser(firebaseUser);
        }
      } else {
        // here if he logged out or not authenticated
        setUser(null);
      }
      setLoading(false);
    });

    // cleanup subscription on unmount
    return unsubscribe;
  }, []);

  const signup = (email, password) => {
    return createUserWithEmailAndPassword(auth, email, password);
  };

  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const logout = () => {
    return signOut(auth);
  };

  const value = {
    user,
    signup,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}