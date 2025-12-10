/**
 * @author Luuxis
 * Luuxis License v1.0
 */

const { app, ipcMain, nativeTheme, session } = require('electron');
const { Microsoft } = require('minecraft-java-core');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const fs = require('fs');

const UpdateWindow = require("./assets/js/windows/updateWindow.js");
const MainWindow = require("./assets/js/windows/mainWindow.js");

// --- CORRECTIF IMPORTANT : User Agent ---
// On définit l'User Agent globalement AVANT tout le reste.
// C'est souvent ça qui manquait.
const CHROME_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
app.userAgentFallback = CHROME_USER_AGENT; 
// ----------------------------------------

let dev = process.env.NODE_ENV === 'dev';

if (dev) {
    let appPath = path.resolve(app.getPath('userData')).replace(/\\/g, '/');
    let appdata = app.getPath('appData');
    if (!fs.existsSync(appPath)) fs.mkdirSync(appPath, { recursive: true });
    if (!fs.existsSync(appdata)) fs.mkdirSync(appdata, { recursive: true });
}

if (!app.requestSingleInstanceLock()) {
    app.quit();
} else {
    app.whenReady().then(() => {
        
        // --- SECONDE COUCHE DE PROTECTION (Réseau) ---
        session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
            details.requestHeaders['User-Agent'] = CHROME_USER_AGENT;
            callback({ cancel: false, requestHeaders: details.requestHeaders });
        });

        // --- TROISIÈME COUCHE (Fenêtres Pop-ups) ---
        app.on('web-contents-created', (event, contents) => {
            contents.setUserAgent(CHROME_USER_AGENT);
            contents.setWindowOpenHandler(({ url }) => {
                // On autorise tout ce qui est Microsoft/Xbox
                if (url.includes('microsoft') || url.includes('live.com') || url.includes('xbox') || url.includes('minecraft')) {
                    return { action: 'allow', overrideBrowserWindowOptions: { userAgent: CHROME_USER_AGENT } };
                }
                return { action: 'deny' };
            });
        });

        if (dev) {
            console.log("Mode DEV : Lancement direct");
            return MainWindow.createWindow();
        }
        UpdateWindow.createWindow();
    });
}

// --- IPC Events (Inchangés) ---
ipcMain.on('main-window-open', () => MainWindow.createWindow())
ipcMain.on('main-window-dev-tools', () => MainWindow.getWindow().webContents.openDevTools({ mode: 'detach' }))
ipcMain.on('main-window-dev-tools-close', () => MainWindow.getWindow().webContents.closeDevTools())
ipcMain.on('main-window-close', () => MainWindow.destroyWindow())
ipcMain.on('main-window-reload', () => MainWindow.getWindow().reload())

ipcMain.on('main-window-progress', (event, options) => {
    const win = MainWindow.getWindow();
    if (win && !win.isDestroyed()) win.setProgressBar(options.progress / options.size)
})
ipcMain.on('main-window-progress-reset', () => {
    const win = MainWindow.getWindow();
    if (win && !win.isDestroyed()) win.setProgressBar(-1)
})
ipcMain.on('main-window-progress-load', () => {
    const win = MainWindow.getWindow();
    if (win && !win.isDestroyed()) win.setProgressBar(2)
})
ipcMain.on('main-window-minimize', () => {
    const win = MainWindow.getWindow();
    if (win && !win.isDestroyed()) win.minimize()
})
ipcMain.on('main-window-maximize', () => {
    if (MainWindow.getWindow().isMaximized()) MainWindow.getWindow().unmaximize();
    else MainWindow.getWindow().maximize();
})
ipcMain.on('main-window-hide', () => {
    const win = MainWindow.getWindow();
    if (win && !win.isDestroyed()) win.hide()
})
ipcMain.on('main-window-show', () => {
    const win = MainWindow.getWindow();
    if (win && !win.isDestroyed()) win.show()
})

// --- Update Window Events ---
ipcMain.on('update-window-close', () => UpdateWindow.destroyWindow())
ipcMain.on('update-window-dev-tools', () => UpdateWindow.getWindow().webContents.openDevTools({ mode: 'detach' }))
ipcMain.on('update-window-progress', (event, options) => {
    const win = UpdateWindow.getWindow();
    if (win && !win.isDestroyed()) win.setProgressBar(options.progress / options.size)
})
ipcMain.on('update-window-progress-reset', () => {
    const win = UpdateWindow.getWindow();
    if (win && !win.isDestroyed()) win.setProgressBar(-1)
})
ipcMain.on('update-window-progress-load', () => {
    const win = UpdateWindow.getWindow();
    if (win && !win.isDestroyed()) win.setProgressBar(2)
})

ipcMain.handle('path-user-data', () => app.getPath('userData'))
ipcMain.handle('appData', e => app.getPath('appData'))

// --- Auth Handler ---
ipcMain.handle('Microsoft-window', async (_, client_id) => {
    // Recommendation: Wrap this in try/catch
    try {
        return await new Microsoft(client_id).getAuth();
    } catch (error) {
        console.error("Auth Failed:", error);
        return { error: true, message: error.message || error };
    }
})

ipcMain.handle('is-dark-theme', (_, theme) => {
    if (theme === 'dark') return true
    if (theme === 'light') return false
    return nativeTheme.shouldUseDarkColors;
})

app.on('window-all-closed', () => app.quit());

// --- Auto Updater ---
autoUpdater.autoDownload = false;

ipcMain.handle('update-app', async () => {
    if (dev) {
        // En DEV, on simule une erreur pour que le splash passe la main
        return { error: true, message: "Dev Mode" };
    }
    return await new Promise(async (resolve, reject) => {
        autoUpdater.checkForUpdates().then(res => resolve(res)).catch(error => {
            reject({ error: true, message: error })
        })
    })
})

autoUpdater.on('update-available', () => {
    const updateWindow = UpdateWindow.getWindow();
    if (updateWindow) updateWindow.webContents.send('updateAvailable');
});
ipcMain.on('start-update', () => autoUpdater.downloadUpdate())
autoUpdater.on('update-not-available', () => {
    const updateWindow = UpdateWindow.getWindow();
    if (updateWindow) updateWindow.webContents.send('update-not-available');
});
autoUpdater.on('update-downloaded', () => autoUpdater.quitAndInstall());
autoUpdater.on('download-progress', (progress) => {
    const updateWindow = UpdateWindow.getWindow();
    if (updateWindow) updateWindow.webContents.send('download-progress', progress);
})
autoUpdater.on('error', (err) => {
    const updateWindow = UpdateWindow.getWindow();
    if (updateWindow) updateWindow.webContents.send('error', err);
});