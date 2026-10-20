const { app, BrowserWindow, Tray, Menu, globalShortcut, ipcMain, dialog, screen } = require('electron');
const path = require('path');
const fs = require('fs');
const Store = require('electron-store');
const AutoLaunch = require('auto-launch');

const store = new Store();
let boardWindow = null;
let settingsWindow = null;
let tray = null;
let isEditMode = false;

const autoLauncher = new AutoLaunch({
  name: 'Deskboard',
  path: app.getPath('exe'),
});

// Ensure images directory exists
const imagesDir = path.join(app.getPath('userData'), 'images');
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

function createBoardWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  boardWindow = new BrowserWindow({
    width,
    height,
    x: 0,
    y: 0,
    transparent: true,
    frame: false,
    skipTaskbar: true,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    closable: false,
    alwaysOnTop: false,
    type: 'desktop',
    focusable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  boardWindow.loadFile('src/board.html');
  boardWindow.setAlwaysOnTop(false, 'screen-saver', -1);
  boardWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  
  // Start in click-through mode
  boardWindow.setIgnoreMouseEvents(true, { forward: true });

  // Prevent focus
  boardWindow.on('focus', () => {
    if (!isEditMode) {
      boardWindow.blur();
    }
  });

  boardWindow.on('closed', () => {
    boardWindow = null;
  });
}

function toggleEditMode() {
  isEditMode = !isEditMode;
  
  if (boardWindow) {
    boardWindow.setIgnoreMouseEvents(!isEditMode, { forward: true });
    boardWindow.webContents.send('toggle-edit-mode', isEditMode);
    
    if (isEditMode) {
      boardWindow.setAlwaysOnTop(true, 'screen-saver', -1);
      boardWindow.focus();
    } else {
      boardWindow.setAlwaysOnTop(false, 'screen-saver', -1);
      boardWindow.blur();
    }
  }
}

function createSettingsWindow() {
  if (settingsWindow) {
    settingsWindow.focus();
    return;
  }

  settingsWindow = new BrowserWindow({
    width: 500,
    height: 400,
    resizable: false,
    minimizable: false,
    maximizable: false,
    title: 'Deskboard Settings',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  settingsWindow.loadFile('src/settings.html');
  settingsWindow.setMenu(null);

  settingsWindow.on('closed', () => {
    settingsWindow = null;
  });
}

function createTray() {
  // Create a simple tray icon (you can replace with actual icon)
  const trayIcon = createTrayIcon();
  tray = new Tray(trayIcon);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Add Image…',
      click: async () => {
        const result = await dialog.showOpenDialog({
          properties: ['openFile'],
          filters: [
            { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'] },
          ],
        });

        if (!result.canceled && result.filePaths.length > 0) {
          const sourcePath = result.filePaths[0];
          const ext = path.extname(sourcePath);
          const filename = `${Date.now()}${ext}`;
          const destPath = path.join(imagesDir, filename);

          fs.copyFileSync(sourcePath, destPath);

          if (boardWindow) {
            boardWindow.webContents.send('image-added', {
              id: Date.now(),
              filename,
              path: destPath,
            });
          }
        }
      },
    },
    { type: 'separator' },
    {
      label: 'Settings…',
      click: () => createSettingsWindow(),
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.quit();
      },
    },
  ]);

  tray.setToolTip('Deskboard');
  tray.setContextMenu(contextMenu);
}

function createTrayIcon() {
  // Create a simple icon programmatically
  const { nativeImage } = require('electron');
  
  // Create a simple 16x16 icon using a base64 PNG
  const buffer = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAdgAAAHYBTnsmCAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAABzSURBVDiNY2AYBaNgFFA' +
    'GGBkZGf6DIQMDAwMjAwPDfzBmZGRkYGBgYGBkZGT4D8YMDAwMjIyMDP/BmJGRkYGBgYGBkZGR4T8YMzAwMDAyMjL8B2NGRkYGBgYGBkZGRob/YMzAwMDAyMjI8B+MGRkZGRgYBh8AAN5lB' +
    'Ae/El3SAAAAAElFTkSuQmCC',
    'base64'
  );
  return nativeImage.createFromBuffer(buffer);
}

function registerShortcut() {
  globalShortcut.unregisterAll();
  const shortcut = store.get('shortcut', 'CommandOrControl+Shift+D');
  
  const success = globalShortcut.register(shortcut, () => {
    toggleEditMode();
  });

  if (!success) {
    console.error('Failed to register shortcut:', shortcut);
  }
}

// IPC handlers
ipcMain.handle('get-board-data', () => {
  return store.get('board', { images: [] });
});

ipcMain.handle('save-board-data', (event, data) => {
  store.set('board', data);
});

ipcMain.handle('get-settings', () => {
  return {
    shortcut: store.get('shortcut', 'CommandOrControl+Shift+D'),
    launchAtLogin: store.get('launchAtLogin', false),
    version: app.getVersion(),
    userDataPath: app.getPath('userData'),
  };
});

ipcMain.handle('save-settings', async (event, settings) => {
  const oldShortcut = store.get('shortcut');
  
  if (settings.shortcut !== oldShortcut) {
    store.set('shortcut', settings.shortcut);
    registerShortcut();
  }

  if (settings.launchAtLogin !== undefined) {
    store.set('launchAtLogin', settings.launchAtLogin);
    if (settings.launchAtLogin) {
      await autoLauncher.enable();
    } else {
      await autoLauncher.disable();
    }
  }
});

ipcMain.handle('delete-image', (event, filename) => {
  const imagePath = path.join(imagesDir, filename);
  if (fs.existsSync(imagePath)) {
    fs.unlinkSync(imagePath);
  }
});

ipcMain.handle('open-data-folder', () => {
  require('electron').shell.openPath(app.getPath('userData'));
});

ipcMain.handle('get-image-path', (event, filename) => {
  return path.join(imagesDir, filename);
});

ipcMain.handle('copy-image-file', async (event, sourcePath) => {
  const ext = path.extname(sourcePath);
  const filename = `${Date.now()}${ext}`;
  const destPath = path.join(imagesDir, filename);
  
  fs.copyFileSync(sourcePath, destPath);
  return filename;
});

// App lifecycle
app.whenReady().then(() => {
  createBoardWindow();
  createTray();
  registerShortcut();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createBoardWindow();
    }
  });
});

app.on('window-all-closed', (e) => {
  e.preventDefault();
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('before-quit', () => {
  if (boardWindow) {
    boardWindow.webContents.send('save-before-quit');
  }
});
