const TIME_PATTERNS = [
    {
        regex: /\b(?:dans|après)\s+(\d+)\s+(minutes?)\b/i,
        type: 'relative_minutes',
    },
    {
        regex: /\b(?:dans|après)\s+(\d+)\s+(heures?)\b/i,
        type: 'relative_hours',
    },
    {
        regex: /\b(?:dans|après)\s+(\d+)\s+(jours?)\b/i,
        type: 'relative_days',
    },
    {
        regex: /\b(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)\b/i,
        type: 'specific_day',
    }
];

const DAY_NAMES = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']; // commencer par dimanche car getDay() renvoie 0 pour dimanche
const DEFAULT_HOUR = 8;

function analyzeTimeKeyword(content) {
    for (const pattern of TIME_PATTERNS) {
        const match = content.match(pattern.regex);
        if (match) {
            return {
                type: pattern.type,
                value: match[1],
            };
        }
    }
    return false;
}

function calculateTimestamp(timeInfo) {
    if (!timeInfo) return null;

    const now = new Date();
    const targetTime = new Date(now);

    switch (timeInfo.type) {
        case 'relative_minutes':
            targetTime.setMinutes(now.getMinutes() + parseInt(timeInfo.value));
            break;
        case 'relative_hours':
            targetTime.setHours(now.getHours() + parseInt(timeInfo.value));
            break;
        case 'relative_days':
            targetTime.setDate(now.getDate() + parseInt(timeInfo.value));
            break;
        case 'specific_day':
            const targetDayIndex = DAY_NAMES.indexOf(timeInfo.value.toLowerCase());
            const currentDayIndex = now.getDay();
            let daysUntilTarget = (targetDayIndex - currentDayIndex + 7) % 7;
            if (daysUntilTarget === 0) daysUntilTarget = 7;
            targetTime.setDate(now.getDate() + daysUntilTarget);
            targetTime.setHours(DEFAULT_HOUR, 0, 0, 0);
            break;
        default:
            return null;
    }

    return targetTime.getTime();
}

let listElement = document.getElementById("list");
let historyListElement = document.getElementById("historyList");
let historyContentElement = document.getElementById("historyContent");
let showHistoryCheckbox = document.getElementById("showHistory");

async function deleteTask(taskId) {
    await window.remindersAPI.deleteTask(taskId);
    refreshDisplay();
}

async function completeTask(taskId) {
    await window.remindersAPI.completeTask(taskId);
    refreshDisplay();
}

async function displayTasks() {
    const tasks = await window.remindersAPI.getTasks();
    listElement.innerHTML = '';

    const activeTasks = tasks.filter(task => !task.completed);

    if (activeTasks.length === 0) {
        listElement.innerHTML = '<div class="text-center text-muted py-4"><i class="bi bi-check-circle me-2"></i>Aucune tâche en cours</div>';
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

        let timeDisplay = '';
        if (task.timestamp) {
            const date = new Date(task.timestamp);
            const now = new Date();
            const isToday = date.toDateString() === now.toDateString();
            const isTomorrow = date.toDateString() === new Date(now.getTime() + 24 * 60 * 60 * 1000).toDateString();

            let dateText;
            if (isOverdue) {
                dateText = `📌 Rappel - ${date.toLocaleDateString('fr-FR', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                })}`;
            } else if (isToday) {
                dateText = `Aujourd'hui ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
            } else if (isTomorrow) {
                dateText = `Demain ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
            } else {
                dateText = date.toLocaleDateString('fr-FR', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            }

            timeDisplay = `<div class="task-date ${isOverdue ? 'overdue' : ''}">${dateText}</div>`;
        }

        taskElement.innerHTML = `
            <div class="task-content">
                <div class="task-text">${task.content}</div>
                ${timeDisplay}
            </div>

            <button class="task-complete" data-task-id="${task.id}" title="Marquer comme terminé">
                <i class="bi bi-check-lg"></i>
            </button>

            <button class="task-delete" data-task-id="${task.id}" title="Supprimer">
                <i class="bi bi-x-lg"></i>
            </button>
        `;

        const deleteButton = taskElement.querySelector('.task-delete');
        deleteButton.addEventListener('click', () => deleteTask(task.id));

        const completeButton = taskElement.querySelector('.task-complete');
        completeButton.addEventListener('click', () => completeTask(task.id));

        listElement.appendChild(taskElement);
    });
}

async function displayHistory() {
    const tasks = await window.remindersAPI.getTasks();
    historyContentElement.innerHTML = '';

    const completedTasks = tasks.filter(task => task.completed);

    if (completedTasks.length === 0) {
        historyContentElement.innerHTML = '<div class="text-center text-muted py-4"><i class="bi bi-check-circle me-2"></i>Aucune tâche terminée</div>';
        return;
    }

    completedTasks.forEach(task => {
        const taskElement = document.createElement('div');
        taskElement.className = 'task task-completed d-flex justify-content-between align-items-start';

        taskElement.innerHTML = `
            <div class="task-content">
                <div class="task-text">${task.content}</div>
                <div class="task-date"><i class="bi bi-check-circle-fill me-1"></i>Terminé</div>
            </div>

            <button class="task-delete" data-task-id="${task.id}" title="Supprimer définitivement">
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
    let contentLower = content.toLowerCase();
    let timeInfo = analyzeTimeKeyword(contentLower);
    let timestamp = calculateTimestamp(timeInfo) || null;

    window.remindersAPI.addTask({
        content,
        timestamp
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

document.addEventListener('DOMContentLoaded', () => {
    refreshDisplay();

    window.remindersAPI.onTasksUpdated(() => {
        refreshDisplay();
    });
});