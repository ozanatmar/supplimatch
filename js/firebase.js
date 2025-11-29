// firebase.js
// Initializes Firebase and exports auth + db for other modules

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
  getFunctions,
  httpsCallable,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-functions.js";

// Export everything needed from Firestore/Auth
export {
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  doc,
  getDoc,
  setDoc,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  getFunctions,
  httpsCallable,
};

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDiVFI4RD-17ZtiKlkKV9Hx5iSkn5IjkMg",
  authDomain: "supplimatch.firebaseapp.com",
  projectId: "supplimatch",
};

// Init
const app = initializeApp(firebaseConfig);

// Export shared instances
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);

console.log("Firebase initialized");
