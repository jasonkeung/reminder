import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCHdBQ9wVWum7lG4qSU-HZUW_JPcgEpDD0",
  authDomain: "reminder-35c2e.firebaseapp.com",
  projectId: "reminder-35c2e",
  storageBucket: "reminder-35c2e.firebasestorage.app",
  messagingSenderId: "784014665730",
  appId: "1:784014665730:web:7bfdd651011437586d9f1b",
  measurementId: "G-TEMTDRB70E"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
