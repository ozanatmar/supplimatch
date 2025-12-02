// index.js
// Main entry point for SuppliMatch SPA (loaded once from index.html)

// ========= IMPORT MODULES =========

// Firebase (auth + db + functions)
import { functions, httpsCallable } from "./firebase.js";

// Auth actions
import { login, logout, signup } from "./auth.js";

// Navigation
import { navigate, dashboardNavigate, loadSubpage } from "./navigation.js";

// Profile module
import {
  saveProfile,
  loadProfile,
  applyRoleVisibility,
  validateProfileForm,
} from "./profile.js";

// Requests (brand owner)
import {
  loadBrandRequests,
  openRequestPopup,
  closeRequestPopup,
  saveRequest,
  deactivateRequest,
} from "./requests.js";

// Request-location dropdown
import {
  showRequestLocationList,
  filterRequestLocationList,
  selectRequestLocation,
} from "./location.js";

// Copacker view (placeholder)
import { loadCopackerView } from "./copacker.js";

// UI helpers
import {
  escapeHtml,
  show,
  hide,
  toggle,
  setText,
  clearText,
  onClick,
  clickOutside,
} from "./ui.js";

// ========= EXPOSE TO WINDOW (for HTML inline handlers) =========
window.login = login;
window.logout = logout;
window.signup = signup;

window.navigate = navigate;
window.dashboardNavigate = dashboardNavigate;
window.loadBrandRequests = loadBrandRequests;

window.saveProfile = saveProfile;
window.loadProfile = loadProfile;

window.openRequestPopup = openRequestPopup;
window.closeRequestPopup = closeRequestPopup;
window.saveRequest = saveRequest;
window.deactivateRequest = deactivateRequest;

window.showRequestLocationList = showRequestLocationList;
window.filterRequestLocationList = filterRequestLocationList;
window.selectRequestLocation = selectRequestLocation;

// Optional: expose helpers for debugging
window.escapeHtml = escapeHtml;
window.show = show;
window.hide = hide;
window.toggle = toggle;

// ========= DOM INITIALIZATION =========
document.addEventListener("DOMContentLoaded", async () => {
  console.log("SuppliMatch initialized");
});
