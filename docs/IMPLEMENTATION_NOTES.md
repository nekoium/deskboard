# Implementation Notes - Bug Fixes (Final)

## Overview
This document details the implementation of five bug fixes and feature additions to Deskboard, focusing on improving the edit mode experience and user interaction.

## 1. Dragging Opened Images to Desktop

### Problem
When a user dragged an image element from a browser or image viewer (not a file from file explorer), it would not be added to the board. Only actual file drops worked.

### Solution
Enhanced the drop event handler to detect multiple data transfer types:
- **File drops**: Already working via `dataTransfer.files`
- **Image element drops**: New support via `dataTransfer.getData('text/uri-list')` and `dataTransfer.getData('text/html')`

The handler now:
1. Tries file drops first (original behavior)
2. Falls back to checking for image URLs in the data transfer
3. Extracts image sources from HTML if needed (handles `<img>` tags)
4. Handles `file://` protocol URLs
5. Copies the source file to the images directory
6. Creates a new image element at the drop location

### Code Location
`src/board.js` - Enhanced `drop` event listener

## 2. Delete Key Support

### Problem
Delete key handling existed but lacked proper event prevention and undo tracking.

### Solution
- Added `e.preventDefault()` to prevent default browser behavior
- Added undo state tracking before deletion
- Ensured proper cleanup and re-rendering

### Code Location
`src/board.js` - Keyboard event handler

## 3. Undo/Redo System

### Problem
No way to undo accidental changes or redo undone actions.

### Solution
Implemented a complete undo/redo system:
- **Undo stack**: Stores up to 50 previous states
- **Redo stack**: Stores states that were undone
- **Deep cloning**: Uses `JSON.parse(JSON.stringify())` to ensure state isolation
- **Keyboard shortcuts**: 
  - Ctrl+Z for undo
  - Ctrl+Y or Ctrl+Shift+Z for redo

States are captured before:
- Dragging images (on drag end)
- Resizing images (on resize end)
- Rotating images (on rotate end)
- Deleting images (before deletion)
- Adding new images (before addition)

### Code Location
`src/board.js` - Stack variables, `pushUndoState()`, `undo()`, `redo()` functions

## 4. Edit Mode Hotkey Behavior

### Problem
Initial concern about edit mode triggering when maximized windows cover the screen.

### Design Evolution

**Attempt 1: Electron Focus Check**
- Checked if board window was focused
- Failed because board window has `focusable: false` and never receives focus
- Broke all hotkey functionality

**Attempt 2: Active Window Detection**
- Used `active-win` package to detect maximized/fullscreen windows
- Added 500ms polling to auto-exit edit mode
- Complex, platform-dependent, unreliable detection
- Desktop detection was inconsistent (Explorer processes, etc.)
- Too many edge cases and compromises

**Final Decision: Simple and Reliable**
- Reverted all window detection logic
- Hotkey always works, toggles edit mode on/off
- Same hotkey to enter and exit
- Escape key also exits edit mode
- Grey overlay provides clear visual feedback

### Why This Approach is Better

1. **Reliability**: No complex platform-specific detection
2. **Predictability**: Users always know what the hotkey will do
3. **Flexibility**: Users can drag from any window to the board
4. **Simplicity**: Less code, fewer bugs, easier to maintain
5. **Usability**: If accidentally triggered, just press hotkey or Escape to exit

The grey overlay makes it immediately obvious when edit mode is active, so accidental activation is not a significant problem.

### Code Location
`main.js` - Simple `toggleEditMode()` function

## 5. Real Exit from Tray

### Problem
The `window-all-closed` event had `e.preventDefault()` to keep the app running in the tray, but this also prevented the app from quitting when explicitly requested via the tray menu.

### Solution
Added an `isQuitting` flag:
1. Set to `true` when user clicks "Quit" from tray menu
2. Check in `window-all-closed` handler
3. Only prevent default if not quitting

```javascript
app.on('window-all-closed', (e) => {
  if (!isQuitting) {
    e.preventDefault();
  }
});
```

### Code Location
`main.js` - `isQuitting` flag, tray menu "Quit" handler, `window-all-closed` event

## Dependencies

No new dependencies added. The `active-win` dependency that was temporarily added has been removed.

## Performance Considerations

1. **Undo stack limit**: 50 states prevents memory bloat
2. **Deep cloning**: JSON serialization is fast for small state objects
3. **No background polling**: Removed the 500ms window check interval
4. **Simpler code path**: Less overhead in hotkey handling

## Lessons Learned

### Window Detection Complexity
Cross-platform window state detection is harder than it appears:
- Different behavior on Windows, macOS, Linux
- Desktop processes vary by system
- Window bounds include decorations/borders
- "Active window" definition varies
- Performance impact of polling

### User Experience Over Technical Perfection
The simple toggle approach is better because:
- Users adapt quickly to consistent behavior
- Visual feedback (grey overlay) is more important than preventing activation
- Easy exit (same hotkey, Escape) makes accidental activation harmless
- Trying to be "smart" about when to allow edit mode created more problems than it solved

## Testing Checklist

- [x] Drag an image from a browser to the board in edit mode
- [x] Drag an image file from file explorer to the board
- [x] Select an image and press Delete
- [x] Make changes and press Ctrl+Z to undo
- [x] Press Ctrl+Y to redo
- [x] Press hotkey to enter edit mode
- [x] Press hotkey again to exit edit mode
- [x] Press Escape to exit edit mode
- [x] Right-click tray icon and select Quit (app exits)
- [x] Check grey overlay is visible in edit mode

## Final Implementation Summary

**What Works:**
- ✅ Dragging images from browsers/viewers
- ✅ Delete key removes selected images
- ✅ Full undo/redo with 50-state history
- ✅ Simple, reliable hotkey toggle
- ✅ Proper app exit from tray menu

**What Was Removed:**
- ❌ Window state detection (too complex, unreliable)
- ❌ Auto-exit on window maximize (not needed)
- ❌ Focus-based hotkey restrictions (broke functionality)

The final implementation prioritizes reliability, simplicity, and user experience over technical complexity.
