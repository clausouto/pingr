const { Menu, safeStorage, dialog } = require('electron/main');
const fs = require('fs');
const autoLauncher = require('./autolauncher');
const { loadConfig, writeConfig } = require('./config');
const { resetTasksFile, exportTasks } = require('./tasks');

function createMenu() {
  const template = [
    ...(process.platform === 'darwin'
      ? [{ role: 'appMenu' }]
      : []),
    { role: 'fileMenu' },
    { role: 'editMenu' },
    { role: 'viewMenu' },
    { role: 'windowMenu' },
    {
      role: 'options',
      label: 'Paramètres',
      submenu: [
        {
          label: 'Lancer au démarrage',
          type: 'checkbox',
          checked: autoLauncher.getAutoLaunchStatus(),
          click: async () => {
            await autoLauncher.toggleAutoLaunch();
          },
        },
        {
          type: 'separator',
        },
        {
          label: 'Chiffrer les données (expérimental)',
          type: 'checkbox',
          checked: safeStorage.isEncryptionAvailable() && loadConfig().useEncryption,
          click: async () => {
            const config = loadConfig();
            config.useEncryption = !config.useEncryption;
            await writeConfig(config);
          },
        },
        {
          label: 'Exporter les tâches (non chiffrées)',
          click: () => {
            const tasks = exportTasks();
            dialog.showSaveDialog({
              title: 'Exporter les tâches',
              defaultPath: 'tasks.json',
            }).then((result) => {
              if (!result.canceled && result.filePath) {
                fs.writeFileSync(result.filePath, tasks);
              }
            });
          },
        },
        {
          type: 'separator',
        },
        {
          label: 'Réinitialiser les tâches',
          click: resetTasksFile,
        }
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

module.exports = { createMenu };

createMenu();