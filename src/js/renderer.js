/**
 * Renderer — DOM rendering engine.
 * Uses document.createElement (XSS-safe). No innerHTML.
 */

const ICONS = {
    check: `<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
    edit: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
    trash: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>`,
    calendar: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
    grip: `<svg viewBox="0 0 24 24" fill="currentColor" opacity="0.3"><circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/></svg>`,
};

/**
 * Render the full task list into the container.
 * @param {HTMLElement} container
 * @param {Array} tasks
 * @param {{ onToggle, onEdit, onDelete, onDragStart, onDragOver, onDrop, onDragEnd }} handlers
 */
export function renderTasks(container, tasks, handlers) {
    container.innerHTML = '';

    if (tasks.length === 0) {
        container.appendChild(createEmptyState());
        return;
    }

    tasks.forEach(task => {
        container.appendChild(createTaskCard(task, handlers));
    });
}

/**
 * Create a single task card element.
 */
function createTaskCard(task, handlers) {
    const card = document.createElement('div');
    card.className = `task-card${task.completed ? ' completed' : ''}`;
    card.dataset.id = task.id;
    card.draggable = true;
    card.setAttribute('role', 'listitem');

    // Drag handle
    const grip = document.createElement('span');
    grip.className = 'task-card__grip';
    grip.innerHTML = ICONS.grip;
    grip.style.cssText = 'cursor:grab;flex-shrink:0;width:18px;margin-top:3px;';
    card.appendChild(grip);

    // Checkbox
    const checkbox = document.createElement('button');
    checkbox.className = `task-card__checkbox${task.completed ? ' checked' : ''}`;
    checkbox.setAttribute('aria-label', task.completed ? 'Mark as incomplete' : 'Mark as complete');
    checkbox.innerHTML = ICONS.check;
    checkbox.addEventListener('click', () => handlers.onToggle(task.id));
    card.appendChild(checkbox);

    // Body
    const body = document.createElement('div');
    body.className = 'task-card__body';

    // Header (title + priority badge)
    const header = document.createElement('div');
    header.className = 'task-card__header';

    const title = document.createElement('span');
    title.className = 'task-card__title';
    title.textContent = task.title;
    header.appendChild(title);

    if (task.priority && task.priority !== 'none') {
        const badge = document.createElement('span');
        badge.className = `badge badge-${task.priority}`;
        badge.textContent = task.priority;
        header.appendChild(badge);
    }

    body.appendChild(header);

    // Description
    if (task.description) {
        const desc = document.createElement('p');
        desc.className = 'task-card__desc';
        desc.textContent = task.description;
        body.appendChild(desc);
    }

    // Meta (date + tags)
    const meta = document.createElement('div');
    meta.className = 'task-card__meta';

    if (task.date) {
        const dateEl = document.createElement('span');
        dateEl.className = 'task-card__date';
        const isOverdue = !task.completed && new Date(task.date) < new Date(new Date().toDateString());
        if (isOverdue) dateEl.classList.add('overdue');
        dateEl.innerHTML = `<span style="width:12px;height:12px;display:inline-flex;">${ICONS.calendar}</span>`;
        const dateText = document.createElement('span');
        dateText.textContent = formatDate(task.date);
        dateEl.appendChild(dateText);
        meta.appendChild(dateEl);
    }

    if (task.tags && task.tags.length) {
        task.tags.forEach(t => {
            const tag = document.createElement('span');
            tag.className = 'tag';
            tag.textContent = t;
            meta.appendChild(tag);
        });
    }

    if (meta.childNodes.length) body.appendChild(meta);
    card.appendChild(body);

    // Actions
    const actions = document.createElement('div');
    actions.className = 'task-card__actions';

    const editBtn = document.createElement('button');
    editBtn.className = 'btn btn-ghost btn-icon';
    editBtn.setAttribute('aria-label', 'Edit task');
    editBtn.innerHTML = ICONS.edit;
    editBtn.addEventListener('click', () => handlers.onEdit(task.id));
    actions.appendChild(editBtn);

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn btn-danger btn-icon';
    deleteBtn.setAttribute('aria-label', 'Delete task');
    deleteBtn.innerHTML = ICONS.trash;
    deleteBtn.addEventListener('click', () => handlers.onDelete(task.id));
    actions.appendChild(deleteBtn);

    card.appendChild(actions);

    // Drag events
    card.addEventListener('dragstart', (e) => {
        card.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', task.id);
        handlers.onDragStart?.(task.id);
    });
    card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
        handlers.onDragEnd?.();
    });
    card.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        card.classList.add('drag-over');
        handlers.onDragOver?.(task.id);
    });
    card.addEventListener('dragleave', () => {
        card.classList.remove('drag-over');
    });
    card.addEventListener('drop', (e) => {
        e.preventDefault();
        card.classList.remove('drag-over');
        const draggedId = e.dataTransfer.getData('text/plain');
        if (draggedId !== task.id) {
            handlers.onDrop?.(draggedId, task.id);
        }
    });

    return card;
}

function createEmptyState() {
    const el = document.createElement('div');
    el.className = 'empty-state animate-fade-in';
    el.innerHTML = `
    <div class="empty-state__icon">📝</div>
    <p class="empty-state__text">No tasks yet</p>
    <p class="empty-state__sub">Click "Add Task" to get started</p>
  `;
    return el;
}

function formatDate(dateStr) {
    try {
        const d = new Date(dateStr + 'T00:00:00');
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());

        if (target.getTime() === today.getTime()) return 'Today';
        if (target.getTime() === tomorrow.getTime()) return 'Tomorrow';

        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
        return dateStr;
    }
}

/**
 * Render stat cards.
 * @param {HTMLElement} container
 * @param {object} stats
 */
export function renderStats(container, stats) {
    container.innerHTML = '';
    const items = [
        { value: stats.total, label: 'Total', color: 'var(--primary-400)' },
        { value: stats.completed, label: 'Done', color: 'var(--success)' },
        { value: stats.pending, label: 'Pending', color: 'var(--accent-500)' },
        { value: stats.overdue, label: 'Overdue', color: 'var(--danger)' },
    ];

    items.forEach(({ value, label, color }) => {
        const card = document.createElement('div');
        card.className = 'stat-card';

        const valEl = document.createElement('div');
        valEl.className = 'stat-card__value';
        valEl.style.color = color;
        valEl.textContent = value;
        card.appendChild(valEl);

        const labEl = document.createElement('div');
        labEl.className = 'stat-card__label';
        labEl.textContent = label;
        card.appendChild(labEl);

        container.appendChild(card);
    });
}
