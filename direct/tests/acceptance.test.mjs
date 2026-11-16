import test from "node:test";
import assert from "node:assert/strict";

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
} from "../domain.mjs";

test("T1: стартовые данные дают 8 ч, 2 ч и прогресс 25%", () => {
  const tasks = createInitialTasks();
  assert.equal(totalHours(tasks), 8);
  assert.equal(doneHours(tasks), 2);
  assert.equal(computeProgress(tasks), 25);
});

test("T2: фильтр «активные» меняет список, прогресс остаётся 25%", () => {
  const tasks = createInitialTasks();
  const active = filterTasks(tasks, "active");
  assert.equal(active.length, 2);
  assert.deepEqual(
    active.map((task) => task.title),
    ["Практика", "Повторение"],
  );
  assert.equal(computeProgress(tasks), 25);
  assert.equal(totalHours(tasks), 8);
});

test("T3: пустое название или пустые/отрицательные часы — ошибка, задача не добавляется", () => {
  const tasks = createInitialTasks();

  const emptyTitle = validateTask({ title: "   ", hours: "2" });
  assert.equal(emptyTitle.ok, false);
  assert.ok(emptyTitle.errors.title);

  const emptyHours = validateTask({ title: "Новое", hours: "" });
  assert.equal(emptyHours.ok, false);
  assert.ok(emptyHours.errors.hours);

  const negativeHours = validateTask({ title: "Новое", hours: "-1" });
  assert.equal(negativeHours.ok, false);
  assert.ok(negativeHours.errors.hours);

  const attempts = [emptyTitle, emptyHours, negativeHours];
  let result = tasks;
  for (const attempt of attempts) {
    if (attempt.ok) result = addTask(result, attempt.value);
  }
  assert.equal(result.length, tasks.length);
});

test("T4: после удаления всех задач итог 0 ч и прогресс 0% без NaN/Infinity", () => {
  let tasks = createInitialTasks();
  for (const task of [...tasks]) {
    tasks = removeTask(tasks, task.id);
  }
  assert.equal(tasks.length, 0);
  assert.equal(totalHours(tasks), 0);
  assert.equal(computeProgress(tasks), 0);
  assert.ok(Number.isFinite(computeProgress(tasks)));
});

test("T5: «Практика» отмечена готовой — 6/8 ч и прогресс 75%", () => {
  let tasks = createInitialTasks();
  tasks = toggleTask(tasks, "t2");
  assert.equal(totalHours(tasks), 8);
  assert.equal(doneHours(tasks), 6);
  assert.equal(computeProgress(tasks), 75);
});
