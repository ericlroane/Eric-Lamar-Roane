import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// The firebaseConfig object is used to initialize the Firebase App.
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "studio-2047789106-e4e02.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "studio-2047789106-e4e02",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "studio-2047789106-e4e02.firebasestorage.app",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "187277438465",
  appId: process.env.FIREBASE_APP_ID || "1:187277438465:web:458bb8d7bd4b8d52191a00"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
