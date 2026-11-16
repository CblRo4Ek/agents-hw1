import {
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

const STORAGE_KEY = "study-tracker-tasks";
const STORAGE_ERROR_MESSAGE =
  "Сохранение недоступно: браузер блокирует локальное хранилище. Трекер продолжит работать в памяти — данные сохранятся только до перезагрузки.";

export function isValidStoredTask(task) {
  if (task === null || typeof task !== "object") {
    return false;
  }

  const steps = task.hours / 0.5;

  return (
    typeof task.id === "string" &&
    task.id !== "" &&
    typeof task.title === "string" &&
    task.title.trim() !== "" &&
    typeof task.hours === "number" &&
    Number.isFinite(task.hours) &&
    task.hours >= 0.5 &&
    task.hours <= 24 &&
    Math.abs(steps - Math.round(steps)) < 1e-9 &&
    typeof task.done === "boolean"
  );
}

export function loadTasks(store) {
  if (!store) {
    return createInitialTasks();
  }

  try {
    const raw = store.getItem(STORAGE_KEY);
    if (raw === null) {
      return createInitialTasks();
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || !parsed.every(isValidStoredTask)) {
      return createInitialTasks();
    }

    return parsed.map((task) => ({
      id: task.id,
      title: task.title,
      hours: task.hours,
      done: task.done,
    }));
  } catch {
    return createInitialTasks();
  }
}

export function saveTasks(store, tasks) {
  if (!store) {
    return false;
  }

  try {
    store.setItem(STORAGE_KEY, JSON.stringify(tasks));
    return true;
  } catch {
    return false;
  }
}

function openStorage() {
  try {
    const candidate = window.localStorage;
    const probe = "__study_tracker_probe__";
    candidate.setItem(probe, probe);
    candidate.removeItem(probe);
    return candidate;
  } catch {
    return null;
  }
}

function startApp() {
  const elements = {
    form: document.querySelector("#task-form"),
    titleInput: document.querySelector("#task-title"),
    hoursInput: document.querySelector("#task-hours"),
    titleError: document.querySelector("#title-error"),
    hoursError: document.querySelector("#hours-error"),
    totalHours: document.querySelector("#total-hours"),
    doneHours: document.querySelector("#done-hours"),
    progress: document.querySelector("#progress"),
    progressBar: document.querySelector("#progress-bar"),
    progressValue: document.querySelector("#progress-value"),
    taskList: document.querySelector("#task-list"),
    emptyState: document.querySelector("#empty-state"),
    filters: document.querySelector(".filters"),
    storageMessage: document.querySelector("#storage-message"),
  };

  const storage = openStorage();
  let storageAvailable = storage !== null;
  let tasks = loadTasks(storage);
  let filter = "all";
  let taskCounter = 0;

  function persistTasks() {
    if (!storageAvailable) {
      return;
    }

    if (!saveTasks(storage, tasks)) {
      storageAvailable = false;
      showStorageMessage(STORAGE_ERROR_MESSAGE);
    }
  }

  function showStorageMessage(message) {
    elements.storageMessage.textContent = message;
    elements.storageMessage.hidden = false;
  }

  function createTaskId() {
    taskCounter += 1;

    if (
      globalThis.crypto &&
      typeof globalThis.crypto.randomUUID === "function"
    ) {
      return `task-${globalThis.crypto.randomUUID()}`;
    }

    return `task-${Date.now()}-${taskCounter}`;
  }

  function formatHours(value) {
    const rounded = Math.round(value * 10) / 10;
    if (Number.isInteger(rounded)) {
      return `${rounded} ч`;
    }

    return `${rounded.toFixed(1).replace(".", ",")} ч`;
  }

  function createTaskItem(task) {
    const item = document.createElement("li");
    item.className = task.done ? "task task--done" : "task";
    item.dataset.id = task.id;

    const label = document.createElement("label");
    label.className = "task__main";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "task__checkbox";
    checkbox.checked = task.done;
    checkbox.dataset.action = "toggle";
    checkbox.setAttribute("aria-label", `Выполнение задачи «${task.title}»`);

    const content = document.createElement("span");
    content.className = "task__content";

    const title = document.createElement("span");
    title.className = "task__title";
    title.textContent = task.title;

    const hours = document.createElement("span");
    hours.className = "task__hours";
    hours.textContent = formatHours(task.hours);

    content.append(title, hours);
    label.append(checkbox, content);

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "task__delete";
    removeButton.dataset.action = "remove";
    removeButton.textContent = "Удалить";
    removeButton.setAttribute("aria-label", `Удалить задачу «${task.title}»`);

    item.append(label, removeButton);
    return item;
  }

  function renderSummary() {
    const total = totalHours(tasks);
    const done = doneHours(tasks);
    const progress = computeProgress(tasks);

    elements.totalHours.textContent = formatHours(total);
    elements.doneHours.textContent = formatHours(done);
    elements.progressValue.textContent = `${progress}%`;
    elements.progressBar.style.width = `${progress}%`;
    elements.progress.setAttribute("aria-valuenow", String(progress));
  }

  function renderTasks() {
    const visibleTasks = filterTasks(tasks, filter);
    elements.taskList.replaceChildren(...visibleTasks.map(createTaskItem));

    if (visibleTasks.length > 0) {
      elements.emptyState.hidden = true;
      return;
    }

    elements.emptyState.hidden = false;
    elements.emptyState.textContent =
      tasks.length === 0
        ? "Задач пока нет. Добавьте первую задачу."
        : "В этом фильтре задач нет.";
  }

  function renderFilters() {
    for (const button of elements.filters.querySelectorAll("[data-filter]")) {
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.filter === filter),
      );
    }
  }

  function render() {
    renderSummary();
    renderTasks();
    renderFilters();
  }

  function clearErrors() {
    elements.titleError.textContent = "";
    elements.titleError.hidden = true;
    elements.hoursError.textContent = "";
    elements.hoursError.hidden = true;
    elements.titleInput.removeAttribute("aria-invalid");
    elements.hoursInput.removeAttribute("aria-invalid");
  }

  function showErrors(errors) {
    if (errors.title) {
      elements.titleError.textContent = errors.title;
      elements.titleError.hidden = false;
      elements.titleInput.setAttribute("aria-invalid", "true");
    }

    if (errors.hours) {
      elements.hoursError.textContent = errors.hours;
      elements.hoursError.hidden = false;
      elements.hoursInput.setAttribute("aria-invalid", "true");
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    clearErrors();

    const result = validateTask({
      title: elements.titleInput.value,
      hours: elements.hoursInput.value,
    });

    if (!result.ok) {
      showErrors(result.errors);
      return;
    }

    tasks = addTask(tasks, {
      id: createTaskId(),
      title: result.value.title,
      hours: result.value.hours,
      done: false,
    });

    persistTasks();
    render();
    elements.form.reset();
    elements.titleInput.focus();
  }

  function handleTaskChange(event) {
    const checkbox = event.target.closest('[data-action="toggle"]');
    if (!checkbox) {
      return;
    }

    const item = checkbox.closest(".task");
    if (!item) {
      return;
    }

    tasks = toggleTask(tasks, item.dataset.id);
    persistTasks();
    render();
  }

  function handleTaskClick(event) {
    const removeButton = event.target.closest('[data-action="remove"]');
    if (!removeButton) {
      return;
    }

    const item = removeButton.closest(".task");
    if (!item) {
      return;
    }

    tasks = removeTask(tasks, item.dataset.id);
    persistTasks();
    render();
  }

  function handleFilterClick(event) {
    const button = event.target.closest("[data-filter]");
    if (!button) {
      return;
    }

    filter = button.dataset.filter;
    render();
  }

  elements.form.addEventListener("submit", handleSubmit);
  elements.taskList.addEventListener("change", handleTaskChange);
  elements.taskList.addEventListener("click", handleTaskClick);
  elements.filters.addEventListener("click", handleFilterClick);

  render();

  if (!storageAvailable) {
    showStorageMessage(STORAGE_ERROR_MESSAGE);
  }
}

if (typeof document !== "undefined") {
  startApp();
}
