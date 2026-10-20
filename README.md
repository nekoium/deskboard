# Deskboard

A desktop vision board application that lives on your desktop layer — behind icons, above your wallpaper.

## Install

Download the Windows installer from [GitHub Releases](https://github.com/nekoium/deskboard/releases). Windows may show a SmartScreen warning because the MVP installer is not code-signed.

To run from source:

```bash
npm install
npm start
```

## Features

- **Vision Board Display**: Images display on your desktop between the wallpaper and icons
- **Edit Mode**: Toggle with `Ctrl+Shift+D` (configurable) to arrange your board
- **Hold/Toggle Mode**: Choose whether to hold keys or toggle edit mode
- **Edit Below Windows**: Edit mode stays below normal application windows for non-intrusive editing
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

The shortcut supports two behaviors:

- **Toggle** (default): press once to enter edit mode and again to leave.
- **Hold**: hold the shortcut to edit and release it to leave.

Press `Ctrl+Shift+D` (or your configured shortcut) to:
- Move images by dragging
- Resize with the blue handle (bottom-right corner)
- Rotate with the green handle (top center)
- Delete selected images with Delete key
- Right-click for context menu

Press the shortcut again to exit edit mode.

### Settings

Access via tray icon → "Settings…":
- Configure the keyboard shortcut and choose hold or toggle behavior
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
npm install
npm start
```

Create a local Windows installer and ZIP archive in `release/`:

```bash
npm run dist
```

## Publishing a release

1. Update `version` in `package.json` and `package-lock.json` with `npm version <version> --no-git-tag-version`.
2. Commit and push the version change.
3. Tag that commit with the matching `v`-prefixed tag, for example `git tag v0.1.0`.
4. Push the tag with `git push origin v0.1.0`.
5. The release workflow builds Windows artifacts and creates a **draft** GitHub release. Review its notes and publish it from GitHub.

Do not reuse or move a published version tag. Increment the version for every release.

## Safety

- No persistent desktop modifications
- Normal windows always stay above the board
- Click-through in normal mode
- Clean shutdown restores desktop state
