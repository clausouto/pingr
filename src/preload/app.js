const { contextBridge, ipcRenderer } = require('electron/renderer');

contextBridge.exposeInMainWorld('remindersAPI', {
    addTask: (task) => ipcRenderer.invoke('add-task', task),
    getTasks: () => ipcRenderer.invoke('get-tasks'),
    getTask: (id) => ipcRenderer.invoke('get-task', id),
    deleteTask: (id) => ipcRenderer.invoke('delete-task', id),
    completeTask: (id) => ipcRenderer.invoke('complete-task', id),
    editTask: (id, newContent, newTimeInfo) => ipcRenderer.invoke('edit-task', id, newContent, newTimeInfo),
    onTasksUpdated: (callback) => ipcRenderer.on('tasks-updated', callback)
});