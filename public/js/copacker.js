// copacker.js
// Handles Copacker dashboard logic. (Currently minimal, ready for expansion)

import { auth, db, doc, getDoc } from "./firebase.js";

// Called when the user opens the Copacker section.
// This will become powerful later (matching requests, etc.)
export async function loadCopackerView() {
  const user = auth.currentUser;
  if (!user) return;

  console.log("Copacker view opened");

  // Load copacker profile (to filter matching requests later)
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) return;

  const data = snap.data();

  // This is where matching logic will be built later
  console.log("Copacker data:", data);

  // Future:
  // loadMatchingRequests(data.copacker);
  // renderCopackerDashboard();
}

console.log("copacker.js loaded (placeholder)");
