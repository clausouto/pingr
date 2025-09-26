const { contextBridge, ipcRenderer } = require('electron/renderer');

contextBridge.exposeInMainWorld('remindersAPI', {
    addTask: (task) => ipcRenderer.invoke('add-task', task),
    getTasks: () => ipcRenderer.invoke('get-tasks')
});