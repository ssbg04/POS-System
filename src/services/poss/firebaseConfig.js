// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDWaFXfj1J1EZUuD6N0N8mWGvIwEhM0bIs",
  authDomain: "pos-system-22c92.firebaseapp.com",
  projectId: "pos-system-22c92",
  storageBucket: "pos-system-22c92.firebasestorage.app",
  messagingSenderId: "818042704762",
  appId: "1:818042704762:web:f254bf6a73618b4318fcc3",
  measurementId: "G-ER71DCYSSN",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
