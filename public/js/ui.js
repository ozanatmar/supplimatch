// ui.js
// Shared small UI helpers used across modules.

// =========================
// Escape HTML (safe rendering)
// =========================
export function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// =========================
// Show element by ID
// =========================
export function show(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = "block";
}

// =========================
// Hide element by ID
// =========================
export function hide(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = "none";
}

// =========================
// Toggle element (none <-> block)
// =========================
export function toggle(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.display = el.style.display === "none" ? "block" : "none";
}

// =========================
// Set text safely
// =========================
export function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.innerText = text;
}

// =========================
// Clear text
// =========================
export function clearText(id) {
  const el = document.getElementById(id);
  if (el) el.innerText = "";
}

// =========================
// Attach click handler safely
// =========================
export function onClick(id, handler) {
  const el = document.getElementById(id);
  if (el) el.onclick = handler;
}

// =========================
// Check if click happened outside an element
// Useful for dropdowns
// =========================
export function clickOutside(elementId, onOutside) {
  document.addEventListener("click", (evt) => {
    const box = document.getElementById(elementId);
    if (!box) return;

    if (!box.contains(evt.target)) onOutside();
  });
}

// =========================
// Modal controls
// =========================
export function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.style.display = "flex"; // fits your existing modal styling
  } else {
    console.warn("[UI] openModal(): element not found:", id);
  }
}

export function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.style.display = "none";
  } else {
    console.warn("[UI] closeModal(): element not found:", id);
  }
}

console.log("ui.js loaded");
