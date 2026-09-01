import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCP51k--Zc1EunY71le4Eeus2GeCMO4SKo",
  authDomain: "onlinecliipboard.firebaseapp.com",
  projectId: "onlinecliipboard",
  storageBucket: "onlinecliipboard.firebasestorage.app",
  messagingSenderId: "529485414559",
  appId: "1:529485414559:web:eb79c169934818fac3e2aa"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
