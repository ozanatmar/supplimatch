// location.js
// Handles location dropdown logic for brand request creation.

import { COUNTRIES, COUNTRY_REGIONS } from "../countries.js";

// Shared exported state
export let REQUEST_LOCATION_OPTIONS = [];

// ======================================================
// Build location dropdown structure (Option B)
// ======================================================

export function buildRequestLocationOptions(profile) {
  const regionsSet = new Set();
  const subregionsSet = new Set();

  // Extract regions + subregions from COUNTRY_REGIONS
  COUNTRIES.forEach((c) => {
    const info = COUNTRY_REGIONS[c];
    if (info) {
      regionsSet.add(info.region);
      subregionsSet.add(info.subregion);
    }
  });

  const regions = Array.from(regionsSet).sort();
  const subregions = Array.from(subregionsSet).sort();
  const countries = [...COUNTRIES].sort();

  const opts = [];

  // Top "quick select" items
  opts.push({ label: "All", scope: "all", value: "" });

  if (profile.region) {
    opts.push({
      label: `My Region (${profile.region})`,
      scope: "my-region",
      value: profile.region,
    });
  }

  if (profile.subregion) {
    opts.push({
      label: `My Subregion (${profile.subregion})`,
      scope: "my-subregion",
      value: profile.subregion,
    });
  }

  if (profile.country) {
    opts.push({
      label: `My Country (${profile.country})`,
      scope: "my-country",
      value: profile.country,
    });
  }

  // Divider + lists
  opts.push({ label: "──────── Regions ────────", divider: true });
  regions.forEach((r) => opts.push({ label: r, scope: "region", value: r }));

  opts.push({ label: "──────── Subregions ────────", divider: true });
  subregions.forEach((sr) =>
    opts.push({ label: sr, scope: "subregion", value: sr })
  );

  opts.push({ label: "──────── Countries ────────", divider: true });
  countries.forEach((c) => opts.push({ label: c, scope: "country", value: c }));

  REQUEST_LOCATION_OPTIONS = opts;
}

// ======================================================
// Rendering the dropdown
// ======================================================

export function renderRequestLocationList(list) {
  const box = document.getElementById("requestLocationDropdown");
  if (!box) return;

  box.innerHTML = "";

  list.forEach((item) => {
    const div = document.createElement("div");
    div.style.padding = "6px 10px";

    if (item.divider) {
      div.textContent = item.label;
      div.style.color = "#999";
      div.style.fontSize = "12px";
    } else {
      div.textContent = item.label;
      div.style.cursor = "pointer";

      div.onclick = () => selectRequestLocation(item);

      div.onmouseover = () => (div.style.background = "#eee");
      div.onmouseout = () => (div.style.background = "white");
    }

    box.appendChild(div);
  });

  if (!list.length) {
    box.innerHTML = "<div style='padding:10px;color:#777;'>No matches</div>";
  }
}

// ======================================================
// Show dropdown
// ======================================================

export function showRequestLocationList() {
  const box = document.getElementById("requestLocationDropdown");
  if (!box) return;

  box.style.display = "block";
  renderRequestLocationList(REQUEST_LOCATION_OPTIONS);
}

// ======================================================
// Filter as user types
// ======================================================

export function filterRequestLocationList() {
  const text = document
    .getElementById("requestLocationSearch")
    .value.toLowerCase();

  const filtered = REQUEST_LOCATION_OPTIONS.filter((item) => {
    if (item.divider) return true; // keep dividers for structure
    return item.label.toLowerCase().includes(text);
  });

  renderRequestLocationList(filtered);
}

// ======================================================
// User selects an item
// ======================================================

export function selectRequestLocation(item) {
  const input = document.getElementById("requestLocationSearch");
  const scopeEl = document.getElementById("requestLocationScope");
  const valueEl = document.getElementById("requestLocationValue");
  const box = document.getElementById("requestLocationDropdown");

  input.value = item.label;
  scopeEl.value = item.scope || "";
  valueEl.value = item.value || "";

  box.style.display = "none";
}

console.log("location.js loaded");
