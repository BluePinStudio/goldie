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
  selectedTotal: document.querySelector("#selected-total"),
  selectedCount: document.querySelector("#selected-count"),
  selectedAverage: document.querySelector("#selected-average"),
  selectedDayDate: document.querySelector("#selected-day-date"),
  selectedDayList: document.querySelector("#selected-day-list"),
  selectedDayEmpty: document.querySelector("#selected-day-empty"),
  weekTotalLabel: document.querySelector("#week-total-label"),
  weekTotal: document.querySelector("#week-total"),
  weekAverage: document.querySelector("#week-average"),
  weekChange: document.querySelector("#week-change"),
  weekChangeLabel: document.querySelector("#week-change-label"),
  monthTotalLabel: document.querySelector("#month-total-label"),
  monthTotal: document.querySelector("#month-total"),
  monthAverage: document.querySelector("#month-average"),
  monthChange: document.querySelector("#month-change"),
  monthChangeLabel: document.querySelector("#month-change-label"),
  summaryError: document.querySelector("#summary-error"),
  weekRange: document.querySelector("#week-range"),
  monthRange: document.querySelector("#month-range"),
  chartCaption: document.querySelector("#chart-caption"),
  salesChart: document.querySelector("#sales-chart"),
  bagsDate: document.querySelector("#bags-date"),
  form: document.querySelector("#job-form"),
  reference: document.querySelector("#job-reference"),
  noJobBag: document.querySelector("#no-job-bag"),
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
  toast: document.querySelector("#toast"),
};

let catalog;
let jobs = [];
let currentUser = null;
let canEdit = false;
let summaryRange = "week";
let summaryRequest = 0;
let lookupRequest = 0;
let lookupIndex = {};
let lookupLoading = false;
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

function calendarWeekDates(dateKey) {
  const day = new Date(`${dateKey}T12:00:00Z`).getUTCDay();
  const sunday = shiftDateKey(dateKey, -day);
  return Array.from({ length: 7 }, (_, index) => shiftDateKey(sunday, index));
}

function calendarMonthDates(dateKey) {
  const [year, month] = dateKey.split("-").map(Number);
  const dayCount = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return Array.from({ length: dayCount }, (_, index) => `${year}-${String(month).padStart(2, "0")}-${String(index + 1).padStart(2, "0")}`);
}

function previousCalendarMonthDates(dateKey) {
  const [year, month] = dateKey.split("-").map(Number);
  const previousMonth = new Date(Date.UTC(year, month - 2, 1));
  const previousYear = previousMonth.getUTCFullYear();
  const previousMonthNumber = previousMonth.getUTCMonth() + 1;
  const dayCount = new Date(Date.UTC(previousYear, previousMonthNumber, 0)).getUTCDate();
  return Array.from({ length: dayCount }, (_, index) => `${previousYear}-${String(previousMonthNumber).padStart(2, "0")}-${String(index + 1).padStart(2, "0")}`);
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
  const widthInput = elements.form.querySelector('input[name="ring-width"]:checked');
  const width = type === "ring" && widthInput
    ? catalog.ringWidths.find((entry) => entry.id === widthInput.value)
    : null;
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
    const quantity = task.characterFactor
        ? `<span class="quantity-control"><input type="number" min="1" max="200" step="1" value="1" name="quantity-${escapeHtml(task.id)}" aria-label="${escapeHtml(task.name)} character count" disabled><span>characters</span></span>`
      : task.quantityLabel
        ? `<span class="quantity-control"><input type="number" min="1" max="99" step="1" value="1" name="quantity-${escapeHtml(task.id)}" aria-label="${escapeHtml(task.quantityLabel)} quantity" disabled><span>${escapeHtml(task.quantityLabel.toLowerCase())}</span></span>`
      : "";
    const priceDescription = !rates
      ? ""
      : task.characterFactor
        ? `${money(rates.setup)} setup + ${money(rates.unit)} / character`
      : rates.additional !== null
        ? `${money(rates.unit)} first · ${money(rates.additional)} each more`
        : task.quantityLabel
          ? `${money(rates.unit)} / ${escapeHtml(task.quantityLabel.toLowerCase().replace(/s$/, ""))}`
          : money(rates.unit);
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
      ? "Replacement clasps and bails priced separately."
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
  for (const task of catalog.tasks[type]) {
    const checkbox = elements.taskList.querySelector(`#task-${CSS.escape(task.id)}`);
    const option = checkbox?.closest(".task-option");
    if (!checkbox || !option) continue;
    const ratesAvailable = taskRates(type, task) !== null;
    const materialEligible = ratesAvailable && (!task.eligibleMaterials || task.eligibleMaterials.includes(elements.material.value));
    if (!materialEligible && checkbox.checked) checkbox.checked = false;
    option.hidden = !materialEligible;
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
    if (!rates) {
      priceElement.textContent = "";
      continue;
    }
    priceElement.textContent = task.characterFactor
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
    const quantity = task.quantityLabel || task.characterFactor ? Number(quantityInput.value) : 1;
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
    : [job.type === "chain" ? "necklace" : job.type, formatJobMaterial(job), job.widthName];
  return `
    <article class="bag-card">
      <div class="bag-topline">
        <div class="bag-title-wrap">
          <p class="bag-reference">${escapeHtml(job.reference || (job.noJobBag ? "No job bag" : job.customItem || "Untitled job bag"))}</p>
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

function editDistance(left, right) {
  let previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let row = 1; row <= left.length; row += 1) {
    const current = [row];
    for (let column = 1; column <= right.length; column += 1) {
      current[column] = Math.min(
        current[column - 1] + 1,
        previous[column] + 1,
        previous[column - 1] + (left[row - 1] === right[column - 1] ? 0 : 1),
      );
    }
    previous = current;
  }
  return previous[right.length];
}

function fuzzyReferenceDistance(query, reference) {
  if (reference.includes(query)) return 0;
  const maxDistance = query.length >= 5 ? 2 : 1;
  let best = maxDistance + 1;
  const minWindow = Math.max(1, query.length - maxDistance);
  const maxWindow = Math.min(reference.length, query.length + maxDistance);
  for (let size = minWindow; size <= maxWindow; size += 1) {
    for (let start = 0; start <= reference.length - size; start += 1) {
      best = Math.min(best, editDistance(query, reference.slice(start, start + size)));
      if (best === 0) return 0;
    }
  }
  return best;
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
    elements.lookupMessage.textContent = "Enter a reference to search job bags.";
    elements.lookupMessage.hidden = false;
    return;
  }
  const results = Object.values(lookupIndex).flatMap((entry) => {
    const reference = normalizeReference(entry.reference);
    if (!reference) return [];
    const distance = fuzzyReferenceDistance(normalized, reference);
    const maxDistance = normalized.length >= 5 ? 2 : 1;
    if (distance > maxDistance) return [];
    const score = reference === normalized ? 0
      : reference.startsWith(normalized) ? 1
        : reference.includes(normalized) ? 2
          : 3 + distance;
    return [{ ...entry, score }];
  }).sort((left, right) => left.score - right.score || Number(right.createdAt) - Number(left.createdAt));
  const matches = results.slice(0, 50);
  elements.lookupResults.innerHTML = matches.map((entry) => `
    <button class="lookup-result" type="button" data-lookup-id="${escapeHtml(entry.jobId)}" data-lookup-date="${escapeHtml(entry.date)}">
      <span class="lookup-result-main">
        <strong>${escapeHtml(entry.reference)}</strong>
        <span>${escapeHtml(formatDay(entry.date))}</span>
      </span>
      <span class="lookup-result-meta">${entry.createdAt ? escapeHtml(new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit", timeZone: "America/Toronto" }).format(new Date(entry.createdAt))) : ""}</span>
    </button>
  `).join("");
  elements.lookupMessage.textContent = !matches.length
    ? "No matching references."
    : matches.length === 50 ? "Showing the 50 closest matches." : "";
  elements.lookupMessage.hidden = matches.length > 0 && matches.length < 50;
  elements.lookupResults.querySelectorAll("[data-lookup-id]").forEach((button) => {
    button.addEventListener("click", () => loadLookupJob(button.dataset.lookupDate, button.dataset.lookupId));
  });
}

async function loadLookupData() {
  if (!database || !currentUser) return;
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
    searchLookupIndex(elements.lookupReference.value);
  } catch (error) {
    if (request !== lookupRequest) return;
    lookupLoading = false;
    console.error("Could not load job bags for lookup:", error);
    elements.lookupResults.innerHTML = "";
    elements.lookupMessage.hidden = false;
    elements.lookupMessage.textContent = "Could not load job bags. Check the database rules and connection.";
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
  const tasks = Array.isArray(job.tasks) ? job.tasks : Object.values(job.tasks || {});
  const piece = job.type === "custom"
    ? `Custom · ${job.customItem || ""}`
    : [job.type, formatJobMaterial(job), job.widthName].filter(Boolean).join(" · ");
  elements.lookupDetail.innerHTML = `
      <div class="lookup-detail-heading">
        <div>
          <p class="eyebrow">JOB BAG</p>
          <h2>${escapeHtml(job.reference || job.customItem || "Untitled job bag")}</h2>
          <p class="lookup-piece">${escapeHtml(piece)}</p>
        </div>
        <strong class="lookup-total">${money(Number(job.total) || 0)}</strong>
      </div>
      <dl class="lookup-metadata">
        <div><dt>Logged</dt><dd>${escapeHtml(formatLoggedAt(job.createdAt))}</dd></div>
        <div><dt>By</dt><dd>${escapeHtml(job.createdByName || "Unknown")}</dd></div>
        <div><dt>Reference</dt><dd>${escapeHtml(job.reference || "—")}</dd></div>
        ${formatJobMaterial(job) ? `<div><dt>Material</dt><dd>${escapeHtml(formatJobMaterial(job))}</dd></div>` : ""}
        ${job.widthName ? `<div><dt>Ring width</dt><dd>${escapeHtml(job.widthName)}</dd></div>` : ""}
        ${job.customItem ? `<div><dt>Item</dt><dd>${escapeHtml(job.customItem)}</dd></div>` : ""}
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
    elements.bagList.innerHTML = '<p class="catalog-error">Could not load today’s job bags. Check the Realtime Database rules and connection.</p>';
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

function reportPeriodDates(periodDates, today) {
  const first = periodDates[0];
  const last = periodDates[periodDates.length - 1];
  if (!first || first > today) return { dates: [], toDate: true };
  if (last >= today) {
    return {
      dates: periodDates.filter((date) => date <= today),
      toDate: true,
    };
  }
  return { dates: periodDates, toDate: false };
}

function periodMetrics(dateKeys, bagsByDate) {
  const total = dateKeys.reduce((sum, date) => {
    const bags = bagsByDate.get(date) || [];
    return sum + bags.reduce((bagSum, job) => bagSum + roundToNearestFive(Number(job.total) || 0), 0);
  }, 0);
  const loggedDays = dateKeys.filter((date) => (bagsByDate.get(date) || []).length > 0).length;
  return {
    total,
    average: loggedDays ? total / loggedDays : 0,
  };
}

function formatPeriodChange(currentTotal, previousTotal) {
  if (previousTotal === 0) return currentTotal === 0 ? "0%" : "New";
  const change = ((currentTotal - previousTotal) / previousTotal) * 100;
  const prefix = change > 0 ? "+" : "";
  return `${prefix}${change.toFixed(1)}%`;
}

function renderPeriodMetrics(type, currentDates, previousDates, bagsByDate, toDate) {
  const current = periodMetrics(currentDates, bagsByDate);
  const previous = periodMetrics(previousDates, bagsByDate);
  const isWeek = type === "week";
  const label = isWeek ? "WEEK" : "MONTH";
  const totalElement = isWeek ? elements.weekTotal : elements.monthTotal;
  const averageElement = isWeek ? elements.weekAverage : elements.monthAverage;
  const changeElement = isWeek ? elements.weekChange : elements.monthChange;
  const totalLabelElement = isWeek ? elements.weekTotalLabel : elements.monthTotalLabel;
  const changeLabelElement = isWeek ? elements.weekChangeLabel : elements.monthChangeLabel;

  totalLabelElement.textContent = `${label} ${toDate ? "TO DATE" : "TOTAL"}`;
  changeLabelElement.textContent = `VS PREV. ${label}${toDate ? " TO DATE" : ""}`;
  totalElement.textContent = money(current.total);
  averageElement.textContent = money(current.average);
  changeElement.textContent = formatPeriodChange(current.total, previous.total);
  changeElement.classList.toggle("change-positive", current.total > previous.total);
  changeElement.classList.toggle("change-negative", current.total < previous.total);
  changeElement.title = `${money(current.total)} compared with ${money(previous.total)} in the previous ${label.toLowerCase()}`;
}

async function loadSummary() {
  if (!database || !currentUser || !elements.summaryDate.value) return;
  const request = ++summaryRequest;
  const selectedDate = elements.summaryDate.value;
  const today = torontoDateKey();
  const weekDates = calendarWeekDates(selectedDate);
  const monthDates = calendarMonthDates(selectedDate);
  const weekReport = reportPeriodDates(weekDates, today);
  const monthReport = reportPeriodDates(monthDates, today);
  const previousWeekDates = weekReport.dates.map((date) => shiftDateKey(date, -7));
  const monthEnd = monthReport.dates[monthReport.dates.length - 1];
  const monthCutoffDay = monthEnd ? Number(monthEnd.slice(-2)) : 0;
  const previousMonthDates = previousCalendarMonthDates(selectedDate);
  const priorMonthBoundedDates = monthReport.toDate
    ? previousMonthDates.filter((date) => Number(date.slice(-2)) <= monthCutoffDay)
    : previousMonthDates;
  const chartDates = summaryRange === "week" ? weekDates : monthDates;
  const dateKeys = [...new Set([
    selectedDate,
    ...chartDates,
    ...weekReport.dates,
    ...previousWeekDates,
    ...monthReport.dates,
    ...priorMonthBoundedDates,
  ])];
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
    renderPeriodMetrics("week", weekReport.dates, previousWeekDates, bagsByDate, weekReport.toDate && weekReport.dates.length < weekDates.length);
    renderPeriodMetrics("month", monthReport.dates, priorMonthBoundedDates, bagsByDate, monthReport.toDate);

    if (summaryRange === "week") {
      const first = chartDates[0];
      const last = chartDates[chartDates.length - 1];
      elements.chartCaption.textContent = `${formatDay(first)} – ${formatDay(last)}`;
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
  lookupIndex = {};
  lookupLoading = false;
  lookupRequest += 1;
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
    elements.authCopy.textContent = "Sign in with your Google account to access the Journal, Summary, and Lookup.";
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
    lookupRequest += 1;
    lookupIndex = {};
    lookupLoading = false;
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

async function removeJob(job) {
  if (!activeDay || !database) return;
  if (!window.confirm("Are you sure you want to delete this job bag?")) return;
  try {
    await firebaseModules.update(
      firebaseModules.ref(database, `days/${activeDay}/bags/${job.id}`),
      { deleted: true },
    );
    showToast("Job bag marked as deleted.");
  } catch (error) {
    console.error("Could not mark the job bag as deleted:", error);
    showToast("Could not update the job bag. Check database access.");
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
elements.noJobBag.addEventListener("change", () => {
  elements.reference.setCustomValidity("");
  elements.reference.required = !elements.noJobBag.checked;
  elements.reference.disabled = elements.noJobBag.checked;
  if (elements.noJobBag.checked) elements.reference.value = "";
});
elements.material.addEventListener("change", () => {
  elements.goldColourSection.hidden = !elements.material.value.startsWith("gold-");
  updateConditionalTaskVisibility();
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
elements.lookupTab.addEventListener("click", () => activatePage("lookup"));
elements.lookupReference.addEventListener("input", () => searchLookupIndex(elements.lookupReference.value));
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
  if (!elements.noJobBag.checked && !elements.reference.value.trim()) {
    elements.reference.setCustomValidity("Enter a reference number or select No job bag.");
    elements.reference.reportValidity();
    return;
  }
  elements.reference.setCustomValidity("");
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
  if (selection.tasks.some((task) => task.characterFactor
      ? !Number.isInteger(task.quantity) || task.quantity < 1 || task.quantity > 200
    : task.quantityLabel && (!Number.isInteger(task.quantity) || task.quantity < 1 || task.quantity > 99))) {
    showError("Enter engraving in 1–200 characters and other quantities as whole numbers from 1 to 99.");
    return;
  }
  showError("");
  const reference = elements.noJobBag.checked ? "" : elements.reference.value.trim();
  const firstName = currentUser.displayName?.trim().split(/\s+/)[0] || "Staff";
  const job = {
    reference,
    noJobBag: elements.noJobBag.checked,
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
    elements.reference.setCustomValidity("");
    elements.reference.required = true;
    elements.reference.disabled = false;
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
