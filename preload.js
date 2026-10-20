const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // Board operations
  getBoardData: () => ipcRenderer.invoke('get-board-data'),
  saveBoardData: (data) => ipcRenderer.invoke('save-board-data', data),
  onToggleEditMode: (callback) => ipcRenderer.on('toggle-edit-mode', (event, isEditMode) => callback(isEditMode)),
  onImageAdded: (callback) => ipcRenderer.on('image-added', (event, imageData) => callback(imageData)),
  onSaveBeforeQuit: (callback) => ipcRenderer.on('save-before-quit', () => callback()),
  
  // Settings operations
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  openDataFolder: () => ipcRenderer.invoke('open-data-folder'),
  
  // Image operations
  deleteImage: (filename) => ipcRenderer.invoke('delete-image', filename),
  getImagePath: (filename) => ipcRenderer.invoke('get-image-path', filename),
  copyImageFile: (sourcePath) => ipcRenderer.invoke('copy-image-file', sourcePath),
});
