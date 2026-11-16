/* ==========================================================================
   StudySprout — International Pricing & Storefront Preview Interactions
   ========================================================================== */

/**
 * 1. PRICING & EXCHANGE RATE CONFIGURATION
 * --------------------------------------------------------------------------
 * - BASE_PRICE_USD: The single source-of-truth price in US Dollars ($2.99).
 * - REFERENCE_RATES: Static reference multipliers relative to 1.00000 USD.
 *   These are reference rates for display estimation, not live market feeds.
 *   To update rates, modify the numeric `rate` values below.
 */
const PRICING_CONFIG = {
  BASE_PRICE_USD: 2.99,
  DEFAULT_CURRENCY: "USD",
  CURRENCIES: {
    USD: { code: "USD", locale: "en-US", rate: 1.00000, label: "US Dollar" },
    INR: { code: "INR", locale: "en-IN", rate: 93.8878, label: "Indian Rupee" },
    GBP: { code: "GBP", locale: "en-GB", rate: 0.75815, label: "British Pound" },
    EUR: { code: "EUR", locale: "de-DE", rate: 0.9088,  label: "Euro" },
    CAD: { code: "CAD", locale: "en-CA", rate: 1.4285,  label: "Canadian Dollar" },
    AUD: { code: "AUD", locale: "en-AU", rate: 1.48087, label: "Australian Dollar" }
  }
};

let activeCurrency = PRICING_CONFIG.DEFAULT_CURRENCY;

/**
 * Formats a USD base amount into the selected display currency using
 * standard Intl.NumberFormat localization and currency conventions.
 */
function formatConvertedPrice(usdAmount, currencyCode = activeCurrency) {
  const config =
    PRICING_CONFIG.CURRENCIES[currencyCode] ||
    PRICING_CONFIG.CURRENCIES[PRICING_CONFIG.DEFAULT_CURRENCY];

  const convertedAmount = usdAmount * config.rate;

  try {
    return new Intl.NumberFormat(config.locale, {
      style: "currency",
      currency: config.code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(convertedAmount);
  } catch (error) {
    // Safe fallback if a browser lacks specific locale data
    return `${config.code} ${convertedAmount.toFixed(2)}`;
  }
}

/**
 * Updates every price element across the DOM (cards, featured section,
 * buttons, FAQ mentions, and any currently open modal).
 */
function updateAllPrices(currencyCode) {
  if (!PRICING_CONFIG.CURRENCIES[currencyCode]) {
    currencyCode = PRICING_CONFIG.DEFAULT_CURRENCY;
  }

  activeCurrency = currencyCode;

  // Keep selector value synchronized
  const currencySelect = document.getElementById("currencySelect");
  if (currencySelect && currencySelect.value !== currencyCode) {
    currencySelect.value = currencyCode;
  }

  // Update all elements tagged with data-price-usd
  document.querySelectorAll("[data-price-usd]").forEach((el) => {
    const rawUsd = parseFloat(el.getAttribute("data-price-usd"));
    const baseUsd = Number.isFinite(rawUsd) ? rawUsd : PRICING_CONFIG.BASE_PRICE_USD;
    el.textContent = formatConvertedPrice(baseUsd, currencyCode);
  });

  // Update disclaimer text to reflect active display currency clearly
  const disclaimerEl = document.getElementById("currencyDisclaimer");
  if (disclaimerEl) {
    const baseFormatted = formatConvertedPrice(PRICING_CONFIG.BASE_PRICE_USD, "USD");
    if (currencyCode === "USD") {
      disclaimerEl.textContent = `Base price: ${baseFormatted} USD. Switch currencies in the top menu to view approximate prices using static reference rates.`;
    } else {
      const convertedFormatted = formatConvertedPrice(PRICING_CONFIG.BASE_PRICE_USD, currencyCode);
      const rateUsed = PRICING_CONFIG.CURRENCIES[currencyCode].rate;
      disclaimerEl.textContent = `Base price: ${baseFormatted} USD (≈ ${convertedFormatted} ${currencyCode} at static reference rate 1 USD = ${rateUsed} ${currencyCode}; not a live exchange rate).`;
    }
  }
}

/* ==========================================================================
   2. CURRENCY SELECTOR INITIALIZATION
   ========================================================================== */
const currencySelect = document.getElementById("currencySelect");
if (currencySelect) {
  currencySelect.value = PRICING_CONFIG.DEFAULT_CURRENCY;
  currencySelect.addEventListener("change", (event) => {
    updateAllPrices(event.target.value);
  });
}

// Render initial USD pricing on load
updateAllPrices(PRICING_CONFIG.DEFAULT_CURRENCY);

/* ==========================================================================
   3. MOBILE NAVIGATION MENU
   ========================================================================== */
const navToggle = document.getElementById("navToggle");
const siteNav = document.getElementById("siteNav");

if (navToggle && siteNav) {
  navToggle.addEventListener("click", () => {
    const isOpen = siteNav.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  siteNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      siteNav.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });

  // Close mobile menu on Escape key
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && siteNav.classList.contains("open")) {
      siteNav.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
      navToggle.focus();
    }
  });
}

/* ==========================================================================
   4. FAQ ACCORDION
   ========================================================================== */
document.querySelectorAll(".accordion-header").forEach((button) => {
  button.addEventListener("click", () => {
    const item = button.closest(".accordion-item");
    if (!item) return;

    const wasOpen = item.classList.contains("active");

    document.querySelectorAll(".accordion-item").forEach((other) => {
      other.classList.remove("active");
      const header = other.querySelector(".accordion-header");
      if (header) header.setAttribute("aria-expanded", "false");
    });

    if (!wasOpen) {
      item.classList.add("active");
      button.setAttribute("aria-expanded", "true");
    }
  });
});

/* ==========================================================================
   5. MODAL INTERACTIONS (6-Page Preview & Storefront Preview Notice)
   ========================================================================== */
const modal = document.getElementById("appModal");
const modalContent = document.getElementById("modalContent");
const modalClose = document.getElementById("modalClose");
let lastFocusedElement = null;

const PAGE_DETAILS = {
  "1": {
    badge: "Page 01 • A4 PDF",
    badgeClass: "bg-pink",
    title: "Planner Cover",
    description: "A gentle, minimalist cover page designed for The Soft Start Student Planner with fields for your name, academic term, and personal intention.",
    highlights: [
      "Clean A4 vertical layout ready for tablet covers or printed binders",
      "Soft pastel styling with calming typography",
      "Undated format usable in any semester or academic year"
    ]
  },
  "2": {
    badge: "Page 02 • A4 PDF",
    badgeClass: "bg-sage",
    title: "Weekly Study Planner",
    description: "Map out your subjects, weekly focus areas, and key study tasks in a calm overview without cramped hourly slots.",
    highlights: [
      "Dedicated space for top weekly priorities and subject goals",
      "Flexible undated day blocks you can duplicate each week",
      "Designed to reduce planning overwhelm"
    ]
  },
  "3": {
    badge: "Page 03 • A4 PDF",
    badgeClass: "bg-butter",
    title: "Daily Planner",
    description: "Structure a single study day around gentle priorities, focused study blocks, and wellbeing reminders.",
    highlights: [
      "Top priorities list to keep daily goals realistic",
      "Open task and study session blocks",
      "Space for daily reflections or energy check-ins"
    ]
  },
  "4": {
    badge: "Page 04 • A4 PDF",
    badgeClass: "bg-lavender",
    title: "Assignments Tracker",
    description: "Keep all coursework, essays, lab reports, and project deadlines visible in one organized A4 spread.",
    highlights: [
      "Columns for subject, assignment title, due date, and status",
      "Clear completion checkboxes for visual progress",
      "Duplicate the page whenever a new term begins"
    ]
  },
  "5": {
    badge: "Page 05 • A4 PDF",
    badgeClass: "bg-peach",
    title: "Exam & Revision Tracker",
    description: "Break down exam subjects into manageable syllabus topics and track multiple revision passes.",
    highlights: [
      "Topic-by-topic confidence and revision progress tracking",
      "Exam date countdown and key focus notes",
      "Ideal for midterms, finals, and standardized tests"
    ]
  },
  "6": {
    badge: "Page 06 • A4 PDF",
    badgeClass: "bg-pink",
    title: "Habit Tracker & Notes",
    description: "Pair gentle daily study habits with a versatile dot-grid notes space for brain dumps, formulas, or quick reminders.",
    highlights: [
      "Simple habit tracking grid for steady routines",
      "Clean dot-grid notes area for freeform writing or sketching",
      "Completes the core 6-page A4 student planner set"
    ]
  }
};

function openPageModal(pageNumber) {
  if (!modal || !modalContent) return;
  const info = PAGE_DETAILS[String(pageNumber)];
  if (!info) return;

  lastFocusedElement = document.activeElement;
  const formattedPrice = formatConvertedPrice(PRICING_CONFIG.BASE_PRICE_USD, activeCurrency);

  modalContent.innerHTML = `
    <span class="modal-pill ${info.badgeClass}">${info.badge}</span>
    <h3 id="modalTitle">${info.title}</h3>
    <p>${info.description}</p>
    <ul class="modal-highlights">
      ${info.highlights.map((item) => `<li>✦ ${item}</li>`).join("")}
    </ul>
    <div class="modal-price-box">
      <span class="modal-price-value">Included in The Soft Start Student Planner — <span data-price-usd="${PRICING_CONFIG.BASE_PRICE_USD}">${formattedPrice}</span></span>
      <span class="modal-price-sub">Six-page A4 digital PDF • Base price $2.99 USD (reference currency conversion)</span>
    </div>
  `;

  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  if (modalClose) modalClose.focus();
}

function openProductPreviewModal() {
  if (!modal || !modalContent) return;

  lastFocusedElement = document.activeElement;
  const formattedPrice = formatConvertedPrice(PRICING_CONFIG.BASE_PRICE_USD, activeCurrency);
  const usdFormatted = formatConvertedPrice(PRICING_CONFIG.BASE_PRICE_USD, "USD");
  const rateNote =
    activeCurrency === "USD"
      ? "Anchored at $2.99 USD."
      : `Anchored at ${usdFormatted} USD (shown in ${activeCurrency} using static reference exchange rates).`;

  modalContent.innerHTML = `
    <span class="modal-pill bg-sage">Storefront Preview</span>
    <h3 id="modalTitle">The Soft Start Student Planner</h3>
    <p>Six-page A4 digital PDF planner designed for calm, distraction-free student organization.</p>
    <div class="modal-price-box">
      <span class="modal-price-value" data-price-usd="${PRICING_CONFIG.BASE_PRICE_USD}">${formattedPrice}</span>
      <span class="modal-price-sub">${rateNote}</span>
    </div>
    <ul class="modal-highlights">
      <li>✦ Includes all 6 undated A4 PDF pages</li>
      <li>✦ Checkout and digital downloads are currently disabled while payment setup is pending</li>
      <li>✦ No payment or personal billing details are collected on this preview site</li>
    </ul>
    <div class="modal-actions">
      <button type="button" class="btn btn-disabled btn-full" disabled aria-disabled="true">
        Checkout &amp; Download Disabled (Preview Mode)
      </button>
    </div>
  `;

  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  if (modalClose) modalClose.focus();
}

function closeModal() {
  if (!modal || !modal.classList.contains("open")) return;
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
    lastFocusedElement.focus();
  }
}

if (modalClose) {
  modalClose.addEventListener("click", closeModal);
}

if (modal) {
  modal.addEventListener("click", (event) => {
    if (event.target === modal) closeModal();
  });
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && modal && modal.classList.contains("open")) {
    closeModal();
  }
});

document.querySelectorAll(".page-card").forEach((card) => {
  const pageNum = card.getAttribute("data-page");
  const showPage = () => openPageModal(pageNum);

  card.addEventListener("click", showPage);
  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      showPage();
    }
  });
});

document.querySelectorAll(".info-modal-trigger").forEach((button) => {
  button.addEventListener("click", openProductPreviewModal);
});

/* ==========================================================================
   6. SCROLL REVEAL ANIMATION
   ========================================================================== */
const fadeElements = document.querySelectorAll(".fade-in");
if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries, currentObserver) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          currentObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  fadeElements.forEach((element) => observer.observe(element));
} else {
  fadeElements.forEach((element) => element.classList.add("visible"));
}
