/**
 * Search & Filter — Real-time task filtering
 */

let currentFilter = 'all';
let currentQuery = '';

/**
 * Filter tasks based on current filter and search query.
 * @param {Array} tasks
 * @returns {Array}
 */
export function filterTasks(tasks) {
    let result = tasks;

    // Status filter
    switch (currentFilter) {
        case 'active':
            result = result.filter(t => !t.completed);
            break;
        case 'completed':
            result = result.filter(t => t.completed);
            break;
        case 'high':
            result = result.filter(t => t.priority === 'high');
            break;
        default:
            break;
    }

    // Search query
    if (currentQuery) {
        const q = currentQuery.toLowerCase();
        result = result.filter(t =>
            t.title.toLowerCase().includes(q) ||
            (t.description && t.description.toLowerCase().includes(q)) ||
            (t.tags && t.tags.some(tag => tag.toLowerCase().includes(q)))
        );
    }

    return result;
}

/**
 * Set the active filter.
 * @param {'all'|'active'|'completed'|'high'} filter
 */
export function setFilter(filter) {
    currentFilter = filter;
}

/**
 * Set the search query.
 * @param {string} query
 */
export function setQuery(query) {
    currentQuery = query.trim();
}

/**
 * Get the current filter.
 */
export function getFilter() {
    return currentFilter;
}
