// profile.js
// Handles loading, saving, validating profile + role-based UI.

import { auth, db, doc, getDoc, setDoc } from "./firebase.js";

import { getRegionData } from "../countries.js";
import { COUNTRY_REGIONS } from "../countries.js";

function getCountryElements() {
  return {
    countrySearch: document.getElementById("countrySearch"),
    countryDropdown: document.getElementById("countryDropdown"),
    hiddenCountryInput: document.getElementById("profileCountry"),
  };
}

const allCountries = Object.keys(COUNTRY_REGIONS);

// ------------------------------
// Show all countries on click
// ------------------------------
window.showCountryList = function () {
  const { countryDropdown } = getCountryElements();
  renderCountryList(allCountries);
  countryDropdown.style.display = "block";
};

// ------------------------------
// Filter while typing
// ------------------------------
window.filterCountryList = function () {
  const { countrySearch, countryDropdown } = getCountryElements();
  const text = countrySearch.value.toLowerCase();
  const filtered = allCountries.filter((c) => c.toLowerCase().includes(text));
  renderCountryList(filtered);
  countryDropdown.style.display = "block";
};

// ------------------------------
// Render dropdown list
// ------------------------------
function renderCountryList(list) {
  const { countryDropdown } = getCountryElements();
  if (!countryDropdown) return; // prevent crash if called too early

  countryDropdown.innerHTML = "";

  list.forEach((country) => {
    const item = document.createElement("div");
    item.textContent = country;
    item.style.padding = "6px";
    item.style.cursor = "pointer";
    item.onclick = () => selectCountry(country);
    item.onmouseover = () => (item.style.background = "#eee");
    item.onmouseout = () => (item.style.background = "white");
    countryDropdown.appendChild(item);
  });
}

// ------------------------------
// When a country is selected
// ------------------------------
function selectCountry(country) {
  const { countrySearch, hiddenCountryInput, countryDropdown } =
    getCountryElements();

  countrySearch.value = country;
  hiddenCountryInput.value = country;

  window.selectedCountry = country;

  const r = getRegionData(country);
  window.selectedCountryRegion = r.region;
  window.selectedCountrySubregion = r.subregion;

  countryDropdown.style.display = "none";
}

// --- State ---
window.selectedCountry = null;
window.selectedCountryRegion = null;
window.selectedCountrySubregion = null;

// ====== VALIDATION ======
export function validateProfileForm() {
  const requiredFields = [
    "profileName",
    "profileCompany",
    "profileCountry",
    "profileTown",
    "profileZIPCode",
  ];

  for (let fieldId of requiredFields) {
    const field = document.getElementById(fieldId);
    const label =
      document.querySelector(`label[for="${fieldId}"]`)?.innerText || fieldId;

    if (!field.value.trim()) {
      return `Please fill: ${label}`;
    }

    if (!field.checkValidity()) {
      return `Invalid value in: ${label}`;
    }
  }

  return ""; // no errors
}

// ====== SAVE PROFILE ======
export async function saveProfile() {
  const errorEl = document.getElementById("profileError");
  const statusEl = document.getElementById("profileStatus");
  errorEl.innerText = "";
  statusEl.innerText = "";

  const err = validateProfileForm();
  if (err) {
    errorEl.innerText = err;
    return;
  }

  const user = auth.currentUser;
  if (!user) return;

  const ref = doc(db, "users", user.uid);

  // roles
  const roles = {
    copacker: document.getElementById("roleCopacker").checked,
    brand: document.getElementById("roleBrand").checked,
  };

  // copacker-specific data
  const copackerData = {};
  if (roles.copacker) {
    copackerData.forms = getSelectedValues("formsGroup");
    copackerData.packaging = getSelectedValues("packagesGroup");
  }

  // country + region mapping
  const country =
    window.selectedCountry || document.getElementById("profileCountry").value;

  const regionData = getRegionData(country);

  // save
  await setDoc(
    ref,
    {
      name: document.getElementById("profileName").value,
      company: document.getElementById("profileCompany").value,
      country,
      region: regionData.region,
      subregion: regionData.subregion,
      state: document.getElementById("profileState").value,
      town: document.getElementById("profileTown").value,
      zipcode: document.getElementById("profileZIPCode").value,
      address: document.getElementById("profileAddress").value,
      phone: document.getElementById("profilePhone").value,
      roles,
      copacker: copackerData,
    },
    { merge: true }
  );

  // Force reload of copacker view next time user clicks it
  const copackerContainer = document.getElementById("dash-copacker");
  if (copackerContainer) {
    delete copackerContainer.dataset.loaded;
  }

  // update UI instantly
  applyRoleVisibility(roles);

  statusEl.innerText = "Saved!";
  setTimeout(() => (statusEl.innerText = ""), 2000);
}

// ====== LOAD PROFILE ======
export async function loadProfile() {
  const user = auth.currentUser;
  if (!user) return;

  // set email
  document.getElementById("profileEmail").value = user.email;

  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;

  const data = snap.data();

  // basic fields
  document.getElementById("profileName").value = data.name || "";
  document.getElementById("profileCompany").value = data.company || "";
  document.getElementById("profileCountry").value = data.country || "";
  document.getElementById("countrySearch").value = data.country || "";
  document.getElementById("profileState").value = data.state || "";
  document.getElementById("profileTown").value = data.town || "";
  document.getElementById("profileZIPCode").value = data.zipcode || "";
  document.getElementById("profileAddress").value = data.address || "";
  document.getElementById("profilePhone").value = data.phone || "";

  // Load credit info
  if (data.credits !== undefined) {
    document.getElementById("profileCredits").innerText = data.credits;
  }

  // Load credit renewal date
  if (data.creditsRenewalDate) {
    let renewDate;

    // If Firestore timestamp (has .toDate())
    if (typeof data.creditsRenewalDate.toDate === "function") {
      renewDate = data.creditsRenewalDate.toDate();
    }
    // If stored as number (Date.now())
    else {
      renewDate = new Date(data.creditsRenewalDate);
    }

    document.getElementById("profileRenewalDate").innerText =
      renewDate.toLocaleDateString();
  }

  // roles
  document.getElementById("roleCopacker").checked =
    data.roles?.copacker || false;
  document.getElementById("roleBrand").checked = data.roles?.brand || false;

  // Load copacker settings
  if (data.roles?.copacker && data.copacker) {
    // 1) Load forms
    if (Array.isArray(data.copacker.forms)) {
      data.copacker.forms.forEach((value) => {
        const btn = document.querySelector(
          `#formsGroup .toggle-btn[data-value="${value}"]`
        );
        if (btn) btn.classList.add("active");
      });
    }

    // 2) Load packaging types
    if (Array.isArray(data.copacker.packaging)) {
      data.copacker.packaging.forEach((value) => {
        const btn = document.querySelector(
          `#packagesGroup .toggle-btn[data-value="${value}"]`
        );
        if (btn) btn.classList.add("active");
      });
    }

    // Show block
    document.getElementById("copackerSettings").style.display = "block";
  }

  // copacker settings visibility
  const block = document.getElementById("copackerSettings");
  if (data.roles?.copacker) block.style.display = "block";
  else block.style.display = "none";

  // store region info
  if (data.country) {
    const r = getRegionData(data.country);
    window.selectedCountry = data.country;
    window.selectedCountryRegion = r.region;
    window.selectedCountrySubregion = r.subregion;
  }
}

// ====== ROLE-BASED DASHBOARD VISIBILITY ======
export function applyRoleVisibility(roles) {
  const btnBrand = document.getElementById("btnBrand");
  const btnCopacker = document.getElementById("btnCopacker");
  const copackerBlock = document.getElementById("copackerSettings");

  if (!btnBrand || !btnCopacker) return;

  // hide all
  btnBrand.style.display = "none";
  btnCopacker.style.display = "none";

  // brand
  if (roles?.brand) btnBrand.style.display = "inline-block";

  // copacker
  if (roles?.copacker) {
    btnCopacker.style.display = "inline-block";
    if (copackerBlock) copackerBlock.style.display = "block";
  } else {
    if (copackerBlock) copackerBlock.style.display = "none";
  }
}

// ====== MULTISELECT BUTTON HANDLER ======
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("toggle-btn")) {
    e.target.classList.toggle("active");
  }
});

export function getSelectedValues(groupId) {
  return [...document.querySelectorAll(`#${groupId} .toggle-btn.active`)].map(
    (btn) => btn.dataset.value
  );
}

console.log("profile.js loaded");
