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

// Handle contribution form submission
const form = document.getElementById("contribution-form");
if (form) {
  const zipInput = document.getElementById("zip");
  const priceInput = document.getElementById("price");
  const currencySelect = document.getElementById("currency");

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

    // Collect a few fields for analytics
    const zip = zipInput ? zipInput.value.trim() : "";
    const priceValue = priceInput ? priceInput.value.trim() : "";
    const priceNumber = priceValue ? Number(priceValue) : null;
    const currency = currencySelect ? currencySelect.value : "";
    const saleFlagInput = form.querySelector('input[name="saleFlag"]:checked');
    const saleFlag = saleFlagInput ? saleFlagInput.value : "";

    // GA4 custom event: contribution_submit
    // Parameters here (zip, currency, sale_flag, value) are what you will
    // expose in GA via Custom dimensions/metrics.
    if (typeof gtag === "function") {
      gtag("event", "contribution_submit", {
        event_category: "contribution",
        event_label: "contribution_form",
        value: priceNumber ?? undefined,  // used as custom metric
        zip: zip || undefined,            // custom dimension
        currency: currency || undefined,  // custom dimension
        sale_flag: saleFlag || undefined, // custom dimension
      });
    }

    // Local console confirmation to help you debug in DevTools
    console.log("contribution_submit event fired", {
      zip,
      priceNumber,
      currency,
      saleFlag,
    });

    setFormMessage(
      "success",
      "Thank you! In this demo, your entry is not stored yet – but the submission flow is working."
    );

    form.reset();
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
