/**
 * App — Entry point. Wires all modules together.
 */

import * as TaskManager from './taskManager.js';
import { renderTasks, renderStats } from './renderer.js';
import { initTheme, toggleTheme } from './theme.js';
import { filterTasks, setFilter, setQuery, getFilter } from './search.js';
import { computeStats } from './stats.js';
// flush is available via TaskManager.flush()

// ── CSS imports (Vite handles these) ──
import '../css/variables.css';
import '../css/base.css';
import '../css/components.css';
import '../css/layout.css';
import '../css/animations.css';
import '../css/themes.css';

// ── DOM References ──
const $ = (sel) => document.querySelector(sel);
const statsGrid = $('#stats-grid');
const taskList = $('#task-list');
const searchInput = $('#search-input');
const themeToggle = $('#theme-toggle');
const addTaskBtn = $('#add-task-btn');
const modalBackdrop = $('#modal-backdrop');
const taskForm = $('#task-form');
const formTitle = $('#form-title');
const formTitleInput = $('#form-title-input');
const formDateInput = $('#form-date-input');
const formDescInput = $('#form-desc-input');
const formPriority = $('#form-priority');
const formTags = $('#form-tags');
const formSubmitBtn = $('#form-submit-btn');
const formCancelBtn = $('#form-cancel-btn');
const filterBtns = document.querySelectorAll('.filter-tab');

// Confirm delete dialog
const confirmBackdrop = $('#confirm-backdrop');
const confirmYesBtn = $('#confirm-yes');
const confirmNoBtn = $('#confirm-no');

let editingId = null;
let deletingId = null;

// ── Initialize ──
function init() {
    TaskManager.init();
    initTheme();
    refresh();
    bindEvents();

    // Flush data before page unload
    window.addEventListener('beforeunload', () => TaskManager.flush());
}

// ── Refresh UI ──
function refresh() {
    const all = TaskManager.getAll();
    const filtered = filterTasks(all);
    const stats = computeStats(all);

    renderStats(statsGrid, stats);
    renderTasks(taskList, filtered, {
        onToggle: handleToggle,
        onEdit: handleEdit,
        onDelete: handleDeletePrompt,
        onDragStart: () => { },
        onDragEnd: () => { },
        onDragOver: () => { },
        onDrop: handleDrop,
    });
}

// ── Event Bindings ──
function bindEvents() {
    // Add Task
    addTaskBtn.addEventListener('click', () => openModal());

    // Theme
    themeToggle.addEventListener('click', toggleTheme);

    // Search (debounced)
    let searchTimer;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => {
            setQuery(e.target.value);
            refresh();
        }, 200);
    });

    // Filters
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            setFilter(btn.dataset.filter);
            refresh();
        });
    });

    // Form submit
    taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        handleSubmit();
    });

    // Form cancel
    formCancelBtn.addEventListener('click', closeModal);

    // Modal backdrop click
    modalBackdrop.addEventListener('click', (e) => {
        if (e.target === modalBackdrop) closeModal();
    });

    // Confirm dialog
    confirmYesBtn.addEventListener('click', handleConfirmDelete);
    confirmNoBtn.addEventListener('click', closeConfirm);
    confirmBackdrop?.addEventListener('click', (e) => {
        if (e.target === confirmBackdrop) closeConfirm();
    });

    // Keyboard: Escape closes modals
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (!modalBackdrop.classList.contains('hidden')) closeModal();
            if (confirmBackdrop && !confirmBackdrop.classList.contains('hidden')) closeConfirm();
        }
    });
}

// ── Handlers ──
function handleToggle(id) {
    TaskManager.toggleComplete(id);
    refresh();
}

function handleEdit(id) {
    const task = TaskManager.getTask(id);
    if (!task) return;
    editingId = id;
    openModal(task);
}

function handleDeletePrompt(id) {
    deletingId = id;
    confirmBackdrop.classList.remove('hidden');
}

function handleConfirmDelete() {
    if (deletingId) {
        // Animate removal
        const card = document.querySelector(`[data-id="${deletingId}"]`);
        if (card) {
            card.classList.add('deleting');
            setTimeout(() => {
                TaskManager.deleteTask(deletingId);
                deletingId = null;
                closeConfirm();
                refresh();
            }, 150);
        } else {
            TaskManager.deleteTask(deletingId);
            deletingId = null;
            closeConfirm();
            refresh();
        }
    }
}

function closeConfirm() {
    confirmBackdrop.classList.add('hidden');
    deletingId = null;
}

function handleDrop(draggedId, targetId) {
    TaskManager.reorderTasks(draggedId, targetId);
    refresh();
}

function handleSubmit() {
    const title = formTitleInput.value.trim();
    if (!title) {
        formTitleInput.classList.add('shake');
        formTitleInput.focus();
        setTimeout(() => formTitleInput.classList.remove('shake'), 500);
        return;
    }

    const data = {
        title,
        description: formDescInput.value,
        date: formDateInput.value,
        priority: formPriority.value,
        tags: formTags.value.split(',').map(t => t.trim()).filter(Boolean),
    };

    if (editingId) {
        TaskManager.updateTask(editingId, data);
    } else {
        TaskManager.addTask(data);
    }

    closeModal();
    refresh();
}

// ── Modal ──
function openModal(task = null) {
    editingId = task ? task.id : null;
    formTitle.textContent = task ? 'Edit Task' : 'New Task';
    formSubmitBtn.textContent = task ? 'Update' : 'Add Task';

    formTitleInput.value = task?.title || '';
    formDateInput.value = task?.date || '';
    formDescInput.value = task?.description || '';
    formPriority.value = task?.priority || 'low';
    formTags.value = task?.tags?.join(', ') || '';

    modalBackdrop.classList.remove('hidden');
    setTimeout(() => formTitleInput.focus(), 100);
}

function closeModal() {
    modalBackdrop.classList.add('hidden');
    editingId = null;
    taskForm.reset();
}

// ── Boot ──
document.addEventListener('DOMContentLoaded', init);
