const { app, safeStorage } = require('electron');
const { loadConfig } = require('./config');
const Logger = require('./logger');
const path = require('node:path');
const fs = require('node:fs');

const TASKS_FILE = app.isPackaged ? path.join(app.getPath('userData'), 'tasks.json') : path.resolve(__dirname, '..', '..', 'tasks.json');

let tasksCache = null;

function loadTasks() {
    try {
        if (tasksCache !== null) {
            return tasksCache;
        }

        if (fs.existsSync(TASKS_FILE)) {
            const data = fs.readFileSync(TASKS_FILE, 'utf8');

            if (safeStorage.isEncryptionAvailable() && loadConfig().useEncryption) {
                try {
                    const parsed = JSON.parse(data);
                    if (parsed.encrypted && parsed.data) {
                        const encryptedBuffer = Buffer.from(parsed.data, 'base64');
                        const decryptedBuffer = safeStorage.decryptString(encryptedBuffer);
                        tasksCache = JSON.parse(decryptedBuffer);
                    } else {
                        tasksCache = parsed;
                        saveTasks(tasksCache);
                    }
                } catch (parseError) {
                    tasksCache = JSON.parse(data);
                }
            } else {
                tasksCache = JSON.parse(data);
            }
        } else {
            tasksCache = [];
        }

        return tasksCache;
    } catch (error) {
        Logger.error('Error loading tasks', error);
    }
    
    return [];
}

function saveTasks(tasks) {
    try {
        let dataToSave;

        if (safeStorage.isEncryptionAvailable() && loadConfig().useEncryption) {
            const jsonString = JSON.stringify(tasks, null, 2);
            const encryptedBuffer = safeStorage.encryptString(jsonString);

            dataToSave = JSON.stringify({
                encrypted: true,
                data: encryptedBuffer.toString('base64'),
                version: '0.0.2'
            }, null, 2);
        } else {
            dataToSave = JSON.stringify(tasks, null, 2);
        }

        fs.writeFileSync(TASKS_FILE, dataToSave);
        tasksCache = tasks;
        return true;
    } catch (error) {
        Logger.error('Error saving tasks', error);
        return false;
    }
}

function resetTasksFile() {
    try {
        if (fs.existsSync(TASKS_FILE)) {
            fs.unlinkSync(TASKS_FILE);
            tasksCache = [];
            Logger.info('Tasks file reset successfully');
            return true;
        } else {
            Logger.warn('Tasks file does not exist, nothing to reset');
            return false;
        }
    } catch (error) {
        Logger.error('Error resetting tasks file', error);
        return false;
    }
}

function exportTasks() {
    const tasks = loadTasks();
    return JSON.stringify(tasks, null, 2);
}

module.exports = { loadTasks, saveTasks, resetTasksFile, exportTasks };