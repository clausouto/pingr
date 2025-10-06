const AutoLaunch = require('auto-launch');
const Logger = require('./logger');

class AutoLauncher {
    constructor() {
        this.autoLaunch = new AutoLaunch({
            name: 'Pingr'
        });
    }

    toggleAutoLaunch() {
        this.autoLaunch.isEnabled().then((isEnabled) => {
            if (isEnabled) {
                Logger.info('Disabling auto launch at startup');
                this.autoLaunch.disable();
            } else {
                Logger.info('Enabling auto launch at startup');
                this.autoLaunch.enable();
            }
        }).catch((err) => {
            Logger.error('Error toggling auto launch', err);
        });
    }

    getAutoLaunchStatus() {
        return this.autoLaunch.isEnabled();
    }
}

module.exports = new AutoLauncher();