let listElement = document.getElementById("list");
let historyListElement = document.getElementById("historyList");
let historyContentElement = document.getElementById("historyContent");
let showHistoryCheckbox = document.getElementById("showHistory");

let translations = {};

async function loadTranslations() {
    const keys = [
        'ui.noActiveTasks',
        'ui.noCompletedTasks',
        'ui.completed',
        'ui.reminder',
        'ui.today',
        'ui.tomorrow',
        'ui.inputPlaceholder',
        'ui.reminderPlaceholder',
        'ui.activeTasks',
        'ui.showHistory',
        'ui.completedTasks'
    ];

    for (const key of keys) {
        translations[key] = await window.translationAPI.getTranslation(key);
    }
}

async function translatePage() {
    const elements = document.querySelectorAll('[data-i18n]');
    
    for (const element of elements) {
        const key = element.getAttribute('data-i18n');
        const translation = await window.translationAPI.getTranslation(key);
        element.textContent = translation;
    }

    const placeholderElements = document.querySelectorAll('[data-i18n-placeholder]');
    for (const element of placeholderElements) {
        const key = element.getAttribute('data-i18n-placeholder');
        const translation = await window.translationAPI.getTranslation(key);
        element.setAttribute('placeholder', translation);
    }
}

function t(key) {
    return translations[key] || key;
}

async function getTask(taskId) {
    return await window.remindersAPI.getTask(taskId);
}

async function deleteTask(taskId) {
    await window.remindersAPI.deleteTask(taskId);
    refreshDisplay();
}

async function completeTask(taskId) {
    await window.remindersAPI.completeTask(taskId);
    refreshDisplay();
}

async function editTask(taskId, newContent) {
    const originalTask = await getTask(taskId);
    if (!originalTask || originalTask.success === false) {
        console.error('Task not found for editing');
        return;
    }

    await window.remindersAPI.editTask(taskId, newContent);
    refreshDisplay();
}

function makeTaskEditable(taskElement, task) {
    if (taskElement.classList.contains('task-editing')) {
        return;
    }

    taskElement.classList.add('task-editing');

    const taskContentDiv = taskElement.querySelector('.task-content');
    const taskTextDiv = taskContentDiv.querySelector('.task-text');
    const originalContent = task.content;

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'task-edit-input';
    input.value = originalContent + ' ';

    taskTextDiv.replaceWith(input);

    const completeButton = taskElement.querySelector('.task-complete');
    const deleteButton = taskElement.querySelector('.task-delete');
    completeButton.style.display = 'none';
    deleteButton.style.display = 'none';

    input.focus();

    let handleClickOutside;

    const saveEdit = async () => {
        if (handleClickOutside) {
            document.removeEventListener('click', handleClickOutside);
        }

        const newContent = input.value.trim();
        if (newContent && newContent !== originalContent) {
            await editTask(task.id, newContent);
        } else {
            refreshDisplay();
        }
    };

    const cancelEdit = () => {
        if (handleClickOutside) {
            document.removeEventListener('click', handleClickOutside);
        }

        refreshDisplay();
    };

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            saveEdit();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            cancelEdit();
        }
    });

    // cancel if clicked outside (with small delay to prevent immediate cancellation)
    setTimeout(() => {
        handleClickOutside = (e) => {
            if (!taskElement.contains(e.target)) {
                document.removeEventListener('click', handleClickOutside);
                cancelEdit();
            }
        };
        document.addEventListener('click', handleClickOutside);
    }, 100);
}

async function displayTasks() {
    const tasks = await window.remindersAPI.getTasks();
    listElement.innerHTML = '';

    const activeTasks = tasks.filter(task => !task.completed);

    if (activeTasks.length === 0) {
        listElement.innerHTML = `<div class="text-center text-muted py-4"><i class="bi bi-check-circle me-2"></i>${t('ui.noActiveTasks')}</div>`;
        return;
    }

    activeTasks.forEach(task => {
        const taskElement = document.createElement('div');
        taskElement.className = 'task d-flex justify-content-between align-items-start';

        const now = Date.now();
        const isOverdue = task.timestamp && task.timestamp < now;
        if (isOverdue) {
            taskElement.classList.add('task-overdue');
        }

        let displayContent = task.content;
        if (task.timestamp) {
            // highlight time keyword
            const regex = new RegExp(`\\b${task.timeText}\\b`, 'i');
            displayContent = task.content.replace(regex, `<span class="time-keyword">$&</span>`);

        }

        let timeDisplay = '';
        if (task.timestamp) {
            const date = new Date(task.timestamp);
            const now = new Date();
            const isToday = date.toDateString() === now.toDateString();
            const isTomorrow = date.toDateString() === new Date(now.getTime() + 24 * 60 * 60 * 1000).toDateString();

            let dateText;
            if (isOverdue) {
                dateText = `📌 ${t('ui.reminder')} - ${date.toLocaleDateString('fr-FR', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                    year: 'numeric'
                })}`;
            } else if (isToday) {
                dateText = `${t('ui.today')} ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
            } else if (isTomorrow) {
                dateText = `${t('ui.tomorrow')} ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
            } else {
                dateText = date.toLocaleDateString('fr-FR', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                    year: 'numeric'
                });
            }

            timeDisplay = `<div class="task-date ${isOverdue ? 'overdue' : ''}">${dateText}</div>`;
        }

        taskElement.innerHTML = `
            <div class="task-content">
                <div class="task-text">${displayContent}</div>
                ${timeDisplay}
            </div>

            <button class="task-complete" data-task-id="${task.id}">
                <i class="bi bi-check-lg"></i>
            </button>

            <button class="task-delete" data-task-id="${task.id}">
                <i class="bi bi-x-lg"></i>
            </button>
        `;

        const deleteButton = taskElement.querySelector('.task-delete');
        deleteButton.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteTask(task.id);
        });

        const completeButton = taskElement.querySelector('.task-complete');
        completeButton.addEventListener('click', (e) => {
            e.stopPropagation();
            completeTask(task.id);
        });

        const taskContent = taskElement.querySelector('.task-content');
        taskContent.addEventListener('click', (e) => {
            if (!e.target.closest('.task-complete') && !e.target.closest('.task-delete')) {
                makeTaskEditable(taskElement, task);
            }
        });

        listElement.appendChild(taskElement);
    });
}

async function displayHistory() {
    const tasks = await window.remindersAPI.getTasks();
    historyContentElement.innerHTML = '';

    const completedTasks = tasks.filter(task => task.completed);

    if (completedTasks.length === 0) {
        historyContentElement.innerHTML = `<div class="text-center text-muted py-4"><i class="bi bi-check-circle me-2"></i>${t('ui.noCompletedTasks')}</div>`;
        return;
    }

    completedTasks.forEach(task => {
        const taskElement = document.createElement('div');
        taskElement.className = 'task task-completed d-flex justify-content-between align-items-start';

        taskElement.innerHTML = `
            <div class="task-content">
                <div class="task-text">${task.content}</div>
                <div class="task-date"><i class="bi bi-check-circle-fill me-1"></i>${t('ui.completed')}</div>
            </div>

            <button class="task-delete" data-task-id="${task.id}">
                <i class="bi bi-trash3"></i>
            </button>
        `;

        const deleteButton = taskElement.querySelector('.task-delete');
        deleteButton.addEventListener('click', () => deleteTask(task.id));

        historyContentElement.appendChild(taskElement);
    });
}

function refreshDisplay() {
    displayTasks();
    if (showHistoryCheckbox && showHistoryCheckbox.checked) {
        displayHistory();
    }
}

let form = document.getElementById("form");

form.addEventListener("submit", (e) => {
    e.preventDefault();
    let content = document.getElementById("content").value;

    window.remindersAPI.addTask({
        content
    });

    document.getElementById("content").value = '';
    refreshDisplay();
});

if (showHistoryCheckbox) {
    showHistoryCheckbox.addEventListener('change', () => {
        if (showHistoryCheckbox.checked) {
            historyListElement.style.display = 'block';
            displayHistory();
        } else {
            historyListElement.style.display = 'none';
        }
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    await loadTranslations();
    await translatePage();

    refreshDisplay();

    window.remindersAPI.onTasksUpdated(() => {
        refreshDisplay();
    });
});