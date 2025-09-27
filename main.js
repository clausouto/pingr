const { app, BrowserWindow, ipcMain, Notification } = require('electron');
const path = require('node:path');
const fs = require('node:fs');

const TASKS_FILE = path.join(app.getPath('userData'), 'tasks.json');

let notificationTimer;
let tasksCache = null;
let mainWindow = null;

function loadTasks() {
    try {
        if (tasksCache !== null) {
            console.log("Using cached tasks");
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

function checkForNotifications() {
    console.log('Checking for notifications...');
    const tasks = loadTasks();
    const now = Date.now();
    let tasksUpdated = false;

    for (let i = 0; i < tasks.length; i++) {
        const task = tasks[i];

        if (task.timestamp === null) continue;

        if (!task.completed && !task.notified && task.timestamp <= now) {
            const notification = new Notification({
                title: 'Reminder',
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

        const newTask = {
            id: crypto.randomUUID(),
            content: task.content,
            timestamp: task.timestamp,
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

    ipcMain.handle('get-tasks', () => {
        const tasks = loadTasks();
        return tasks.sort((a, b) => b.createdAt - a.createdAt);
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
    stopNotificationTimer();
    console.log('Notification timer stopped.');
    if (process.platform !== 'darwin') {
        app.quit()
    }
})