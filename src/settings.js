let currentSettings = {};
let newShortcut = null;
let recordingShortcut = false;

const shortcutInput = document.getElementById('shortcut-input');
const currentShortcutSpan = document.getElementById('current-shortcut');
const launchAtLoginCheckbox = document.getElementById('launch-at-login');
const versionSpan = document.getElementById('version');
const openDataFolderButton = document.getElementById('open-data-folder');
const saveButton = document.getElementById('save-button');
const cancelButton = document.getElementById('cancel-button');

async function init() {
  currentSettings = await window.api.getSettings();
  
  shortcutInput.value = '';
  currentShortcutSpan.textContent = currentSettings.shortcut;
  launchAtLoginCheckbox.checked = currentSettings.launchAtLogin;
  versionSpan.textContent = currentSettings.version;
  
  newShortcut = currentSettings.shortcut;
}

// Shortcut recording
shortcutInput.addEventListener('focus', () => {
  recordingShortcut = true;
  shortcutInput.value = 'Press keys...';
});

shortcutInput.addEventListener('blur', () => {
  recordingShortcut = false;
  if (!newShortcut) {
    shortcutInput.value = '';
  }
});

shortcutInput.addEventListener('keydown', (e) => {
  if (!recordingShortcut) return;
  
  e.preventDefault();
  
  const modifiers = [];
  const key = e.key;
  
  // Build modifier string
  if (e.ctrlKey || e.metaKey) {
    modifiers.push('CommandOrControl');
  }
  if (e.shiftKey) {
    modifiers.push('Shift');
  }
  if (e.altKey) {
    modifiers.push('Alt');
  }
  
  // Normalize key name
  let normalizedKey = key;
  if (key.length === 1) {
    normalizedKey = key.toUpperCase();
  }
  
  // Don't allow modifier-only shortcuts
  if (['Control', 'Meta', 'Shift', 'Alt'].includes(key)) {
    return;
  }
  
  // Build shortcut string
  if (modifiers.length > 0) {
    newShortcut = modifiers.join('+') + '+' + normalizedKey;
    shortcutInput.value = newShortcut;
  }
});

// Open data folder
openDataFolderButton.addEventListener('click', () => {
  window.api.openDataFolder();
});

// Save settings
saveButton.addEventListener('click', async () => {
  const settings = {
    shortcut: newShortcut || currentSettings.shortcut,
    launchAtLogin: launchAtLoginCheckbox.checked,
  };
  
  await window.api.saveSettings(settings);
  window.close();
});

// Cancel
cancelButton.addEventListener('click', () => {
  window.close();
});

init();
