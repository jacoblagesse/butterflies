// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyANWdapj-hDJzO8F7tYv97DecLD6ytY4eE",
  authDomain: "butterfly-memorial.firebaseapp.com",
  projectId: "butterfly-memorial",
  storageBucket: "butterfly-memorial.firebasestorage.app",
  messagingSenderId: "235160475346",
  appId: "1:235160475346:web:3f1dd3b2c206099e38bf0b",
  measurementId: "G-K08Z9QFM2H"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const db = getFirestore(app)
