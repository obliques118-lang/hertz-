// src/firebase.ts
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, onValue, push, serverTimestamp } from "firebase/database";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration (hardcoded for development)
const firebaseConfig = {
  apiKey: "AIzaSyAXxdZ7evN9n69L8KXJVKlbMZfsCc5ORiU",
  authDomain: "hertz-da7ba.firebaseapp.com",
  projectId: "hertz-da7ba",
  storageBucket: "hertz-da7ba.firebasestorage.app",
  messagingSenderId: "456571876241",
  appId: "1:456571876241:web:439f3a67c1cdc722dba030",
  measurementId: "G-B3XCCNS9NB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const analytics = getAnalytics(app);
export { ref, set, onValue, push, serverTimestamp };
