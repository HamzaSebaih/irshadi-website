import { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase'; // Import Firestore database
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore'; // Add setDoc

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) { 
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch the user role from Firestore
        const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
        const role = userDoc.exists() ? userDoc.data().role : "user"; // Default role
        
        // Set user state with role
        setUser({ ...firebaseUser, role });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signup = async (email, password, role = "user") => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Save the role to Firestore
    await setDoc(doc(db, "users", user.uid), { role });

    setUser({ ...user, role });
  };

  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const logout = () => {
    return signOut(auth).then(() => setUser(null));
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
