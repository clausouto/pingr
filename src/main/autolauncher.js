const { app } = require('electron/main');

class AutoLauncher {
    toggleAutoLaunch() {    
        app.setLoginItemSettings({
            openAtLogin: !app.getLoginItemSettings().openAtLogin
        });
    }

    getAutoLaunchStatus() {
        return app.getLoginItemSettings().openAtLogin;
    }
}

module.exports = new AutoLauncher();