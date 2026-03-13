const { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain } = require('electron');
const path = require('path');
const { startServer } = require('./server');

let mainWindow = null;
let tray = null;
let server = null;

// Auto-updater (gracefully skipped if electron-updater is not installed)
let autoUpdater = null;
try {
    autoUpdater = require('electron-updater').autoUpdater;
} catch {
    // electron-updater not installed — updates disabled
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 420,
        height: 520,
        resizable: false,
        maximizable: false,
        title: 'EduPrime Link',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        },
        show: false, // Shown conditionally after server starts
    });

    mainWindow.loadFile(path.join(__dirname, 'ui', 'index.html'));

    mainWindow.on('close', (e) => {
        // Minimize to tray instead of quitting
        e.preventDefault();
        mainWindow.hide();
    });
}

function createTray() {
    const iconPath = path.join(__dirname, 'build', 'icon.png');
    const icon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });
    tray = new Tray(icon);
    tray.setToolTip('EduPrime Link — Running');

    const loginSettings = app.getLoginItemSettings();

    const contextMenu = Menu.buildFromTemplate([
        {
            label: '🟢 EduPrime Link is running',
            enabled: false
        },
        { type: 'separator' },
        {
            label: 'Open Status Window',
            click: () => {
                if (mainWindow) {
                    mainWindow.show();
                    mainWindow.focus();
                }
            }
        },
        { type: 'separator' },
        {
            label: 'Start at Login',
            type: 'checkbox',
            checked: loginSettings.openAtLogin,
            click: (menuItem) => {
                app.setLoginItemSettings({
                    openAtLogin: menuItem.checked,
                    openAsHidden: true
                });
            }
        },
        { type: 'separator' },
        {
            label: 'Quit EduPrime Link',
            click: () => {
                if (server) server.close();
                app.exit(0);
            }
        }
    ]);

    tray.setContextMenu(contextMenu);

    tray.on('click', () => {
        if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
        }
    });
}

// IPC: renderer reload request (used by the Retry button)
ipcMain.on('reload-window', () => {
    if (mainWindow) mainWindow.reload();
});

app.whenReady().then(async () => {
    try {
        // Check if this is the first launch (before we enable start-at-login)
        const loginSettings = app.getLoginItemSettings();
        const isFirstLaunch = !loginSettings.openAtLogin;

        if (isFirstLaunch) {
            app.setLoginItemSettings({
                openAtLogin: true,
                openAsHidden: true
            });
        }

        // Start the HTTP + WebSocket server
        server = await startServer();
        console.log('EduPrime Link server started');

        // Create tray icon
        createTray();

        // Create the status window
        createWindow();

        // Always show the window on launch
        mainWindow.show();

        // Auto-update check (silently fails if not signed or updater unavailable)
        if (autoUpdater) {
            try {
                autoUpdater.checkForUpdatesAndNotify();
            } catch { /* ignore — unsigned builds on macOS will throw */ }

            // Re-check every 4 hours for long-running sessions
            setInterval(() => {
                try { autoUpdater.checkForUpdatesAndNotify(); } catch { /* ignore */ }
            }, 4 * 60 * 60 * 1000);
        }

    } catch (err) {
        console.error('Failed to start EduPrime Link:', err);
        app.exit(1);
    }
});

// macOS: keep app running when all windows closed (tray mode)
app.on('window-all-closed', (e) => {
    e.preventDefault();
});

app.on('activate', () => {
    if (mainWindow) {
        mainWindow.show();
    }
});
