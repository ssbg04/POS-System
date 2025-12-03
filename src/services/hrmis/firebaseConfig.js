// // firebaseConfig.js
// import { initializeApp } from "firebase/app";
// import { getFirestore } from "firebase/firestore";
// import { getDatabase } from "firebase/database";
// import { getAuth } from "firebase/auth";
// import { getStorage } from "firebase/storage";

// // Firebase config from your constants
// const firebaseConfig = {
//   apiKey: "AIzaSyCkd-grdHPEeAUJ_o7WfqA6o22RAM0aTQY",
//   authDomain: "hrmis-29ebe.firebaseapp.com",
//   projectId: "hrmis-29ebe",
//   storageBucket: "hrmis-29ebe.firebasestorage.app",
//   messagingSenderId: "1059582715714",
//   appId: "1:1059582715714:web:7021acbee4d3ad055a8adb",
//   measurementId: "G-JPB2MW08N1",
// };

// // Initialize app
// const app = initializeApp(firebaseConfig);

// // Access services
// export const db = getFirestore(app);
// export const rtdb = getDatabase(app);
// export const auth = getAuth(app);
// export const storage = getStorage(app);

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCkd-grdHPEeAUJ_o7WfqA6o2ZRAMOaTQY",
  authDomain: "hrmis-29ebe.firebaseapp.com",
  projectId: "hrmis-29ebe",
  storageBucket: "hrmis-29ebe.firebasestorage.app",
  messagingSenderId: "1059582715714",
  appId: "1:1059582715714:web:7021acbee4d3ad055a8adb",
  // measurementId: "G-JPB2MW08N1" // Optional: remove if not using Analytics
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore
const db = getFirestore(app);

// Export the database instance to use throughout your app
export { db };
