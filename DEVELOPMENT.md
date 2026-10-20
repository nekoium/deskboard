# Deskboard - Development Documentation

## Project Overview

Deskboard is a desktop vision board application built with Electron that displays inspirational images on your desktop layer - between your wallpaper and desktop icons.

## Project Structure

```
deskboard/
├── main.js                 # Electron main process
├── preload.js             # IPC bridge for secure communication
├── package.json           # Dependencies and scripts
├── README.md             # User documentation
├── PRODUCT.md            # Product specification
├── .gitignore            # Git ignore rules
└── src/
    ├── board.html        # Vision board UI
    ├── board.js          # Board interaction logic
    ├── board.css         # Board styling
    ├── settings.html     # Settings window UI
    ├── settings.js       # Settings logic
    └── settings.css      # Settings styling
```

## Architecture

### Main Process (main.js)

Handles:
- **Window Management**: Creates transparent, click-through board window
- **System Tray**: Menu with Add Image, Settings, Quit options
- **Global Shortcuts**: Keyboard shortcut registration for edit mode toggle
- **File Operations**: Copying images to local storage, managing image directory
- **IPC Handlers**: Communication bridge between main and renderer processes
- **Auto-launch**: Launch at login functionality

Key Features:
- Transparent window with `type: 'desktop'` to sit below icons
- Click-through mode with `setIgnoreMouseEvents(true)`
- Edit mode toggles interactivity and overlay
- Prevents focus stealing in normal mode

### Preload Script (preload.js)

Secure IPC bridge using contextBridge:
- Board data operations (get/save)
- Settings management
- Image file operations
- Event listeners for mode changes and new images

### Renderer Process (board.js)

Manages the vision board UI:
- **Image Rendering**: Creates DOM elements for each image
- **Drag & Drop**: Add images by dropping files onto board
- **Image Manipulation**:
  - Move: Click and drag
  - Resize: Blue handle (bottom-right), maintains aspect ratio
  - Rotate: Green handle (top), snaps to 0/90/180/270 degrees
- **Selection**: Click to select, Escape or click empty space to deselect
- **Context Menu**: Right-click for remove option
- **Auto-save**: Saves board state after every change

### Settings Window (settings.js)

Configuration interface:
- **Keyboard Shortcut**: Records key combinations for edit mode
- **Launch at Login**: Toggle auto-start
- **Data Folder**: Opens user data directory
- **Version Display**: Shows current version

## Data Persistence

Uses `electron-store` for JSON-based storage:

### Board Data
```json
{
  "images": [
    {
      "id": 1697812345678,
      "filename": "1697812345678.jpg",
      "x": 100,
      "y": 150,
      "width": 300,
      "height": 300,
      "rotation": 0
    }
  ]
}
```

### Settings Data
```json
{
  "shortcut": "CommandOrControl+Shift+D",
  "launchAtLogin": false
}
```

### Image Storage

Images are copied to: `app.getPath('userData')/images/`
- Windows: `%APPDATA%/deskboard/images/`
- macOS: `~/Library/Application Support/deskboard/images/`
- Linux: `~/.config/deskboard/images/`

## User Workflows

### Adding Images

**Method 1: Tray Menu**
1. Click tray icon
2. Select "Add Image…"
3. Choose image file
4. Image appears centered on screen

**Method 2: Drag & Drop**
1. Press keyboard shortcut to enter edit mode
2. Drag image files onto the board
3. Images appear at drop location

### Editing Images

1. Press keyboard shortcut (default: `Ctrl+Shift+D`)
2. Board overlay appears (semi-transparent white)
3. Click image to select (blue outline appears)
4. Manipulate image:
   - **Move**: Drag image
   - **Resize**: Drag blue handle (bottom-right corner)
   - **Rotate**: Drag green handle (top center)
   - **Delete**: Press Delete key
   - **Context Menu**: Right-click for options
5. Press keyboard shortcut again to exit edit mode

### Configuring Settings

1. Click tray icon → "Settings…"
2. Configure:
   - **Keyboard Shortcut**: Click input, press desired keys
   - **Launch at Login**: Check/uncheck checkbox
   - **Data Folder**: Click to open in file explorer
3. Click "Save" to apply changes

## Technical Details

### Window Configuration

```javascript
{
  transparent: true,        // Transparent background
  frame: false,            // No window frame
  skipTaskbar: true,       // Hide from taskbar
  type: 'desktop',         // Desktop layer window
  focusable: false,        // Don't steal focus
  alwaysOnTop: false,      // Below normal windows
}
```

### Edit Mode Toggle

- **Normal Mode**: `setIgnoreMouseEvents(true, { forward: true })`
- **Edit Mode**: `setIgnoreMouseEvents(false)`

### Safety Features

1. **No Persistent Changes**: Window closes cleanly, no desktop modifications
2. **Focus Management**: Never steals focus from other applications
3. **Window Layering**: Always below normal application windows
4. **Click-through**: Desktop icons and right-click work normally
5. **Clean Shutdown**: All resources released properly

## Development Commands

```bash
# Install dependencies
npm install

# Run application
npm start

# Run in development mode
npm run dev
```

## Testing Checklist

### Core Functionality
- [ ] Application launches successfully
- [ ] System tray icon appears
- [ ] Board window is transparent
- [ ] Desktop icons are clickable in normal mode
- [ ] Edit mode toggles with keyboard shortcut

### Image Management
- [ ] Add image via tray menu
- [ ] Drag and drop images onto board
- [ ] Images persist after restart
- [ ] Images load correctly from storage

### Image Manipulation
- [ ] Click to select image
- [ ] Drag to move image
- [ ] Resize handle maintains aspect ratio
- [ ] Rotate handle snaps to cardinal directions
- [ ] Delete key removes selected image
- [ ] Context menu appears on right-click

### Settings
- [ ] Settings window opens
- [ ] Keyboard shortcut recording works
- [ ] Shortcut changes take effect immediately
- [ ] Launch at login toggle works
- [ ] Data folder opens correctly
- [ ] Version displays correctly

### Safety
- [ ] Normal windows stay above board
- [ ] Board doesn't steal focus
- [ ] Clean exit on quit
- [ ] No desktop modifications persist

## Known Limitations (MVP)

- Single monitor support only
- Images only (no text notes)
- Single board (no multiple boards)
- Local storage only (no cloud sync)
- Simple tray icon (base64 placeholder)

## Future Enhancements

1. **Multi-monitor Support**: Detect and span across displays
2. **Text Notes**: Add text elements to the board
3. **Multiple Boards**: Switch between different vision boards
4. **Cloud Sync**: Save boards to cloud storage
5. **Templates**: Pre-designed board layouts
6. **Image Effects**: Filters, borders, shadows
7. **Grouping**: Group related images together
8. **Layers**: Z-index control for overlapping images

## Troubleshooting

### Application won't start
- Check Node.js and Electron are installed
- Run `npm install` to ensure dependencies are present
- Check console for error messages

### Images not loading
- Verify images directory exists in user data folder
- Check file permissions
- Verify image file formats are supported

### Keyboard shortcut not working
- Check for conflicts with other applications
- Try different key combination
- Ensure app has accessibility permissions (macOS)

### Board not click-through
- Restart application
- Check edit mode is disabled
- Verify window configuration in main.js

## Building for Production

Create the Windows x64 NSIS installer and ZIP archive in `release/`:

```bash
npm ci
npm run dist
```

Pushing a version tag such as `v0.1.0` runs `.github/workflows/release.yml`. The workflow requires the tag to match the package version, builds the same artifacts on GitHub Actions, and creates a draft GitHub release.

## License

MIT
