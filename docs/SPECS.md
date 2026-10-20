# Deskboard Technical Specifications

## Overview
Deskboard is a desktop vision board application built with Electron that displays images as a transparent overlay on the desktop background. It stays visible without interfering with normal desktop usage.

## Architecture

### Technology Stack
- **Framework**: Electron v27.x
- **Backend**: Node.js
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Storage**: electron-store (JSON-based persistent storage)
- **Native Modules**: 
  - uiohook-napi (global keyboard event detection for hold mode)
  - auto-launch (startup integration)

### Window Architecture

#### Board Window
- **Type**: `desktop` - renders below normal windows
- **Transparency**: Fully transparent background
- **Frame**: Frameless window
- **Focusable**: `false` - cannot receive keyboard focus
- **Taskbar**: Hidden with `skipTaskbar: true`
- **Mouse Events**: Click-through by default, interactive in edit mode

#### Settings Window
- **Type**: Standard application window
- **Modal Behavior**: Disables shortcuts while open
- **Focus**: Standard focusable window

### Process Model
```
Main Process (main.js)
├── Board Window (renderer: board.html/board.js)
├── Settings Window (renderer: settings.html/settings.js)
├── Tray Icon (system tray integration)
└── Global Shortcuts (system-wide hotkey registration)
```

## Core Features

### 1. Desktop Background Rendering
Images are rendered on a transparent window that sits at the desktop level, below normal application windows but above the actual desktop wallpaper.

**Implementation:**
- Window type: `desktop`
- `alwaysOnTop: false` with screen-saver level
- Visible on all workspaces and full-screen spaces

### 2. Edit Mode

#### Activation
- **Trigger**: Global shortcut (default: Ctrl+Shift+D, configurable)
- **Modes**: 
  - Toggle mode (press to enter, press again to exit)
  - Hold mode (hold to stay in edit mode, release to exit)

#### Visual Feedback
- Semi-transparent white overlay (30% opacity)
- Selected images show blue outline
- Resize handles (bottom-right corner)
- Rotate handles (top center)

#### Interaction
- **Mouse**: Drag to move, resize handles, rotate handles
- **Context Menu**: Right-click for actions (on images or blank area)
- **Exit**: Same hotkey to toggle off, or press Escape

### 3. Image Management

#### Adding Images
1. **Tray Menu**: "Add Image..." opens file picker
2. **Drag & Drop**: 
   - Drag image files from file explorer
   - Drag image elements from browsers/image viewers
   - Works only in edit mode

#### Image Operations
- **Move**: Click and drag
- **Resize**: Drag bottom-right handle (maintains aspect ratio)
- **Rotate**: Drag top handle (snaps to 0°, 90°, 180°, 270° within 10° threshold)
- **Remove**: Right-click → Remove
- **Undo/Redo**: Right-click → Undo/Redo (50 state history)

#### Storage
- Image files copied to: `<userData>/images/`
- Filename format: `<timestamp><extension>`
- Metadata stored in electron-store as JSON

### 4. Context Menu System

#### Image Context Menu (Right-click on image)
- Remove
- ─── (divider)
- Undo (disabled if no history)
- Redo (disabled if no redo stack)

#### Board Context Menu (Right-click on blank area)
- Undo (disabled if no history)
- Redo (disabled if no redo stack)

#### Menu Behavior
- Automatically closes on action
- Closes on Escape key
- Closes on click outside menu

### 5. Undo/Redo System

#### Implementation
- **Stack Limit**: 50 states
- **Storage**: Deep cloned state using JSON serialization
- **Triggers**: Before any modification (drag, resize, rotate, delete, add)

#### State Management
```javascript
undoStack: [state1, state2, state3, ...]  // Previous states
redoStack: [stateN, stateM, ...]          // Undone states
```

When action performed → push current state to undoStack, clear redoStack
When undo → pop from undoStack, push current to redoStack
When redo → pop from redoStack, push current to undoStack

### 6. Tray Integration

#### Menu Items
- Add Image... (opens file picker)
- ─── 
- Settings... (opens settings window)
- ───
- Quit (exits application)

#### Quit Behavior
Uses `isQuitting` flag to distinguish user-initiated quit from window closure:
```javascript
app.on('window-all-closed', (e) => {
  if (!isQuitting) {
    e.preventDefault(); // Keep running in tray
  }
  // Otherwise, allow quit
});
```

## Technical Constraints & Design Decisions

### Keyboard Input Limitation

#### The Problem
Operating systems only send keyboard events to windows that have focus. Electron windows set with `focusable: false` cannot receive keyboard events, even when visible.

#### Why This Matters
The board window must be `focusable: false` to maintain desktop background behavior:
- If focusable, it appears in Alt+Tab
- If focused, it might show in taskbar
- If focused, it might appear above normal windows
- Desktop-type windows should not steal focus

#### Solutions Evaluated

**Option 1: Global Keyboard Shortcuts** ❌
- Register Delete, Ctrl+Z, Ctrl+Y as global shortcuts
- **Rejected**: Too invasive, conflicts with other applications
- **Risk**: Global hooks can cause system-wide issues

**Option 2: Make Window Focusable in Edit Mode** ❌
- Dynamically enable focus when entering edit mode
- **Rejected**: Window becomes visible in Alt+Tab, breaks desktop illusion
- **Conflict**: Violates design goal of staying as background

**Option 3: Context Menu for All Actions** ✅ **CHOSEN**
- Right-click menus work without focus
- Remove, Undo, Redo accessible via context menu
- **Trade-off**: Slightly less convenient than keyboard shortcuts
- **Benefit**: Maintains clean desktop background behavior

#### Final Implementation
- **Edit mode hotkey**: Only global shortcut (unavoidable, single shortcut is acceptable)
- **Escape key**: Works because edit mode briefly allows keyboard events
- **All other actions**: Context menu only
- **No keyboard shortcuts**: Delete, Ctrl+Z, Ctrl+Y removed

### Cross-Platform Considerations

#### Window Behavior
- **Windows**: Desktop-type window works well, stays below normal windows
- **macOS**: May require additional permissions for global shortcuts
- **Linux**: Desktop window behavior varies by window manager

#### File Paths
- Uses Electron's path APIs for cross-platform compatibility
- `app.getPath('userData')` for storage location
- Handles both Windows (`\`) and Unix (`/`) path separators

### Security Considerations

#### Context Isolation
- `contextIsolation: true` - separates main and renderer processes
- `nodeIntegration: false` - prevents direct Node.js access from renderer
- Preload script exposes only necessary APIs via `contextBridge`

#### File Operations
- Image files copied to controlled directory
- No direct file system access from renderer
- File paths validated before operations

### Performance Considerations

#### Image Rendering
- CSS `object-fit: contain` for aspect ratio preservation
- Hardware-accelerated CSS transforms for rotation
- No image processing in JavaScript (uses native rendering)

#### State Management
- JSON serialization for state cloning (fast for small objects)
- 50-state limit prevents memory bloat
- Lazy rendering (only renders when needed)

#### Memory Management
- Images loaded as file:// URLs (browser handles caching)
- No in-memory image buffers
- Unused undo states garbage collected when limit exceeded

## Data Storage

### electron-store Schema

#### Board Data
```json
{
  "board": {
    "images": [
      {
        "id": 1234567890123.456,
        "filename": "1234567890123.jpg",
        "x": 100,
        "y": 200,
        "width": 300,
        "height": 300,
        "rotation": 0
      }
    ]
  }
}
```

#### Settings Data
```json
{
  "shortcut": "CommandOrControl+Shift+D",
  "launchAtLogin": false,
  "holdMode": false
}
```

### File System Structure
```
<userData>/
├── images/
│   ├── 1234567890123.jpg
│   ├── 1234567890124.png
│   └── ...
├── config.json (electron-store)
└── logs/
```

## IPC Communication

### Main → Renderer
- `toggle-edit-mode`: Notify edit mode state change
- `image-added`: New image added from tray menu
- `save-before-quit`: Request state save before quit

### Renderer → Main
- `get-board-data`: Load saved board state
- `save-board-data`: Persist board state
- `get-settings`: Load settings
- `save-settings`: Persist settings
- `delete-image`: Remove image file
- `get-image-path`: Resolve image file path
- `copy-image-file`: Copy dropped file to images directory
- `open-data-folder`: Open userData in file explorer

## Build & Distribution

### Build Configuration
- **Builder**: electron-builder
- **Target**: NSIS installer + ZIP archive (Windows x64)
- **ASAR**: Enabled for code packaging
- **Code Signing**: Not configured (can be added)

### Dependencies
- **Production**: electron-store, auto-launch, uiohook-napi
- **Development**: electron, electron-builder

### Native Module Handling
- uiohook-napi requires native compilation (node-gyp)
- Prebuilt binaries used when available
- Build process must support native modules

## Known Limitations

### 1. Keyboard Shortcuts
**Limitation**: Only the edit mode toggle hotkey works. All other actions require context menu.

**Reason**: Desktop-type unfocusable windows cannot receive keyboard events.

**Workaround**: Context menu provides full access to all features.

**Cannot Add**: Delete, Ctrl+Z, Ctrl+Y as keyboard shortcuts without compromising desktop background behavior.

### 2. Window Detection
**Limitation**: Cannot detect if maximized windows cover the board.

**Reason**: Electron runs in a sandbox, cannot query other application windows reliably.

**Impact**: Edit mode can be activated even when board is not visible.

**Mitigation**: Visual feedback (grey overlay) makes accidental activation obvious; easy to exit with same hotkey or Escape.

### 3. Drag & Drop from Browsers
**Limitation**: Dragging images from some web browsers may not work reliably.

**Reason**: Different browsers provide different data in dataTransfer object.

**Workaround**: Users can save image to disk first, then drag file.

### 4. Multi-Monitor
**Limitation**: Board renders only on primary display.

**Reason**: Uses primary display dimensions for board window.

**Future**: Could be extended to multi-monitor support.

### 5. Fullscreen Applications
**Limitation**: Board may not be visible under fullscreen apps or games.

**Reason**: Fullscreen applications typically render at highest z-level.

**Expected**: This is normal behavior; board is meant for desktop use.

## Future Considerations

### Potential Enhancements
- Multi-monitor support
- Image filters/effects
- Text labels on images
- Image grouping/layers
- Export/import board layouts
- Cloud sync
- Templates

### Technical Debt
- No automated tests
- No error telemetry
- Settings window could be more polished
- No keyboard shortcut customization UI (except main toggle)
- Undo stack not persisted (lost on app restart)

### Platform-Specific Features
- **Windows**: Could use Windows 10/11 wallpaper API for deeper integration
- **macOS**: Could use mission control integration
- **Linux**: Varies too much by window manager to target specific features

## Development Guidelines

### Code Style
- ES6+ JavaScript
- Async/await for asynchronous operations
- Descriptive variable names
- Comments for non-obvious logic

### File Organization
```
deskboard/
├── main.js              # Main process
├── preload.js           # IPC bridge
├── package.json
├── src/
│   ├── board.html       # Board renderer HTML
│   ├── board.js         # Board renderer logic
│   ├── board.css        # Board styles
│   ├── settings.html    # Settings renderer HTML
│   ├── settings.js      # Settings renderer logic
│   └── settings.css     # Settings styles
├── build/
│   ├── icon.png         # Tray icon
│   └── icon.ico         # Windows app icon
└── docs/
    ├── PRODUCT.md       # Product specification
    └── SPECS.md         # Technical specification (this file)
```

### Error Handling
- IPC calls use try-catch
- File operations check existence before deletion
- Graceful degradation when native modules unavailable
- Console logging for debugging (not production-ready)

### Testing Strategy
- Manual testing on target OS
- Test with various image formats
- Test drag & drop from multiple sources
- Test with multiple images
- Test undo/redo edge cases
- Test hold mode with various shortcuts

## Changelog & Version History

### v0.1.0 - Initial Implementation
- Basic desktop board rendering
- Edit mode with toggle/hold shortcuts
- Image drag, resize, rotate
- Context menu for remove
- Tray menu integration
- Settings window
- Auto-launch support

### Bug Fixes (Current)
- ✅ Dragging opened images from browsers
- ✅ Enhanced context menu with undo/redo
- ✅ Undo/redo system (50 states)
- ✅ Proper quit from tray
- ✅ Context menu on blank areas
- ❌ Removed Delete/Ctrl+Z/Ctrl+Y keyboard shortcuts (architectural limitation)

## References

- [Electron Documentation](https://www.electronjs.org/docs/latest)
- [electron-store](https://github.com/sindresorhus/electron-store)
- [uiohook-napi](https://github.com/SnosMe/uiohook-napi)
- [electron-builder](https://www.electron.build/)
