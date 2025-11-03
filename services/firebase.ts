import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// The firebaseConfig object is used to initialize the Firebase App.
const firebaseConfig = {
  apiKey: "AIzaSyBvhFciifKivZKhbJWWSfH700tNG97Rp04",
  authDomain: "studio-2047789106-e4e02.firebaseapp.com",
  projectId: "studio-2047789106-e4e02",
  storageBucket: "studio-2047789106-e4e02.firebasestorage.app",
  messagingSenderId: "187277438465",
  appId: "1:187277438465:web:458bb8d7bd4b8d52191a00"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
