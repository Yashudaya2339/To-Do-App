/**
 * TaskManager — Business logic for CRUD operations.
 * Pure data layer — no DOM access.
 */

import { getTasks, saveTasks, saveTasksSync } from './storage.js';

let tasks = [];

/** Initialize from storage */
export function init() {
    tasks = getTasks();
    return tasks;
}

/** Get all tasks (returns a shallow copy) */
export function getAll() {
    return [...tasks];
}

/**
 * Add a new task.
 * @param {{ title: string, description?: string, date?: string, priority?: string, tags?: string[] }} data
 * @returns {object} the new task
 */
export function addTask({ title, description = '', date = '', priority = 'low', tags = [] }) {
    const task = {
        id: crypto.randomUUID(),
        title: title.trim(),
        description: description.trim(),
        date,
        priority,
        tags: tags.map(t => t.trim()).filter(Boolean),
        completed: false,
        createdAt: new Date().toISOString(),
        order: tasks.length,
    };
    tasks.unshift(task);
    reindex();
    saveTasks(tasks);
    return task;
}

/**
 * Update an existing task by ID.
 * @param {string} id
 * @param {object} updates
 * @returns {object|null} updated task or null
 */
export function updateTask(id, updates) {
    const idx = tasks.findIndex(t => t.id === id);
    if (idx === -1) return null;

    // Only allow updating safe fields
    const allowed = ['title', 'description', 'date', 'priority', 'tags', 'completed'];
    for (const key of allowed) {
        if (key in updates) {
            tasks[idx][key] = typeof updates[key] === 'string' ? updates[key].trim() : updates[key];
        }
    }
    saveTasks(tasks);
    return tasks[idx];
}

/**
 * Toggle completion status.
 * @param {string} id
 * @returns {object|null}
 */
export function toggleComplete(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return null;
    task.completed = !task.completed;
    saveTasks(tasks);
    return task;
}

/**
 * Delete a task by ID.
 * @param {string} id
 * @returns {boolean}
 */
export function deleteTask(id) {
    const idx = tasks.findIndex(t => t.id === id);
    if (idx === -1) return false;
    tasks.splice(idx, 1);
    reindex();
    saveTasks(tasks);
    return true;
}

/**
 * Reorder tasks after drag-and-drop.
 * @param {string} draggedId
 * @param {string} targetId
 */
export function reorderTasks(draggedId, targetId) {
    const dragIdx = tasks.findIndex(t => t.id === draggedId);
    const targetIdx = tasks.findIndex(t => t.id === targetId);
    if (dragIdx === -1 || targetIdx === -1) return;

    const [moved] = tasks.splice(dragIdx, 1);
    tasks.splice(targetIdx, 0, moved);
    reindex();
    saveTasks(tasks);
}

/**
 * Get a single task by ID.
 * @param {string} id
 * @returns {object|null}
 */
export function getTask(id) {
    return tasks.find(t => t.id === id) || null;
}

/** Flush pending saves synchronously (e.g. before unload) */
export function flush() {
    saveTasksSync(tasks);
}

/* ---- Helpers ---- */
function reindex() {
    tasks.forEach((t, i) => { t.order = i; });
}
