import { COUNTRIES } from "./countries.js";

document.addEventListener('DOMContentLoaded', () => {  
  // =========================
  // Config
  // =========================
  const REQUEST_WEBHOOK_URL = 'https://hook.eu2.make.com/8rgorhtlpbxbozuy39ap8ulnfusino4e';
  const COPACKER_REGISTER_WEBHOOK_URL = 'https://hook.eu2.make.com/b9vc54muqd8898ph4187nrdovte2tiod';

  // =========================
  // Helpers
  // =========================
  const $ = (id) => document.getElementById(id);

  function populateCountrySelect(selectEl, list) {
    if (!selectEl) return;
    list.forEach((c) => {
      const opt = document.createElement("option");
      opt.value = c;
      opt.textContent = c;
      selectEl.appendChild(opt);
    });
  }

  function addOption(select, label, value, { disabled = false, selected = false } = {}) {
    if (!select) return;
    const opt = document.createElement("option");
    opt.textContent = label;
    opt.value = value ?? label;
    opt.disabled = disabled;
    opt.selected = selected;
    select.appendChild(opt);
  }
  
  function addSeparator(select) {
    addOption(select, "──────────", "", { disabled: true });
  }

  function populateSourceSelect(select, countries) {
    if (!select) return;
  
    // clear existing
    select.innerHTML = "";
  
    // 1) All (default)
    addOption(select, "All", undefined, { selected:true });
  
    // 2) Regions
    addSeparator(select);
    const regions = [
      "Asia",
      "Europe",
      "Africa",
      "North America",
      "South America",
      "Oceania",
      "European Union",
    ];
    regions.forEach(label => addOption(select, label, label));
  
    // 3) Countries
    addSeparator(select);
    countries.forEach(c => addOption(select, c, c));
  }

  function closeOnOverlayClick(overlayEl, closeFn) {
    if (!overlayEl) return;
    overlayEl.addEventListener("click", (e) => {
      if (e.target === overlayEl) closeFn();
    });
  }

  function setSubmitState(btn, isLoading, idleText, loadingText = "Submitting...") {
    if (!btn) return;
    btn.disabled = isLoading;
    btn.textContent = isLoading ? loadingText : idleText;
  }

  function initPillGroups(root = document) {
    root.querySelectorAll(".pill-group").forEach((group) => {
      group.addEventListener("click", (e) => {
        const pill = e.target.closest(".pill");
        if (!pill) return;
        pill.classList.toggle("active");
      });
    });
  }

  function getPillPayload(root = document) {
    const payload = {};
    root.querySelectorAll(".pill-group").forEach((group) => {
      const name = group.dataset.name;
      if (!name) return;
      payload[name] = Array.from(group.querySelectorAll(".pill.active")).map(
        (p) => p.textContent
      );
    });
    return payload;
  }

  function clearAllPills(root = document) {
    root.querySelectorAll(".pill.active").forEach((p) => p.classList.remove("active"));
  }

  async function postJSON(url, payload) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Request failed");
    return res;
  }

  function initInputCharacterFiltering(root = document) {
    const rules = {
      "letters-space": {
        test: /^[A-Za-z ]*$/,
        sanitize: (v) => v.replace(/[^A-Za-z ]/g, ""),
      },
      "alphanum-space": {
        test: /^[A-Za-z0-9 ]*$/,
        sanitize: (v) => v.replace(/[^A-Za-z0-9 ]/g, ""),
      },
    };

    root.querySelectorAll("input[data-allowed]").forEach((input) => {
      const rule = rules[input.dataset.allowed];
      if (!rule) return;

      input.addEventListener("input", () => {
        if (!rule.test.test(input.value)) input.value = rule.sanitize(input.value);
      });
    });
  }

  // =========================
  // Countries
  // =========================
  populateCountrySelect($("countrySelect"), COUNTRIES);
  populateSourceSelect($("targetSourceSelect"), COUNTRIES);


  // =========================
  // Co-packer modal
  // =========================
  const openCopackerModalBtn = $("openCopackerModal");
  const copackerModalOverlay = $("copackerModal");
  const closeCopackerModalBtn = $("closeModal");
  const copackerForm = $("copackerForm");
  const copackerSuccessBox = $("copackerSuccess");
  const copackerSubmitBtn = $("copackerSubmit");

  function resetCopackerModal() {
    if (!copackerForm || !copackerSuccessBox) return;
    copackerForm.style.display = "";
    copackerSuccessBox.style.display = "none";
    copackerForm.reset();
    clearAllPills(copackerForm);
    setSubmitState(copackerSubmitBtn, false, "Submit");
  }

  function openCopackerModal() {
    if (!copackerModalOverlay) return;
    resetCopackerModal();
    copackerModalOverlay.classList.add("active");
  }

  function closeCopackerModal() {
    copackerModalOverlay?.classList.remove("active");
  }

  openCopackerModalBtn?.addEventListener("click", openCopackerModal);
  closeCopackerModalBtn?.addEventListener("click", closeCopackerModal);
  closeOnOverlayClick(copackerModalOverlay, closeCopackerModal);

  // Submit: co-packer
  copackerForm?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const payload = Object.fromEntries(new FormData(copackerForm).entries());
    Object.assign(payload, getPillPayload(copackerForm));

    setSubmitState(copackerSubmitBtn, true, "Submit");

    try {
      await postJSON(COPACKER_REGISTER_WEBHOOK_URL, payload);
      copackerForm.style.display = "none";
      copackerSuccessBox.style.display = "block";
    } catch {
      alert("Submission failed. Please try again.");
      setSubmitState(copackerSubmitBtn, false, "Submit");
    }
  });

  // =========================
  // Request modal
  // =========================
  const openRequestModalBtn = $("openRequestModal");
  const requestModalOverlay = $("requestModal");
  const closeRequestModalBtn = $("closeRequestModal");
  const requestForm = $("requestForm");
  const requestSuccessBox = $("requestSuccess");
  const requestSubmitBtn = $("requestSubmit");

  function resetRequestModal() {
    if (!requestForm || !requestSuccessBox) return;
    requestForm.style.display = "";
    requestSuccessBox.style.display = "none";
    requestForm.reset();
    setSubmitState(requestSubmitBtn, false, "Submit request");
  }

  function openRequestModal() {
    if (!requestModalOverlay) return;
    resetRequestModal();
    requestModalOverlay.classList.add("active");
  }

  function closeRequestModal() {
    requestModalOverlay?.classList.remove("active");
  }

  openRequestModalBtn?.addEventListener("click", openRequestModal);
  closeRequestModalBtn?.addEventListener("click", closeRequestModal);
  closeOnOverlayClick(requestModalOverlay, closeRequestModal);

  // Submit: request
  requestForm?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const payload = Object.fromEntries(new FormData(requestForm).entries());

    setSubmitState(requestSubmitBtn, true, "Submit request");

    try {
      await postJSON(REQUEST_WEBHOOK_URL, payload);
      requestForm.style.display = "none";
      requestSuccessBox.style.display = "block";
    } catch {
      alert("Submission failed. Please try again.");
      setSubmitState(requestSubmitBtn, false, "Submit request");
    }
  });

  // =========================
  // Global init (once)
  // =========================
  initPillGroups(document);
  initInputCharacterFiltering(document);

  // Esc closes both
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    closeCopackerModal();
    closeRequestModal();
  });
});
