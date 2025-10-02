const { Menu } = require('electron/main');
const autoLauncher = require('./autolauncher');

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
      role: 'help',
      submenu: [
        {
          label: 'Auto Launch at Startup',
          type: 'checkbox',
          checked: autoLauncher.getAutoLaunchStatus(),
          click: async () => {
            await autoLauncher.toggleAutoLaunch();
          },
        }
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

module.exports = { createMenu };

createMenu();