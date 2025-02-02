import { initializeApp } from "firebase/app";
import { getAuth } from 'firebase/auth';


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
export const auth = getAuth(app);