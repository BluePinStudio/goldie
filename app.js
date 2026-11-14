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
let database;
let firebaseAuth;
let firebaseModules;
let unsubscribeMembership;
let unsubscribeDay;
let activeDay = "";
let toastTimeout;

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
  elements.taskFootnote.hidden = type !== "ring" && type !== "necklace";
  elements.taskFootnote.textContent = type === "ring"
    ? "For resizing, enter the change in quarter-size steps (for example 1.25). The displayed rate is per size."
    : type === "necklace"
      ? "Replacement clasps and bails priced separately."
      : "";
  for (const input of elements.taskList.querySelectorAll(".task-input")) {
    input.addEventListener("change", () => {
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
  elements.clearButton.hidden = count === 0;
  elements.bagList.innerHTML = jobs.map((job) => {
    const taskChips = (Array.isArray(job.tasks) ? job.tasks : Object.values(job.tasks || {})).map((task) => {
      const quantity = task.sizeFactor
        ? ` · ${task.quantity} sizes`
        : task.characterFactor
          ? ` · ${task.quantity} characters`
        : task.quantity > 1 ? ` × ${task.quantity}` : "";
      return `<span class="detail-chip">${escapeHtml(task.name)}${quantity}</span>`;
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
            <button class="remove-button" type="button" data-remove="${escapeHtml(job.id)}" aria-label="Remove ${escapeHtml(job.reference || "job bag")}">×</button>
          </div>
        </div>
        <div class="bag-details">${taskChips}</div>
        ${job.notes ? `<p class="bag-notes">${escapeHtml(job.notes)}</p>` : ""}
        <span class="staff-chip">${escapeHtml(job.createdByName || "Staff")}</span>
      </article>
    `;
  }).join("");
  elements.bagList.querySelectorAll("[data-remove]").forEach((button) => {
    button.addEventListener("click", () => {
      removeJob(button.dataset.remove);
    });
  });
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
    const data = snapshot.val() || {};
    jobs = Object.entries(data)
      .map(([id, job]) => ({ ...job, id }))
      .sort((left, right) => Number(right.createdAt) - Number(left.createdAt));
    render();
  }, (error) => {
    console.error("Could not load today's job bags:", error);
    elements.bagList.innerHTML = '<p class="catalog-error">Could not load today’s job bags. Check the Realtime Database rules and connection.</p>';
  });
}

function handleAuthState(user) {
  unsubscribeMembership?.();
  unsubscribeDay?.();
  unsubscribeMembership = null;
  unsubscribeDay = null;
  activeDay = "";
  jobs = [];
  render();
  currentUser = user;
  elements.accountBar.hidden = !user;

  if (!user) {
    elements.appShell.hidden = true;
    elements.authScreen.hidden = false;
    elements.googleSignIn.hidden = false;
    elements.authHeading.textContent = "Sign in";
    elements.authCopy.textContent = "Sign in with your Google account to view and add today's job bags.";
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
    if (snapshot.val()?.active === true) {
      elements.authScreen.hidden = true;
      elements.appShell.hidden = false;
      showToday();
      return;
    }
    unsubscribeDay?.();
    unsubscribeDay = null;
    activeDay = "";
    jobs = [];
    render();
    elements.appShell.hidden = true;
    elements.authScreen.hidden = false;
    elements.googleSignIn.hidden = true;
    elements.authHeading.textContent = "Access not enabled";
    elements.authCopy.textContent = "Ask an administrator to approve this Google account.";
    showAuthMessage(`Firebase user ID: ${user.uid}`);
  }, (error) => {
    console.error("Could not check Firebase member access:", error);
    unsubscribeDay?.();
    unsubscribeDay = null;
    activeDay = "";
    jobs = [];
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

elements.form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!currentUser || !database || !activeDay) {
    showError("Sign in with an approved account before adding a job bag.");
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
    tasks: selection.tasks.map(({ id, name, unitPrice, quantity, sizeFactor, characterFactor }) => ({
      id,
      name,
      price: unitPrice,
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
