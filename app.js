import { firebaseConfig, isFirebaseConfigured } from "./firebase-config.js";

const elements = {
  authScreen: document.querySelector("#auth-screen"),
  authHeading: document.querySelector("#auth-heading"),
  authCopy: document.querySelector("#auth-copy"),
  authMessage: document.querySelector("#auth-message"),
  googleSignIn: document.querySelector("#google-sign-in"),
  appShell: document.querySelector("#app-shell"),
  accountBar: document.querySelector("#account-bar"),
  accountName: document.querySelector("#account-name"),
  signOut: document.querySelector("#sign-out"),
  jobsTab: document.querySelector("#jobs-tab"),
  summaryTab: document.querySelector("#summary-tab"),
  jobsView: document.querySelector("#jobs-view"),
  summaryView: document.querySelector("#summary-view"),
  roleBadge: document.querySelector("#role-badge"),
  summaryDate: document.querySelector("#summary-date"),
  selectedTotal: document.querySelector("#selected-total"),
  selectedCount: document.querySelector("#selected-count"),
  selectedAverage: document.querySelector("#selected-average"),
  selectedDayDate: document.querySelector("#selected-day-date"),
  selectedDayList: document.querySelector("#selected-day-list"),
  selectedDayEmpty: document.querySelector("#selected-day-empty"),
  summaryError: document.querySelector("#summary-error"),
  weekRange: document.querySelector("#week-range"),
  monthRange: document.querySelector("#month-range"),
  chartCaption: document.querySelector("#chart-caption"),
  salesChart: document.querySelector("#sales-chart"),
  bagsDate: document.querySelector("#bags-date"),
  form: document.querySelector("#job-form"),
  itemType: document.querySelector("#item-type"),
  material: document.querySelector("#material"),
  materialField: document.querySelector("#material-field"),
  goldColourSection: document.querySelector("#gold-colour-section"),
  goldColour: document.querySelector("#gold-colour"),
  customSection: document.querySelector("#custom-section"),
  customItem: document.querySelector("#custom-item"),
  customPrice: document.querySelector("#custom-price"),
  ringSection: document.querySelector("#ring-section"),
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
  clearButton: document.querySelector("#clear-button"),
  toast: document.querySelector("#toast"),
};

let catalog;
let jobs = [];
let currentUser = null;
let canEdit = false;
let summaryRange = "week";
let summaryRequest = 0;
let database;
let firebaseAuth;
let firebaseModules;
let unsubscribeMembership;
let unsubscribeDay;
let activeDay = "";
let toastTimeout;

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

function shiftDateKey(dateKey, offset) {
  const date = new Date(`${dateKey}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
}

function businessWeekDates(dateKey) {
  const day = new Date(`${dateKey}T12:00:00Z`).getUTCDay();
  const daysSinceTuesday = (day - 2 + 7) % 7;
  const tuesday = shiftDateKey(dateKey, -daysSinceTuesday);
  return Array.from({ length: 5 }, (_, index) => shiftDateKey(tuesday, index));
}

function calendarMonthDates(dateKey) {
  const [year, month] = dateKey.split("-").map(Number);
  const dayCount = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return Array.from({ length: dayCount }, (_, index) => `${year}-${String(month).padStart(2, "0")}-${String(index + 1).padStart(2, "0")}`);
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

function money(amount) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: catalog.currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(roundToNearestFive(amount));
}

function taskRates(type, task) {
  const rates = catalog.ratesCAD[task.rateGroup || type];
  const material = catalog.materials.find((entry) => entry.id === elements.material.value);
  const color = catalog.goldColors.find((entry) => entry.id === elements.goldColour.value);
  const widthInput = elements.form.querySelector('input[name="ring-width"]:checked');
  const width = type === "ring" && widthInput
    ? catalog.ringWidths.find((entry) => entry.id === widthInput.value)
    : null;
  const multiplier = (material?.multiplier ?? 1)
    * (material?.id.startsWith("gold-") ? color?.multiplier ?? 1 : 1)
    * (type === "ring" && !task.ignoreWidthMultiplier ? width?.multiplier ?? 1 : 1);
  return {
    unit: roundToNearestFive(rates[task.priceKey] * multiplier),
    additional: task.additionalPriceKey ? roundToNearestFive(rates[task.additionalPriceKey] * multiplier) : null,
    setup: task.setupPriceKey ? roundToNearestFive(rates[task.setupPriceKey] * multiplier) : 0,
  };
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
  for (const type of ["ring", "necklace"]) {
    if (!Array.isArray(data.tasks[type]) || data.tasks[type].length === 0 || !data.ratesCAD[type]) {
      throw new Error(`The pricing catalog needs at least one ${type} task.`);
    }
  }
  if (!data.materials.every((material) => Number.isFinite(material.multiplier) && material.multiplier > 0)
    || !data.goldColors.every((color) => Number.isFinite(color.multiplier) && color.multiplier > 0)) {
    throw new Error("Every material and gold colour needs a positive numeric multiplier.");
  }
  for (const [group, rates] of Object.entries(data.ratesCAD)) {
    if (!Object.values(rates).every((price) => Number.isFinite(price) && price >= 0)) {
      throw new Error(`Every ${group} rate must be a non-negative number in ratesCAD.`);
    }
  }
  for (const [type, tasks] of Object.entries(data.tasks)) {
    if (!tasks.every((task) => {
      const rates = data.ratesCAD[task.rateGroup || type];
      return rates
        && Number.isFinite(rates[task.priceKey])
        && (task.additionalPriceKey === undefined || Number.isFinite(rates[task.additionalPriceKey]))
        && (task.setupPriceKey === undefined || Number.isFinite(rates[task.setupPriceKey]))
        && (task.characterFactor !== true || Boolean(task.setupPriceKey))
        && (!task.sizeFactor || typeof task.sizeFactor === "boolean");
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
        <strong>${escapeHtml(width.name)}</strong><span>${escapeHtml(width.range)}</span>
      </label>
    </div>
  `).join("");
  updateItemType();
}

function updateItemType() {
  const type = elements.itemType.value;
  const isCustom = type === "custom";
  elements.otherWorkEnabled.checked = false;
  elements.otherWorkName.value = "";
  elements.otherWorkPrice.value = "";
  elements.otherWorkFields.hidden = true;
  elements.materialField.hidden = isCustom;
  elements.goldColourSection.hidden = isCustom || !elements.material.value.startsWith("gold-");
  elements.ringSection.hidden = type !== "ring";
  elements.customSection.hidden = !isCustom;
  elements.form.querySelector(".task-section").hidden = isCustom;
  if (isCustom) {
    updateEstimate();
    return;
  }
  elements.taskHint.textContent = type === "necklace" ? "Select repairs · extra work is discounted" : "Select all that apply";
  elements.taskList.innerHTML = catalog.tasks[type].map((task) => {
    const rates = taskRates(type, task);
    const quantity = task.sizeFactor
      ? `<span class="quantity-control"><input type="number" min="0.25" max="10" step="0.25" value="1" name="quantity-${escapeHtml(task.id)}" aria-label="${escapeHtml(task.name)} size change" disabled><span>sizes</span></span>`
      : task.characterFactor
        ? `<span class="quantity-control"><input type="number" min="1" max="200" step="1" value="1" name="quantity-${escapeHtml(task.id)}" aria-label="${escapeHtml(task.name)} character count" disabled><span>characters</span></span>`
      : task.quantityLabel
        ? `<span class="quantity-control"><input type="number" min="1" max="99" step="1" value="1" name="quantity-${escapeHtml(task.id)}" aria-label="${escapeHtml(task.quantityLabel)} quantity" disabled><span>${escapeHtml(task.quantityLabel.toLowerCase())}</span></span>`
      : "";
    const priceDescription = task.sizeFactor
      ? `${money(rates.unit)} / size`
      : task.characterFactor
        ? `${money(rates.setup)} setup + ${money(rates.unit)} / character`
      : rates.additional !== null
        ? `${money(rates.unit)} first · ${money(rates.additional)} each more`
        : task.quantityLabel
          ? `${money(rates.unit)} / ${escapeHtml(task.quantityLabel.toLowerCase().replace(/s$/, ""))}`
          : money(rates.unit);
    return `
      <div class="task-option">
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
      ? "Replacement clasps and bails priced separately."
      : "";
  for (const input of elements.taskList.querySelectorAll(".task-input")) {
    input.addEventListener("change", () => {
      haptic();
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
  updateEstimate();
}

function updateTaskPriceLabels() {
  const type = elements.itemType.value;
  if (!catalog?.tasks[type]) return;
  for (const task of catalog.tasks[type]) {
    const priceElement = elements.taskList.querySelector(`#task-${CSS.escape(task.id)} + .task-card .task-price`);
    if (!priceElement) continue;
    const rates = taskRates(type, task);
    priceElement.textContent = task.sizeFactor
      ? `${money(rates.unit)} / size`
      : task.characterFactor
        ? `${money(rates.setup)} setup + ${money(rates.unit)} / character`
      : rates.additional !== null
        ? `${money(rates.unit)} first · ${money(rates.additional)} each more`
        : task.quantityLabel
          ? `${money(rates.unit)} / ${task.quantityLabel.toLowerCase().replace(/s$/, "")}`
          : money(rates.unit);
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
  const material = catalog.materials.find((entry) => entry.id === elements.material.value);
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
    const quantity = task.quantityLabel || task.sizeFactor || task.characterFactor ? Number(quantityInput.value) : 1;
    const rates = taskRates(type, task);
    const taskTotal = rates.additional !== null
      ? rates.unit + Math.max(0, quantity - 1) * rates.additional
      : rates.setup + rates.unit * quantity;
    return [{ ...task, quantity, unitPrice: rates.unit, taskTotal }];
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
  const total = roundToNearestFive(tasks.reduce((sum, task) => sum + task.taskTotal, 0));
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
  const total = jobs.reduce((sum, job) => sum + roundToNearestFive(job.total), 0);
  const count = jobs.length;
  const formattedTotal = money(total);
  elements.totalValue.textContent = formattedTotal;
  elements.listTotal.textContent = formattedTotal;
  elements.bagCount.textContent = String(count);
  elements.headingCount.textContent = String(count);
  elements.averageValue.textContent = money(count ? total / count : 0);
  elements.emptyState.hidden = count > 0;
  elements.bagsTotal.hidden = count === 0;
  elements.clearButton.hidden = count === 0 || !canEdit;
  elements.bagList.innerHTML = jobs.map((job) => renderBagCard(job, canEdit)).join("");
  elements.bagList.querySelectorAll("[data-remove]").forEach((button) => {
    button.addEventListener("click", () => {
      removeJob(button.dataset.remove);
    });
  });
}

function renderBagCard(job, removable) {
  const taskChips = (Array.isArray(job.tasks) ? job.tasks : Object.values(job.tasks || {})).map((task) => {
    const quantity = task.sizeFactor
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
    : [job.type === "chain" ? "necklace" : job.type, job.materialName, job.goldColourName, job.widthName];
  return `
    <article class="bag-card">
      <div class="bag-topline">
        <div class="bag-title-wrap">
          <p class="bag-reference">${escapeHtml(job.reference || job.customItem || "Untitled job bag")}</p>
          <p class="bag-subtitle">${escapeHtml(descriptors.filter(Boolean).join(" · "))}</p>
        </div>
        <div class="bag-price-wrap">
          <strong class="bag-price">${money(job.total)}</strong>
          ${removable ? `<button class="remove-button" type="button" data-remove="${escapeHtml(job.id)}" aria-label="Remove ${escapeHtml(job.reference || "job bag")}">×</button>` : ""}
        </div>
      </div>
      <div class="bag-details">${taskChips}</div>
      ${job.notes ? `<p class="bag-notes">${escapeHtml(job.notes)}</p>` : ""}
      <span class="staff-chip">${escapeHtml(job.createdByName || "Staff")}</span>
    </article>
  `;
}

function dayBagsFromValue(data) {
  return Object.entries(data || {})
    .map(([id, job]) => ({ ...job, id }))
    .sort((left, right) => Number(right.createdAt) - Number(left.createdAt));
}

function showAuthMessage(message) {
  elements.authMessage.textContent = message;
}

function showToday() {
  const dateKey = torontoDateKey();
  elements.bagsDate.dateTime = dateKey;
  elements.bagsDate.textContent = formatDay(dateKey);
  if (!database || !currentUser || dateKey === activeDay) return;

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
    elements.bagList.innerHTML = '<p class="catalog-error">Could not load today’s job bags. Check the Realtime Database rules and connection.</p>';
  });
}

function activatePage(page) {
  const isSummary = page === "summary";
  elements.jobsView.hidden = isSummary;
  elements.summaryView.hidden = !isSummary;
  elements.jobsTab.classList.toggle("is-active", !isSummary);
  elements.jobsTab.setAttribute("aria-pressed", String(!isSummary));
  elements.summaryTab.classList.toggle("is-active", isSummary);
  elements.summaryTab.setAttribute("aria-pressed", String(isSummary));
  if (isSummary) loadSummary();
}

function renderSelectedDay(dayKey, dayBags) {
  const total = dayBags.reduce((sum, job) => sum + roundToNearestFive(Number(job.total) || 0), 0);
  elements.selectedTotal.textContent = money(total);
  elements.selectedCount.textContent = String(dayBags.length);
  elements.selectedAverage.textContent = money(dayBags.length ? total / dayBags.length : 0);
  elements.selectedDayDate.dateTime = dayKey;
  elements.selectedDayDate.textContent = formatDay(dayKey);
  elements.selectedDayList.innerHTML = dayBags.map((job) => renderBagCard(job, false)).join("");
  elements.selectedDayEmpty.hidden = dayBags.length > 0;
}

function compactMoney(amount) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: catalog.currency,
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(roundToNearestFive(amount));
}

function renderSalesChart(dateKeys, bagsByDate) {
  const totals = dateKeys.map((date) => {
    const bags = bagsByDate.get(date) || [];
    return {
      date,
      bags: bags.length,
      total: bags.reduce((sum, job) => sum + roundToNearestFive(Number(job.total) || 0), 0),
    };
  });
  const maxTotal = Math.max(1, ...totals.map((entry) => entry.total));
  elements.salesChart.style.minWidth = `${Math.max(440, totals.length * 52)}px`;
  elements.salesChart.innerHTML = totals.map((entry) => {
    const date = new Date(`${entry.date}T12:00:00Z`);
    const dayLabel = summaryRange === "week"
      ? new Intl.DateTimeFormat(undefined, { weekday: "short", timeZone: "UTC" }).format(date)
      : String(date.getUTCDate());
    const height = entry.total ? Math.max(4, entry.total / maxTotal * 100) : 0;
    return `
      <button class="chart-column" type="button" data-chart-date="${entry.date}" title="${formatDay(entry.date)} · ${money(entry.total)} · ${entry.bags} bags" aria-label="${formatDay(entry.date)}: ${money(entry.total)}, ${entry.bags} bags">
        <span class="chart-value">${compactMoney(entry.total)}</span>
        <span class="chart-bar" style="--bar-height:${height}%"></span>
        <span class="chart-date">${dayLabel}</span>
      </button>
    `;
  }).join("");
  elements.salesChart.querySelectorAll("[data-chart-date]").forEach((button) => {
    button.addEventListener("click", () => {
      elements.summaryDate.value = button.dataset.chartDate;
      loadSummary();
    });
  });
}

async function loadSummary() {
  if (!database || !currentUser || !elements.summaryDate.value) return;
  const request = ++summaryRequest;
  const selectedDate = elements.summaryDate.value;
  const chartDates = summaryRange === "week"
    ? businessWeekDates(selectedDate)
    : calendarMonthDates(selectedDate);
  const dateKeys = [...new Set([selectedDate, ...chartDates])];
  elements.summaryError.hidden = true;
  elements.selectedDayList.innerHTML = '<p class="loading-message">Loading day summary…</p>';
  elements.selectedDayEmpty.hidden = true;
  elements.salesChart.innerHTML = "";

  try {
    const entries = await Promise.all(dateKeys.map(async (date) => {
      const snapshot = await firebaseModules.get(firebaseModules.ref(database, `days/${date}/bags`));
      return [date, dayBagsFromValue(snapshot.val())];
    }));
    if (request !== summaryRequest) return;
    const bagsByDate = new Map(entries);
    renderSelectedDay(selectedDate, bagsByDate.get(selectedDate) || []);
    renderSalesChart(chartDates, bagsByDate);

    if (summaryRange === "week") {
      const first = chartDates[0];
      const last = chartDates[chartDates.length - 1];
      elements.chartCaption.textContent = `${formatDay(first)} – ${formatDay(last)} · Tuesday to Saturday`;
    } else {
      const date = new Date(`${selectedDate}T12:00:00Z`);
      elements.chartCaption.textContent = new Intl.DateTimeFormat(undefined, {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }).format(date);
    }
  } catch (error) {
    if (request !== summaryRequest) return;
    console.error("Could not load the summary:", error);
    elements.summaryError.textContent = "Could not load summary data. Check your Realtime Database read rules and connection.";
    elements.summaryError.hidden = false;
    elements.selectedDayList.innerHTML = "";
    elements.selectedDayEmpty.hidden = true;
  }
}

function handleAuthState(user) {
  unsubscribeMembership?.();
  unsubscribeDay?.();
  unsubscribeMembership = null;
  unsubscribeDay = null;
  activeDay = "";
  jobs = [];
  canEdit = false;
  summaryRequest += 1;
  render();
  currentUser = user;
  elements.accountBar.hidden = !user;

  if (!user) {
    elements.roleBadge.textContent = "";
    elements.appShell.hidden = true;
    elements.authScreen.hidden = false;
    elements.googleSignIn.hidden = false;
    elements.authHeading.textContent = "Sign in";
    elements.authCopy.textContent = "Sign in with your Google account to access shared job bags and summaries.";
    showAuthMessage("");
    return;
  }

  const firstName = user.displayName?.trim().split(/\s+/)[0] || "Staff";
  elements.accountName.textContent = firstName;
  elements.authScreen.hidden = false;
  elements.appShell.hidden = true;
  elements.googleSignIn.hidden = true;
  elements.authHeading.textContent = "Checking access";
  elements.authCopy.textContent = "";
  showAuthMessage("");

  const memberRef = firebaseModules.ref(database, `members/${user.uid}`);
  unsubscribeMembership = firebaseModules.onValue(memberRef, (snapshot) => {
    const member = snapshot.val();
    if (member?.active === true && ["editor", "viewer"].includes(member.role)) {
      canEdit = member.role === "editor";
      elements.roleBadge.textContent = canEdit ? "Editor" : "View only";
      elements.summaryDate.value = torontoDateKey();
      elements.jobsTab.hidden = false;
      elements.summaryTab.hidden = false;
      render();
      elements.authScreen.hidden = true;
      elements.appShell.hidden = false;
      showToday();
      activatePage("jobs");
      return;
    }
    unsubscribeDay?.();
    unsubscribeDay = null;
    activeDay = "";
    jobs = [];
    canEdit = false;
    elements.roleBadge.textContent = "";
    render();
    elements.appShell.hidden = true;
    elements.authScreen.hidden = false;
    elements.googleSignIn.hidden = true;
    elements.authHeading.textContent = member?.active === true ? "Role not configured" : "Access not enabled";
    elements.authCopy.textContent = member?.active === true
      ? "Ask an administrator to set this account's role to editor or viewer."
      : "Ask an administrator to approve this Google account.";
    showAuthMessage(`Firebase user ID: ${user.uid}`);
  }, (error) => {
    console.error("Could not check Firebase member access:", error);
    unsubscribeDay?.();
    unsubscribeDay = null;
    activeDay = "";
    jobs = [];
    canEdit = false;
    elements.roleBadge.textContent = "";
    render();
    elements.appShell.hidden = true;
    elements.authScreen.hidden = false;
    elements.googleSignIn.hidden = true;
    elements.authHeading.textContent = "Could not check access";
    elements.authCopy.textContent = "Check your Realtime Database rules and connection.";
    showAuthMessage(`Firebase user ID: ${user.uid}`);
  });
}

async function removeJob(id) {
  if (!activeDay || !database) return;
  try {
    await firebaseModules.remove(firebaseModules.ref(database, `days/${activeDay}/bags/${id}`));
    showToast("Job bag removed.");
  } catch (error) {
    console.error("Could not remove the job bag:", error);
    showToast("Could not remove the job bag. Check database access.");
  }
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("show");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => elements.toast.classList.remove("show"), 2300);
}

elements.itemType.addEventListener("change", updateItemType);
elements.material.addEventListener("change", () => {
  elements.goldColourSection.hidden = !elements.material.value.startsWith("gold-");
  updateEstimate();
});
elements.goldColour.addEventListener("change", updateEstimate);
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
elements.summaryDate.addEventListener("change", loadSummary);
elements.weekRange.addEventListener("click", () => {
  summaryRange = "week";
  elements.weekRange.classList.add("is-active");
  elements.weekRange.setAttribute("aria-pressed", "true");
  elements.monthRange.classList.remove("is-active");
  elements.monthRange.setAttribute("aria-pressed", "false");
  loadSummary();
});
elements.monthRange.addEventListener("click", () => {
  summaryRange = "month";
  elements.monthRange.classList.add("is-active");
  elements.monthRange.setAttribute("aria-pressed", "true");
  elements.weekRange.classList.remove("is-active");
  elements.weekRange.setAttribute("aria-pressed", "false");
  loadSummary();
});

elements.form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!currentUser || !database || !activeDay || !canEdit) {
    showError("Only editors can add job bags.");
    return;
  }
  const selection = getSelection();
  if (selection.type === "custom" && (!selection.customItem || !Number.isFinite(selection.customPrice) || selection.total < 5)) {
    showError("Enter the custom item and a price that rounds to at least $5.");
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
    showError("Enter an Other job description and a price that rounds to at least $5.");
    return;
  }
  if (selection.tasks.some((task) => task.sizeFactor
    ? !Number.isFinite(task.quantity) || task.quantity < 0.25 || task.quantity > 10 || Math.round(task.quantity * 4) !== task.quantity * 4
    : task.characterFactor
      ? !Number.isInteger(task.quantity) || task.quantity < 1 || task.quantity > 200
    : task.quantityLabel && (!Number.isInteger(task.quantity) || task.quantity < 1 || task.quantity > 99))) {
    showError("Enter sizing in quarter-size steps, engraving in 1–200 characters, and other quantities as whole numbers from 1 to 99.");
    return;
  }
  showError("");
  const reference = elements.form.elements.reference.value.trim();
  const firstName = currentUser.displayName?.trim().split(/\s+/)[0] || "Staff";
  const job = {
    reference,
    type: selection.type,
    customItem: selection.customItem || "",
    materialName: selection.material?.name || "",
    goldColourName: selection.color?.name || "",
    widthName: selection.width?.name || "",
    tasks: selection.tasks.map(({ id, name, unitPrice, taskTotal, quantity, sizeFactor, characterFactor }) => ({
      id,
      name,
      price: unitPrice,
      chargedAmount: taskTotal,
      quantity,
      sizeFactor: Boolean(sizeFactor),
      characterFactor: Boolean(characterFactor),
    })),
    notes: elements.form.elements.notes.value.trim(),
    total: roundToNearestFive(selection.total),
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
    haptic(25);
    celebrateJobAdded();
    elements.form.reset();
    elements.itemType.value = "ring";
    updateItemType();
    showToast(`${reference ? `${reference} added` : "Job bag added"} to today's list.`);
  } catch (error) {
    console.error("Could not save the job bag:", error);
    showError("Could not save the job bag. Check your connection and database access.");
  } finally {
    submitButton.disabled = false;
  }
});

elements.clearButton.addEventListener("click", async () => {
  if (!canEdit) return;
  if (!jobs.length || !window.confirm("Remove all of today's job bags?")) return;
  try {
    await firebaseModules.remove(firebaseModules.ref(database, `days/${activeDay}/bags`));
    showToast("Today's job bags cleared.");
  } catch (error) {
    console.error("Could not clear today's job bags:", error);
    showToast("Could not clear today's job bags. Check database access.");
  }
});

async function start() {
  elements.authScreen.hidden = false;
  elements.authHeading.textContent = "Sign in";
  elements.googleSignIn.disabled = true;
  showAuthMessage("");
  try {
    const response = await fetch("./prices.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`Could not load prices.json (HTTP ${response.status}).`);
    initializeCatalog(await response.json());

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
    elements.googleSignIn.disabled = false;
    authSdk.onAuthStateChanged(firebaseAuth, handleAuthState, (error) => {
      console.error("Firebase sign-in state failed:", error);
      showAuthMessage("Could not connect to Firebase Authentication. Check your configuration.");
    });
  } catch (error) {
    console.error("Could not initialize the application:", error);
    showAuthMessage(`Could not load the app. Check the Firebase configuration, network, and prices.json. ${error.message}`);
    elements.googleSignIn.disabled = true;
  }
}

elements.googleSignIn.addEventListener("click", async () => {
  elements.googleSignIn.disabled = true;
  showAuthMessage("");
  try {
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
    showAuthMessage("Google sign-in failed. Check your Firebase Authentication setup and try again.");
  } finally {
    elements.googleSignIn.disabled = false;
  }
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
setInterval(() => {
  if (!elements.appShell.hidden) showToday();
}, 60_000);
