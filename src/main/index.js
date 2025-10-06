const { app, BrowserWindow, ipcMain, Notification, Tray, nativeImage, Menu } = require('electron');
const Logger = require('./logger');
const { loadTasks, saveTasks } = require('./tasks');
const { loadConfig } = require('./config');
const { updateElectronApp } = require('update-electron-app');
const { handleStartupEvent } = require('./squirrel-startup');
const path = require('node:path');
const chrono = require('chrono-node');
const crypto = require('crypto');

if (handleStartupEvent()) {
  return;
}
updateElectronApp();

const ICON = nativeImage.createFromPath(path.resolve(__dirname, '..', '..', 'resources', 'icon.png'));
const TRAY_ICON = nativeImage.createFromPath(process.platform === 'darwin' ? path.resolve(__dirname, '..', '..', 'resources', 'tray-icon-apple.png') : path.resolve(__dirname, '..', '..', 'resources', 'tray-icon.png'));

let notificationTimer = null;

let mainWindow = null;
let tray = null;

process.on('uncaughtException', (error) => {
    Logger.error('Uncaught Exception', error);
    if (!app.isPackaged) {
        process.exit(1);
    }
});

function sourceFile() {
    return path.resolve(__dirname, '..', 'renderer', 'index.html')
}

function calculateTime(content) {
    if (!content) return;
    try {
        const timeInfo = chrono.fr.parse(content);
        if (timeInfo.length === 0) return {
            text: null,
            timestamp: null
        };
        return {
            text: timeInfo[0].text,
            timestamp: timeInfo[0].start.date().getTime(),
        }
    } catch (error) {
        Logger.error('Error parsing date', error);
    }
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

            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.once('focus', () => mainWindow.flashFrame(false));
                mainWindow.flashFrame(true);
            }

            task.notified = true;
            tasksUpdated = true;
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
    stopNotificationTimer();

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
    const gotTheLock = app.requestSingleInstanceLock();
    if (!gotTheLock) {
        app.quit();
        return;
    } else {
        app.on('second-instance', (event, commandLine, workingDirectory) => {
            if (mainWindow) {
                if (mainWindow.isMinimized()) mainWindow.restore();
                mainWindow.show();
                mainWindow.focus();
            } else {
                createWindow();
            }
        });
    }

    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        icon: ICON,
        webPreferences: {
            preload: path.resolve(__dirname, '..', 'preload', 'app.js')
        }
    })

    // open dev tools
    //mainWindow.webContents.openDevTools();
    mainWindow.loadFile(sourceFile());
}

app.whenReady().then(() => {
    require('./menu');
    loadConfig();

    ipcMain.handle('add-task', (event, task) => {
        const tasks = loadTasks();
        const time = calculateTime(task.content);

        const newTask = {
            id: crypto.randomUUID(),
            content: task.content,
            timeText: time.text.trim(),
            timestamp: time.timestamp,
            createdAt: new Date().getTime(),
            completed: false,
            notified: false
        };

        tasks.push(newTask);

        if (saveTasks(tasks)) {
            Logger.info(`Task saved successfully`);
            return { success: true, task: newTask };
        } else {
            Logger.error('Failed to save task');
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

    ipcMain.handle('edit-task', (event, id, newContent) => {
        const tasks = loadTasks();
        const task = tasks.find(t => t.id === id);

        if (task) {
            const newTime = calculateTime(newContent);
            task.content = newContent;
            if (newTime && newTime.text && newTime.timestamp) {
                newTime.text = newTime.text.trim();
                if (task.timeText !== newTime.text) {
                    if (task.timestamp !== newTime.timestamp) {
                        task.notified = false;
                    }
                    task.timeText = newTime.text;
                    task.timestamp = newTime.timestamp;
                } else {
                    const timeAdjustMatch = newContent.match(/([+-]\d+)/);
                    if (timeAdjustMatch) {
                        const now = new Date();
                        let adjustment = parseInt(timeAdjustMatch[0]);
                        adjustment *= 60 * 1000;
                        if (now.getTime() > task.timestamp) {
                            task.timestamp = now.getTime() + adjustment;
                            task.notified = false;
                        } else {
                            task.timestamp += adjustment;
                        }

                        task.content = newContent.replace(/([+-]\d+)/, '').trim();
                    }
                }
            } else {
                task.timeText = null;
                task.timestamp = null;
            }
            saveTasks(tasks);
            return { success: true };
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

    if (!tray) {
        tray = new Tray(TRAY_ICON);
        const menu = Menu.buildFromTemplate([
            {
                label: "Open Pingr window", click: (item, window, event) => {
                    if (mainWindow) {
                        mainWindow.show();
                        mainWindow.focus();
                    } else {
                        createWindow();
                    }
                }
            },
            { type: "separator" },
            { role: "quit" },
        ]);
        tray.setToolTip('Pingr')
        tray.setContextMenu(menu);

        tray.on('click', () => {
            if (process.platform === 'darwin') return;
            if (mainWindow) {
                mainWindow.show();
                mainWindow.focus();
            } else {
                createWindow();
            }
        });
    }

    app.on("before-quit", ev => {
        console.log('App is quitting, cleaning up...');
        stopNotificationTimer();

        if (mainWindow) {
            mainWindow.removeAllListeners("close");
            mainWindow = null;
        }

        if (tray) {
            tray.destroy();
            tray = null;
        }
    });

    mainWindow.on('close', (e) => {
        e.preventDefault();
        mainWindow.hide();
    })

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow()
        }
    });
})