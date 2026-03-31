import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAUCErJAVY-lF4aofVzNqXd_zwriTr0lPE",
  authDomain: "phforever-eb387.firebaseapp.com",
  projectId: "phforever-eb387",
  storageBucket: "phforever-eb387.firebasestorage.app",
  messagingSenderId: "744509128853",
  appId: "1:744509128853:web:52f9c41b8b697c1c45db9c",
  measurementId: "G-BRNVG4M2H7"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
