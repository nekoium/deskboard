# Deskboard

A desktop vision board application that lives on your desktop layer — behind icons, above your wallpaper.

## Quick Start

```bash
npm install
npm start
```

## Features

- **Vision Board Display**: Images display on your desktop between the wallpaper and icons
- **Edit Mode**: Toggle with `Ctrl+Shift+D` (configurable) to arrange your board
- **Image Management**: 
  - Add images via drag-and-drop or tray menu
  - Move, resize, and rotate images
  - Remove images with Delete key
- **System Tray**: Quick access to add images, settings, and quit
- **Persistence**: Board layout and settings automatically saved
- **Launch at Login**: Optional startup configuration

## Usage

### Adding Images

1. Click the tray icon → "Add Image…", or
2. Enter edit mode and drag images directly onto the board

### Edit Mode

Press `Ctrl+Shift+D` (or your configured shortcut) to:
- Move images by dragging
- Resize with the blue handle (bottom-right corner)
- Rotate with the green handle (top center)
- Delete selected images with Delete key
- Right-click for context menu

Press the shortcut again to exit edit mode.

### Settings

Access via tray icon → "Settings…":
- Configure keyboard shortcut
- Enable launch at login
- Open data folder
- View version

## Architecture

Built with Electron for cross-platform desktop integration:

- **main.js**: Electron main process, window management, system tray
- **preload.js**: IPC bridge for secure renderer communication
- **src/board.js**: Vision board logic and image manipulation
- **src/settings.js**: Settings interface

Images are stored in the application data directory and persist across sessions.

## Development

```bash
npm start
```

## Safety

- No persistent desktop modifications
- Normal windows always stay above the board
- Click-through in normal mode
- Clean shutdown restores desktop state
