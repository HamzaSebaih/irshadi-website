import { createContext, useContext, useState, useEffect, useMemo } from 'react'; 
import { auth } from '../firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); 
  const [loading, setLoading] = useState(true); 

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => { 
      setUser(user); 
      setLoading(false); 
    });
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


  const value = useMemo(() => ({
    user,
    signup,
    login,
    logout
  }), [user]);



  return (
    <AuthContext.Provider value={value}>
      {/* Only render children when Firebase auth state is determined */}
      {!loading && children}
    </AuthContext.Provider>
  );
}