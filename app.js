import { firebaseConfig, isFirebaseConfigured } from "./firebase-config.js";

const elements = {
  authScreen: document.querySelector("#auth-screen"),
  authHeading: document.querySelector("#auth-heading"),
  authCopy: document.querySelector("#auth-copy"),
  authMessage: document.querySelector("#auth-message"),
  metalPricesToggle: document.querySelector("#metal-prices-toggle"),
  goldPriceValue: document.querySelector("#gold-price-value"),
  silverPriceValue: document.querySelector("#silver-price-value"),
  gold10kPrice: document.querySelector("#gold-10k-price"),
  gold14kPrice: document.querySelector("#gold-14k-price"),
  gold18kPrice: document.querySelector("#gold-18k-price"),
  gold24kPrice: document.querySelector("#gold-24k-price"),
  metalPricesUpdated: document.querySelector("#metal-prices-updated"),
  authMethods: document.querySelector("#auth-methods"),
  loginView: document.querySelector("#login-view"),
  signUpView: document.querySelector("#sign-up-view"),
  emailAuthForm: document.querySelector("#email-auth-form"),
  authEmail: document.querySelector("#auth-email"),
  authPassword: document.querySelector("#auth-password"),
  rememberMe: document.querySelector("#remember-me"),
  signUpForm: document.querySelector("#email-sign-up-form"),
  signUpFirstName: document.querySelector("#sign-up-first-name"),
  signUpEmail: document.querySelector("#sign-up-email"),
  signUpPassword: document.querySelector("#sign-up-password"),
  signUpRememberMe: document.querySelector("#sign-up-remember-me"),
  emailLogin: document.querySelector("#email-login"),
  emailSignUp: document.querySelector("#email-sign-up"),
  googleSignIn: document.querySelector("#google-sign-in"),
  googleSignUp: document.querySelector("#google-sign-up"),
  forgotPassword: document.querySelector("#forgot-password"),
  showSignUp: document.querySelector("#show-sign-up"),
  showLogIn: document.querySelector("#show-log-in"),
  currencySelect: document.querySelector("#currency-select"),
  appShell: document.querySelector("#app-shell"),
  accountBar: document.querySelector("#account-bar"),
  accountName: document.querySelector("#account-name"),
  signOut: document.querySelector("#sign-out"),
  jobsTab: document.querySelector("#jobs-tab"),
  summaryTab: document.querySelector("#summary-tab"),
  lookupTab: document.querySelector("#lookup-tab"),
  jobsView: document.querySelector("#jobs-view"),
  summaryView: document.querySelector("#summary-view"),
  lookupView: document.querySelector("#lookup-view"),
  lookupReference: document.querySelector("#lookup-reference"),
  lookupResults: document.querySelector("#lookup-results"),
  lookupMessage: document.querySelector("#lookup-message"),
  lookupDetailPanel: document.querySelector("#lookup-detail-panel"),
  lookupDetail: document.querySelector("#lookup-detail"),
  roleBadge: document.querySelector("#role-badge"),
  summaryDate: document.querySelector("#summary-date"),
  calendarMonthLabel: document.querySelector("#calendar-month-label"),
  calendarGrid: document.querySelector("#calendar-grid"),
  previousMonth: document.querySelector("#previous-month"),
  nextMonth: document.querySelector("#next-month"),
  todayButton: document.querySelector("#today-button"),
  calendarMonthTotal: document.querySelector("#calendar-month-total"),
  selectedDayPanel: document.querySelector("#selected-day-panel"),
  selectedDayDate: document.querySelector("#selected-day-date"),
  selectedDayHolidays: document.querySelector("#selected-day-holidays"),
  selectedDayList: document.querySelector("#selected-day-list"),
  selectedDayEmpty: document.querySelector("#selected-day-empty"),
  selectedDayEmptyHoliday: document.querySelector("#selected-day-empty-holiday"),
  summaryError: document.querySelector("#summary-error"),
  bagsDate: document.querySelector("#bags-date"),
  form: document.querySelector("#job-form"),
  reference: document.querySelector("#job-reference"),
  referenceField: document.querySelector("#reference-field"),
  noJobBag: document.querySelector("#no-job-bag"),
  itemNumberField: document.querySelector("#item-number-field"),
  itemNumber: document.querySelector("#item-number"),
  repairTime: document.querySelector("#repair-time"),
  itemType: document.querySelector("#item-type"),
  material: document.querySelector("#material"),
  materialField: document.querySelector("#material-field"),
  goldColourSection: document.querySelector("#gold-colour-section"),
  goldColour: document.querySelector("#gold-colour"),
  customSection: document.querySelector("#custom-section"),
  customItem: document.querySelector("#custom-item"),
  customPrice: document.querySelector("#custom-price"),
  ringSection: document.querySelector("#ring-section"),
  otherWorkLabel: document.querySelector("#other-work-label"),
  widthChoices: document.querySelector("#width-choices"),
  taskList: document.querySelector("#task-list"),
  otherWorkEnabled: document.querySelector("#other-work-enabled"),
  otherWorkFields: document.querySelector("#other-work-fields"),
  otherWorkName: document.querySelector("#other-work-name"),
  otherWorkPrice: document.querySelector("#other-work-price"),
  taskHint: document.querySelector("#task-hint"),
  taskFootnote: document.querySelector("#task-footnote"),
  estimate: document.querySelector("#estimate-value"),
  formError: document.querySelector("#form-error"),
  bagList: document.querySelector("#bag-list"),
  emptyState: document.querySelector("#empty-state"),
  bagsTotal: document.querySelector("#bags-total"),
  totalValue: document.querySelector("#total-value"),
  bagCount: document.querySelector("#bag-count"),
  headingCount: document.querySelector("#heading-count"),
  averageValue: document.querySelector("#average-value"),
  listTotal: document.querySelector("#list-total"),
  toast: document.querySelector("#toast"),
};

let catalog;
let holidayDefinitions = [];
let jobs = [];
let currentUser = null;
let canEdit = false;
let summaryHasDaySelection = false;
let summaryRequest = 0;
let lookupRequest = 0;
let lookupIndex = {};
let lookupLoading = false;
let lookupLoadedAt = 0;
let database;
let firebaseAuth;
let firebaseModules;
let unsubscribeMembership;
let unsubscribeDay;
let activeDay = "";
let toastTimeout;
let lastActivityWriteAt = 0;
const GRAMS_PER_TROY_OUNCE = 31.1034768;

function haptic(duration = 12) {
  if ("vibrate" in navigator) navigator.vibrate(duration);
}

function celebrateJobAdded() {
  const button = elements.form.querySelector('button[type="submit"]');
  const buttonBounds = button.getBoundingClientRect();
  const burst = document.createElement("div");
  burst.className = "confetti-burst";
  burst.setAttribute("aria-hidden", "true");
  burst.style.left = `${buttonBounds.left + buttonBounds.width / 2}px`;
  burst.style.top = `${buttonBounds.top + buttonBounds.height / 2}px`;
  const colors = ["#65704e", "#c5a96e", "#d88b70", "#8997b4", "#e7c96a"];
  const count = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 16 : 36;
  for (let index = 0; index < count; index += 1) {
    const angle = Math.random() * Math.PI * 2;
    const distance = 48 + Math.random() * 112;
    const piece = document.createElement("span");
    piece.className = "confetti-piece";
    piece.style.setProperty("--confetti-x", `${Math.cos(angle) * distance}px`);
    piece.style.setProperty("--confetti-y", `${Math.sin(angle) * distance - 28}px`);
    piece.style.setProperty("--confetti-spin", `${Math.random() * 540 - 270}deg`);
    piece.style.setProperty("--confetti-delay", `${Math.random() * 90}ms`);
    piece.style.setProperty("--confetti-color", colors[Math.floor(Math.random() * colors.length)]);
    burst.append(piece);
  }
  document.body.append(burst);
  setTimeout(() => burst.remove(), 1000);
}

function torontoDateKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Toronto",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function calendarMonthDates(dateKey) {
  const [year, month] = dateKey.split("-").map(Number);
  const dayCount = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return Array.from({ length: dayCount }, (_, index) => `${year}-${String(month).padStart(2, "0")}-${String(index + 1).padStart(2, "0")}`);
}

function calendarGridDates(monthDates) {
  const firstDate = new Date(`${monthDates[0]}T12:00:00Z`);
  const lastDate = new Date(`${monthDates[monthDates.length - 1]}T12:00:00Z`);
  const gridStart = new Date(Date.UTC(
    firstDate.getUTCFullYear(),
    firstDate.getUTCMonth(),
    firstDate.getUTCDate() - firstDate.getUTCDay(),
  ));
  const gridEnd = new Date(Date.UTC(
    lastDate.getUTCFullYear(),
    lastDate.getUTCMonth(),
    lastDate.getUTCDate() + 6 - lastDate.getUTCDay(),
  ));
  const dates = [];
  for (const date = new Date(gridStart); date <= gridEnd; date.setUTCDate(date.getUTCDate() + 1)) {
    dates.push(date.toISOString().slice(0, 10));
  }
  return dates;
}

function dateKeyFromUtcDate(date) {
  return date.toISOString().slice(0, 10);
}

const HOLIDAY_WEEKDAYS = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};
const HOLIDAY_KINDS = new Set(["general", "valentine", "canada", "christmas", "halloween", "birthday"]);

function nthWeekdayOfMonth(year, month, weekday, occurrence) {
  const firstWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const day = 1 + (weekday - firstWeekday + 7) % 7 + (occurrence - 1) * 7;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function easterSundayDateKey(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = (h + l - 7 * m + 114) % 31 + 1;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function validateHolidayDefinitions(definitions) {
  if (!Array.isArray(definitions)) throw new Error("holidays.json must contain a holidays array.");
  definitions.forEach((holiday, index) => {
    const entry = `holidays.json entry ${index + 1}`;
    if (!holiday || typeof holiday !== "object" || Array.isArray(holiday)) {
      throw new Error(`${entry} must be an object.`);
    }
    if (typeof holiday.name !== "string" || !holiday.name.trim()) {
      throw new Error(`${entry} needs a non-empty name.`);
    }
    if (typeof holiday.emoji !== "string" || !holiday.emoji.trim()) {
      throw new Error(`${entry} needs an emoji.`);
    }
    if (holiday.kind !== undefined && !HOLIDAY_KINDS.has(holiday.kind)) {
      throw new Error(`${entry} has an unsupported kind.`);
    }
    const validMonth = Number.isInteger(holiday.month) && holiday.month >= 1 && holiday.month <= 12;
    const validDay = (month, day) => Number.isInteger(day)
      && day >= 1
      && day <= new Date(Date.UTC(2000, month, 0)).getUTCDate();
    switch (holiday.type) {
      case "annual":
        if (!validMonth || !validDay(holiday.month, holiday.day)) throw new Error(`${entry} has an invalid annual month or day.`);
        break;
      case "nth-weekday":
        if (!validMonth
          || !Object.prototype.hasOwnProperty.call(HOLIDAY_WEEKDAYS, holiday.weekday)
          || !Number.isInteger(holiday.occurrence)
          || holiday.occurrence < 1
          || holiday.occurrence > 5) {
          throw new Error(`${entry} needs a valid month, weekday, and occurrence (1-5).`);
        }
        break;
      case "weekday-on-or-before":
        if (!validMonth
          || !validDay(holiday.month, holiday.day)
          || !Object.prototype.hasOwnProperty.call(HOLIDAY_WEEKDAYS, holiday.weekday)) {
          throw new Error(`${entry} needs a valid month, day, and weekday.`);
        }
        break;
      case "easter-offset":
        if (!Number.isInteger(holiday.offsetDays)) throw new Error(`${entry} needs an integer offsetDays value.`);
        break;
      case "one-off": {
        const date = typeof holiday.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(holiday.date)
          ? new Date(`${holiday.date}T12:00:00Z`)
          : null;
        if (!date || Number.isNaN(date.getTime()) || dateKeyFromUtcDate(date) !== holiday.date) {
          throw new Error(`${entry} needs a valid YYYY-MM-DD date.`);
        }
        break;
      }
      default:
        throw new Error(`${entry} has an unsupported type.`);
    }
  });
  return definitions;
}

function configuredHolidaysForGrid(calendarDates, definitions) {
  const years = new Set(calendarDates.map((dateKey) => Number(dateKey.slice(0, 4))));
  const visibleDates = new Set(calendarDates);
  const holidays = new Map();
  const addHoliday = (dateKey, definition) => {
    if (!visibleDates.has(dateKey)) return;
    const entries = holidays.get(dateKey) || [];
    entries.push({
      name: definition.name.trim(),
      emoji: definition.emoji,
      kind: definition.kind || "general",
    });
    holidays.set(dateKey, entries);
  };
  for (const definition of definitions) {
    if (definition.type === "one-off") {
      addHoliday(definition.date, definition);
      continue;
    }
    for (const year of years) {
      let dateKey;
      if (definition.type === "annual") {
        const date = new Date(Date.UTC(year, definition.month - 1, definition.day));
        if (date.getUTCMonth() !== definition.month - 1 || date.getUTCDate() !== definition.day) continue;
        dateKey = dateKeyFromUtcDate(date);
      } else if (definition.type === "nth-weekday") {
        dateKey = nthWeekdayOfMonth(year, definition.month, HOLIDAY_WEEKDAYS[definition.weekday], definition.occurrence);
        if (Number(dateKey.slice(5, 7)) !== definition.month) continue;
      } else if (definition.type === "weekday-on-or-before") {
        const date = new Date(Date.UTC(year, definition.month - 1, definition.day));
        const targetWeekday = HOLIDAY_WEEKDAYS[definition.weekday];
        date.setUTCDate(date.getUTCDate() - (date.getUTCDay() - targetWeekday + 7) % 7);
        dateKey = dateKeyFromUtcDate(date);
      } else {
        const date = new Date(`${easterSundayDateKey(year)}T12:00:00Z`);
        date.setUTCDate(date.getUTCDate() + definition.offsetDays);
        dateKey = dateKeyFromUtcDate(date);
      }
      addHoliday(dateKey, definition);
    }
  }
  return holidays;
}

function fullMoonJulianDate(lunation) {
  // Meeus's phase approximation uses a half-step from each new-moon lunation.
  const k = lunation + 0.5;
  const t = k / 1236.85;
  const t2 = t * t;
  const t3 = t2 * t;
  const t4 = t3 * t;
  const sinDegrees = (angle) => Math.sin(angle * Math.PI / 180);
  const solarAnomaly = 2.5534 + 29.10535670 * k - 0.0000014 * t2 - 0.00000011 * t3;
  const lunarAnomaly = 201.5643 + 385.81693528 * k + 0.0107582 * t2 + 0.00001238 * t3 - 0.000000058 * t4;
  const latitudeArgument = 160.7108 + 390.67050284 * k - 0.0016118 * t2 - 0.00000227 * t3 + 0.000000011 * t4;
  const jde = 2451550.09766 + 29.530588861 * k + 0.00015437 * t2 - 0.000000150 * t3 + 0.00000000073 * t4;
  const phaseCorrection =
    (0.1734 - 0.000393 * t) * sinDegrees(solarAnomaly)
    + 0.0021 * sinDegrees(2 * solarAnomaly)
    - 0.4068 * sinDegrees(lunarAnomaly)
    + 0.0161 * sinDegrees(2 * lunarAnomaly)
    - 0.0004 * sinDegrees(3 * lunarAnomaly)
    + 0.0104 * sinDegrees(2 * latitudeArgument)
    - 0.0051 * sinDegrees(solarAnomaly + lunarAnomaly)
    - 0.0074 * sinDegrees(solarAnomaly - lunarAnomaly)
    + 0.0004 * sinDegrees(2 * latitudeArgument + solarAnomaly)
    - 0.0004 * sinDegrees(2 * latitudeArgument - solarAnomaly)
    - 0.0006 * sinDegrees(2 * latitudeArgument + lunarAnomaly)
    + 0.0010 * sinDegrees(2 * latitudeArgument - lunarAnomaly)
    + 0.0005 * sinDegrees(solarAnomaly + 2 * lunarAnomaly);
  const planetaryCorrection =
    0.000325 * sinDegrees(299.77 + 0.107408 * k - 0.009173 * t2)
    + 0.000165 * sinDegrees(251.88 + 0.016321 * k)
    + 0.000164 * sinDegrees(251.83 + 26.651886 * k)
    + 0.000126 * sinDegrees(349.42 + 36.412478 * k)
    + 0.000110 * sinDegrees(84.66 + 18.206239 * k)
    + 0.000062 * sinDegrees(141.74 + 53.303771 * k)
    + 0.000060 * sinDegrees(207.14 + 2.453732 * k)
    + 0.000056 * sinDegrees(154.84 + 7.306860 * k)
    + 0.000047 * sinDegrees(34.52 + 27.261239 * k)
    + 0.000042 * sinDegrees(207.19 + 0.121824 * k)
    + 0.000040 * sinDegrees(291.34 + 1.844379 * k)
    + 0.000037 * sinDegrees(161.72 + 24.198154 * k)
    + 0.000035 * sinDegrees(239.56 + 25.513099 * k)
    + 0.000023 * sinDegrees(331.55 + 3.592518 * k);
  return jde + phaseCorrection + planetaryCorrection;
}

function terrestrialTimeOffsetSeconds(year) {
  if (year >= 2150) {
    const centuriesSince1820 = (year - 1820) / 100;
    return -20 + 32 * centuriesSince1820 ** 2;
  }
  if (year >= 2050) {
    const centuriesSince1820 = (year - 1820) / 100;
    return -20 + 32 * centuriesSince1820 ** 2 - 0.5628 * (2150 - year);
  }
  if (year >= 2005 && year < 2050) {
    const yearsSince2000 = year - 2000;
    return 62.92 + 0.32217 * yearsSince2000 + 0.005589 * yearsSince2000 ** 2;
  }
  if (year >= 1986) {
    const yearsSince2000 = year - 2000;
    return 63.86
      + 0.3345 * yearsSince2000
      - 0.060374 * yearsSince2000 ** 2
      + 0.0017275 * yearsSince2000 ** 3
      + 0.000651814 * yearsSince2000 ** 4
      + 0.00002373599 * yearsSince2000 ** 5;
  }
  return 69;
}

function fullMoonDatesForGrid(calendarDates) {
  const firstDay = Date.parse(`${calendarDates[0]}T00:00:00Z`) - 86_400_000;
  const lastDay = Date.parse(`${calendarDates[calendarDates.length - 1]}T23:59:59Z`) + 86_400_000;
  const startJulianDate = 2440587.5 + firstDay / 86_400_000;
  const endJulianDate = 2440587.5 + lastDay / 86_400_000;
  const firstLunation = Math.floor((startJulianDate - 2451550.09766) / 29.530588861) - 1;
  const lastLunation = Math.ceil((endJulianDate - 2451550.09766) / 29.530588861) + 1;
  const visibleDates = new Set(calendarDates);
  const fullMoonDates = new Set();
  for (let lunation = firstLunation; lunation <= lastLunation; lunation += 1) {
    const julianDate = fullMoonJulianDate(lunation);
    const terrestrialTimestamp = (julianDate - 2440587.5) * 86_400_000;
    const year = new Date(terrestrialTimestamp).getUTCFullYear();
    const fullMoonDate = torontoDateKey(new Date(terrestrialTimestamp - terrestrialTimeOffsetSeconds(year) * 1000));
    if (visibleDates.has(fullMoonDate)) fullMoonDates.add(fullMoonDate);
  }
  return fullMoonDates;
}

function shiftMonthDateKey(dateKey, offset) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const targetMonth = new Date(Date.UTC(year, month - 1 + offset, 1));
  const targetYear = targetMonth.getUTCFullYear();
  const targetMonthNumber = targetMonth.getUTCMonth() + 1;
  const targetDay = Math.min(day, new Date(Date.UTC(targetYear, targetMonthNumber, 0)).getUTCDate());
  return `${targetYear}-${String(targetMonthNumber).padStart(2, "0")}-${String(targetDay).padStart(2, "0")}`;
}

function formatDay(dateKey) {
  const date = new Date(`${dateKey}T12:00:00Z`);
  return new Intl.DateTimeFormat(undefined, {
    timeZone: "UTC",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

function roundToNearestFive(amount) {
  return Math.round(amount / 5) * 5;
}

function formatCurrency(amount, options = {}) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: elements.currencySelect.value,
    currencyDisplay: "narrowSymbol",
    ...options,
  }).formatToParts(amount)
    .map((part) => part.type === "currency" ? "$" : part.value)
    .join("");
}

function money(amount) {
  return formatCurrency(amount, {
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

async function fetchMetalSpotQuote(symbol) {
  const response = await fetch(`https://api.gold-api.com/price/${symbol}/CAD`, { cache: "no-store" });
  if (!response.ok) throw new Error(`${symbol} price request failed (HTTP ${response.status}).`);

  const quote = await response.json();
  if (quote.symbol !== symbol || quote.currency !== "CAD" || !Number.isFinite(quote.price) || quote.price <= 0) {
    throw new Error(`${symbol} price response did not contain a valid CAD quote.`);
  }
  return quote;
}

function spotPerGram(pricePerOunce) {
  return money(pricePerOunce / GRAMS_PER_TROY_OUNCE);
}

function formatQuoteUpdatedAt(quote) {
  const updatedAt = new Date(quote.updatedAt);
  if (Number.isNaN(updatedAt.getTime())) return null;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Toronto",
  }).format(updatedAt);
}

async function loadMetalSpotPrices() {
  const [goldResult, silverResult] = await Promise.allSettled([
    fetchMetalSpotQuote("XAU"),
    fetchMetalSpotQuote("XAG"),
  ]);
  const updatedAtValues = [];

  if (goldResult.status === "fulfilled") {
    const gold = goldResult.value;
    const pureGoldPerGram = gold.price / GRAMS_PER_TROY_OUNCE;
    elements.gold10kPrice.textContent = money(Math.round(pureGoldPerGram * 10 / 24));
    elements.gold14kPrice.textContent = money(Math.round(pureGoldPerGram * 14 / 24));
    elements.gold18kPrice.textContent = money(Math.round(pureGoldPerGram * 18 / 24));
    elements.gold24kPrice.textContent = money(Math.round(pureGoldPerGram));
    elements.goldPriceValue.textContent = money(Math.round(pureGoldPerGram));
    const updatedAt = formatQuoteUpdatedAt(gold);
    if (updatedAt) updatedAtValues.push(`Gold ${updatedAt}`);
  } else {
    console.error("Could not load live gold spot price:", goldResult.reason);
    elements.gold10kPrice.textContent = "Unavailable";
    elements.gold14kPrice.textContent = "Unavailable";
    elements.gold18kPrice.textContent = "Unavailable";
    elements.gold24kPrice.textContent = "Unavailable";
    elements.goldPriceValue.textContent = "Unavailable";
  }

  if (silverResult.status === "fulfilled") {
    const silver = silverResult.value;
    elements.silverPriceValue.textContent = spotPerGram(silver.price);
    const updatedAt = formatQuoteUpdatedAt(silver);
    if (updatedAt) updatedAtValues.push(`Silver ${updatedAt}`);
  } else {
    console.error("Could not load live silver spot price:", silverResult.reason);
    elements.silverPriceValue.textContent = "Unavailable";
  }

  elements.metalPricesUpdated.textContent = updatedAtValues.length
    ? `Updated ${updatedAtValues.join(" · ")}. Refreshes every five minutes.`
    : "Update time unavailable. Refreshes every five minutes.";
  elements.metalPricesToggle.setAttribute(
    "aria-label",
    `Live metal prices. Gold 24 karat ${elements.goldPriceValue.textContent} CAD per gram. Expand for silver and other gold karats.`,
  );
}

function taskRates(type, task) {
  const rates = catalog.ratesCAD[task.rateGroup || type];
  const material = type === "watch"
    ? null
    : catalog.materials.find((entry) => entry.id === elements.material.value);
  const widthInput = elements.form.querySelector('input[name="ring-width"]:checked');
  const width = type === "ring" && widthInput
    ? catalog.ringWidths.find((entry) => entry.id === widthInput.value)
    : null;
  if (task.materialPriceTable) {
    const price = rates[task.materialPriceTable]?.[material?.id];
    if (Number.isFinite(price)) return { unit: price, additional: null, setup: 0 };
    if (price && Number.isFinite(price.first) && Number.isFinite(price.additional)) {
      return { unit: price.first, additional: price.additional, setup: 0 };
    }
    return null;
  }
  if (task.priceTable) {
    const table = rates[task.priceTable];
    const price = type === "ring"
      ? table[width?.id]?.[material?.id]
      : table[material?.id];
    if (price === undefined) return null;
    return typeof price === "number"
      ? { unit: price, additional: null, setup: 0 }
      : { unit: price.first, additional: price.additional ?? null, setup: 0 };
  }
  return {
    unit: rates[task.priceKey],
    additional: task.additionalPriceKey ? rates[task.additionalPriceKey] : null,
    setup: task.setupPriceKey ? rates[task.setupPriceKey] : 0,
  };
}

function taskPriceDescription(task, rates) {
  if (!rates) return "";
  if (task.characterFactor) return `${money(rates.setup)} setup fee + ${money(rates.unit)} per character`;
  if (task.priceTable && rates.additional === null) return money(rates.unit);
  if (rates.additional !== null) {
    const unit = task.quantityLabel?.toLowerCase().replace(/s$/, "");
    return unit
      ? `${money(rates.unit)} for the first ${unit}; ${money(rates.additional)} for each additional ${unit}`
      : `${money(rates.unit)} for the first; ${money(rates.additional)} for each additional`;
  }
  if (task.quantityLabel) {
    const unit = task.quantityLabel.toLowerCase().replace(/s$/, "");
    return `${money(rates.unit)} per ${unit}`;
  }
  return money(rates.unit);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
}

function initializeCatalog(data) {
  if (!data || !Array.isArray(data.materials) || !Array.isArray(data.goldColors) || !Array.isArray(data.ringWidths) || !data.tasks || !data.ratesCAD) {
    throw new Error("The pricing catalog is missing materials, gold colours, ring widths, rates, or tasks.");
  }
  for (const type of ["ring", "necklace", "bracelet", "watch"]) {
    if (!Array.isArray(data.tasks[type]) || data.tasks[type].length === 0) {
      throw new Error(`The pricing catalog needs at least one ${type} task.`);
    }
  }
  const hasValidRates = (value) => Number.isFinite(value) && value >= 0
    || Boolean(value) && typeof value === "object" && !Array.isArray(value)
      && Object.keys(value).length > 0 && Object.values(value).every(hasValidRates);
  for (const [group, rates] of Object.entries(data.ratesCAD)) {
    if (!Object.values(rates).every(hasValidRates)) {
      throw new Error(`Every ${group} rate must be a non-negative number in ratesCAD.`);
    }
  }
  for (const [type, tasks] of Object.entries(data.tasks)) {
    if (!tasks.every((task) => {
      const rates = data.ratesCAD[task.rateGroup || type];
      return rates
        && (task.priceTable
          ? rates[task.priceTable] && typeof rates[task.priceTable] === "object"
          : task.materialPriceTable
            ? rates[task.materialPriceTable]
              && typeof rates[task.materialPriceTable] === "object"
              && Object.keys(rates[task.materialPriceTable]).length > 0
              && Object.values(rates[task.materialPriceTable]).every((rate) => Number.isFinite(rate)
                || Boolean(rate) && Number.isFinite(rate.first) && Number.isFinite(rate.additional))
            : Number.isFinite(rates[task.priceKey]))
        && (task.additionalPriceKey === undefined || Number.isFinite(rates[task.additionalPriceKey]))
        && (task.setupPriceKey === undefined || Number.isFinite(rates[task.setupPriceKey]))
        && (task.characterFactor !== true || Boolean(task.setupPriceKey));
    })) {
      throw new Error(`Every ${type} task must reference valid ratesCAD entries.`);
    }
  }
  catalog = data;
  renderOptions();
  render();
}

function renderOptions() {
  elements.itemType.innerHTML = [
    ["ring", "Ring"],
    ["necklace", "Necklace"],
    ["bracelet", "Bracelet"],
    ["watch", "Watch"],
    ["custom", "Custom"],
  ].map(([value, label]) => `<option value="${value}">${label}</option>`).join("");
  elements.material.innerHTML = catalog.materials
    .map((material) => `<option value="${escapeHtml(material.id)}">${escapeHtml(material.name)}</option>`)
    .join("");
  elements.goldColour.innerHTML = catalog.goldColors
    .map((color) => `<option value="${escapeHtml(color.id)}">${escapeHtml(color.name)}</option>`)
    .join("");
  elements.widthChoices.innerHTML = catalog.ringWidths.map((width, index) => `
    <div>
      <input class="choice-input" type="radio" name="ring-width" id="width-${escapeHtml(width.id)}" value="${escapeHtml(width.id)}" ${index === 1 ? "checked" : ""}>
      <label class="choice-card" for="width-${escapeHtml(width.id)}">
        <strong>${escapeHtml(width.name)}</strong>
      </label>
    </div>
  `).join("");
  updateItemType();
}

function updateItemType() {
  const type = elements.itemType.value;
  const isCustom = type === "custom";
  const isWatch = type === "watch";
  elements.otherWorkEnabled.checked = false;
  elements.otherWorkName.value = "";
  elements.otherWorkPrice.value = "";
  elements.otherWorkFields.hidden = true;
  elements.otherWorkLabel.textContent = isWatch ? "Custom" : "Other";
  elements.materialField.hidden = isCustom || isWatch;
  elements.goldColourSection.hidden = isCustom || isWatch || !elements.material.value.startsWith("gold-");
  elements.ringSection.hidden = type !== "ring";
  elements.customSection.hidden = !isCustom;
  elements.form.querySelector(".task-section").hidden = isCustom;
  if (isCustom) {
    updateEstimate();
    return;
  }
  elements.taskHint.textContent = "Select all applicable repairs";
  elements.taskList.innerHTML = catalog.tasks[type].map((task) => {
    const rates = taskRates(type, task);
    const quantity = task.characterFactor
        ? `<span class="quantity-control"><input type="number" min="1" max="200" step="1" value="1" name="quantity-${escapeHtml(task.id)}" aria-label="${escapeHtml(task.name)} character count" disabled><span>characters</span></span>`
      : task.quantityLabel
        ? `<span class="quantity-control"><input type="number" min="1" max="99" step="1" value="1" name="quantity-${escapeHtml(task.id)}" aria-label="${escapeHtml(task.quantityLabel)} quantity" disabled><span>${escapeHtml(task.quantityLabel.toLowerCase())}</span></span>`
      : "";
    const priceDescription = escapeHtml(taskPriceDescription(task, rates));
    return `
      <div class="task-option"${!rates || task.eligibleMaterials && !task.eligibleMaterials.includes(elements.material.value) ? " hidden" : ""}>
        <input class="task-input" type="checkbox" id="task-${escapeHtml(task.id)}" name="tasks" value="${escapeHtml(task.id)}">
        <label class="task-card" for="task-${escapeHtml(task.id)}">
          <span class="task-copy"><span class="task-name">${escapeHtml(task.name)}</span><span class="task-price">${priceDescription}</span></span>
        </label>
        ${quantity}
      </div>
    `;
  }).join("");
  updateTaskPriceLabels();
  elements.taskFootnote.hidden = true;
  elements.taskFootnote.textContent = type === "ring"
    ? ""
    : type === "necklace"
      ? "Replacement clasps and bails are priced separately."
      : "";
  for (const input of elements.taskList.querySelectorAll(".task-input")) {
    input.addEventListener("change", () => {
      haptic();
      updateConditionalTaskVisibility();
      const quantity = elements.form.elements[`quantity-${input.value}`];
      if (quantity) {
        quantity.disabled = !input.checked;
      }
      updateEstimate();
    });
  }
  elements.taskList.querySelectorAll(".quantity-control input").forEach((input) => {
    input.addEventListener("input", updateEstimate);
  });
  updateConditionalTaskVisibility();
  updateEstimate();
}

function updateConditionalTaskVisibility() {
  const type = elements.itemType.value;
  const material = type === "watch"
    ? null
    : catalog.materials.find((entry) => entry.id === elements.material.value);
  for (const task of catalog.tasks[type]) {
    const checkbox = elements.taskList.querySelector(`#task-${CSS.escape(task.id)}`);
    const option = checkbox?.closest(".task-option");
    if (!checkbox || !option) continue;
    const ratesAvailable = taskRates(type, task) !== null;
    const materialEligible = ratesAvailable
      && (!task.eligibleMaterials || task.eligibleMaterials.includes(elements.material.value))
      && (!material?.id.startsWith("gold-") || !task.excludedGoldColors || !task.excludedGoldColors.includes(elements.goldColour.value));
    if (!materialEligible && checkbox.checked) {
      checkbox.checked = false;
      const quantity = elements.form.elements[`quantity-${task.id}`];
      if (quantity) quantity.disabled = true;
    }
    option.hidden = !materialEligible;
  }
  if (type === "ring") {
    const selected = new Set([...elements.taskList.querySelectorAll(".task-input:checked")].map((input) => input.value));
    const resizingSelected = selected.has("resize-up") || selected.has("resize-down");
    const shankSelected = selected.has("full-shank") || selected.has("quarter-shank");
    const refinishSelected = selected.has("refinish") || selected.has("refinish-rhodium");
    const hiddenTasks = new Set();
    if (resizingSelected) {
      hiddenTasks.add(selected.has("resize-up") ? "resize-down" : "resize-up");
      for (const id of ["full-shank", "quarter-shank", "quick-polish", "refinish", "refinish-rhodium"]) hiddenTasks.add(id);
    } else if (shankSelected) {
      for (const id of ["resize-up", "resize-down", "quick-polish", "refinish", "refinish-rhodium"]) hiddenTasks.add(id);
      if (selected.has("full-shank")) hiddenTasks.add("quarter-shank");
      if (selected.has("quarter-shank")) hiddenTasks.add("full-shank");
    }
    if (resizingSelected || selected.has("quarter-shank")) hiddenTasks.add("solder-break-only");
    if (selected.has("refinish")) hiddenTasks.add("refinish-rhodium");
    if (selected.has("refinish-rhodium")) hiddenTasks.add("refinish");
    if (refinishSelected) hiddenTasks.add("quick-polish");
    if (selected.has("quick-polish")) {
      hiddenTasks.add("refinish");
      hiddenTasks.add("refinish-rhodium");
    }
    if (selected.has("unsolder-rings")) {
      hiddenTasks.add("solder-rings-bottom");
      hiddenTasks.add("solder-rings-top-and-bottom");
      hiddenTasks.add("solder-break-only");
    } else if (selected.has("solder-rings-bottom")) {
      hiddenTasks.add("solder-rings-top-and-bottom");
      hiddenTasks.add("unsolder-rings");
    } else if (selected.has("solder-rings-top-and-bottom")) {
      hiddenTasks.add("solder-rings-bottom");
      hiddenTasks.add("unsolder-rings");
    }
    if (!selected.has("unsolder-rings") && selected.has("solder-break-only")) {
      hiddenTasks.add("unsolder-rings");
    }
    for (const id of hiddenTasks) {
      const checkbox = elements.taskList.querySelector(`#task-${CSS.escape(id)}`);
      const option = checkbox?.closest(".task-option");
      if (!checkbox || !option) continue;
      option.hidden = true;
      if (checkbox.checked) {
        checkbox.checked = false;
        const quantity = elements.form.elements[`quantity-${id}`];
        if (quantity) quantity.disabled = true;
      }
    }
  }
  const hasOtherTask = [...elements.taskList.querySelectorAll(".task-input:checked")]
    .some((input) => !["rhodium-with-repair", "refinish", "refinish-rhodium"].includes(input.value));
  for (const task of catalog.tasks[type].filter((entry) => entry.requiresOtherTask)) {
    const checkbox = elements.taskList.querySelector(`#task-${CSS.escape(task.id)}`);
    const option = checkbox?.closest(".task-option");
    if (!checkbox || !option) continue;
    option.hidden = option.hidden || !hasOtherTask;
    if (option.hidden && checkbox.checked) checkbox.checked = false;
  }
}

function updateTaskPriceLabels() {
  const type = elements.itemType.value;
  if (!catalog?.tasks[type]) return;
  for (const task of catalog.tasks[type]) {
    const priceElement = elements.taskList.querySelector(`#task-${CSS.escape(task.id)} + .task-card .task-price`);
    if (!priceElement) continue;
    const rates = taskRates(type, task);
    const quantityControl = priceElement.closest(".task-option").querySelector(".quantity-control");
    if (quantityControl && task.priceTable && task.quantityLabel === "Sizes") {
      quantityControl.hidden = !rates || rates.additional === null;
    }
    if (!rates) {
      priceElement.textContent = "";
      continue;
    }
    priceElement.textContent = taskPriceDescription(task, rates);
  }
}

function getSelection() {
  const type = elements.itemType.value;
  if (type === "custom") {
    const customItem = elements.customItem.value.trim();
    const customPrice = Number(elements.customPrice.value);
    return {
      type,
      customItem,
      customPrice,
      tasks: [],
      total: roundToNearestFive(customPrice),
    };
  }
  const material = type === "watch"
    ? null
    : catalog.materials.find((entry) => entry.id === elements.material.value);
  const color = material?.id.startsWith("gold-")
    ? catalog.goldColors.find((entry) => entry.id === elements.goldColour.value)
    : null;
  const widthInput = elements.form.querySelector('input[name="ring-width"]:checked');
  const width = type === "ring" && widthInput
    ? catalog.ringWidths.find((entry) => entry.id === widthInput.value)
    : null;
  const tasks = catalog.tasks[type].flatMap((task) => {
    const checkbox = elements.taskList.querySelector(`#task-${CSS.escape(task.id)}`);
    if (!checkbox?.checked) return [];
    const quantityInput = elements.form.elements[`quantity-${task.id}`];
    const hasQuantityInput = quantityInput && !quantityInput.closest(".quantity-control").hidden;
    const quantity = hasQuantityInput ? Number(quantityInput.value) : 1;
    const rates = taskRates(type, task);
    const taskTotal = rates.additional !== null
      ? rates.unit + Math.max(0, quantity - 1) * rates.additional
      : rates.setup + rates.unit * quantity;
    return [{
      ...task,
      quantity,
      quantityLabel: hasQuantityInput ? task.quantityLabel : undefined,
      unitPrice: rates.unit,
      taskTotal,
    }];
  });
  if (elements.otherWorkEnabled.checked) {
    const price = roundToNearestFive(Number(elements.otherWorkPrice.value));
    tasks.push({
      id: "other",
      name: elements.otherWorkName.value.trim(),
      quantity: 1,
      unitPrice: price,
      taskTotal: price,
    });
  }
  const total = tasks.reduce((sum, task) => sum + task.taskTotal, 0);
  return { type, material, color, width, tasks, total };
}

function updateEstimate() {
  if (!catalog) return;
  updateTaskPriceLabels();
  elements.estimate.textContent = money(getSelection().total);
}

function showError(message) {
  elements.formError.textContent = message;
  elements.formError.hidden = !message;
}

function render() {
  if (!catalog) return;
  document.querySelector(".entry-panel").hidden = !canEdit;
  const total = jobs.reduce((sum, job) => sum + (Number(job.total) || 0), 0);
  const count = jobs.length;
  const formattedTotal = money(total);
  elements.totalValue.textContent = formattedTotal;
  elements.listTotal.textContent = formattedTotal;
  elements.bagCount.textContent = String(count);
  elements.headingCount.textContent = String(count);
  elements.averageValue.textContent = money(count ? total / count : 0);
  elements.emptyState.hidden = count > 0;
  elements.bagsTotal.hidden = count === 0;
  elements.bagList.innerHTML = jobs.map((job) => renderBagCard(job, canEdit)).join("");
  elements.bagList.querySelectorAll("[data-remove]").forEach((button) => {
    button.addEventListener("click", () => {
      const job = jobs.find((entry) => entry.id === button.dataset.remove);
      if (job) removeJob(job);
    });
  });
}

function renderBagCard(job, removable) {
  const taskChips = (Array.isArray(job.tasks) ? job.tasks : Object.values(job.tasks || {})).map((task) => {
    const quantity = task.sizeFactor || task.quantityLabel === "Sizes"
      ? ` · ${task.quantity} sizes`
      : task.characterFactor
        ? ` · ${task.quantity} characters`
        : task.quantity > 1 ? ` × ${task.quantity}` : "";
    const manualPrice = task.id === "other" && Number.isFinite(Number(task.price))
      ? ` · ${money(task.price)}`
      : "";
    return `<span class="detail-chip">${escapeHtml(task.name)}${quantity}${manualPrice}</span>`;
  }).join("");
  const descriptors = job.type === "custom"
    ? ["Custom", job.customItem]
    : [job.type === "chain" ? "Necklace" : `${job.type[0].toUpperCase()}${job.type.slice(1)}`, formatJobMaterial(job), job.widthName];
  const jobIdentifier = formatJobIdentifier(job);
  const repairTimeChip = `<span class="detail-chip">Repair time · ${escapeHtml(formatRepairTime(job.repairTimeMinutes))}</span>`;
  const userColor = getUserColor(job);
  return `
    <article class="bag-card" style="${userColor.style}">
      <div class="bag-topline">
        <div class="bag-title-wrap">
          <p class="bag-reference">${escapeHtml(jobIdentifier)}</p>
          <p class="bag-subtitle">${escapeHtml(descriptors.filter(Boolean).join(" · "))}</p>
        </div>
        <div class="bag-price-wrap">
          <strong class="bag-price">${money(job.total)}</strong>
          ${removable ? `          <button class="remove-button" type="button" data-remove="${escapeHtml(job.id)}" aria-label="Remove ${escapeHtml(jobIdentifier)}">×</button>` : ""}
        </div>
      </div>
      <div class="bag-details">${taskChips}${repairTimeChip}</div>
      ${job.notes ? `<p class="bag-notes">${escapeHtml(job.notes)}</p>` : ""}
      <span class="staff-chip" style="${userColor.style}">${escapeHtml(job.createdByName || "Staff")}</span>
    </article>
  `;
}

const USER_COLORS = [
  { background: "#edf2e6", border: "#a6b18f", text: "#52603d" },
  { background: "#edf1f7", border: "#9cacc4", text: "#4f617c" },
  { background: "#f7ece8", border: "#c49a8d", text: "#7a5145" },
  { background: "#f4f0dc", border: "#bdad70", text: "#716529" },
  { background: "#eeeafa", border: "#aaa0c7", text: "#625779" },
  { background: "#e7f2ef", border: "#8fb5a9", text: "#466a60" },
  { background: "#f6edf3", border: "#bd98ac", text: "#79566a" },
  { background: "#eee8df", border: "#b8a58c", text: "#6d604f" },
];

function getUserColor(job) {
  const identity = String(job.createdByUid || job.createdByName || "staff");
  let hash = 0;
  for (let index = 0; index < identity.length; index += 1) {
    hash = ((hash << 5) - hash + identity.charCodeAt(index)) | 0;
  }
  const color = USER_COLORS[Math.abs(hash) % USER_COLORS.length];
  return {
    color,
    style: `--user-bg:${color.background};--user-border:${color.border};--user-text:${color.text}`,
  };
}

function groupSummaryBags(dayBags) {
  const groups = new Map();
  for (const job of dayBags) {
    const reference = String(job.reference || "").trim();
    const key = reference ? `reference:${reference}` : `job:${job.id}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(job);
  }
  return Array.from(groups.values()).sort((left, right) => {
    const leftReference = String(left[0].reference || "").trim();
    const rightReference = String(right[0].reference || "").trim();
    const leftNumber = /^\d+$/.test(leftReference) ? Number(leftReference) : null;
    const rightNumber = /^\d+$/.test(rightReference) ? Number(rightReference) : null;
    if (leftNumber !== null && rightNumber !== null && leftNumber !== rightNumber) return leftNumber - rightNumber;
    if (leftNumber !== null && rightNumber === null) return -1;
    if (leftNumber === null && rightNumber !== null) return 1;
    if (leftReference && !rightReference) return -1;
    if (!leftReference && rightReference) return 1;
    return leftReference.localeCompare(rightReference, undefined, { numeric: true })
      || Math.max(...right.map((job) => Number(job.createdAt) || 0))
        - Math.max(...left.map((job) => Number(job.createdAt) || 0));
  });
}

function renderSummaryBagGroup(jobsInGroup) {
  const first = jobsInGroup[0];
  const reference = String(first.reference || "").trim();
  if (!reference) return renderBagCard(first, false);
  const sortedJobs = [...jobsInGroup].sort((left, right) =>
    (Number(left.itemNumber) || 0) - (Number(right.itemNumber) || 0)
    || (Number(left.createdAt) || 0) - (Number(right.createdAt) || 0));
  const total = sortedJobs.reduce((sum, job) => sum + (Number(job.total) || 0), 0);
  const userColor = getUserColor(sortedJobs[0]);
  const itemMarkup = sortedJobs.map((job) => {
    const itemNumber = Number(job.itemNumber);
    const itemLabel = Number.isInteger(itemNumber) && itemNumber >= 1 ? `Item ${itemNumber}` : "Job bag item";
    const taskChips = (Array.isArray(job.tasks) ? job.tasks : Object.values(job.tasks || {})).map((task) => {
      const quantity = task.sizeFactor || task.quantityLabel === "Sizes"
        ? ` · ${task.quantity} sizes`
        : task.characterFactor
          ? ` · ${task.quantity} characters`
          : task.quantity > 1 ? ` × ${task.quantity}` : "";
      const manualPrice = task.id === "other" && Number.isFinite(Number(task.price))
        ? ` · ${money(task.price)}`
        : "";
      return `<span class="detail-chip">${escapeHtml(task.name)}${quantity}${manualPrice}</span>`;
    }).join("");
    const descriptors = job.type === "custom"
      ? ["Custom", job.customItem]
      : [job.type === "chain" ? "Necklace" : `${job.type[0].toUpperCase()}${job.type.slice(1)}`, formatJobMaterial(job), job.widthName];
    const staffColor = getUserColor(job);
    return `
      <div class="bag-group-item">
        <div class="bag-group-item-heading">
          <div>
            <strong>${escapeHtml(itemLabel)}</strong>
            <span>${escapeHtml(descriptors.filter(Boolean).join(" · "))}</span>
          </div>
          <strong class="bag-group-item-price">${money(job.total)}</strong>
        </div>
        <div class="bag-details">${taskChips}</div>
        ${job.notes ? `<p class="bag-notes">${escapeHtml(job.notes)}</p>` : ""}
        <span class="staff-chip" style="${staffColor.style}">${escapeHtml(job.createdByName || "Staff")}</span>
      </div>
    `;
  }).join("");
  const repairTime = sortedJobs.reduce((sum, job) => sum + (Number(job.repairTimeMinutes) || 0), 0);
  return `
    <article class="bag-card bag-card-grouped" style="${userColor.style}">
      <div class="bag-topline">
        <div class="bag-title-wrap">
          <p class="bag-reference">${escapeHtml(reference)}</p>
          <p class="bag-subtitle">${sortedJobs.length} ${sortedJobs.length === 1 ? "item" : "items"}</p>
        </div>
        <div class="bag-summary-meta">
          <strong class="bag-price">${money(total)}</strong>
          <span class="bag-repair-time">${escapeHtml(formatRepairTime(repairTime))}</span>
        </div>
      </div>
      <div class="bag-group-items">${itemMarkup}</div>
    </article>
  `;
}

function formatJobIdentifier(job) {
  const reference = String(job.reference || "").trim();
  const itemNumber = Number(job.itemNumber);
  const hasItemNumber = job.noJobBag !== true && Number.isInteger(itemNumber) && itemNumber >= 1;
  if (reference) return hasItemNumber ? `${reference}-${itemNumber}` : reference;
  const fallback = job.noJobBag ? "No job bag number" : job.customItem || "Untitled job bag";
  return hasItemNumber ? `${fallback} · Item ${itemNumber}` : fallback;
}

function formatRepairTime(minutes) {
  const value = Number(minutes);
  if (!Number.isInteger(value) || value < 1) return "Not recorded";
  const hours = Math.floor(value / 60);
  const remainingMinutes = value % 60;
  if (!hours) return `${remainingMinutes}m`;
  return `${hours}h ${String(remainingMinutes).padStart(2, "0")}m`;
}

function formatJobMaterial(job) {
  const material = String(job.materialName || "").trim();
  const colour = String(job.goldColourName || "").trim();
  if (!material || !colour) return material || colour;
  if (!/\bgold$/i.test(material)) return `${material} · ${colour}`;
  const materialPrefix = material.replace(/\s+gold$/i, "").trim();
  const formattedColour = colour.replace(/\bgold$/i, "Gold");
  return `${materialPrefix} ${formattedColour}`.trim();
}

function dayBagsFromValue(data) {
  return Object.entries(data || {})
    .filter(([, job]) => job?.deleted !== true)
    .map(([id, job]) => ({ ...job, id }))
    .sort((left, right) => Number(right.createdAt) - Number(left.createdAt));
}

function normalizeReference(reference) {
  return String(reference || "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function searchLookupIndex(query) {
  if (lookupLoading) {
    elements.lookupResults.innerHTML = "";
    elements.lookupMessage.textContent = "Loading job bags…";
    elements.lookupMessage.hidden = false;
    return;
  }
  const normalized = normalizeReference(query);
  if (!normalized) {
    elements.lookupResults.innerHTML = "";
    elements.lookupMessage.textContent = "Enter a reference number to search job bags.";
    elements.lookupMessage.hidden = false;
    return;
  }
  const matches = Object.values(lookupIndex)
    .filter((entry) => normalizeReference(entry.reference) === normalized)
    .sort((left, right) => Number(right.createdAt) - Number(left.createdAt));
  elements.lookupResults.innerHTML = matches.map((entry) => `
    <button class="lookup-result" type="button" data-lookup-id="${escapeHtml(entry.jobId)}" data-lookup-date="${escapeHtml(entry.date)}">
      <span class="lookup-result-main">
        <strong>${escapeHtml(formatJobIdentifier(entry))}</strong>
        <span>${escapeHtml(formatDay(entry.date))}</span>
      </span>
      <span class="lookup-result-meta">${entry.createdAt ? escapeHtml(new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit", timeZone: "America/Toronto" }).format(new Date(entry.createdAt))) : ""}</span>
    </button>
  `).join("");
  elements.lookupMessage.textContent = matches.length ? "" : "No matching references.";
  elements.lookupMessage.hidden = matches.length > 0;
  elements.lookupResults.querySelectorAll("[data-lookup-id]").forEach((button) => {
    button.addEventListener("click", () => loadLookupJob(button.dataset.lookupDate, button.dataset.lookupId));
  });
}

async function loadLookupData() {
  if (!database || !currentUser) return;
  if (lookupLoading) return;
  if (lookupLoadedAt && Date.now() - lookupLoadedAt < 60_000) {
    searchLookupIndex(elements.lookupReference.value);
    return;
  }
  const request = ++lookupRequest;
  lookupLoading = true;
  lookupIndex = {};
  elements.lookupResults.innerHTML = "";
  elements.lookupDetailPanel.hidden = true;
  elements.lookupMessage.hidden = false;
  elements.lookupMessage.textContent = "Loading job bags…";
  try {
    const snapshot = await firebaseModules.get(firebaseModules.ref(database, "days"));
    if (request !== lookupRequest) return;
    const days = snapshot.val() || {};
    Object.entries(days).forEach(([date, day]) => {
      Object.entries(day?.bags || {}).forEach(([jobId, job]) => {
        if (job?.deleted === true || typeof job?.reference !== "string" || !normalizeReference(job.reference)) return;
        lookupIndex[`${date}/${jobId}`] = {
          ...job,
          jobId,
          date,
          createdAt: Number(job.createdAt) || 0,
        };
      });
    });
    lookupLoading = false;
    lookupLoadedAt = Date.now();
    searchLookupIndex(elements.lookupReference.value);
  } catch (error) {
    if (request !== lookupRequest) return;
    lookupLoading = false;
    lookupLoadedAt = 0;
    console.error("Could not load job bags for lookup:", error);
    elements.lookupResults.innerHTML = "";
    elements.lookupMessage.hidden = false;
    elements.lookupMessage.textContent = "Could not load job bags. Check the database rules and your connection.";
  }
}

function formatLoggedAt(timestamp) {
  if (!Number.isFinite(Number(timestamp))) return "Unknown date";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "America/Toronto",
  }).format(new Date(Number(timestamp)));
}

function loadLookupJob(date, jobId) {
  elements.lookupDetailPanel.hidden = false;
  const job = lookupIndex[`${date}/${jobId}`];
  if (!job) {
    elements.lookupDetail.innerHTML = '<p class="lookup-message">This job bag is no longer available. Search again to refresh.</p>';
    return;
  }
  void recordUserActivity({
    inspectedBag: {
      date,
      jobId,
      reference: formatJobIdentifier(job),
    },
  });
  const tasks = Array.isArray(job.tasks) ? job.tasks : Object.values(job.tasks || {});
  const piece = job.type === "custom"
    ? `Custom · ${job.customItem || ""}`
    : [job.type === "chain" ? "Necklace" : `${job.type[0].toUpperCase()}${job.type.slice(1)}`, formatJobMaterial(job), job.widthName].filter(Boolean).join(" · ");
  elements.lookupDetail.innerHTML = `
      <div class="lookup-detail-heading">
        <div>
          <h2>${escapeHtml(formatJobIdentifier(job))}</h2>
          <p class="lookup-piece">${escapeHtml(piece)}</p>
        </div>
        <strong class="lookup-total">${money(Number(job.total) || 0)}</strong>
      </div>
      <dl class="lookup-metadata">
        <div><dt>Logged</dt><dd>${escapeHtml(formatLoggedAt(job.createdAt))}</dd></div>
        <div><dt>By</dt><dd>${escapeHtml(job.createdByName || "Unknown")}</dd></div>
        <div><dt>Repair time</dt><dd>${escapeHtml(formatRepairTime(job.repairTimeMinutes))}</dd></div>
      </dl>
      <h3 class="lookup-section-heading">Work</h3>
      ${tasks.length ? `<div class="lookup-tasks">${tasks.map((task) => {
        const quantity = task.quantity > 1 || task.sizeFactor || task.quantityLabel === "Sizes" || task.characterFactor ? ` × ${task.quantity}${task.sizeFactor || task.quantityLabel === "Sizes" ? " sizes" : task.characterFactor ? " characters" : ""}` : "";
        const amount = Number.isFinite(Number(task.chargedAmount)) ? Number(task.chargedAmount) : Number(task.price) * (Number(task.quantity) || 1);
        return `<div class="lookup-task"><span>${escapeHtml(task.name)}${escapeHtml(quantity)}</span><strong>${money(amount)}</strong></div>`;
      }).join("")}</div>` : '<p class="lookup-message">No repair details saved.</p>'}
      ${job.notes ? `<div class="lookup-notes"><h3 class="lookup-section-heading">Notes</h3><p>${escapeHtml(job.notes)}</p></div>` : ""}
    `;
  elements.lookupDetailPanel.scrollIntoView({ block: "nearest", behavior: "smooth" });
}

function showAuthMessage(message) {
  elements.authMessage.textContent = message;
}

function showAuthPage(page) {
  const isSignUp = page === "sign-up";
  elements.loginView.hidden = isSignUp;
  elements.signUpView.hidden = !isSignUp;
  elements.authHeading.textContent = isSignUp ? "Create your account" : "Log in";
  elements.authCopy.textContent = isSignUp
    ? "Create an account to access Benchmate2000 features."
    : "Log in or create an account to access the Benchmate2000 features.";
  showAuthMessage("");
}

async function recordUserActivity({ loginTime = null, inspectedBag = null, calendarDate = null } = {}) {
  const user = currentUser;
  if (!database || !user) return;

  const now = Date.now();
  if (!loginTime && !inspectedBag && !calendarDate && now - lastActivityWriteAt < 60_000) return;
  lastActivityWriteAt = now;

  const loginMarker = typeof loginTime === "string" ? loginTime : "";
  const parsedLoginTime = loginMarker ? Date.parse(loginMarker) : NaN;

  try {
    const loginEventKey = loginMarker
      ? firebaseModules.push(firebaseModules.ref(database, `activity/${user.uid}/loginEvents`)).key
      : null;
    await firebaseModules.runTransaction(firebaseModules.ref(database, `activity/${user.uid}`), (value) => {
      const activity = value && typeof value === "object" && !Array.isArray(value) ? value : {};
      const loginEvents = { ...(activity.loginEvents || {}) };
      const cutoff31Days = now - 31 * 24 * 60 * 60 * 1000;

      if (loginMarker && activity.lastRecordedLogin !== loginMarker && Number.isFinite(parsedLoginTime)) {
        const eventTime = Math.min(parsedLoginTime, now);
        if (eventTime >= cutoff31Days) loginEvents[loginEventKey] = eventTime;
      }

      for (const [eventKey, timestamp] of Object.entries(loginEvents)) {
        const eventTime = Number(timestamp);
        if (!Number.isFinite(eventTime) || eventTime < cutoff31Days || eventTime > now) {
          delete loginEvents[eventKey];
        }
      }

      const loginTimestamps = Object.values(loginEvents).map(Number);
      const updatedActivity = {
        ...activity,
        lastUsedAt: now,
        loginEvents,
        loginsLast7Days: loginTimestamps.filter((timestamp) => timestamp >= now - 7 * 24 * 60 * 60 * 1000).length,
        loginsLast31Days: loginTimestamps.length,
        jobBagsInspected: Math.max(0, Number(activity.jobBagsInspected) || 0) + (inspectedBag ? 1 : 0),
      };
      if (loginMarker) updatedActivity.lastRecordedLogin = loginMarker;
      return updatedActivity;
    }, { applyLocally: false });

    const detailWrites = [];
    if (inspectedBag) {
      detailWrites.push(firebaseModules.set(
        firebaseModules.ref(database, `activityDetails/${user.uid}/inspectedJobBags/${inspectedBag.date}/${inspectedBag.jobId}`),
        {
          reference: String(inspectedBag.reference || ""),
          lastInspectedAt: now,
        },
      ));
    }
    if (calendarDate) {
      detailWrites.push(firebaseModules.set(
        firebaseModules.ref(database, `activityDetails/${user.uid}/calendarDaysViewed/${calendarDate}`),
        now,
      ));
    }
    await Promise.all(detailWrites);
  } catch (error) {
    lastActivityWriteAt = 0;
    console.error("Could not save user activity:", error);
  }
}

function showToday() {
  const dateKey = torontoDateKey();
  elements.bagsDate.dateTime = dateKey;
  elements.bagsDate.textContent = formatDay(dateKey);
  if (!database || !currentUser || !canEdit || dateKey === activeDay) return;

  unsubscribeDay?.();
  activeDay = dateKey;
  jobs = [];
  render();
  const dayRef = firebaseModules.ref(database, `days/${dateKey}/bags`);
  unsubscribeDay = firebaseModules.onValue(dayRef, (snapshot) => {
    jobs = dayBagsFromValue(snapshot.val());
    render();
  }, (error) => {
    console.error("Could not load today's job bags:", error);
    elements.bagList.innerHTML = '<p class="catalog-error">Could not load today’s job bags. Check the database rules and your connection.</p>';
  });
}

function activatePage(page) {
  const isJournal = page === "jobs" && canEdit;
  const isLookup = page === "lookup";
  const isSummary = !isJournal && !isLookup;
  elements.jobsView.hidden = !isJournal;
  elements.summaryView.hidden = !isSummary;
  elements.lookupView.hidden = !isLookup;
  elements.jobsTab.classList.toggle("is-active", isJournal);
  elements.jobsTab.setAttribute("aria-pressed", String(isJournal));
  elements.summaryTab.classList.toggle("is-active", isSummary);
  elements.summaryTab.setAttribute("aria-pressed", String(isSummary));
  elements.lookupTab.classList.toggle("is-active", isLookup);
  elements.lookupTab.setAttribute("aria-pressed", String(isLookup));
  if (isSummary) loadSummary();
  if (isLookup) loadLookupData();
}

function renderSelectedDay(dayKey, dayBags) {
  elements.selectedDayDate.dateTime = dayKey;
  elements.selectedDayDate.textContent = formatDay(dayKey);
  const holidays = configuredHolidaysForGrid([dayKey], holidayDefinitions).get(dayKey) || [];
  const holidayDescription = holidays.map((holiday) => `${holiday.emoji} ${holiday.name}`).join(" · ");
  const hasBags = dayBags.length > 0;
  elements.selectedDayHolidays.textContent = holidayDescription;
  elements.selectedDayHolidays.hidden = !hasBags || holidays.length === 0;
  elements.selectedDayEmptyHoliday.textContent = holidayDescription;
  elements.selectedDayEmptyHoliday.hidden = hasBags || holidays.length === 0;
  elements.selectedDayList.innerHTML = groupSummaryBags(dayBags).map((jobsInGroup) => renderSummaryBagGroup(jobsInGroup)).join("");
  elements.selectedDayEmpty.hidden = hasBags;
  elements.selectedDayPanel.hidden = false;
}

function totalForDates(dateKeys, bagsByDate) {
  return dateKeys.reduce((sum, date) => {
    const bags = bagsByDate.get(date) || [];
    return sum + bags.reduce((bagSum, job) => bagSum + (Number(job.total) || 0), 0);
  }, 0);
}

function renderCalendar(monthDates, selectedDate, bagsByDate) {
  const monthDate = new Date(`${selectedDate}T12:00:00Z`);
  const today = torontoDateKey();
  elements.calendarMonthLabel.textContent = new Intl.DateTimeFormat(undefined, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(monthDate);
  elements.calendarMonthTotal.textContent = money(totalForDates(monthDates, bagsByDate));
  const calendarDays = calendarGridDates(monthDates);
  const fullMoonDates = fullMoonDatesForGrid(calendarDays);
  const holidays = configuredHolidaysForGrid(calendarDays, holidayDefinitions);
  const weekMarkup = [];
  for (let index = 0; index < calendarDays.length; index += 7) {
    const week = calendarDays.slice(index, index + 7);
    const weekDates = week;
    const dayMarkup = week.map((dateKey) => {
      const bags = bagsByDate.get(dateKey) || [];
      const total = bags.reduce((sum, job) => sum + (Number(job.total) || 0), 0);
      const date = new Date(`${dateKey}T12:00:00Z`);
      const hasFullMoon = fullMoonDates.has(dateKey);
      const dayHolidays = holidays.get(dateKey) || [];
      const holidayNames = dayHolidays.map((holiday) => holiday.name).join(", ");
      const holidayKind = dayHolidays.find((holiday) => holiday.kind !== "general")?.kind;
      const bagCount = groupSummaryBags(bags).length;
      const bagLabel = bagCount === 1 ? "1 job bag" : `${bagCount} job bags`;
      let laborMarkup = "";
      if (canEdit) {
        const laborByUser = new Map();
        for (const job of bags) {
          const identity = String(job.createdByUid || job.createdByName || "Staff");
          const name = String(job.createdByName || "Staff").trim() || "Staff";
          const current = laborByUser.get(identity) || { name, minutes: 0 };
          current.minutes += Number(job.repairTimeMinutes) || 0;
          laborByUser.set(identity, current);
        }
        const users = Array.from(laborByUser.values())
          .sort((left, right) => right.minutes - left.minutes || left.name.localeCompare(right.name));
        laborMarkup = users.length ? `
          <span class="calendar-day-labor-users">${users.map((entry) =>
            `${escapeHtml(entry.name)} · ${escapeHtml(formatRepairTime(entry.minutes))}`).join("<br>")}</span>
        ` : "";
      }
      const classes = [
        "calendar-day",
        dateKey.slice(0, 7) !== monthDates[0].slice(0, 7) ? "is-outside-month" : "",
        dateKey === selectedDate ? "is-selected" : "",
        dateKey === today ? "is-today" : "",
        dayHolidays.length ? "is-holiday" : "",
        holidayKind ? `is-holiday-${holidayKind}` : "",
      ].filter(Boolean).join(" ");
      return `
        <button class="${classes}" type="button" data-calendar-date="${dateKey}" aria-pressed="${dateKey === selectedDate}" aria-label="${formatDay(dateKey)}${hasFullMoon ? ", Full moon" : ""}${holidayNames ? `, ${escapeHtml(holidayNames)}` : ""}: ${money(total)}, ${bagLabel}" title="${hasFullMoon ? "Full moon · " : ""}${holidayNames ? `${escapeHtml(holidayNames)} · ` : ""}${money(total)}">
          <span class="calendar-day-number">${date.getUTCDate()}${hasFullMoon ? '<span class="full-moon-indicator" aria-hidden="true"></span>' : ""}</span>
          ${dayHolidays.length ? `<span class="calendar-holidays">${dayHolidays.map((holiday) => `
            <span class="calendar-holiday"><span aria-hidden="true">${escapeHtml(holiday.emoji)}</span><span>${escapeHtml(holiday.name)}</span></span>
          `).join("")}</span>` : ""}
          <span class="calendar-day-total">${money(total)}</span>
          ${laborMarkup}
        </button>
      `;
    }).join("");
    weekMarkup.push(`
      <div class="calendar-week">
        ${dayMarkup}
        <div class="calendar-week-total">
          <span>Week total</span>
          <strong>${money(totalForDates(weekDates, bagsByDate))}</strong>
        </div>
      </div>
    `);
  }
  elements.calendarGrid.innerHTML = weekMarkup.join("");

  elements.calendarGrid.querySelectorAll("[data-calendar-date]").forEach((button) => {
    button.addEventListener("click", () => {
      const dateKey = button.dataset.calendarDate;
      void recordUserActivity({ calendarDate: dateKey });
      elements.summaryDate.value = dateKey;
      summaryHasDaySelection = true;
      if (!monthDates.includes(dateKey)) {
        elements.selectedDayPanel.hidden = true;
        void loadSummary();
        return;
      }
      renderCalendar(monthDates, dateKey, bagsByDate);
      renderSelectedDay(dateKey, bagsByDate.get(dateKey) || []);
    });
  });
}

async function loadSummary() {
  if (!database || !currentUser || !elements.summaryDate.value) return;
  const request = ++summaryRequest;
  const selectedDate = elements.summaryDate.value;
  const monthDates = calendarMonthDates(selectedDate);
  const calendarDates = calendarGridDates(monthDates);
  elements.summaryError.hidden = true;
  elements.calendarGrid.innerHTML = '<p class="loading-message">Loading calendar…</p>';
  if (!summaryHasDaySelection) elements.selectedDayPanel.hidden = true;

  try {
    const dateRangeQuery = firebaseModules.query(
      firebaseModules.ref(database, "days"),
      firebaseModules.orderByKey(),
      firebaseModules.startAt(calendarDates[0]),
      firebaseModules.endAt(calendarDates[calendarDates.length - 1]),
    );
    const snapshot = await firebaseModules.get(dateRangeQuery);
    if (request !== summaryRequest) return;
    const days = snapshot.val() || {};
    const bagsByDate = new Map(calendarDates.map((date) => [date, dayBagsFromValue(days[date]?.bags)]));
    renderCalendar(monthDates, selectedDate, bagsByDate);
    if (summaryHasDaySelection) renderSelectedDay(selectedDate, bagsByDate.get(selectedDate) || []);
  } catch (error) {
    if (request !== summaryRequest) return;
    console.error("Could not load the summary:", error);
    elements.summaryError.textContent = "Could not load summary data. Check the database read rules and your connection.";
    elements.summaryError.hidden = false;
    elements.calendarGrid.innerHTML = "";
    elements.selectedDayList.innerHTML = "";
    elements.selectedDayEmpty.hidden = true;
    elements.selectedDayPanel.hidden = true;
  }
}

function handleAuthState(user) {
  if (currentUser?.uid !== user?.uid) lastActivityWriteAt = 0;
  unsubscribeMembership?.();
  unsubscribeDay?.();
  unsubscribeMembership = null;
  unsubscribeDay = null;
  activeDay = "";
  jobs = [];
  canEdit = false;
  lookupIndex = {};
  lookupLoading = false;
  lookupLoadedAt = 0;
  lookupRequest += 1;
  summaryRequest += 1;
  render();
  currentUser = user;
  elements.accountBar.hidden = !user;

  if (!user) {
    elements.roleBadge.textContent = "";
    elements.appShell.hidden = true;
    elements.authScreen.hidden = false;
    elements.authMethods.hidden = false;
    showAuthPage("log-in");
    return;
  }

  const firstName = user.displayName?.trim().split(/\s+/)[0] || "Staff";
  elements.accountName.textContent = firstName;
  elements.authScreen.hidden = false;
  elements.appShell.hidden = true;
  elements.authMethods.hidden = true;
  elements.authHeading.textContent = "Checking access";
  elements.authCopy.textContent = "";
  showAuthMessage("");

  const memberRef = firebaseModules.ref(database, `members/${user.uid}`);
  unsubscribeMembership = firebaseModules.onValue(memberRef, (snapshot) => {
    const member = snapshot.val();
    if (member?.active === true && ["editor", "viewer"].includes(member.role)) {
      canEdit = member.role === "editor";
      elements.roleBadge.textContent = canEdit ? "Editor" : "View only";
      void recordUserActivity({ loginTime: user.metadata?.lastSignInTime });
      elements.summaryDate.value = torontoDateKey();
      summaryHasDaySelection = false;
      elements.selectedDayPanel.hidden = true;
      elements.jobsTab.hidden = !canEdit;
      elements.summaryTab.hidden = false;
      elements.lookupTab.hidden = false;
      unsubscribeDay?.();
      unsubscribeDay = null;
      activeDay = "";
      jobs = [];
      render();
      elements.authScreen.hidden = true;
      elements.appShell.hidden = false;
      if (canEdit) {
        showToday();
        activatePage("jobs");
      } else {
        activatePage("summary");
      }
      return;
    }
    unsubscribeDay?.();
    unsubscribeDay = null;
    lookupRequest += 1;
    lookupIndex = {};
    lookupLoading = false;
    lookupLoadedAt = 0;
    activeDay = "";
    jobs = [];
    canEdit = false;
    elements.roleBadge.textContent = "";
    render();
    elements.appShell.hidden = true;
    elements.authScreen.hidden = false;
    elements.authMethods.hidden = true;
    elements.authHeading.textContent = member?.active === true ? "Role not configured" : "Access not enabled";
    elements.authCopy.textContent = member?.active === true
      ? "Ask an administrator to assign this account the Editor or Viewer role."
      : "Ask an administrator to approve this account. If you just signed up, share your Firebase user ID with them.";
    showAuthMessage(`Firebase user ID: ${user.uid}`);
  }, (error) => {
    console.error("Could not check Firebase member access:", error);
    unsubscribeDay?.();
    unsubscribeDay = null;
    lookupRequest += 1;
    lookupIndex = {};
    lookupLoading = false;
    lookupLoadedAt = 0;
    activeDay = "";
    jobs = [];
    canEdit = false;
    elements.roleBadge.textContent = "";
    render();
    elements.appShell.hidden = true;
    elements.authScreen.hidden = false;
    elements.authMethods.hidden = true;
    elements.authHeading.textContent = "Could not check access";
    elements.authCopy.textContent = "Check the database rules and your connection.";
    showAuthMessage(`Firebase user ID: ${user.uid}`);
  });
}

async function removeJob(job) {
  if (!activeDay || !database) return;
  if (!window.confirm("Are you sure you want to delete this job bag?")) return;
  try {
    await firebaseModules.update(
      firebaseModules.ref(database, `days/${activeDay}/bags/${job.id}`),
      { deleted: true },
    );
    lookupLoadedAt = 0;
    showToast("Job bag marked as deleted.");
  } catch (error) {
    console.error("Could not mark the job bag as deleted:", error);
    showToast("Could not update the job bag. Check your database access.");
  }
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("show");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => elements.toast.classList.remove("show"), 2300);
}

elements.itemType.addEventListener("change", updateItemType);
elements.reference.addEventListener("input", () => elements.reference.setCustomValidity(""));
elements.itemNumber.addEventListener("input", () => elements.itemNumber.setCustomValidity(""));
elements.repairTime.addEventListener("input", () => elements.repairTime.setCustomValidity(""));
elements.noJobBag.addEventListener("change", () => {
  const noJobBag = elements.noJobBag.checked;
  elements.reference.setCustomValidity("");
  elements.reference.required = !noJobBag;
  elements.reference.disabled = noJobBag;
  elements.referenceField.hidden = noJobBag;
  elements.itemNumber.required = !noJobBag;
  elements.itemNumber.disabled = noJobBag;
  elements.itemNumberField.hidden = noJobBag;
  if (noJobBag) {
    elements.reference.value = "";
    elements.itemNumber.value = "";
    elements.itemNumber.setCustomValidity("");
  }
});
elements.material.addEventListener("change", () => {
  elements.goldColourSection.hidden = !elements.material.value.startsWith("gold-");
  updateConditionalTaskVisibility();
  updateEstimate();
});
elements.goldColour.addEventListener("change", () => {
  updateConditionalTaskVisibility();
  updateEstimate();
});
elements.widthChoices.addEventListener("change", updateEstimate);
elements.customItem.addEventListener("input", updateEstimate);
elements.customPrice.addEventListener("input", updateEstimate);
elements.otherWorkEnabled.addEventListener("change", () => {
  haptic();
  elements.otherWorkFields.hidden = !elements.otherWorkEnabled.checked;
  updateEstimate();
});
elements.otherWorkName.addEventListener("input", updateEstimate);
elements.otherWorkPrice.addEventListener("input", updateEstimate);
elements.taskList.addEventListener("click", (event) => {
  if (!(event.target instanceof Element) || event.target.closest("label, input")) return;
  const checkbox = event.target.closest(".task-option")?.querySelector(".task-input");
  checkbox?.click();
});
document.querySelector(".other-work").addEventListener("click", (event) => {
  if (!(event.target instanceof Element) || event.target.closest("label, input, #other-work-fields")) return;
  elements.otherWorkEnabled.click();
});
elements.jobsTab.addEventListener("click", () => activatePage("jobs"));
elements.summaryTab.addEventListener("click", () => activatePage("summary"));
elements.lookupTab.addEventListener("click", () => activatePage("lookup"));
elements.lookupReference.addEventListener("input", () => searchLookupIndex(elements.lookupReference.value));
for (const eventType of ["click", "input", "change"]) {
  elements.appShell.addEventListener(eventType, () => {
    void recordUserActivity();
  });
}
function changeCalendarMonth(offset) {
  elements.summaryDate.value = shiftMonthDateKey(elements.summaryDate.value, offset);
  summaryHasDaySelection = false;
  elements.selectedDayPanel.hidden = true;
  loadSummary();
}

elements.previousMonth.addEventListener("click", () => changeCalendarMonth(-1));
elements.nextMonth.addEventListener("click", () => changeCalendarMonth(1));
elements.todayButton.addEventListener("click", () => {
  elements.summaryDate.value = torontoDateKey();
  summaryHasDaySelection = false;
  elements.selectedDayPanel.hidden = true;
  loadSummary();
});

elements.form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!currentUser || !database || !activeDay || !canEdit) {
    showError("Only editors can add job bags.");
    return;
  }
  const itemNumber = elements.noJobBag.checked ? null : Number(elements.itemNumber.value);
  if (itemNumber !== null && (!Number.isInteger(itemNumber) || itemNumber < 1)) {
    elements.itemNumber.setCustomValidity("Enter the item number as a whole number greater than zero.");
    elements.itemNumber.reportValidity();
    return;
  }
  elements.itemNumber.setCustomValidity("");
  const repairTimeMinutes = Number(elements.repairTime.value);
  if (!Number.isInteger(repairTimeMinutes) || repairTimeMinutes < 1) {
    elements.repairTime.setCustomValidity("Enter the repair time as a whole number of minutes.");
    elements.repairTime.reportValidity();
    return;
  }
  elements.repairTime.setCustomValidity("");
  const referenceValue = elements.reference.value;
  if (!elements.noJobBag.checked && (!Number.isInteger(Number(referenceValue)) || Number(referenceValue) < 1)) {
    elements.reference.setCustomValidity("Enter the job bag number as a whole number greater than zero.");
    elements.reference.reportValidity();
    return;
  }
  elements.reference.setCustomValidity("");
  const selection = getSelection();
  if (selection.type === "custom" && (!selection.customItem || !Number.isFinite(selection.customPrice) || selection.total < 5)) {
    showError("Enter a custom item and a price that rounds to at least $5.");
    return;
  }
  if (selection.type !== "custom" && selection.tasks.length === 0) {
    showError("Choose at least one piece of bench work to price this bag.");
    return;
  }
  if (elements.otherWorkEnabled.checked
    && (!elements.otherWorkName.value.trim()
      || !Number.isFinite(Number(elements.otherWorkPrice.value))
      || Number(elements.otherWorkPrice.value) <= 0
      || roundToNearestFive(Number(elements.otherWorkPrice.value)) < 5)) {
    showError("Enter a description and price for Other work. The price must round to at least $5.");
    return;
  }
  if (selection.tasks.some((task) => task.characterFactor
      ? !Number.isInteger(task.quantity) || task.quantity < 1 || task.quantity > 200
    : task.quantityLabel && (!Number.isInteger(task.quantity) || task.quantity < 1 || task.quantity > 99))) {
    showError("Enter engraving as a whole number from 1 to 200 characters. Enter other quantities as whole numbers from 1 to 99.");
    return;
  }
  showError("");
  const reference = elements.noJobBag.checked ? "" : elements.reference.value;
  const firstName = currentUser.displayName?.trim().split(/\s+/)[0] || "Staff";
  const job = {
    reference,
    noJobBag: elements.noJobBag.checked,
    ...(itemNumber === null ? {} : { itemNumber }),
    type: selection.type,
    customItem: selection.customItem || "",
    materialName: selection.material?.name || "",
    goldColourName: selection.color?.name || "",
    widthName: selection.width?.name || "",
    tasks: selection.tasks.map(({ id, name, unitPrice, taskTotal, quantity, quantityLabel, characterFactor }) => ({
      id,
      name,
      price: unitPrice,
      chargedAmount: taskTotal,
      quantity,
      ...(quantityLabel ? { quantityLabel } : {}),
      characterFactor: Boolean(characterFactor),
    })),
    notes: elements.form.elements.notes.value.trim(),
    repairTimeMinutes,
    total: selection.total,
    createdAt: Date.now(),
    createdByUid: currentUser.uid,
    createdByName: firstName,
  };
  const submitButton = elements.form.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  try {
    const dateKey = torontoDateKey();
    if (dateKey !== activeDay) showToday();
    const jobRef = firebaseModules.push(firebaseModules.ref(database, `days/${dateKey}/bags`));
    await firebaseModules.set(jobRef, { ...job, id: jobRef.key });
    lookupLoadedAt = 0;
    haptic(25);
    celebrateJobAdded();
    elements.form.reset();
    elements.reference.setCustomValidity("");
    elements.reference.required = true;
    elements.reference.disabled = false;
    elements.referenceField.hidden = false;
    elements.itemNumber.setCustomValidity("");
    elements.itemNumber.required = true;
    elements.itemNumber.disabled = false;
    elements.itemNumberField.hidden = false;
    elements.itemType.value = "ring";
    updateItemType();
    if (window.matchMedia("(max-width: 720px)").matches) {
      elements.form.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    showToast(`${reference ? `${reference} added` : "Job bag added"} to today's list.`);
  } catch (error) {
    console.error("Could not save the job bag:", error);
    showError("Could not save the job bag. Check your connection and database access.");
  } finally {
    submitButton.disabled = false;
  }
});

function setAuthBusy(isBusy) {
  for (const control of [
    elements.authEmail,
    elements.authPassword,
    elements.rememberMe,
    elements.signUpFirstName,
    elements.signUpEmail,
    elements.signUpPassword,
    elements.signUpRememberMe,
    elements.emailLogin,
    elements.emailSignUp,
    elements.googleSignIn,
    elements.googleSignUp,
    elements.forgotPassword,
    elements.showSignUp,
    elements.showLogIn,
  ]) {
    control.disabled = isBusy;
  }
}

function authErrorMessage(error, method) {
  switch (error.code) {
    case "auth/invalid-email":
      return "Enter a valid email address.";
    case "auth/user-not-found":
      return method === "Password recovery"
        ? "If an account exists for that email, a password reset email has been sent."
        : "The email or password is incorrect.";
    case "auth/email-already-in-use":
      return "An account with this email already exists. Try logging in instead.";
    case "auth/weak-password":
      return "Choose a stronger password with at least 6 characters.";
    case "auth/invalid-credential":
    case "auth/invalid-login-credentials":
    case "auth/wrong-password":
      return "The email or password is incorrect.";
    case "auth/user-disabled":
      return "This account is disabled. Contact an administrator.";
    case "auth/too-many-requests":
      return "Too many attempts. Wait a little and try again.";
    case "auth/network-request-failed":
      return "Could not connect to Firebase. Check your connection and try again.";
    case "auth/operation-not-allowed":
      return method === "Google"
        ? "Enable Google sign-in in Firebase Authentication and try again."
        : "Enable Email/Password sign-in in Firebase Authentication and try again.";
    default:
      return `${method} failed. Check your Firebase Authentication setup and try again.`;
  }
}

async function setAuthPersistence(rememberMe) {
  const persistence = rememberMe.checked
    ? firebaseModules.browserLocalPersistence
    : firebaseModules.browserSessionPersistence;
  await firebaseModules.setPersistence(firebaseAuth, persistence);
}

async function authenticateWithEmail(createAccount) {
  const form = createAccount ? elements.signUpForm : elements.emailAuthForm;
  const emailInput = createAccount ? elements.signUpEmail : elements.authEmail;
  const passwordInput = createAccount ? elements.signUpPassword : elements.authPassword;
  const rememberMe = createAccount ? elements.signUpRememberMe : elements.rememberMe;
  if (!form.reportValidity()) return;
  const firstName = createAccount ? elements.signUpFirstName.value.trim() : "";
  if (createAccount && !firstName) {
    elements.signUpFirstName.setCustomValidity("Enter your first name.");
    elements.signUpFirstName.reportValidity();
    return;
  }
  if (createAccount) elements.signUpFirstName.setCustomValidity("");

  setAuthBusy(true);
  showAuthMessage("");
  let accountCreated = false;
  try {
    await setAuthPersistence(rememberMe);
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    if (createAccount) {
      const credential = await firebaseModules.createUserWithEmailAndPassword(firebaseAuth, email, password);
      accountCreated = true;
      await firebaseModules.updateProfile(credential.user, { displayName: firstName });
      elements.accountName.textContent = firstName;
    } else {
      await firebaseModules.signInWithEmailAndPassword(firebaseAuth, email, password);
    }
  } catch (error) {
    console.error(accountCreated ? "Could not save the new user's first name:" : createAccount ? "Email sign-up failed:" : "Email login failed:", error);
    showAuthMessage(accountCreated
      ? "Your account was created, but we couldn't save your first name. Contact an administrator for help."
      : authErrorMessage(error, createAccount ? "Email sign-up" : "Email login"));
  } finally {
    setAuthBusy(false);
  }
}

async function sendPasswordRecovery() {
  if (!elements.authEmail.reportValidity()) return;

  setAuthBusy(true);
  showAuthMessage("");
  try {
    await firebaseModules.sendPasswordResetEmail(firebaseAuth, elements.authEmail.value.trim());
    showAuthMessage("If an account exists for that email, a password reset email has been sent.");
  } catch (error) {
    console.error("Password recovery failed:", error);
    showAuthMessage(authErrorMessage(error, "Password recovery"));
  } finally {
    setAuthBusy(false);
  }
}

elements.emailAuthForm.addEventListener("submit", (event) => {
  event.preventDefault();
  void authenticateWithEmail(false);
});
elements.signUpForm.addEventListener("submit", (event) => {
  event.preventDefault();
  void authenticateWithEmail(true);
});
elements.signUpFirstName.addEventListener("input", () => elements.signUpFirstName.setCustomValidity(""));
elements.forgotPassword.addEventListener("click", sendPasswordRecovery);
elements.showSignUp.addEventListener("click", () => {
  showAuthPage("sign-up");
  elements.signUpEmail.focus();
});
elements.showLogIn.addEventListener("click", () => {
  showAuthPage("log-in");
  elements.authEmail.focus();
});

async function start() {
  elements.authScreen.hidden = false;
  showAuthPage("log-in");
  setAuthBusy(true);
  try {
    const [pricesResponse, holidaysResponse] = await Promise.all([
      fetch("./prices.json", { cache: "no-store" }),
      fetch("./holidays.json", { cache: "no-store" }),
    ]);
    if (!pricesResponse.ok) throw new Error(`Could not load prices.json (HTTP ${pricesResponse.status}).`);
    if (!holidaysResponse.ok) throw new Error(`Could not load holidays.json (HTTP ${holidaysResponse.status}).`);
    const [prices, holidayConfig] = await Promise.all([pricesResponse.json(), holidaysResponse.json()]);
    holidayDefinitions = validateHolidayDefinitions(holidayConfig?.holidays);
    initializeCatalog(prices);

    if (!isFirebaseConfigured) {
      showAuthMessage("Add your Firebase web app values to firebase-config.js to enable sign-in.");
      return;
    }

    const [appSdk, authSdk, databaseSdk] = await Promise.all([
      import("https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js"),
      import("https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js"),
      import("https://www.gstatic.com/firebasejs/11.0.2/firebase-database.js"),
    ]);
    firebaseModules = { ...appSdk, ...authSdk, ...databaseSdk };
    const firebaseApp = appSdk.initializeApp(firebaseConfig);
    firebaseAuth = authSdk.getAuth(firebaseApp);
    database = databaseSdk.getDatabase(firebaseApp);
    authSdk.onAuthStateChanged(firebaseAuth, handleAuthState, (error) => {
      console.error("Firebase sign-in state failed:", error);
      showAuthMessage("Could not connect to Firebase Authentication. Check your configuration.");
    });
    setAuthBusy(false);
  } catch (error) {
    console.error("Could not initialize the application:", error);
    showAuthMessage(`Could not load the app. Check the Firebase configuration, network, prices.json, and holidays.json. ${error.message}`);
    setAuthBusy(true);
  }
}

async function authenticateWithGoogle(rememberMe) {
  setAuthBusy(true);
  showAuthMessage("");
  try {
    await setAuthPersistence(rememberMe);
    const provider = new firebaseModules.GoogleAuthProvider();
    await firebaseModules.signInWithPopup(firebaseAuth, provider);
  } catch (error) {
    if (error.code === "auth/popup-blocked") {
      try {
        await firebaseModules.signInWithRedirect(firebaseAuth, new firebaseModules.GoogleAuthProvider());
        return;
      } catch (redirectError) {
        error = redirectError;
      }
    }
    console.error("Google sign-in failed:", error);
    showAuthMessage(authErrorMessage(error, "Google"));
  } finally {
    setAuthBusy(false);
  }
}

elements.googleSignIn.addEventListener("click", () => {
  void authenticateWithGoogle(elements.rememberMe);
});
elements.googleSignUp.addEventListener("click", () => {
  void authenticateWithGoogle(elements.signUpRememberMe);
});

async function signOut() {
  if (!firebaseAuth) return;
  try {
    await firebaseModules.signOut(firebaseAuth);
  } catch (error) {
    console.error("Could not sign out:", error);
    showAuthMessage("Could not sign out. Please try again.");
  }
}

elements.signOut.addEventListener("click", signOut);
start();
void loadMetalSpotPrices();
setInterval(() => {
  void loadMetalSpotPrices();
}, 5 * 60_000);
setInterval(() => {
  if (!elements.appShell.hidden) showToday();
}, 60_000);
