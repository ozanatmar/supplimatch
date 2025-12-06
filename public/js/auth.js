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
  setDoc,
  db,
} from "./firebase.js";

import { navigate, dashboardNavigate } from "./navigation.js";
import { applyRoleVisibility } from "./profile.js";

// ========== LOGIN ==========
export function login() {
  const email = document.getElementById("loginEmail").value;
  const pass = document.getElementById("loginPassword").value;

  signInWithEmailAndPassword(auth, email, pass)
    .then(async (cred) => {
      console.log("[LOGIN] Firebase login success");
      console.log(
        "[LOGIN] Before reload() emailVerified =",
        cred.user.emailVerified
      );

      await cred.user.reload(); // 🔥 force refresh

      console.log(
        "[LOGIN] After reload() emailVerified =",
        cred.user.emailVerified
      );

      if (!cred.user.emailVerified) {
        console.log("[LOGIN] Email not verified → blocking login");
        alert("Please verify your email before logging in.");
        return;
      }

      console.log(
        "[LOGIN] Email is verified → letting onAuthStateChanged continue"
      );

      // Trigger the usual auth flow
      // (onAuthStateChanged will handle navigation)
    })
    .catch((err) => alert(err.message));
  // signInWithEmailAndPassword(auth, email, pass).catch((err) =>
  //   alert(err.message)
  // );
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
    .then(async (cred) => {
      const now = Date.now();
      const renewIn30Days = now + 30 * 24 * 60 * 60 * 1000;

      // Create initial user record
      await setDoc(doc(db, "users", cred.user.uid), {
        credits: 100,
        creditsRenewalDate: renewIn30Days,
        roles: { brand: false, copacker: false },
      });

      sendEmailVerification(cred.user);

      alert("Verification email sent. Please check your inbox.");
    })
    .catch((err) => alert(err.message));
}

// ========== AUTH STATE LISTENER ==========
onAuthStateChanged(auth, async (user) => {
  console.log("[AUTH] State changed. User =", user);
  console.log("[AUTH] emailVerified =", user?.emailVerified);

  const out = document.getElementById("headerLoggedOut");
  const inn = document.getElementById("headerLoggedIn");

  // 🟥 No user → logged out state
  if (!user) {
    inn.style.display = "none";
    out.style.display = "flex";
    navigate("home");
    return;
  }

  // 🟧 User exists but email NOT verified → stay on login page
  if (!user.emailVerified) {
    console.log(
      "[AUTH] User logged in but NOT verified → stay on login screen"
    );
    inn.style.display = "none";
    out.style.display = "flex";

    // Important: DO NOT navigate("home") here
    return;
  }

  // 🟩 Email verified → proceed normally
  out.style.display = "none";
  inn.style.display = "flex";

  navigate("dashboard");
  await dashboardNavigate("main");

  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    const data = snap.data();
    applyRoleVisibility(data?.roles);

    if (data.credits !== undefined) {
      document.getElementById(
        "headerCredits"
      ).innerText = `Credits: ${data.credits}`;
    }
  }
});

console.log("auth.js loaded");
