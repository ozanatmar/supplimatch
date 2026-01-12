import { COUNTRIES } from "./countries.js";

document.addEventListener('DOMContentLoaded', () => {  
  const countrySelect = document.getElementById("countrySelect");
  if(countrySelect) {
    COUNTRIES.forEach(c => {
      const opt = document.createElement("option");
      opt.value = c;
      opt.textContent = c;
      countrySelect.appendChild(opt);
    });
  }
  
  const openBtn = document.getElementById('openCopackerModal');
  const modal = document.getElementById('copackerModal');
  const closeBtn = document.getElementById('closeModal');
  const form = document.getElementById('copackerForm');
  const successBox = document.getElementById('copackerSuccess');
  const submitBtn = document.getElementById('copackerSubmit');
  const openRequestBtn = document.getElementById('openRequestModal');
  const requestModal = document.getElementById('requestModal');
  const closeRequestBtn = document.getElementById('closeRequestModal');
  const requestForm = document.getElementById('requestForm');
  const requestSuccessBox = document.getElementById('requestSuccess');
  const requestSubmitBtn = document.getElementById('requestSubmit');
  const REQUEST_WEBHOOK_URL = 'https://hook.eu2.make.com/8rgorhtlpbxbozuy39ap8ulnfusino4e';
  const COPACKER_REGISTER_WEBHOOK_URL = 'https://hook.eu2.make.com/b9vc54muqd8898ph4187nrdovte2tiod';

  // create request modal
  function resetRequestModal() {
    requestForm.style.display = '';
    requestSuccessBox.style.display = 'none';
    requestForm.reset();
    requestSubmitBtn.disabled = false;
    requestSubmitBtn.textContent = 'Submit request';
  }
  
  function openRequestModal() {
    resetRequestModal();
    requestModal.classList.add('active');
  }
  
  function closeRequestModal() {
    requestModal.classList.remove('active');
  }

  openRequestBtn?.addEventListener('click', openRequestModal);
  closeRequestBtn?.addEventListener('click', closeRequestModal);
  
  requestModal?.addEventListener('click', (e) => {
    if (e.target === requestModal) closeRequestModal();
  });

  // register copacker modal
  function resetModal() {
    // show form, hide success
    form.style.display = '';
    successBox.style.display = 'none';

    // clear fields
    form.reset();

    // clear pill selections
    document.querySelectorAll('.pill.active').forEach(p => p.classList.remove('active'));

    // reset button
    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit';
  }

  function openModal() {
    resetModal();
    modal.classList.add('active');
  }

  function closeModal() {
    modal.classList.remove('active');
  }

  // Open/close modal
  openBtn.addEventListener('click', openModal);
  closeBtn.addEventListener('click', closeModal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal();
      closeRequestModal();
    }
  });

  // Pill multi-select handling
  document.querySelectorAll('.pill-group').forEach(group => {
    group.addEventListener('click', e => {
      if (!e.target.classList.contains('pill')) return;
      e.target.classList.toggle('active');
    });
  });

  // submit create request form
  requestForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
  
    const payload = Object.fromEntries(new FormData(requestForm).entries());
  
    requestSubmitBtn.disabled = true;
    requestSubmitBtn.textContent = 'Submitting...';
  
    try {
      const res = await fetch(REQUEST_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
  
      if (!res.ok) throw new Error('Request failed');
  
      requestForm.style.display = 'none';
      requestSuccessBox.style.display = 'block';
    } catch {
      alert('Submission failed. Please try again.');
      requestSubmitBtn.disabled = false;
      requestSubmitBtn.textContent = 'Submit request';
    }
  });

  // Submit register copacker form
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Build payload from inputs/selects
    const payload = Object.fromEntries(new FormData(form).entries());

    // Add pill selections as arrays
    document.querySelectorAll('.pill-group').forEach(group => {
      const name = group.dataset.name;
      payload[name] = Array.from(group.querySelectorAll('.pill.active')).map(p => p.textContent);
    });

    // UI: loading state
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';

    try {
      const res = await fetch(COPACKER_REGISTER_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Request failed');

      // Show success, keep modal open
      form.style.display = 'none';
      successBox.style.display = 'block';
    } catch (err) {
      alert('Submission failed. Please try again.');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit';
    }
  });

  // Input character filtering
  document.querySelectorAll('input[data-allowed]').forEach(input => {
    const rules = {
      'letters-space': /^[A-Za-z ]*$/,
      'alphanum-space': /^[A-Za-z0-9 ]*$/
    };
  
    const regex = rules[input.dataset.allowed];
  
    input.addEventListener('input', () => {
      if (!regex.test(input.value)) {
        if (input.dataset.allowed === 'letters-space') {
          input.value = input.value.replace(/[^A-Za-z ]/g, '');
        } else if (input.dataset.allowed === 'alphanum-space') {
          input.value = input.value.replace(/[^A-Za-z0-9 ]/g, '');
        }
      }
    });
  });
});
