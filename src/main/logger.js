const { app } = require('electron');
const fs = require('fs');
const path = require('path');

const LOG_FILE = app.isPackaged ? path.join(app.getPath('userData'), 'pingr.log') : path.join(__dirname, '..', 'pingr.log');

class Logger {
    static log(level, message, error = null) {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] (${level.toUpperCase()}): ${message}`;
        
        console.log(logEntry);
        
        try {
            fs.appendFileSync(LOG_FILE, logEntry + (error ? `\n${error.stack}` : '') + '\n');
        } catch (e) {
            console.error('Failed to write to log file:', e);
        }
    }

    static info(message) { this.log('info', message); }
    static warn(message) { this.log('warn', message); }
    static error(message, error) { this.log('error', message, error); }
}

module.exports = Logger;