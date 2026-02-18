/**
 * Stats — Task statistics calculator
 */

/**
 * Compute statistics from task array.
 * @param {Array} tasks
 * @returns {{ total: number, completed: number, pending: number, overdue: number, completionRate: number }}
 */
export function computeStats(tasks) {
    const today = new Date(new Date().toDateString());
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const pending = total - completed;
    const overdue = tasks.filter(t =>
        !t.completed && t.date && new Date(t.date) < today
    ).length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, pending, overdue, completionRate };
}
