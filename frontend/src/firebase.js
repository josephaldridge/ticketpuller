// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA1A_o3dyAOhjH-8FvD8ji9V3NLmq_BAWU",
  authDomain: "zendesk-ticket-pulls.firebaseapp.com",
  projectId: "zendesk-ticket-pulls",
  storageBucket: "zendesk-ticket-pulls.firebasestorage.app",
  messagingSenderId: "505066171893",
  appId: "1:505066171893:web:5378101b4e6e62317d04bc"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);