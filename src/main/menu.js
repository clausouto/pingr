const { Menu, safeStorage, dialog } = require('electron/main');

const fs = require('node:fs');

const autoLauncher = require('./autolauncher');
const { loadConfig, writeConfig } = require('./config');
const { resetTasksFile, exportTasks } = require('./tasks');
const i18n = require('./i18n');

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
      label: i18n.__('menu.settings'),
      submenu: [
        {
          label: i18n.__('menu.autoLaunch'),
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
          label: i18n.__('menu.encryptData'),
          type: 'checkbox',
          checked: safeStorage.isEncryptionAvailable() && loadConfig().useEncryption,
          click: async () => {
            const config = loadConfig();
            config.useEncryption = !config.useEncryption;
            await writeConfig(config);
          },
        },
        {
          label: i18n.__('menu.exportTasks'),
          click: () => {
            const tasks = exportTasks();
            dialog.showSaveDialog({
              title: i18n.__('menu.exportTasks'),
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
          label: i18n.__('menu.resetTasks'),
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