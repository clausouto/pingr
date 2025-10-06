# Pingr

<div align="center">
  <img src="resources/icon.png" alt="Pingr Logo" width="200"/>
  
  **A simple and elegant reminder management application**
  
  [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
  [![Version](https://img.shields.io/badge/version-0.0.1-green.svg)](package.json)
</div>

## 📝 Description

Pingr is a lightweight desktop reminder application built with Electron that helps you manage tasks with natural language time parsing. Simply type what you need to remember and when, and Pingr will notify you at the right time.

## ✨ Features

- **Natural Language Date Parsing**: Use French natural language to set reminders (e.g., "demain à 14h", "dans 2 heures")
- **Task Management**: Create, edit, complete, and delete tasks with ease
- **Smart Notifications**: Get notified when tasks are due
- **Task History**: View completed tasks in a dedicated history section
- **Data Encryption**: Optional encryption for your task data using Electron's SafeStorage
- **System Tray Integration**: Quick access from your system tray
- **Cross-Platform**: Works on Windows, macOS, and Linux
- **Export Tasks**: Export your tasks to JSON format (unencrypted)
- **Task Time Adjustments**: Quickly adjust task times with +/- shortcuts

## 🚀 Installation

### Download Pre-built Binaries

Download the latest release for your platform from the [Releases](https://github.com/clausouto/pingr/releases) page:

- **Windows**: `.exe` installer
- **macOS**: `.zip` archive
- **Linux**: `.deb` or `.rpm` package

### Build from Source

#### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

#### Steps

1. Clone the repository:
```bash
git clone https://github.com/clausouto/pingr.git
cd pingr
```

2. Install dependencies:
```bash
npm install
```

3. Run in development mode:
```bash
npm start
```

4. Build for production:
```bash
npm run make
```

The built application will be available in the `out/` directory.

## 📖 Usage

### Creating a Task

1. Open Pingr
2. Type your reminder in the input field
3. Press Enter to save

**Examples:**
- `Appeler Marie demain à 14h`
- `Réunion dans 2 heures`
- `Anniversaire vendredi`

### Managing Tasks

- **Complete a task**: Click the checkmark button (✓)
- **Delete a task**: Click the X button
- **Edit a task**: Double-click on the task content
- **View history**: Toggle "Afficher l'historique" checkbox

### Task Time Adjustments

When editing a task, you can use quick time adjustments:
- `+15` - Add 15 minutes
- `-30` - Subtract 30 minutes

### Settings

Access settings from the menu bar (Paramètres):

- **Lancer au démarrage**: Start Pingr automatically when your system boots
- **Chiffrer les données**: Enable/disable data encryption
- **Exporter les tâches**: Export tasks to JSON file
- **Réinitialiser les tâches**: Reset all tasks

## 🏗️ Project Structure

```
pingr/
├── src/
│   ├── main/           # Main process (Electron)
│   │   ├── index.js    # Application entry point
│   │   ├── menu.js     # Application menu
│   │   ├── tasks.js    # Task management
│   │   ├── config.js   # Configuration management
│   │   ├── logger.js   # Logging utility
│   │   ├── autolauncher.js  # Auto-launch functionality
│   │   └── squirrel-startup.js  # Squirrel startup handling
│   ├── preload/        # Preload scripts
│   │   └── app.js      # IPC bridge
│   ├── renderer/       # Renderer process (UI)
│   │   ├── index.html  # Main UI
│   │   └── index.js    # UI logic
│   └── styles/         # CSS styles
│       └── base.css
├── resources/          # Application icons and assets
├── forge.config.js     # Electron Forge configuration
└── package.json        # Project dependencies
```

## 🛠️ Development

### Available Scripts

- `npm start` - Start the application in development mode
- `npm run package` - Package the application
- `npm run make` - Create distribution packages
- `npm run publish` - Publish to GitHub releases

### Technologies Used

- **Electron**: Desktop application framework
- **Bootstrap 5**: UI framework
- **Bootstrap Icons**: Icon library
- **Chrono-node**: Natural language date parser
- **update-electron-app**: Automatic updates through GitHub releases
- **Squirrel**: Windows installer

## 🔒 Data Storage

Pingr stores your tasks and configuration locally:

- **Development**: In the project root directory
  - `tasks.json` - Task data
  - `config.json` - Application configuration

- **Production**: In the system's user data directory
  - Windows: `%APPDATA%/Pingr/`
  - macOS: `~/Library/Application Support/Pingr/`
  - Linux: `~/.config/Pingr/`

### Encryption

When encryption is enabled, task data is encrypted using Electron's SafeStorage API, which uses:
- **Windows**: DPAPI
- **macOS**: Keychain
- **Linux**: System keyring (libsecret)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👤 Author

**Claudio Souto**

- GitHub: [@clausouto](https://github.com/clausouto)
- Repository: [pingr](https://github.com/clausouto/pingr)

## 🙏 Acknowledgments

- Built with [Electron](https://www.electronjs.org/)
- Natural language parsing powered by [Chrono](https://github.com/wanasit/chrono)
- UI components from [Bootstrap](https://getbootstrap.com/)