import { initializeApp } from "firebase/app";
import { getAuth } from 'firebase/auth';
import { getFirestore } from "firebase/firestore"; // Import Firestore


const firebaseConfig = {
  apiKey: "AIzaSyD2JwoFCJuy9FDmALY4seFGIt5uTfM6EwM",
  authDomain: "irshadi-auth.firebaseapp.com",
  projectId: "irshadi-auth",
  storageBucket: "irshadi-auth.firebasestorage.app",
  messagingSenderId: "418916288228",
  appId: "1:418916288228:web:8e34a3624a573293728ef1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app); // Initialize Firestore
//maybe we can use our own backend here insted of connecting to the firestore ?

export { auth, db }; 