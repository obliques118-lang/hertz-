import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, set, push, onChildAdded } from 'firebase/database';

const firebaseConfig = {
  // Replace with your Firebase config
  apiKey: "AIzaSyAXxdZ7evN9n69L8KXJVKlbMZfsCc5ORiU",
  authDomain: "hertz-da7ba.firebaseapp.com",
  projectId: "hertz-da7ba",
  storageBucket: "hertz-da7ba.firebasestorage.app",
  messagingSenderId: "456571876241",
  appId: "1:456571876241:web:439f3a67c1cdc722dba030",
  measurementId: "G-B3XCCNS9NB"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
