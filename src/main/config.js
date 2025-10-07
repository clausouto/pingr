const { app } = require('electron/main');

const path = require('node:path');
const fs = require('node:fs');

const log = require('electron-log');

const CONFIG_FILE = app.isPackaged ? path.join(app.getPath('userData'), 'config.json') : path.resolve(__dirname, '..', '..', 'config.json');
const DEFAULT_CONFIG = {
    useEncryption: true,
    language: 'en'
};

let config = null;

function loadConfig() {
    try {
        if (config !== null) {
            return config;
        }

        if (fs.existsSync(CONFIG_FILE)) {
            const data = fs.readFileSync(CONFIG_FILE, 'utf8');
            config = JSON.parse(data)
            return config;
        } else {
            config = DEFAULT_CONFIG;
            
            fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
            return config;
        }
    } catch (error) {
        log.error('Error loading config', error);
    }
    return {};
}

function writeConfig(config) {
    try {
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
        return true;
    }
    catch (error) {
        log.error('Error writing config', error);
        return false;
    }
}

module.exports = { loadConfig, writeConfig };