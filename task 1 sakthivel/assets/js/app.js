const apiBase = (() => {
  if (window.location.protocol === 'file:') {
    return 'http://localhost:4000';
  }
  return window.location.origin;
})();

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const error = data && (data.error || data.errors) ? data : { error: 'Request failed.' };
    throw { status: response.status, body: error };
  }
  return data;
}

function getPage() {
  return document.body.dataset.page;
}

function createEventCard(event) {
  const article = document.createElement('article');
  article.className = 'event-card';
  article.innerHTML = `
    <div>
      <span class="tag">${event.category}</span>
      <h3>${event.title}</h3>
      <p>${event.description}</p>
    </div>
    <div class="meta">
      <span><strong>Location:</strong> ${event.location}</span>
      <span><strong>Date:</strong> ${event.date}</span>
      <a class="button button-secondary" href="event-details.html?id=${event.id}">View details</a>
    </div>
  `;
  return article;
}

function renderEventList(events, container) {
  container.innerHTML = '';
  events.forEach((event) => container.appendChild(createEventCard(event)));
}

async function loadHomeFeatured() {
  const featured = document.getElementById('featured-events');
  if (!featured) return;
  try {
    const events = await fetchJson(`${apiBase}/events`);
    renderEventList(events.slice(0, 3), featured);
  } catch (err) {
    featured.innerHTML = '<p class="loading">Unable to load featured events.</p>';
  }
}

async function loadEventsPage() {
  const searchInput = document.getElementById('search-input');
  const categoryFilter = document.getElementById('category-filter');
  const eventsGrid = document.getElementById('events-grid');
  const emptyState = document.getElementById('events-empty');

  if (!searchInput || !categoryFilter || !eventsGrid || !emptyState) return;

  const categories = new Set(['Networking', 'Workshop', 'Business', 'Design', 'Panel']);
  categories.forEach((category) => {
    const option = document.createElement('option');
    option.value = category;
    option.textContent = category;
    categoryFilter.appendChild(option);
  });

  async function refreshList() {
    const searchValue = searchInput.value.trim();
    const categoryValue = categoryFilter.value;
    const query = new URLSearchParams();
    if (searchValue) query.append('search', searchValue);
    if (categoryValue) query.append('category', categoryValue);

    try {
      const events = await fetchJson(`${apiBase}/events?${query.toString()}`);
      if (events.length === 0) {
        emptyState.classList.remove('hidden');
        eventsGrid.innerHTML = '';
      } else {
        emptyState.classList.add('hidden');
        renderEventList(events, eventsGrid);
      }
    } catch (err) {
      emptyState.textContent = 'Unable to load events.';
      emptyState.classList.remove('hidden');
      eventsGrid.innerHTML = '';
    }
  }

  searchInput.addEventListener('input', refreshList);
  categoryFilter.addEventListener('change', refreshList);
  refreshList();
}

async function loadEventDetailsPage() {
  const card = document.getElementById('event-detail-card');
  if (!card) return;
  const params = new URLSearchParams(window.location.search);
  const eventId = params.get('id');
  if (!eventId) {
    card.innerHTML = '<p class="loading">Missing event ID.</p>';
    return;
  }
  try {
    const event = await fetchJson(`${apiBase}/events/${eventId}`);
    card.innerHTML = `
      <div>
        <span class="tag">${event.category}</span>
        <h2>${event.title}</h2>
        <p>${event.description}</p>
      </div>
      <div class="event-detail-grid">
        <div class="detail-item"><strong>Location</strong><span>${event.location}</span></div>
        <div class="detail-item"><strong>Date</strong><span>${event.date}</span></div>
        <div class="detail-item"><strong>Category</strong><span>${event.category}</span></div>
      </div>
      <a class="button button-primary" href="register.html?event_id=${event.id}">Register for this event</a>
    `;
  } catch (err) {
    card.innerHTML = '<p class="loading">Event details not available.</p>';
  }
}

function validateFormData(data) {
  const errors = [];
  if (!data.event_id) errors.push('Please select an event.');
  if (!data.name || !data.name.trim()) errors.push('Name is required.');
  if (!data.email || !/^\S+@\S+\.\S+$/.test(data.email)) errors.push('Email must be valid.');
  if (!data.phone || !/^\d{6,15}$/.test(data.phone.replace(/\D/g, ''))) errors.push('Phone must contain 6 to 15 digits.');
  return errors;
}

async function populateEventSelect(selectElement, selectedEventId = null) {
  selectElement.innerHTML = '<option value="">Select an event</option>';
  try {
    const events = await fetchJson(`${apiBase}/events`);
    events.forEach((event) => {
      const option = document.createElement('option');
      option.value = event.id;
      option.textContent = `${event.title} — ${event.date}`;
      selectElement.appendChild(option);
    });
    if (selectedEventId) {
      selectElement.value = selectedEventId;
    }
  } catch (err) {
    selectElement.innerHTML = '<option value="">Unable to load events</option>';
  }
}

async function loadRegisterPage() {
  const eventSelect = document.getElementById('event-select');
  const form = document.getElementById('registration-form');
  const errorBox = document.getElementById('form-error');
  if (!eventSelect || !form || !errorBox) return;

  await populateEventSelect(eventSelect);
  const params = new URLSearchParams(window.location.search);
  const eventId = params.get('event_id');
  if (eventId) {
    eventSelect.value = eventId;
  }

  form.addEventListener('submit', async (submitEvent) => {
    submitEvent.preventDefault();
    errorBox.classList.add('hidden');
    errorBox.textContent = '';

    const formData = {
      event_id: Number(eventSelect.value),
      name: document.getElementById('name-input').value,
      email: document.getElementById('email-input').value,
      phone: document.getElementById('phone-input').value,
    };

    const validationErrors = validateFormData(formData);
    if (validationErrors.length) {
      errorBox.innerHTML = validationErrors.map((msg) => `<div>${msg}</div>`).join('');
      errorBox.classList.remove('hidden');
      return;
    }

    try {
      const result = await fetchJson(`${apiBase}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      window.location.href = `success.html?id=${result.id}`;
    } catch (err) {
      const messages = err.body.errors || [err.body.error || 'Unable to submit registration.'];
      errorBox.innerHTML = messages.map((msg) => `<div>${msg}</div>`).join('');
      errorBox.classList.remove('hidden');
    }
  });
}

async function loadSuccessPage() {
  const params = new URLSearchParams(window.location.search);
  const registrationId = params.get('id');
  const viewLink = document.getElementById('view-registration-link');
  const successCard = document.querySelector('.success-card');
  if (!registrationId || !viewLink || !successCard) return;

  viewLink.href = `registration.html?id=${registrationId}`;

  try {
    const registration = await fetchJson(`${apiBase}/register/${registrationId}`);
    const details = document.createElement('div');
    details.className = 'event-detail-grid';
    details.innerHTML = `
      <div class="detail-item"><strong>Registration ID</strong><span>${registration.id}</span></div>
      <div class="detail-item"><strong>Event</strong><span>${registration.event_title}</span></div>
      <div class="detail-item"><strong>Name</strong><span>${registration.name}</span></div>
      <div class="detail-item"><strong>Email</strong><span>${registration.email}</span></div>
      <div class="detail-item"><strong>Phone</strong><span>${registration.phone}</span></div>
    `;
    successCard.insertBefore(details, successCard.querySelector('.hero-actions'));
  } catch (err) {
    const message = document.createElement('p');
    message.className = 'loading';
    message.textContent = 'Unable to load registration summary.';
    successCard.insertBefore(message, successCard.querySelector('.hero-actions'));
  }
}

async function loadRegistrationPage() {
  const eventSelect = document.getElementById('event-select');
  const form = document.getElementById('registration-management-form');
  const messageBox = document.getElementById('registration-message');
  const errorBox = document.getElementById('form-error');
  const deleteButton = document.getElementById('delete-registration');
  if (!eventSelect || !form || !messageBox || !errorBox || !deleteButton) return;

  const params = new URLSearchParams(window.location.search);
  const registrationId = params.get('id');
  if (!registrationId) {
    messageBox.textContent = 'Registration ID is missing in the URL.';
    messageBox.classList.remove('hidden');
    form.querySelector('button').disabled = true;
    return;
  }

  await populateEventSelect(eventSelect);

  try {
    const registration = await fetchJson(`${apiBase}/register/${registrationId}`);
    eventSelect.value = registration.event_id;
    document.getElementById('name-input').value = registration.name;
    document.getElementById('email-input').value = registration.email;
    document.getElementById('phone-input').value = registration.phone;
  } catch (err) {
    messageBox.textContent = 'Unable to load registration details.';
    messageBox.classList.remove('hidden');
    form.querySelector('button').disabled = true;
    return;
  }

  form.addEventListener('submit', async (submitEvent) => {
    submitEvent.preventDefault();
    errorBox.classList.add('hidden');
    errorBox.textContent = '';
    messageBox.classList.add('hidden');

    const formData = {
      event_id: Number(eventSelect.value),
      name: document.getElementById('name-input').value,
      email: document.getElementById('email-input').value,
      phone: document.getElementById('phone-input').value,
    };

    const validationErrors = validateFormData(formData);
    if (validationErrors.length) {
      errorBox.innerHTML = validationErrors.map((msg) => `<div>${msg}</div>`).join('');
      errorBox.classList.remove('hidden');
      return;
    }

    try {
      await fetchJson(`${apiBase}/register/${registrationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      messageBox.textContent = 'Registration updated successfully.';
      messageBox.style.color = '#047857';
      messageBox.classList.remove('hidden');
    } catch (err) {
      const messages = err.body.errors || [err.body.error || 'Unable to update registration.'];
      errorBox.innerHTML = messages.map((msg) => `<div>${msg}</div>`).join('');
      errorBox.classList.remove('hidden');
    }
  });

  deleteButton.addEventListener('click', async () => {
    if (!confirm('Delete this registration permanently?')) return;
    try {
      await fetchJson(`${apiBase}/register/${registrationId}`, { method: 'DELETE' });
      window.location.href = 'index.html';
    } catch (err) {
      messageBox.textContent = err.body.error || 'Unable to delete registration.';
      messageBox.style.color = '#b91c1c';
      messageBox.classList.remove('hidden');
    }
  });
}

function initPage() {
  const page = getPage();
  switch (page) {
    case 'home':
      loadHomeFeatured();
      break;
    case 'events':
      loadEventsPage();
      break;
    case 'event-details':
      loadEventDetailsPage();
      break;
    case 'register':
      loadRegisterPage();
      break;
    case 'success':
      loadSuccessPage();
      break;
    case 'registration':
      loadRegistrationPage();
      break;
    default:
      break;
  }
}

window.addEventListener('DOMContentLoaded', initPage);
