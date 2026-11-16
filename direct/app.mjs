import {
  FILTERS,
  addTask,
  computeProgress,
  createInitialTasks,
  doneHours,
  filterTasks,
  removeTask,
  toggleTask,
  totalHours,
  validateTask,
} from "./domain.mjs";

const STORAGE_KEY = "mini-tracker-tasks-v2";

const state = {
  tasks: createInitialTasks(),
  filter: "all",
  storageAvailable: true,
};

const els = {
  form: document.querySelector("#task-form"),
  title: document.querySelector("#title"),
  hours: document.querySelector("#hours"),
  titleError: document.querySelector("#title-error"),
  hoursError: document.querySelector("#hours-error"),
  list: document.querySelector("#task-list"),
  empty: document.querySelector("#empty"),
  totalHours: document.querySelector("#total-hours"),
  doneHours: document.querySelector("#done-hours"),
  progress: document.querySelector("#progress"),
  progressBar: document.querySelector("#progress-bar"),
  filter: document.querySelector("#filter"),
  storageNotice: document.querySelector("#storage-notice"),
};

function detectStorage() {
  try {
    const probe = "__tracker_probe__";
    window.localStorage.setItem(probe, "1");
    window.localStorage.removeItem(probe);
    return true;
  } catch (error) {
    return false;
  }
}

function loadTasks() {
  if (!state.storageAvailable) return createInitialTasks();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialTasks();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return createInitialTasks();
    return parsed;
  } catch (error) {
    return createInitialTasks();
  }
}

function persist() {
  if (!state.storageAvailable) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.tasks));
  } catch (error) {
    state.storageAvailable = false;
    showStorageNotice();
  }
}

function showStorageNotice() {
  if (els.storageNotice) {
    els.storageNotice.hidden = false;
  }
}

function render() {
  const visible = filterTasks(state.tasks, state.filter);

  els.list.replaceChildren();
  for (const task of visible) {
    const item = document.createElement("li");
    item.className = "task";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.done;
    checkbox.id = `done-${task.id}`;
    checkbox.setAttribute("aria-label", `Отметить «${task.title}»`);
    checkbox.addEventListener("change", () => {
      state.tasks = toggleTask(state.tasks, task.id);
      persist();
      render();
    });

    const label = document.createElement("label");
    label.className = "task-title";
    label.htmlFor = checkbox.id;
    label.textContent = task.title;

    const hours = document.createElement("span");
    hours.className = "task-hours";
    hours.textContent = `${task.hours} ч`;

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "task-remove";
    remove.textContent = "Удалить";
    remove.setAttribute("aria-label", `Удалить «${task.title}»`);
    remove.addEventListener("click", () => {
      state.tasks = removeTask(state.tasks, task.id);
      persist();
      render();
    });

    item.append(checkbox, label, hours, remove);
    els.list.append(item);
  }

  els.empty.hidden = visible.length !== 0;

  const total = totalHours(state.tasks);
  const done = doneHours(state.tasks);
  const progress = computeProgress(state.tasks);

  els.totalHours.textContent = `${total} ч`;
  els.doneHours.textContent = `${done} ч`;
  els.progress.textContent = `${progress}%`;
  els.progressBar.style.width = `${progress}%`;
}

function clearErrors() {
  els.titleError.textContent = "";
  els.hoursError.textContent = "";
  els.title.removeAttribute("aria-invalid");
  els.hours.removeAttribute("aria-invalid");
}

function showErrors(errors) {
  if (errors.title) {
    els.titleError.textContent = errors.title;
    els.title.setAttribute("aria-invalid", "true");
  }
  if (errors.hours) {
    els.hoursError.textContent = errors.hours;
    els.hours.setAttribute("aria-invalid", "true");
  }
}

els.form.addEventListener("submit", (event) => {
  event.preventDefault();
  clearErrors();

  const result = validateTask({
    title: els.title.value,
    hours: els.hours.value,
  });

  if (!result.ok) {
    showErrors(result.errors);
    return;
  }

  state.tasks = addTask(state.tasks, result.value);
  persist();
  els.form.reset();
  render();
});

els.filter.addEventListener("change", () => {
  state.filter = FILTERS.includes(els.filter.value) ? els.filter.value : "all";
  render();
});

function init() {
  state.storageAvailable = detectStorage();
  if (!state.storageAvailable) {
    showStorageNotice();
  }
  state.tasks = loadTasks();
  render();
}

init();
