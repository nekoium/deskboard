const { app, BrowserWindow, Tray, Menu, globalShortcut, ipcMain, dialog, screen } = require('electron');
const path = require('path');
const fs = require('fs');
const Store = require('electron-store');
const AutoLaunch = require('auto-launch');

let uIOhook = null;
let UiohookKey = null;
try {
  ({ uIOhook, UiohookKey } = require('uiohook-napi'));
} catch (error) {
  console.error('Global key release detection is unavailable:', error);
}

const store = new Store();
let boardWindow = null;
let settingsWindow = null;
let tray = null;
let isEditMode = false;
let holdShortcutDown = false;
let holdReleaseKeycodes = null;
let inputHookStarted = false;
let inputHookListenerAdded = false;
let isQuitting = false;

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

function setEditMode(enabled) {
  if (isEditMode === enabled) return;

  isEditMode = enabled;

  if (boardWindow) {
    boardWindow.setIgnoreMouseEvents(!isEditMode, { forward: true });
    boardWindow.webContents.send('toggle-edit-mode', isEditMode);
    boardWindow.setAlwaysOnTop(false);

    if (!isEditMode) {
      boardWindow.blur();
    }
  }
}

function toggleEditMode() {
  setEditMode(!isEditMode);
}

function stopHoldInteraction() {
  holdShortcutDown = false;
  holdReleaseKeycodes = null;
  setEditMode(false);
}

function createSettingsWindow() {
  if (settingsWindow) {
    settingsWindow.focus();
    return;
  }

  // Do not let the active shortcut fire while the user records a shortcut.
  globalShortcut.unregisterAll();
  stopHoldInteraction();
  stopInputHook();

  settingsWindow = new BrowserWindow({
    width: 500,
    height: 450,
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
    // Re-register shortcuts when settings window closes
    registerShortcut();
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
        isQuitting = true;
        
        // Close all windows first
        if (settingsWindow) {
          settingsWindow.destroy();
        }
        if (boardWindow) {
          boardWindow.destroy();
        }
        
        // Force quit
        app.exit(0);
      },
    },
  ]);

  tray.setToolTip('Deskboard');
  tray.setContextMenu(contextMenu);
}

function createTrayIcon() {
  const { nativeImage } = require('electron');
  return nativeImage
    .createFromPath(path.join(__dirname, 'build', 'icon.png'))
    .resize({ width: 16, height: 16 });
}

function getHoldReleaseKeycodes(shortcut) {
  if (!UiohookKey) return null;

  const aliases = {
    Return: 'Enter',
    Left: 'ArrowLeft',
    Right: 'ArrowRight',
    Up: 'ArrowUp',
    Down: 'ArrowDown',
  };
  const modifierNames = new Set([
    'commandorcontrol', 'cmdorctrl', 'command', 'cmd', 'control', 'ctrl',
    'super', 'meta', 'alt', 'option', 'shift',
  ]);
  const parts = shortcut.split('+').filter(Boolean);
  const mainPart = parts.findLast((part) => !modifierNames.has(part.toLowerCase()));
  const mainKey = aliases[mainPart] || mainPart;
  const mainKeycode = UiohookKey[mainKey];

  if (mainKeycode === undefined) return null;

  const keycodes = new Set([mainKeycode]);
  for (const part of parts) {
    switch (part.toLowerCase()) {
      case 'commandorcontrol':
      case 'cmdorctrl':
        keycodes.add(process.platform === 'darwin' ? UiohookKey.Meta : UiohookKey.Ctrl);
        keycodes.add(process.platform === 'darwin' ? UiohookKey.MetaRight : UiohookKey.CtrlRight);
        break;
      case 'control':
      case 'ctrl':
        keycodes.add(UiohookKey.Ctrl);
        keycodes.add(UiohookKey.CtrlRight);
        break;
      case 'command':
      case 'cmd':
      case 'super':
      case 'meta':
        keycodes.add(UiohookKey.Meta);
        keycodes.add(UiohookKey.MetaRight);
        break;
      case 'alt':
      case 'option':
        keycodes.add(UiohookKey.Alt);
        keycodes.add(UiohookKey.AltRight);
        break;
      case 'shift':
        keycodes.add(UiohookKey.Shift);
        keycodes.add(UiohookKey.ShiftRight);
        break;
    }
  }

  return keycodes;
}

function startInputHook() {
  if (!uIOhook || inputHookStarted) return;

  if (!inputHookListenerAdded) {
    uIOhook.on('keyup', (event) => {
      if (holdShortcutDown && holdReleaseKeycodes?.has(event.keycode)) {
        stopHoldInteraction();
      }
    });
    inputHookListenerAdded = true;
  }

  uIOhook.start();
  inputHookStarted = true;
}

function stopInputHook() {
  if (!uIOhook || !inputHookStarted) return;
  uIOhook.stop();
  inputHookStarted = false;
}

function registerShortcut() {
  globalShortcut.unregisterAll();
  stopHoldInteraction();

  const shortcut = store.get('shortcut', 'CommandOrControl+Shift+D');
  const holdMode = store.get('holdMode', false);
  const releaseKeycodes = holdMode ? getHoldReleaseKeycodes(shortcut) : null;

  if (holdMode && releaseKeycodes) {
    startInputHook();
  } else {
    stopInputHook();
    if (holdMode) {
      console.error(`Hold mode does not support shortcut: ${shortcut}. Falling back to toggle mode.`);
    }
  }

  const success = globalShortcut.register(shortcut, () => {
    if (holdMode && releaseKeycodes) {
      if (!holdShortcutDown) {
        holdShortcutDown = true;
        holdReleaseKeycodes = releaseKeycodes;
        setEditMode(true);
      }
      return;
    }

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
    holdMode: store.get('holdMode', false),
    version: app.getVersion(),
    userDataPath: app.getPath('userData'),
  };
});

ipcMain.handle('save-settings', async (event, settings) => {
  if (settings.shortcut) {
    store.set('shortcut', settings.shortcut);
  }

  if (settings.launchAtLogin !== undefined) {
    store.set('launchAtLogin', settings.launchAtLogin);
    if (settings.launchAtLogin) {
      await autoLauncher.enable();
    } else {
      await autoLauncher.disable();
    }
  }

  if (settings.holdMode !== undefined) {
    store.set('holdMode', settings.holdMode);
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
  if (!isQuitting) {
    e.preventDefault();
  }
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
  stopInputHook();
});

app.on('before-quit', () => {
  isQuitting = true;
  if (boardWindow) {
    boardWindow.webContents.send('save-before-quit');
  }
});
