// copacker.js
import {
  auth,
  db,
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
} from "./firebase.js";

console.log("%c[Copacker] Module loaded", "color:#3aa3ff");

// ---------------------------------------------------------
// Load filtered requests
// ---------------------------------------------------------

async function loadAllRequests() {
  console.log("[Copacker] Fetching ACTIVE requests…");

  // Load the copacker's profile
  const user = auth.currentUser;
  const userSnap = await getDoc(doc(db, "users", user.uid));
  const copacker = userSnap.data();

  const allowedForms = copacker?.copacker?.forms || [];
  const allowedPackaging = copacker?.copacker?.packaging || [];

  // If copacker has not selected any forms or packaging → show nothing
  if (allowedForms.length === 0 || allowedPackaging.length === 0) {
    console.log(
      "[Copacker] No forms or packaging selected → returning empty list."
    );
    return [];
  }

  const q = query(collection(db, "requests"), where("active", "==", true));
  const snap = await getDocs(q);

  console.log(`[Copacker] Found ${snap.size} active requests`);

  const results = [];

  snap.forEach((docSnap) => {
    const req = { id: docSnap.id, ...docSnap.data() };

    // ---- LOCATION FILTER ----
    const scope = req.locationScope;
    const value = req.locationValue;

    let allowedLocation = false;

    if (scope === "all") {
      allowedLocation = true;
    } else if (scope === "country") {
      allowedLocation = value === copacker.country;
    } else if (scope === "region") {
      allowedLocation = value === copacker.region;
    } else if (scope === "my-subregion") {
      allowedLocation = value === copacker.subregion;
    }

    // ---- FORM FILTER ----
    let allowedForm = allowedForms.includes(req.form);

    // ---- PACKAGING FILTER ----
    let allowedPackagingMatch = allowedPackaging.includes(req.packagingType);

    // ---- FINAL FILTER ----
    if (allowedLocation && allowedForm && allowedPackagingMatch) {
      results.push(req);
    }
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

    const created = r.createdAt?.toDate?.().toLocaleString?.() || "(no date)";

    // 👉 Use the SAME fields & structure as Brand Owner view, but without deactivate button
    card.innerHTML = `
      <div class="request-card-body">
        <div style="font-size:13px; color:#777; margin-bottom:4px;">
          ${created}
        </div>

        <div style="font-weight:bold; margin-bottom:4px;">
          ${r.product || ""}
        </div>

        <div style="font-size:13px; margin-bottom:4px;">
          <strong>Form:</strong> ${r.form || ""}
        </div>

        <div style="font-size:13px; margin-bottom:4px;">
          <strong>Quantity:</strong> ${r.packageQty || 0} packages
        </div>

        <div style="font-size:13px; margin-bottom:4px;">
          <strong>Packaging:</strong> ${r.packagingType || ""}
        </div>

        <div style="font-size:13px; margin-bottom:4px;">
          <strong>Per package:</strong> ${r.unitQty || 0} ${r.unitType || ""}
        </div>

        <div style="font-size:13px;">
          <strong>Location:</strong> ${r.locationLabel || "All"}
        </div>
      </div>
    `;

    container.appendChild(card);
  });
}
