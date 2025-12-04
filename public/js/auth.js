// auth.js
// Handles login, signup, logout, and auth state changes.

import {
  auth,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  doc,
  getDoc,
  db,
} from "./firebase.js";

import { navigate, dashboardNavigate } from "./navigation.js";
import { applyRoleVisibility } from "./profile.js";

// ========== LOGIN ==========
export function login() {
  const email = document.getElementById("loginEmail").value;
  const pass = document.getElementById("loginPassword").value;

  signInWithEmailAndPassword(auth, email, pass).catch((err) =>
    alert(err.message)
  );
}

// ========== LOGOUT ==========
export function logout() {
  signOut(auth);
}

// ========== SIGNUP ==========
export function signup() {
  const email = document.getElementById("signupEmail").value;
  const pass = document.getElementById("signupPassword").value;

  createUserWithEmailAndPassword(auth, email, pass)
    .then((cred) => {
      sendEmailVerification(cred.user);
      alert("Verification email sent. Please check your inbox.");
    })
    .catch((err) => alert(err.message));
}

// ========== AUTH STATE LISTENER ==========
onAuthStateChanged(auth, async (user) => {
  const out = document.getElementById("headerLoggedOut");
  const inn = document.getElementById("headerLoggedIn");

  if (user && user.emailVerified) {
    out.style.display = "none";
    inn.style.display = "flex";

    // Show dashboard main container
    navigate("dashboard");

    // Load main dashboard subpage and roles
    await dashboardNavigate("main");

    const ref = doc(db, "users", user.uid);
    const snap = await getDoc(ref);

    if (snap.exists()) {
      const data = snap.data();
      applyRoleVisibility(data?.roles);
    }
  } else {
    inn.style.display = "none";
    out.style.display = "flex";
    navigate("home");
  }
});

console.log("auth.js loaded");
