// requests.js
// Handles creation, listing, rendering, and deactivation of Brand Owner requests.

import {
  auth,
  db,
  doc,
  getDoc,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  setDoc,
  serverTimestamp,
  functions,
  httpsCallable,
} from "./firebase.js";

import {
  REQUEST_LOCATION_OPTIONS,
  buildRequestLocationOptions,
  showRequestLocationList,
  filterRequestLocationList,
  renderRequestLocationList,
  selectRequestLocation,
} from "./location.js";

import { escapeHtml } from "./ui.js";

// Export functions used externally
export {
  showRequestLocationList,
  filterRequestLocationList,
  selectRequestLocation,
};

// ==========================================================
// Load all requests belonging to the logged-in brand owner
// ==========================================================

export async function loadBrandRequests() {
  const user = auth.currentUser;
  if (!user) return;

  const grid = document.getElementById("requestsGrid");
  if (!grid) return;

  // Load user profile to get region/subregion/country
  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);
  const profile = userSnap.exists() ? userSnap.data() : {};

  // Build location list structure (option B)
  buildRequestLocationOptions(profile);

  // Load this user's requests
  const q = query(
    collection(db, "requests"),
    where("brandOwnerId", "==", user.uid)
  );

  const snap = await getDocs(q);

  const requests = [];
  snap.forEach((d) => {
    requests.push({ id: d.id, ...d.data() });
  });

  // Sort newest first
  requests.sort((a, b) => {
    const aTime = a.createdAt?.seconds || 0;
    const bTime = b.createdAt?.seconds || 0;
    return bTime - aTime;
  });

  // Render the grid
  renderRequestsGrid(requests);
}

// ==========================================================
// Render ALL request cards on brand page
// ==========================================================

export function renderRequestsGrid(requests) {
  const grid = document.getElementById("requestsGrid");
  if (!grid) return;

  grid.innerHTML = "";

  // Always show "Create New Request"
  const createCard = document.createElement("div");
  createCard.className = "request-card request-card-new";
  createCard.onclick = () => openRequestPopup();

  createCard.innerHTML = `
    <div class="request-card-body">
      <div style="font-size:32px; line-height:1;">＋</div>
      <div style="font-weight:bold; margin-top:8px;">Create a new request</div>
      <div style="font-size:13px; color:#555; margin-top:4px;">
        Describe what you need and we'll match you with copackers.
      </div>
    </div>
  `;
  grid.appendChild(createCard);

  // Render actual requests
  requests.forEach((req) => {
    const card = document.createElement("div");
    card.className = "request-card";

    const created = req.createdAt?.toDate?.().toLocaleString?.() || "(no date)";

    card.innerHTML = `
      <div class="request-card-body">
        <div style="font-size:13px; color:#777; margin-bottom:4px;">${created}</div>

        <div style="font-weight:bold; margin-bottom:4px;">
          ${escapeHtml(req.product || "")}
        </div>

        <div style="font-size:13px; margin-bottom:4px;">
          <strong>Form:</strong> ${escapeHtml(req.form || "")}
        </div>

        <div style="font-size:13px; margin-bottom:4px;">
          <strong>Quantity:</strong> ${req.packageQty || 0} packages
        </div>

        <div style="font-size:13px; margin-bottom:4px;">
          <strong>Packaging:</strong> ${escapeHtml(req.packagingType || "")}
        </div>

        <div style="font-size:13px; margin-bottom:4px;">
          <strong>Per package:</strong> ${req.unitQty || 0} ${escapeHtml(
      req.unitType || ""
    )}
        </div>

        <div style="font-size:13px;">
          <strong>Location:</strong> ${escapeHtml(req.locationLabel || "All")}
        </div>

        ${
          req.active === false
            ? `<div class="deactivated-label">DEACTIVATED</div>`
            : `<button class="deactivate-btn" onclick="deactivateRequest('${req.id}')">
                Deactivate
               </button>`
        }
      </div>
    `;

    grid.appendChild(card);
  });
}

// ==========================================================
// Open Request Creation Popup
// ==========================================================

export function openRequestPopup() {
  const backdrop = document.getElementById("requestModalBackdrop");
  if (!backdrop) return;

  // Reset fields
  document.getElementById("requestProduct").value = "";
  document.getElementById("requestForm").value = "";
  document.getElementById("requestPackageQty").value = "";
  document.getElementById("requestPackagingType").value = "";
  document.getElementById("requestUnitQty").value = "";
  document.getElementById("requestUnitType").value = "";
  document.getElementById("requestError").innerText = "";

  // Default location to All
  const locInput = document.getElementById("requestLocationSearch");
  const locScope = document.getElementById("requestLocationScope");
  const locValue = document.getElementById("requestLocationValue");
  if (locInput && locScope && locValue) {
    locInput.value = "All";
    locScope.value = "all";
    locValue.value = "";
  }

  backdrop.style.display = "flex";
}

export function closeRequestPopup() {
  const backdrop = document.getElementById("requestModalBackdrop");
  if (backdrop) backdrop.style.display = "none";
}

// ==========================================================
// Save a new Request
// ==========================================================

export async function saveRequest() {
  const errEl = document.getElementById("requestError");
  errEl.innerText = "";

  const user = auth.currentUser;
  if (!user) {
    errEl.innerText = "Not logged in.";
    return;
  }

  // Read form fields
  const product = document.getElementById("requestProduct").value.trim();
  const form = document.getElementById("requestForm").value;
  const packageQty = parseInt(
    document.getElementById("requestPackageQty").value,
    10
  );
  const packagingType = document.getElementById("requestPackagingType").value;
  const unitQty = parseInt(document.getElementById("requestUnitQty").value, 10);
  const unitType = document.getElementById("requestUnitType").value;

  const locInput = document.getElementById("requestLocationSearch");
  const locScope = document.getElementById("requestLocationScope");
  const locValue = document.getElementById("requestLocationValue");

  const locationLabel = locInput?.value.trim() || "";
  const locationScope = locScope?.value || "";
  const locationValue = locValue?.value || "";

  console.log({
    product,
    form,
    packageQty,
    packagingType,
    unitQty,
    unitType,
    locationLabel,
    locationScope,
    locationValue,
  });

  // Validation
  if (
    !product ||
    !form ||
    !packagingType ||
    !unitType ||
    !locationLabel ||
    !locationScope ||
    !Number.isFinite(packageQty) ||
    packageQty <= 0 ||
    !Number.isFinite(unitQty) ||
    unitQty <= 0
  ) {
    errEl.innerText = "Please fill all fields with valid values.";
    return;
  }

  try {
    const callable = httpsCallable(functions, "createRequest");
    const result = await callable({
      product,
      form,
      packageQty,
      packagingType,
      unitQty,
      unitType,
      locationScope,
      locationValue,
      locationLabel,
    });

    console.log("Request created via Cloud Function:", result.data);

    const resp = result.data;

    if (resp.active === false) {
      alert(
        "Your request was created but not published.\nReason: " + resp.reason
      );
    } else {
      alert("Your request has been published successfully.");
    }

    await loadBrandRequests();
    closeRequestPopup();
  } catch (e) {
    console.error(e);
    errEl.innerText = "Error saving request.";
  }
}

// ==========================================================
// Deactivate a request
// ==========================================================

export async function deactivateRequest(requestId) {
  if (!confirm("Are you sure you want to deactivate this request?")) return;

  try {
    await setDoc(
      doc(db, "requests", requestId),
      { active: false },
      { merge: true }
    );

    await loadBrandRequests();
  } catch (e) {
    console.error(e);
    alert("Could not deactivate request.");
  }
}

console.log("requests.js loaded");
