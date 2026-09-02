// Firebase Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

// Firebase Configuration
const firebaseConfig = {
   apiKey: "AIzaSyDe9GRffYekg8sFvmRHo2-VSy_bxtVS-tA",
  authDomain: "trace-ed4fd.firebaseapp.com",
  projectId: "trace-ed4fd",
  storageBucket: "trace-ed4fd.firebasestorage.app",
  messagingSenderId: "159694952039",
  appId: "1:159694952039:web:74ff8f8c81855d986966c2"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

console.log("✅ TRACE Connected Successfully");