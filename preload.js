const { contextBridge, ipcRenderer } = require('electron/renderer');

contextBridge.exposeInMainWorld('remindersAPI', {
    addTask: (task) => ipcRenderer.invoke('add-task', task),
    getTasks: () => ipcRenderer.invoke('get-tasks'),
    deleteTask: (id) => ipcRenderer.invoke('delete-task', id),
    completeTask: (id) => ipcRenderer.invoke('complete-task', id)
});