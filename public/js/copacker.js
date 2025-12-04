// copacker.js
import { auth, db, doc, getDoc, collection, getDocs } from "./firebase.js";

import { openModal } from "./ui.js";

console.log("%c[Copacker] Module loaded", "color:#3aa3ff");

// ---------------------------------------------------------
// Load ALL requests (no filtering)
// ---------------------------------------------------------

async function loadAllRequests() {
  console.log("[Copacker] Fetching ALL requests (no filters)…");

  const snap = await getDocs(collection(db, "requests"));
  console.log(`[Copacker] Found ${snap.size} total requests`);

  const results = [];

  snap.forEach((docSnap) => {
    results.push({
      id: docSnap.id,
      ...docSnap.data(),
    });
  });

  return results;
}

// ---------------------------------------------------------
// Render Copacker Dashboard (shows ALL requests)
// ---------------------------------------------------------

export async function renderCopackerDashboard() {
  console.log("[Copacker] Rendering dashboard…");

  const user = auth.currentUser;
  if (!user) {
    console.error("[Copacker] No authenticated user!");
    return;
  }

  // Load user profile (not used for filtering now, but may be needed later)
  const userSnap = await getDoc(doc(db, "users", user.uid));
  const data = userSnap.data();
  console.log("[Copacker] Loaded user profile:", data);

  const container = document.getElementById("copackerRequestsGrid");
  container.innerHTML = "";

  // Load ALL requests
  const requests = await loadAllRequests();
  console.log("[Copacker] Rendering request cards:", requests.length);

  if (requests.length === 0) {
    container.innerHTML = "<p>No requests found.</p>";
    return;
  }

  requests.forEach((r) => {
    const card = document.createElement("div");
    card.className = "request-card";

    card.innerHTML = `
      <div class="request-top">
        <small>${
          r.createdAt ? new Date(r.createdAt.toMillis()).toLocaleString() : ""
        }</small>
      </div>

      <h3>${r.product}</h3>

      <p><strong>Forms:</strong> ${r.forms?.join(", ") || "-"}</p>
      <p><strong>Packaging:</strong> ${r.packaging?.join(", ") || "-"}</p>
      <p><strong>MOQ:</strong> ${r.moq || "-"}</p>
      <p><strong>Location:</strong> ${r.locationLabel || "-"}</p>
      <p><strong>Status:</strong> ${r.active ? "Active" : "Inactive"}</p>

      <button class="details-btn"
              onclick="openRequestDetails('${r.id}')">Details</button>
    `;

    container.appendChild(card);
  });
}

// ---------------------------------------------------------
// DETAILS MODAL
// ---------------------------------------------------------

export async function openRequestDetails(id) {
  console.log("[Copacker] Opening request details:", id);

  const snap = await getDoc(doc(db, "requests", id));
  if (!snap.exists()) {
    console.error("[Copacker] Request not found:", id);
    return;
  }

  const r = snap.data();

  const html = `
    <h2>${r.product}</h2>
    <p><strong>Description:</strong> ${r.description || "None"}</p>
    <p><strong>Forms:</strong> ${r.forms?.join(", ") || "-"}</p>
    <p><strong>Packaging:</strong> ${r.packaging?.join(", ") || "-"}</p>
    <p><strong>MOQ:</strong> ${r.moq || "-"}</p>
    <p><strong>Location:</strong> ${r.locationLabel || "-"}</p>
    <p><strong>Status:</strong> ${r.active ? "Active" : "Inactive"}</p>
    <p><strong>Created:</strong> ${
      r.createdAt ? new Date(r.createdAt.toMillis()).toLocaleString() : "-"
    }</p>

    <button onclick="closeModal('requestDetailsModal')">Close</button>
  `;

  document.getElementById("requestDetailsContent").innerHTML = html;
  openModal("requestDetailsModal");
}

window.openRequestDetails = openRequestDetails;
