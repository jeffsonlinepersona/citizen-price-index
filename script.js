// script.js

// Footer year
const yearSpan = document.getElementById("year");
if (yearSpan) {
  yearSpan.textContent = new Date().getFullYear();
}

// Simple "Updated: Today" text
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

// Fake stats (you can replace with real data later)
const submissions = document.getElementById("stat-submissions");
const cities = document.getElementById("stat-cities");
const category = document.getElementById("stat-category");

if (submissions) submissions.textContent = "—";
if (cities) cities.textContent = "—";
if (category) category.textContent = "—";

// Handle contribution form (demo only)
const form = document.getElementById("contribution-form");
if (form) {
  const messageEl = document.getElementById("form-message");

  form.addEventListener("submit", (event) => {
    event.preventDefault(); // prevent real submission for now

    if (messageEl) {
      messageEl.textContent =
        "Thank you! In this demo, your entry is not stored yet – but the submission flow is working.";
      messageEl.classList.remove("error");
      messageEl.classList.add("success");
    }

    form.reset();
  });
}
