/**
 * TaskFlow Application Logic
 * Integrates directly with ASP.NET Core Minimal Web API (/api/todos)
 */

const API_BASE = '/api/todos';

// Application State
let state = {
    tasks: [],
    filter: 'all', // 'all' | 'active' | 'completed'
    category: 'All', // 'All' | 'Work' | 'Study' | 'Personal' | 'Urgent'
    searchQuery: '',
    isLoading: true
};

// DOM Elements
const taskList = document.getElementById('taskList');
const emptyState = document.getElementById('emptyState');
const loadingState = document.getElementById('loadingState');
const addTaskForm = document.getElementById('addTaskForm');
const taskTitleInput = document.getElementById('taskTitleInput');
const taskCategorySelect = document.getElementById('taskCategorySelect');
const taskPrioritySelect = document.getElementById('taskPrioritySelect');
const taskDueDateInput = document.getElementById('taskDueDateInput');
const searchInput = document.getElementById('searchInput');
const clearSearchBtn = document.getElementById('clearSearchBtn');
const clearCompletedBtn = document.getElementById('clearCompletedBtn');
const themeToggle = document.getElementById('themeToggle');
const connectionStatus = document.getElementById('connectionStatus');

// Stats Elements
const totalTasksCount = document.getElementById('totalTasksCount');
const completedTasksCount = document.getElementById('completedTasksCount');
const pendingTasksCount = document.getElementById('pendingTasksCount');
const progressPercentage = document.getElementById('progressPercentage');
const progressBarFill = document.getElementById('progressBarFill');

// Modal Elements
const editModalOverlay = document.getElementById('editModalOverlay');
const editTaskForm = document.getElementById('editTaskForm');
const editTaskId = document.getElementById('editTaskId');
const editTaskTitle = document.getElementById('editTaskTitle');
const editTaskCategory = document.getElementById('editTaskCategory');
const editTaskPriority = document.getElementById('editTaskPriority');
const editTaskDueDate = document.getElementById('editTaskDueDate');
const closeModalBtn = document.getElementById('closeModalBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');

// ==========================================================================
// Initialization
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    setupEventListeners();
    fetchTasks();
});

// Theme Management
function initTheme() {
    const savedTheme = localStorage.getItem('taskflow_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('taskflow_theme', newTheme);
}

// ==========================================================================
// Event Listeners
// ==========================================================================

function setupEventListeners() {
    // Theme toggle
    themeToggle.addEventListener('click', toggleTheme);

    // Add Task
    addTaskForm.addEventListener('submit', handleAddTask);

    // Filter Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            state.filter = e.target.getAttribute('data-filter');
            renderTasks();
        });
    });

    // Category Chips
    document.querySelectorAll('.chip').forEach(chip => {
        chip.addEventListener('click', (e) => {
            document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
            e.target.classList.add('active');
            state.category = e.target.getAttribute('data-cat');
            renderTasks();
        });
    });

    // Search input
    let searchDebounce;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchDebounce);
        searchDebounce = setTimeout(() => {
            state.searchQuery = e.target.value.trim().toLowerCase();
            clearSearchBtn.style.display = state.searchQuery ? 'block' : 'none';
            renderTasks();
        }, 200);
    });

    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        state.searchQuery = '';
        clearSearchBtn.style.display = 'none';
        renderTasks();
    });

    // Clear completed
    clearCompletedBtn.addEventListener('click', handleClearCompleted);

    // Modal controls
    closeModalBtn.addEventListener('click', closeEditModal);
    cancelEditBtn.addEventListener('click', closeEditModal);
    editModalOverlay.addEventListener('click', (e) => {
        if (e.target === editModalOverlay) closeEditModal();
    });
    editTaskForm.addEventListener('submit', handleSaveEdit);
}

// ==========================================================================
// API Operations
// ==========================================================================

async function fetchTasks() {
    setLoading(true);
    try {
        const response = await fetch(API_BASE);
        if (!response.ok) throw new Error('API network response was not ok');
        const data = await response.json();
        state.tasks = data;
        updateConnectionStatus(true);
    } catch (err) {
        console.error('Failed to fetch tasks:', err);
        updateConnectionStatus(false);
        showToast('ไม่สามารถเชื่อมต่อกับ API ได้ กรุณาตรวจสอบว่ารัน dotnet run อยู่หรือไม่', 'error');
    } finally {
        setLoading(false);
        renderTasks();
        updateStats();
    }
}

async function handleAddTask(e) {
    e.preventDefault();
    const title = taskTitleInput.value.trim();
    if (!title) return;

    const newTask = {
        title: title,
        isComplete: false,
        category: taskCategorySelect.value,
        priority: taskPrioritySelect.value,
        dueDate: taskDueDateInput.value ? new Date(taskDueDateInput.value).toISOString() : null
    };

    try {
        const response = await fetch(API_BASE, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newTask)
        });

        if (!response.ok) throw new Error('Failed to create task');
        const createdTask = await response.json();

        state.tasks.unshift(createdTask);
        taskTitleInput.value = '';
        taskDueDateInput.value = '';
        renderTasks();
        updateStats();
        showToast('เพิ่มรายการงานสำเร็จแล้ว ✨', 'success');
    } catch (err) {
        console.error(err);
        showToast('เกิดข้อผิดพลาดในการสร้างงาน', 'error');
    }
}

async function handleToggleTask(id) {
    const task = state.tasks.find(t => t.id === id);
    if (!task) return;

    const previousStatus = task.isComplete;
    task.isComplete = !task.isComplete;
    renderTasks();
    updateStats();

    if (task.isComplete) {
        launchConfetti();
        showToast(`งาน "${task.title}" เสร็จเรียบร้อยแล้ว! 🎉`, 'success');
    }

    try {
        const response = await fetch(`${API_BASE}/${id}/toggle`, {
            method: 'PUT'
        });
        if (!response.ok) throw new Error('Failed to update status');
    } catch (err) {
        console.error(err);
        task.isComplete = previousStatus;
        renderTasks();
        updateStats();
        showToast('ไม่สามารถบันทึกสถานะได้', 'error');
    }
}

async function handleDeleteTask(id) {
    const taskIndex = state.tasks.findIndex(t => t.id === id);
    if (taskIndex === -1) return;

    const removedTask = state.tasks.splice(taskIndex, 1)[0];
    renderTasks();
    updateStats();

    try {
        const response = await fetch(`${API_BASE}/${id}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to delete');
        showToast('ลบรายการงานแล้ว', 'info');
    } catch (err) {
        console.error(err);
        state.tasks.splice(taskIndex, 0, removedTask);
        renderTasks();
        updateStats();
        showToast('เกิดข้อผิดพลาดในการลบ', 'error');
    }
}

async function handleClearCompleted() {
    const completedCount = state.tasks.filter(t => t.isComplete).length;
    if (completedCount === 0) return;

    if (!confirm(`คุณต้องการลบงานที่ทำเสร็จแล้วทั้งหมด ${completedCount} รายการใช่หรือไม่?`)) return;

    try {
        const response = await fetch(`${API_BASE}/completed`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to clear completed tasks');

        state.tasks = state.tasks.filter(t => !t.isComplete);
        renderTasks();
        updateStats();
        showToast(`ลบงานที่เสร็จแล้ว ${completedCount} รายการเรียบร้อย`, 'info');
    } catch (err) {
        console.error(err);
        showToast('เกิดข้อผิดพลาดในการลบงาน', 'error');
    }
}

function openEditModal(task) {
    editTaskId.value = task.id;
    editTaskTitle.value = task.title;
    editTaskCategory.value = task.category || 'General';
    editTaskPriority.value = task.priority || 'Medium';
    editTaskDueDate.value = task.dueDate ? task.dueDate.split('T')[0] : '';
    editModalOverlay.classList.add('active');
}

function closeEditModal() {
    editModalOverlay.classList.remove('active');
}

async function handleSaveEdit(e) {
    e.preventDefault();
    const id = parseInt(editTaskId.value);
    const task = state.tasks.find(t => t.id === id);
    if (!task) return;

    const updatedData = {
        id: id,
        title: editTaskTitle.value.trim(),
        isComplete: task.isComplete,
        category: editTaskCategory.value,
        priority: editTaskPriority.value,
        dueDate: editTaskDueDate.value ? new Date(editTaskDueDate.value).toISOString() : null
    };

    try {
        const response = await fetch(`${API_BASE}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedData)
        });

        if (!response.ok) throw new Error('Failed to update task');
        const result = await response.json();

        Object.assign(task, result);
        closeEditModal();
        renderTasks();
        updateStats();
        showToast('แก้ไขข้อมูลสำเร็จแล้ว', 'success');
    } catch (err) {
        console.error(err);
        showToast('เกิดข้อผิดพลาดในการแก้ไข', 'error');
    }
}

// ==========================================================================
// Rendering
// ==========================================================================

function renderTasks() {
    const filteredTasks = state.tasks.filter(task => {
        // Status filter
        if (state.filter === 'active' && task.isComplete) return false;
        if (state.filter === 'completed' && !task.isComplete) return false;

        // Category filter
        if (state.category !== 'All' && task.category !== state.category) return false;

        // Search query
        if (state.searchQuery && !task.title.toLowerCase().includes(state.searchQuery)) return false;

        return true;
    });

    taskList.innerHTML = '';

    if (filteredTasks.length === 0) {
        emptyState.style.display = 'block';
    } else {
        emptyState.style.display = 'none';
        filteredTasks.forEach(task => {
            taskList.appendChild(createTaskElement(task));
        });
    }
}

function createTaskElement(task) {
    const li = document.createElement('li');
    li.className = `task-item ${task.isComplete ? 'completed' : ''}`;
    li.setAttribute('data-id', task.id);

    // Format due date
    let dueInfoHtml = '';
    if (task.dueDate) {
        const dueDate = new Date(task.dueDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const isOverdue = !task.isComplete && dueDate < today;
        const formattedDate = dueDate.toLocaleDateString('th-TH', { month: 'short', day: 'numeric' });
        dueInfoHtml = `
            <span class="task-due ${isOverdue ? 'overdue' : ''}">
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                ${isOverdue ? 'เกินกำหนด: ' : 'ครบกำหนด: '}${formattedDate}
            </span>
        `;
    }

    const catClass = `badge-cat-${(task.category || 'general').toLowerCase()}`;
    const prioClass = `badge-prio-${(task.priority || 'medium').toLowerCase()}`;
    const prioLabel = task.priority === 'High' ? '🔴 ด่วนสูง' : task.priority === 'Low' ? '🟢 ทั่วไป' : '🟡 ปานกลาง';

    li.innerHTML = `
        <label class="custom-checkbox">
            <input type="checkbox" ${task.isComplete ? 'checked' : ''} onchange="handleToggleTask(${task.id})">
            <span class="checkmark">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
            </span>
        </label>
        <div class="task-content">
            <div class="task-title">${escapeHtml(task.title)}</div>
            <div class="task-meta">
                <span class="badge ${catClass}">${task.category || 'General'}</span>
                <span class="badge ${prioClass}">${prioLabel}</span>
                ${dueInfoHtml}
            </div>
        </div>
        <div class="task-actions">
            <button type="button" class="action-btn edit-btn" title="แก้ไข" onclick='openEditModal(${JSON.stringify(task).replace(/'/g, "&apos;")})'>
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
            </button>
            <button type="button" class="action-btn delete-btn" title="ลบ" onclick="handleDeleteTask(${task.id})">
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
        </div>
    `;

    return li;
}

function updateStats() {
    const total = state.tasks.length;
    const completed = state.tasks.filter(t => t.isComplete).length;
    const pending = total - completed;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

    totalTasksCount.textContent = total;
    completedTasksCount.textContent = completed;
    pendingTasksCount.textContent = pending;
    progressPercentage.textContent = `${percent}%`;
    progressBarFill.style.width = `${percent}%`;

    clearCompletedBtn.disabled = completed === 0;
}

function setLoading(isLoading) {
    state.isLoading = isLoading;
    loadingState.style.display = isLoading ? 'flex' : 'none';
}

function updateConnectionStatus(isConnected) {
    if (isConnected) {
        connectionStatus.textContent = '● Connected';
        connectionStatus.className = 'status-badge connected';
    } else {
        connectionStatus.textContent = '● Disconnected';
        connectionStatus.className = 'status-badge error';
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ==========================================================================
// Toasts
// ==========================================================================

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
        if (toast.parentElement) toast.remove();
    }, 3000);
}

// ==========================================================================
// Confetti Animation Effect
// ==========================================================================

function launchConfetti() {
    const canvas = document.getElementById('confettiCanvas');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const pieces = [];
    const colors = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#38bdf8', '#a855f7'];

    for (let i = 0; i < 70; i++) {
        pieces.push({
            x: canvas.width / 2,
            y: canvas.height * 0.4,
            r: Math.random() * 6 + 4,
            d: Math.random() * 50 + 10,
            color: colors[Math.floor(Math.random() * colors.length)],
            tilt: Math.floor(Math.random() * 10) - 10,
            tiltAngleIncremental: (Math.random() * 0.07) + 0.05,
            tiltAngle: 0,
            vx: (Math.random() - 0.5) * 14,
            vy: (Math.random() - 0.7) * 14
        });
    }

    let animationFrame;
    let opacity = 1;

    function render() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        pieces.forEach(p => {
            p.tiltAngle += p.tiltAngleIncremental;
            p.y += (Math.cos(p.d) + 3 + p.r / 2) / 2 + p.vy;
            p.x += Math.sin(p.d) * 2 + p.vx;
            p.vx *= 0.98;
            p.vy += 0.35; // gravity
            p.tilt = Math.sin(p.tiltAngle - (p.d / 3)) * 15;

            ctx.beginPath();
            ctx.lineWidth = p.r / 2;
            ctx.strokeStyle = p.color;
            ctx.moveTo(p.x + p.tilt + (p.r / 4), p.y);
            ctx.lineTo(p.x + p.tilt, p.y + p.tilt + (p.r / 4));
            ctx.stroke();
        });

        if (pieces[0] && pieces[0].y < canvas.height + 200) {
            animationFrame = requestAnimationFrame(render);
        } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            cancelAnimationFrame(animationFrame);
        }
    }

    render();
}
