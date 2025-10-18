// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA1_3S5h0fqAFlBNnvzdfcpQgMmErICTbY",
  authDomain: "morningstar-d8bd5.firebaseapp.com",
  projectId: "morningstar-d8bd5",
  storageBucket: "morningstar-d8bd5.firebasestorage.app",
  messagingSenderId: "723179600997",
  appId: "1:723179600997:web:d9c9c6fa515ae6df63da8c",
  measurementId: "G-36YQDXV1QF",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics only on the client-side (Next.js / SSR safe)
export const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;

// Export Firestore instance for database usage
export const db = getFirestore(app);
