const MIN_HOURS = 0.5;
const MAX_HOURS = 24;
const HOURS_STEP = 0.5;
const STEP_EPSILON = 1e-9;

export function createInitialTasks() {
  return [
    { id: "t1", title: "Чтение", hours: 2, done: true },
    { id: "t2", title: "Практика", hours: 4, done: false },
    { id: "t3", title: "Повторение", hours: 2, done: false },
  ];
}

export function totalHours(tasks) {
  return tasks.reduce((sum, task) => sum + task.hours, 0);
}

export function doneHours(tasks) {
  return tasks.reduce((sum, task) => sum + (task.done ? task.hours : 0), 0);
}

export function computeProgress(tasks) {
  const total = totalHours(tasks);
  if (!Number.isFinite(total) || total <= 0) {
    return 0;
  }

  const progress = Math.round((100 * doneHours(tasks)) / total);
  return Number.isFinite(progress) ? progress : 0;
}

export function validateTask({ title, hours }) {
  const errors = {};
  const trimmedTitle = typeof title === "string" ? title.trim() : "";

  if (trimmedTitle === "") {
    errors.title = "Укажите название задачи";
  }

  const normalizedHours = parseHours(hours);
  if (normalizedHours.error) {
    errors.hours = normalizedHours.error;
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    errors,
    value: { title: trimmedTitle, hours: normalizedHours.value },
  };
}

function parseHours(hours) {
  const raw = typeof hours === "string" ? hours.trim() : hours;

  if (raw === "" || raw === null || raw === undefined) {
    return { error: "Укажите часы" };
  }

  const value = Number(raw);
  if (!Number.isFinite(value)) {
    return { error: "Часы должны быть числом" };
  }

  if (value < MIN_HOURS || value > MAX_HOURS) {
    return { error: "Часы должны быть от 0,5 до 24" };
  }

  const steps = value / HOURS_STEP;
  if (Math.abs(steps - Math.round(steps)) > STEP_EPSILON) {
    return { error: "Часы указываются с шагом 0,5" };
  }

  return { value };
}

export function addTask(tasks, task) {
  return [...tasks, task];
}

export function removeTask(tasks, id) {
  return tasks.filter((task) => task.id !== id);
}

export function toggleTask(tasks, id) {
  return tasks.map((task) =>
    task.id === id ? { ...task, done: !task.done } : task,
  );
}

export function filterTasks(tasks, filter) {
  if (filter === "active") {
    return tasks.filter((task) => !task.done);
  }

  if (filter === "done") {
    return tasks.filter((task) => task.done);
  }

  return [...tasks];
}
