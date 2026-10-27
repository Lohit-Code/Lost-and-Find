// Purge any old/stale localStorage items (specifically Rashmika demo card)
try {
  let stored = JSON.parse(localStorage.getItem('lostItems')) || [];
  stored = stored.filter(function (item) {
    if (!item) return false;
    const itemStr = JSON.stringify(item).toLowerCase();
    if (itemStr.includes('rashmika') || itemStr.includes('mandana') || itemStr.includes('mandanna')) {
      return false;
    }
    return item.image && item.image.startsWith('data:image/');
  });
  localStorage.setItem('lostItems', JSON.stringify(stored));
} catch (e) {
  localStorage.removeItem('lostItems');
}

// Immediate DOM sweep: Remove any card containing Rashmika Mandanna
document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.card').forEach(function (card) {
    const text = card.textContent.toLowerCase();
    if (text.includes('rashmika') || text.includes('mandana') || text.includes('mandanna')) {
      card.remove();
    }
  });
});

const form = document.getElementById('lostItemForm');
const imageInput = document.getElementById('itemImage');
const uploadArea = document.querySelector('.upload-area');
const imagePreview = document.getElementById('imagePreview');
const imagePreviewText = document.getElementById('imagePreviewText');
const formError = document.getElementById('formError');
const formSuccess = document.getElementById('formSuccess');
const cardsGrid = document.getElementById('cardsGrid');
const searchInput = document.getElementById('searchInput');
const filterButtons = document.querySelectorAll('.filter-btn');

let uploadedImageData = '';

// Handle Image Selection
if (imageInput) {
  imageInput.addEventListener('change', function () {
    const file = imageInput.files[0];

    if (!file) {
      resetImagePreview();
      return;
    }

    // Check image type
    if (!file.type.startsWith('image/')) {
      showError('Please select a valid image file (JPG, PNG, or WEBP).');
      imageInput.value = '';
      resetImagePreview();
      return;
    }

    // Limit image size to 5 MB
    if (file.size > 5 * 1024 * 1024) {
      showError('Image size must be less than 5 MB.');
      imageInput.value = '';
      resetImagePreview();
      return;
    }

    const reader = new FileReader();

    reader.onload = function (e) {
      uploadedImageData = e.target.result;
      if (imagePreview) {
        imagePreview.src = uploadedImageData;
        imagePreview.style.display = 'block';
        imagePreview.hidden = false;
      }
      if (imagePreviewText) {
        imagePreviewText.style.display = 'none';
      }
      if (formError) {
        formError.textContent = '';
        formError.style.display = 'none';
      }

      // Update upload area subtitle with file name
      const uploadSubtitle = uploadArea?.querySelector('p');
      if (uploadSubtitle) {
        uploadSubtitle.textContent = `Selected: ${file.name}`;
      }
    };

    reader.readAsDataURL(file);
  });
}

// Drag & drop visual effects for upload area
if (uploadArea) {
  ['dragenter', 'dragover'].forEach((eventName) => {
    uploadArea.addEventListener(eventName, (e) => {
      e.preventDefault();
      uploadArea.style.borderColor = 'var(--primary)';
      uploadArea.style.background = 'var(--primary-subtle)';
    });
  });

  ['dragleave', 'drop'].forEach((eventName) => {
    uploadArea.addEventListener(eventName, (e) => {
      e.preventDefault();
      uploadArea.style.borderColor = '';
      uploadArea.style.background = '';
    });
  });
}

// Form Submission
if (form) {
  form.addEventListener('submit', function (e) {
    e.preventDefault();

    // Clear previous messages
    if (formError) {
      formError.textContent = '';
      formError.style.display = 'none';
    }
    if (formSuccess) {
      formSuccess.textContent = '';
      formSuccess.style.display = 'none';
    }

    // Get form values
    const itemName = document.getElementById('itemName')?.value.trim() || '';
    const category = document.getElementById('itemCategory')?.value || '';
    const description = document.getElementById('itemDescription')?.value.trim() || '';
    const location = document.getElementById('itemLocation')?.value.trim() || '';
    const date = document.getElementById('itemDate')?.value || '';
    const reporterName = document.getElementById('reporterName')?.value.trim() || '';
    const reporterPhone = document.getElementById('reporterPhone')?.value.trim() || '';
    const reportType = document.getElementById('reportType')?.value || 'lost';

    // Required fields
    if (
      !itemName ||
      !category ||
      !description ||
      !location ||
      !reporterName ||
      !reporterPhone ||
      !uploadedImageData
    ) {
      showError('Please fill in all required fields and upload an image.');
      return;
    }

    // Phone validation (10 digits)
    const phonePattern = /^[0-9]{10}$/;
    if (!phonePattern.test(reporterPhone)) {
      showError('Please enter a valid 10-digit phone number.');
      return;
    }

    // Item name length
    if (itemName.length < 2) {
      showError('Please enter a valid item name (at least 2 characters).');
      return;
    }

    // Description length
    if (description.length < 5) {
      showError('Please provide a little more detail about the item.');
      return;
    }

    const item = {
      id: Date.now(),
      image: uploadedImageData,
      name: itemName,
      category: category,
      type: reportType,
      description: description,
      location: location,
      date: date ? formatDate(date) : 'Recently',
      reporter: reporterName,
      phone: reporterPhone,
    };

    // Save and display
    saveItem(item);
    createItemCard(item);
    showSuccess('Your report has been published successfully.');

    // Reset form
    form.reset();
    resetImagePreview();

    // Scroll smoothly to listings
    setTimeout(function () {
      const lostSection = document.getElementById('lost-items');
      if (lostSection) {
        lostSection.scrollIntoView({ behavior: 'smooth' });
      }
    }, 600);
  });
}

function formatDate(dateString) {
  const options = {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  };
  const dateObj = new Date(dateString);
  return dateObj.toLocaleDateString('en-GB', options);
}

function createItemCard(item) {
  if (!cardsGrid) return;

  const card = document.createElement('article');
  card.className = 'card';
  card.dataset.category = (item.category || '').toLowerCase();
  card.dataset.name = (item.name || '').toLowerCase();
  card.dataset.location = (item.location || '').toLowerCase();

  const isFound = item.type === 'found';
  const statusLabel = isFound ? 'Found' : 'Lost';

  card.innerHTML = `
    <div class="card-image">
      <img
        src="${item.image}"
        alt="${escapeHTML(item.name)}"
        loading="lazy"
      >
      <span class="card-status">
        <i class="fa-solid fa-circle"></i>
        ${statusLabel}
      </span>
    </div>
    <div class="card-body">
      <span class="badge">
        <i class="fa-solid fa-tag"></i>
        ${escapeHTML(item.category)}
      </span>
      <h3>${escapeHTML(item.name)}</h3>
      <p class="card-desc">${escapeHTML(item.description)}</p>
      <div class="card-details">
        <p class="card-meta">
          <i class="fa-solid fa-location-dot"></i>
          ${escapeHTML(item.location)}
        </p>
        <p class="card-meta">
          <i class="fa-regular fa-calendar"></i>
          ${escapeHTML(item.date)}
        </p>
        <p class="card-meta">
          <i class="fa-regular fa-user"></i>
          ${escapeHTML(item.reporter)}
        </p>
      </div>
      <button class="btn btn-small found-button" type="button" aria-label="I found ${escapeHTML(item.name)}">
        <i class="fa-solid fa-hand-pointer"></i>
        ${isFound ? 'This is Mine' : 'I Found This'}
      </button>
    </div>
  `;

  cardsGrid.prepend(card);

  const imgEl = card.querySelector('img');
  if (imgEl) {
    imgEl.addEventListener('error', function () {
      this.src =
        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23f5f0e8'/%3E%3Ccircle cx='200' cy='130' r='40' fill='%23ffe566' stroke='%231a1a1a' stroke-width='3'/%3E%3Cpath d='M180 170 L220 170 L240 210 L160 210 Z' fill='%23c4b5fd' stroke='%231a1a1a' stroke-width='3'/%3E%3Ctext x='200' y='250' font-family='sans-serif' font-weight='800' font-size='15' fill='%231a1a1a' text-anchor='middle'%3EIMAGE NOT FOUND%3C/text%3E%3C/svg%3E";
      this.alt = 'Image not available';
    });
  }

  const foundButton = card.querySelector('.found-button');
  if (foundButton) {
    foundButton.addEventListener('click', function () {
      handleFoundButton(item.name);
    });
  }
}

function handleFoundButton(itemName) {
  alert(
    `Thanks for reaching out regarding "${itemName}".\n\n` +
    `Please reach out to the campus security desk or lost-and-found office to coordinate safe return.`
  );
}

// Attach listener to any static or existing cards
function setupExistingCardButtons() {
  document.querySelectorAll('.card .btn-small').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const card = btn.closest('.card');
      const title = card ? card.querySelector('h3')?.textContent.trim() : 'this item';
      handleFoundButton(title || 'this item');
    });
  });
}

// Search Filter
if (searchInput) {
  searchInput.addEventListener('input', function () {
    const searchTerm = searchInput.value.toLowerCase().trim();
    const cards = document.querySelectorAll('.card');

    cards.forEach(function (card) {
      const cardText = card.textContent.toLowerCase();
      if (!searchTerm || cardText.includes(searchTerm)) {
        card.style.display = '';
      } else {
        card.style.display = 'none';
      }
    });
  });
}

// Category Filter with Plural/Singular Normalization
filterButtons.forEach(function (button) {
  button.addEventListener('click', function () {
    filterButtons.forEach((btn) => btn.classList.remove('active'));
    button.classList.add('active');

    const filterCategory = (button.dataset.category || '').toLowerCase();
    const filterText = button.textContent.trim().toLowerCase();
    const cards = document.querySelectorAll('.card');

    cards.forEach(function (card) {
      if (filterCategory === 'all' || filterText === 'all items') {
        card.style.display = '';
        return;
      }

      const cardDatasetCategory = (card.dataset.category || '').toLowerCase();
      const badge = card.querySelector('.badge');
      const badgeCategory = (badge ? badge.textContent.trim() : '').toLowerCase();

      // Normalize root words (e.g. wallets -> wallet, bags -> bag)
      const rootFilter = filterCategory.replace(/s$/, '');
      const rootBadge = badgeCategory.replace(/s$/, '');

      const isMatch =
        cardDatasetCategory === filterCategory ||
        cardDatasetCategory === rootFilter ||
        badgeCategory.includes(rootFilter) ||
        rootBadge.includes(rootFilter);

      card.style.display = isMatch ? '' : 'none';
    });
  });
});

function saveItem(item) {
  try {
    let items = JSON.parse(localStorage.getItem('lostItems')) || [];
    items.unshift(item);
    items = items.slice(0, 20); // Keep last 20
    localStorage.setItem('lostItems', JSON.stringify(items));
  } catch (err) {
    console.warn('Could not save to localStorage:', err);
  }
}

function loadSavedItems() {
  try {
    const items = JSON.parse(localStorage.getItem('lostItems')) || [];
    items.reverse().forEach(function (item) {
      if (!item) return;
      const str = JSON.stringify(item).toLowerCase();
      if (str.includes('rashmika') || str.includes('mandana')) return;
      createItemCard(item);
    });
  } catch (err) {
    console.warn('Could not load from localStorage:', err);
  }
}

function resetImagePreview() {
  uploadedImageData = '';
  if (imagePreview) {
    imagePreview.src = '';
    imagePreview.style.display = 'none';
    imagePreview.hidden = true;
  }
  if (imagePreviewText) {
    imagePreviewText.style.display = 'block';
  }
  const uploadSubtitle = uploadArea?.querySelector('p');
  if (uploadSubtitle) {
    uploadSubtitle.textContent = 'Add a clear photo of your lost item';
  }
}

function showError(message) {
  if (!formError) return;
  formError.textContent = message;
  formError.style.display = 'block';
  formError.hidden = false;
  if (formSuccess) {
    formSuccess.textContent = '';
    formSuccess.style.display = 'none';
    formSuccess.hidden = true;
  }
  formError.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function showSuccess(message) {
  if (!formSuccess) return;
  formSuccess.textContent = message;
  formSuccess.style.display = 'block';
  formSuccess.hidden = false;
  if (formError) {
    formError.textContent = '';
    formError.style.display = 'none';
    formError.hidden = true;
  }
}

function escapeHTML(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Smooth scroll for internal links
document.querySelectorAll('a[href^="#"]').forEach(function (link) {
  link.addEventListener('click', function (e) {
    const targetID = this.getAttribute('href');
    if (targetID === '#' || !document.querySelector(targetID)) return;
    e.preventDefault();
    document.querySelector(targetID).scrollIntoView({ behavior: 'smooth' });
  });
});

// Set max date for picker to today
const dateInput = document.getElementById('itemDate');
if (dateInput) {
  const today = new Date().toISOString().split('T')[0];
  dateInput.max = today;
}

// Fallback for broken/not found images
function setupImageFallbacks() {
  const placeholderSVG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23f5f0e8'/%3E%3Ccircle cx='200' cy='130' r='40' fill='%23ffe566' stroke='%231a1a1a' stroke-width='3'/%3E%3Cpath d='M180 170 L220 170 L240 210 L160 210 Z' fill='%23c4b5fd' stroke='%231a1a1a' stroke-width='3'/%3E%3Ctext x='200' y='250' font-family='sans-serif' font-weight='800' font-size='15' fill='%231a1a1a' text-anchor='middle'%3EIMAGE NOT FOUND%3C/text%3E%3C/svg%3E";

  document.querySelectorAll('.card-image img').forEach(function (img) {
    img.addEventListener('error', function () {
      this.src = placeholderSVG;
      this.alt = 'Image not available';
    });
    if (img.complete && img.naturalWidth === 0) {
      this.src = placeholderSVG;
      this.alt = 'Image not available';
    }
  });
}

// Initialize on page load
setupExistingCardButtons();
loadSavedItems();
setupImageFallbacks();
