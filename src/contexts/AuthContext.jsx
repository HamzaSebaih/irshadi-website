import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { auth } from '../firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile
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

  const googleLogin = () => {
    return signInWithPopup(auth, new GoogleAuthProvider());
  };

  const logout = () => {
    return signOut(auth);
  };

  const sendVerificationEmail = (user) => {
    return sendEmailVerification(user);
  };

  const resetPassword = (email) => {
    return sendPasswordResetEmail(auth, email);
  };

  const storeName = (user,name) => {
    return updateProfile(user, {displayName: name});
  };





  const value = useMemo(() => ({
    user,
    signup,
    login,
    googleLogin,
    logout,
    sendVerificationEmail,
    resetPassword,
    storeName
  }), [user]);



  return (
    <AuthContext.Provider value={value}>
      {/* Only render children when Firebase auth state is determined */}
      {!loading && children}
    </AuthContext.Provider>
  );
}