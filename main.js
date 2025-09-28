const { app, BrowserWindow, ipcMain, Notification } = require('electron');
const path = require('node:path');
const fs = require('node:fs');

const TASKS_FILE = path.join(__dirname, 'tasks.json');
const DAY_NAMES = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']; // commencer par dimanche car getDay() renvoie 0 pour dimanche
const DEFAULT_HOUR = 8;

//dev
//path.join(__dirname, 'tasks.json');
//production
//path.join(app.getPath('userData'), 'tasks.json');

let notificationTimer;
let tasksCache = null;
let mainWindow = null;

function loadTasks() {
    try {
        if (tasksCache !== null) {
            //console.log("Using cached tasks");
            return tasksCache;
        }

        if (fs.existsSync(TASKS_FILE)) {
            console.log("Loading tasks from file");
            const data = fs.readFileSync(TASKS_FILE, 'utf8');
            tasksCache = JSON.parse(data);
            return tasksCache;
        } else {
            tasksCache = [];
            return tasksCache;
        }
    } catch (error) {
        console.error('Error loading tasks:', error);
    }
    return [];
}

function saveTasks(tasks) {
    try {
        fs.writeFileSync(TASKS_FILE, JSON.stringify(tasks, null, 2));
        tasksCache = tasks;
        return true;
    } catch (error) {
        console.error('Error saving tasks:', error);
        return false;
    }
}

function calculateTimestamp(timeInfo) {
    if (!timeInfo) return null;

    const now = new Date();
    const targetTime = new Date(now);

    switch (timeInfo.type) {
        case 'relative_minutes':
            targetTime.setMinutes(now.getMinutes() + timeInfo.minutes);

            if (timeInfo.seconds) {
                targetTime.setSeconds(now.getSeconds() + timeInfo.seconds);
            }
            break;
        case 'relative_hours':
            targetTime.setHours(now.getHours() + timeInfo.hours);

            if (timeInfo.minutes) {
                targetTime.setMinutes(now.getMinutes() + timeInfo.minutes);
            }
            break;
        case 'relative_days':
            targetTime.setDate(now.getDate() + timeInfo.days);
            break;
        case 'specific_day':
            const hour = timeInfo.hours || DEFAULT_HOUR;
            const minute = timeInfo.minutes || 0;

            // => days to add
            const dayHandlers = {
                "aujourd'hui": () => 0,
                "auj": () => 0,
                "demain": () => 1,
                "dem": () => 1,
                "après-demain": () => 2
            };

            const keyword = timeInfo.keyword.toLowerCase();

            if (dayHandlers[keyword]) {
                const daysToAdd = dayHandlers[keyword]();
                if (daysToAdd > 0) {
                    targetTime.setDate(now.getDate() + daysToAdd);
                }
                targetTime.setHours(hour, minute, 0, 0);
            } else {
                const targetDayIndex = DAY_NAMES.indexOf(keyword);
                if (targetDayIndex !== -1) {
                    const currentDayIndex = now.getDay();
                    let daysUntilTarget = (targetDayIndex - currentDayIndex + 7) % 7;
                    if (daysUntilTarget === 0) daysUntilTarget = 7;
                    targetTime.setDate(now.getDate() + daysUntilTarget);
                    targetTime.setHours(hour, minute, 0, 0);
                }
            }
            break;
        default:
            return null;
    }

    return targetTime.getTime();
}

function checkForNotifications() {
    const tasks = loadTasks();
    const now = Date.now();
    let tasksUpdated = false;

    for (let i = 0; i < tasks.length; i++) {
        const task = tasks[i];

        if (task.timestamp === null) continue;

        if (!task.completed && !task.notified && task.timestamp <= now) {
            const notification = new Notification({
                title: 'Pingr',
                body: task.content,
            });

            notification.show();

            task.notified = true;
            tasksUpdated = true;

            console.log(`Notification sent for task: ${task.content}`);
        }
    }

    if (tasksUpdated) {
        saveTasks(tasks);

        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('tasks-updated');
        }
    }
}

function startNotificationTimer() {
    console.log('Starting notification timer...');
    notificationTimer = setInterval(checkForNotifications, 1000);

    checkForNotifications();
}

function stopNotificationTimer() {
    if (notificationTimer) {
        clearInterval(notificationTimer);
        notificationTimer = null;
    }
}

const createWindow = () => {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        }
    })

    // open dev tools
    //mainWindow.webContents.openDevTools();
    mainWindow.loadFile('index.html')
}

app.whenReady().then(() => {
    ipcMain.handle('add-task', (event, task) => {
        const tasks = loadTasks();
        const timestamp = calculateTimestamp(task.timeInfo) || null;

        const newTask = {
            id: crypto.randomUUID(),
            content: task.content,
            timeInfo: task.timeInfo,
            timestamp: timestamp,
            createdAt: new Date().getTime(),
            completed: false,
            notified: false
        };

        tasks.push(newTask);

        if (saveTasks(tasks)) {
            console.log('Task saved successfully');
            return { success: true, task: newTask };
        } else {
            console.log('Failed to save task');
            return { success: false, error: 'Failed to save task' };
        }
    });

    ipcMain.handle('delete-task', (event, id) => {
        let tasks = loadTasks();
        tasks = tasks.filter(task => task.id !== id);
        saveTasks(tasks);
    });

    ipcMain.handle('complete-task', (event, id) => {
        const tasks = loadTasks();
        const task = tasks.find(t => t.id === id);
        if (task) {
            task.completed = true;
            saveTasks(tasks);
        }
    });

    ipcMain.handle('edit-task', (event, id, newContent, newTimeInfo) => {
        const tasks = loadTasks();
        const task = tasks.find(t => t.id === id);
        if (task) {
            task.content = newContent;

            if (newTimeInfo !== false && newTimeInfo !== null) {
                task.timestamp = calculateTimestamp(newTimeInfo) || null;
                task.timeInfo = newTimeInfo;
            } else if (newTimeInfo === null) {
                task.timestamp = null;
                task.timeInfo = null;
            } else if (newTimeInfo === false) {
                if (!task.timeInfo || !task.timestamp) return;
                const timeAdjustMatch = newContent.match(/([+-]\d+)/);
                if (timeAdjustMatch) {
                    const adjustment = parseInt(timeAdjustMatch[0]);
                    if (isNaN(adjustment) || adjustment === 0) return;

                    const now = new Date();
                    let adjustmentMs = 0;

                    switch (task.timeInfo.type) {
                        case 'relative_minutes':
                            adjustmentMs = adjustment * 60 * 1000;
                            break;
                        case 'relative_hours':
                            adjustmentMs = adjustment * 60 * 60 * 1000;
                            break;
                        case 'relative_days':
                            adjustmentMs = adjustment * 24 * 60 * 60 * 1000;
                            break;
                        default:
                            return;
                    }

                    if (now.getTime() > task.timestamp) {
                        task.timestamp = now.getTime() + adjustmentMs;
                        task.notified = false;
                    } else {
                        task.timestamp += adjustmentMs;
                    }

                    // remove the adjustment part from content
                    task.content = newContent.replace(/([+-]\d+)/, '').trim();
                    const currentValue = parseInt(task.timeInfo.value);
                    task.timeInfo.value = (currentValue + adjustment).toString();
                }
            }

            if (!saveTasks(tasks)) {
                return { success: false, error: 'Failed to save task' };
            }
        }
        return { success: false, error: 'Task not found' };
    });

    ipcMain.handle('get-tasks', () => {
        const tasks = loadTasks();
        return tasks.sort((a, b) => b.createdAt - a.createdAt);
    });

    ipcMain.handle('get-task', (event, id) => {
        const tasks = loadTasks();
        const task = tasks.find(t => t.id === id);
        return task || { success: false, error: 'Task not found' };
    });

    createWindow()

    startNotificationTimer();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow()
        }
    });
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        console.log("notification timer stopped");
        stopNotificationTimer();
        app.quit()
    }
})