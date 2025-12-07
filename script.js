// script.js

// Footer year
const yearSpan = document.getElementById("year");
if (yearSpan) {
  yearSpan.textContent = new Date().getFullYear();
}

// Simple "Updated: Today" text on the index card
const dateSpan = document.getElementById("cpi-date");
if (dateSpan) {
  const today = new Date();
  const formatted = today.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  dateSpan.textContent = `Updated: ${formatted}`;
}

// Fake stats (placeholder values until you connect a data source)
const submissions = document.getElementById("stat-submissions");
const cities = document.getElementById("stat-cities");
const category = document.getElementById("stat-category");

if (submissions) submissions.textContent = "—";
if (cities) cities.textContent = "—";
if (category) category.textContent = "—";

// Utility: set form message text/state
function setFormMessage(type, text) {
  const messageEl = document.getElementById("form-message");
  if (!messageEl) return;

  messageEl.textContent = text || "";
  messageEl.classList.remove("success", "error");

  if (type === "success") {
    messageEl.classList.add("success");
  } else if (type === "error") {
    messageEl.classList.add("error");
  }
}

// Handle contribution form submission with multiple items
const form = document.getElementById("contribution-form");
if (form) {
  const zipInput = document.getElementById("zip");
  const currencySelect = document.getElementById("currency");
  const itemsContainer = document.getElementById("items-container");
  const addItemBtn = document.getElementById("add-item-btn");

  // Helper: create a single item row
  function createItemRow(id) {
    const row = document.createElement("div");
    row.className = "item-row";
    row.dataset.itemId = id;

    row.innerHTML = `
      <div class="item-fields">
        <input type="text" name="item-desc" class="item-desc" placeholder="e.g., 1 dozen eggs" required />
        <input type="number" name="item-price" class="item-price" step="0.01" min="0" placeholder="price e.g., 4.99" required />
        <select name="item-sale" class="item-sale">
          <option value="unspecified">Unspecified</option>
          <option value="sale">On sale</option>
          <option value="regular">Regular price</option>
        </select>
        <input type="text" name="item-note" class="item-note" placeholder="Note (brand, size, e.g., 'large, organic') (optional)" />
        <button type="button" class="btn tertiary remove-item-btn" title="Remove item">×</button>
      </div>
    `;

    const removeBtn = row.querySelector(".remove-item-btn");
    removeBtn.addEventListener("click", () => {
      // Ensure at least one row remains
      if (itemsContainer.children.length > 1) {
        row.remove();
      } else {
        // clear values instead of removing last row
        row.querySelectorAll("input, select").forEach((el) => {
          if (el.tagName === "INPUT") el.value = "";
          else if (el.tagName === "SELECT") el.value = "unspecified";
        });
      }
    });

    return row;
  }

  // Initialize with one item row
  function ensureInitialItem() {
    itemsContainer.innerHTML = "";
    itemsContainer.appendChild(createItemRow(1));
  }

  ensureInitialItem();

  // Add new item
  if (addItemBtn) {
    addItemBtn.addEventListener("click", () => {
      const nextId = itemsContainer.children.length + 1;
      itemsContainer.appendChild(createItemRow(nextId));
      // focus the new item's description
      const last = itemsContainer.lastElementChild;
      const desc = last.querySelector('.item-desc');
      if (desc) desc.focus();
    });
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault(); // prevent real submission for now

    // Basic ZIP validation: must be exactly 5 digits
    if (zipInput) {
      const zip = zipInput.value.trim();
      const zipValid = /^\d{5}$/.test(zip);

      if (!zipValid) {
        setFormMessage(
          "error",
          "Please enter a valid 5-digit ZIP code (e.g., 94103)."
        );
        zipInput.focus();
        return;
      }
    }

    // Collect items
    const itemRows = Array.from(itemsContainer.querySelectorAll('.item-row'));
    const items = [];
    for (const row of itemRows) {

      const descEl = row.querySelector('.item-desc');
      const priceEl = row.querySelector('.item-price');
      const saleEl = row.querySelector('.item-sale');
      const noteEl = row.querySelector('.item-note');

      const desc = descEl ? descEl.value.trim() : "";
      const priceRaw = priceEl ? priceEl.value.trim() : "";
      const price = priceRaw ? Number(priceRaw) : null;
      const sale = saleEl ? saleEl.value : "unspecified";
      const note = noteEl ? noteEl.value.trim() : "";

      // skip entirely blank rows
      if (!desc && (price === null || price === 0 || priceRaw === "")) continue;

      if (!desc) {
        setFormMessage('error', 'Please add a description for each item.');
        descEl.focus();
        return;
      }

      if (price === null || Number.isNaN(price)) {
        setFormMessage('error', 'Please provide a valid price for each item.');
        priceEl.focus();
        return;
      }

      items.push({ description: desc, price: price, sale: sale, note: note });
    }

    if (items.length === 0) {
      setFormMessage('error', 'Please enter at least one purchased item.');
      return;
    }

    const zip = zipInput ? zipInput.value.trim() : "";
    const currency = currencySelect ? currencySelect.value : "";
    const store = document.getElementById('store') ? document.getElementById('store').value.trim() : "";

    // Analytics / debug: total value and item count
    const totalValue = items.reduce((s, it) => s + (Number(it.price) || 0), 0);

    if (typeof gtag === "function") {
      gtag("event", "contribution_submit", {
        event_category: "contribution",
        event_label: "contribution_form",
        items_count: items.length,
        total_value: totalValue,
        zip: zip || undefined,
        currency: currency || undefined,
        store: store || undefined,
      });
    }

    console.log('contribution_submit', { zip, currency, store, items, totalValue });

    setFormMessage(
      "success",
      "Thanks — your entry is recorded in this demo. In a full build it would be saved to the database."
    );

    // Reset the form and leave one empty item row
    form.reset();
    ensureInitialItem();
  });
}

// "Use my location" button (geolocation + reverse geocode)
const useLocationBtn = document.getElementById("use-location-btn");
if (useLocationBtn) {
  const zipInput = document.getElementById("zip");

  useLocationBtn.addEventListener("click", () => {
    if (!navigator.geolocation) {
      setFormMessage(
        "error",
        "Location services are not supported in this browser."
      );
      return;
    }

    setFormMessage("success", "Detecting your location…");
    useLocationBtn.disabled = true;
    useLocationBtn.textContent = "Detecting…";

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;

          // Simple reverse geocode using OpenStreetMap Nominatim
          const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(
            latitude
          )}&lon=${encodeURIComponent(longitude)}&zoom=10&addressdetails=1`;

          const response = await fetch(url);
          if (!response.ok) {
            throw new Error("Reverse geocoding failed");
          }

          const data = await response.json();
          const postcode =
            data?.address?.postcode || data?.address?.postalcode || "";

          if (!postcode) {
            throw new Error("Could not determine ZIP code from location.");
          }

          // If postcode contains extra pieces (e.g., "94103-1234"), keep first 5 digits
          const match = postcode.match(/\d{5}/);
          if (!match) {
            throw new Error("Could not parse a 5-digit ZIP code.");
          }

          if (zipInput) {
            zipInput.value = match[0];
          }

          setFormMessage(
            "success",
            "Detected your location and filled in your ZIP code."
          );
        } catch (err) {
          console.error(err);
          setFormMessage(
            "error",
            "Sorry, we couldn't determine your ZIP code from your location."
          );
        } finally {
          useLocationBtn.disabled = false;
          useLocationBtn.textContent = "Use my location";
        }
      },
      (error) => {
        console.error(error);
        useLocationBtn.disabled = false;
        useLocationBtn.textContent = "Use my location";

        if (error.code === error.PERMISSION_DENIED) {
          setFormMessage(
            "error",
            "Location access was denied. You can still enter your ZIP code manually."
          );
        } else {
          setFormMessage(
            "error",
            "We couldn't get your location. Please enter your ZIP code manually."
          );
        }
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000,
      }
    );
  });
}
