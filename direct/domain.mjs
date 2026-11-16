export const HOURS_MIN = 0.5;
export const HOURS_MAX = 24;
export const HOURS_STEP = 0.5;

export const FILTERS = ["all", "active", "done"];

export function createInitialTasks() {
  return [
    { id: "t1", title: "Чтение", hours: 2, done: true },
    { id: "t2", title: "Практика", hours: 4, done: false },
    { id: "t3", title: "Повторение", hours: 2, done: false },
  ];
}

export function validateTask(input) {
  const errors = {};
  const rawTitle = input && typeof input.title === "string" ? input.title : "";
  const title = rawTitle.trim();
  if (title === "") {
    errors.title = "Введите название задачи.";
  }

  const rawHours = input ? input.hours : undefined;
  const emptyHours =
    rawHours === undefined ||
    rawHours === null ||
    (typeof rawHours === "string" && rawHours.trim() === "");

  let hours = NaN;
  if (emptyHours) {
    errors.hours = "Введите часы (от 0,5 до 24).";
  } else {
    hours = typeof rawHours === "number" ? rawHours : Number(rawHours);
    if (!Number.isFinite(hours)) {
      errors.hours = "Часы должны быть числом.";
    } else if (hours < HOURS_MIN || hours > HOURS_MAX) {
      errors.hours = "Часы должны быть от 0,5 до 24.";
    } else if (Math.round(hours / HOURS_STEP) * HOURS_STEP !== hours) {
      errors.hours = "Часы указываются с шагом 0,5.";
    }
  }

  const ok = Object.keys(errors).length === 0;
  return { ok, errors, value: ok ? { title, hours } : null };
}

export function totalHours(tasks) {
  return tasks.reduce((sum, task) => sum + task.hours, 0);
}

export function doneHours(tasks) {
  return tasks.reduce((sum, task) => sum + (task.done ? task.hours : 0), 0);
}

export function computeProgress(tasks) {
  const total = totalHours(tasks);
  if (tasks.length === 0 || total <= 0) return 0;
  return Math.round((100 * doneHours(tasks)) / total);
}

export function filterTasks(tasks, filter) {
  if (filter === "active") return tasks.filter((task) => !task.done);
  if (filter === "done") return tasks.filter((task) => task.done);
  return tasks.slice();
}

export function addTask(tasks, { title, hours }) {
  const id = `t${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
  return [...tasks, { id, title, hours, done: false }];
}

export function removeTask(tasks, id) {
  return tasks.filter((task) => task.id !== id);
}

export function toggleTask(tasks, id) {
  return tasks.map((task) =>
    task.id === id ? { ...task, done: !task.done } : task,
  );
}
