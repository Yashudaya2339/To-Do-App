/**
 * StorageManager — Safe localStorage abstraction
 * Handles JSON serialization, corruption recovery, and debounced writes.
 */

const STORAGE_KEY = 'taskflow_data';
const DEBOUNCE_MS = 300;

let saveTimer = null;

/**
 * Retrieve tasks from localStorage.
 * Returns an empty array if data is missing or corrupted.
 */
export function getTasks() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        console.warn('StorageManager: corrupted data, resetting.');
        localStorage.removeItem(STORAGE_KEY);
        return [];
    }
}

/**
 * Persist tasks to localStorage (debounced).
 * @param {Array} tasks
 */
export function saveTasks(tasks) {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
        } catch (e) {
            console.error('StorageManager: failed to save', e);
        }
    }, DEBOUNCE_MS);
}

/**
 * Immediately persist (used before page unload).
 * @param {Array} tasks
 */
export function saveTasksSync(tasks) {
    clearTimeout(saveTimer);
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (e) {
        console.error('StorageManager: sync save failed', e);
    }
}

/**
 * Get/set a simple preference value.
 */
export function getPref(key) {
    try {
        return localStorage.getItem(`taskflow_${key}`);
    } catch {
        return null;
    }
}

export function setPref(key, value) {
    try {
        localStorage.setItem(`taskflow_${key}`, value);
    } catch {
        /* silent */
    }
}
