// navigation.js
// Handles high-level page navigation and dashboard subpage loading.

import { loadProfile } from "./profile.js";
import { renderCopackerDashboard } from "./copacker.js";

// BASIC PAGE NAVIGATION (home, login, dashboard, etc.)
export function navigate(page) {
  document.querySelectorAll(".page").forEach((p) => (p.style.display = "none"));

  const el = document.getElementById("page-" + page);
  if (el) el.style.display = "block";
}

// LOAD SUBPAGE HTML INTO DASHBOARD AREA
export async function loadSubpage(targetId, filePath) {
  const container = document.getElementById(targetId);
  if (!container) return false;

  const html = await fetch(filePath).then((r) => r.text());
  container.innerHTML = html;

  return true;
}

// DASHBOARD INTERNAL NAVIGATION
export async function dashboardNavigate(section) {
  // Hide all current dashboard subpages
  document
    .querySelectorAll(".dash-subpage")
    .forEach((el) => (el.style.display = "none"));

  const container = document.getElementById("dash-" + section);
  if (!container) return;

  // Load HTML if not loaded yet
  if (!container.dataset.loaded) {
    if (section === "profile") {
      await loadSubpage("dash-profile", "/pages/profile.html");
      await loadProfile();
    }

    if (section === "main") {
      await loadSubpage("dash-main", "/pages/dashboard-main.html");
    }

    if (section === "copacker") {
      await loadSubpage("dash-copacker", "/pages/copacker.html");
      await renderCopackerDashboard();
    }

    if (section === "brand") {
      await loadSubpage("dash-brand", "/pages/brand.html");
      await window.loadBrandRequests();
    }

    container.dataset.loaded = "true";
  }

  // Show selected subpage
  container.style.display = "block";

  return true;
}

console.log("navigation.js loaded");
