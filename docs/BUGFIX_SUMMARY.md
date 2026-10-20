# Bug Fixes Summary

## Fixed Issues

### 1. Dragging Opened Pictures to Desktop in Edit Mode
**Issue**: Dragging an already opened/rendered image to the desktop didn't add it to the board, only file dragging worked.

**Fix**: Enhanced the drop event handler in `src/board.js` to handle both file drops and image element drops:
- Now checks for `text/uri-list` and `text/html` data in the dataTransfer
- Extracts image source URLs from HTML content if needed
- Handles local file paths (with `file://` protocol or direct paths)
- Copies the image file to the images directory and creates a new image element

### 2. Delete Key Support in Edit Mode
**Issue**: Delete key wasn't properly removing selected images.

**Resolution**: Keyboard shortcuts cannot work without window focus due to OS limitations.

**Final Implementation**: 
- Delete action moved to context menu (right-click on image → Remove)
- This works without requiring window focus
- Maintains desktop background behavior

### 3. Undo/Redo Support
**Issue**: No undo/redo functionality when editing the board.

**Fix**: Implemented full undo/redo system accessible via context menu:
- Added `undoStack` and `redoStack` arrays with a maximum of 50 states
- `pushUndoState()` saves current state before any modification
- `undo()` restores previous state (via context menu)
- `redo()` restores next state (via context menu)
- Undo states are pushed before:
  - Dragging images
  - Resizing images
  - Rotating images
  - Deleting images
  - Adding new images via drop

**Note on Keyboard Shortcuts**: Ctrl+Z and Ctrl+Y cannot be implemented due to architectural constraints. Desktop-type windows with `focusable: false` cannot receive keyboard events. Using global shortcuts would be too invasive and risky. Context menu provides full functionality without these limitations.

### 4. Edit Mode Hotkey Behavior
**Issue**: Edit mode hotkey behavior needed consideration for user experience.

**Decision**: Keep it simple and reliable
- Hotkey works everywhere, always
- Same hotkey toggles edit mode on/off
- Escape key also exits edit mode
- Grey overlay makes it obvious when edit mode is active
- Users can easily exit if accidentally triggered

**Why this approach:**
- Window detection proved unreliable and complex across platforms
- Users need to be able to drag images from other windows to the board
- Simple toggle is intuitive and predictable
- Visual feedback (grey overlay) prevents confusion

### 5. Real Exit from Tray
**Issue**: Clicking "Quit" from tray menu didn't actually exit the application.

**Fix**: 
- Added `isQuitting` flag in `main.js`
- Set `isQuitting = true` when user clicks Quit from tray menu
- Modified `window-all-closed` event handler to only prevent default if not quitting
- Now the app properly exits when user selects Quit from the tray menu

## Architectural Constraints

### Keyboard Input Limitation

**The Core Issue**: Operating systems only send keyboard events to windows that have focus. Deskboard's window must remain `focusable: false` to maintain desktop background behavior (no Alt+Tab appearance, no taskbar presence, stays below normal windows).

**Solutions Evaluated**:

1. **Global Keyboard Hooks** ❌
   - Register Delete, Ctrl+Z, Ctrl+Y as system-wide shortcuts
   - **Rejected**: Too invasive, high risk of conflicts with other applications
   - **Risk**: Global hooks can cause system instability

2. **Dynamic Focus** ❌
   - Make window focusable when entering edit mode
   - **Rejected**: Window appears in Alt+Tab, shows on taskbar, breaks desktop illusion
   - **Conflict**: Violates core design principle

3. **Context Menu Only** ✅ **CHOSEN**
   - All actions accessible via right-click menu
   - Works without window focus
   - **Trade-off**: Slightly less convenient than keyboard shortcuts
   - **Benefit**: Maintains clean desktop background behavior, no system-wide risks

**Final Decision**: Only the edit mode toggle uses a global shortcut (necessary and acceptable for a single hotkey). All other actions (Remove, Undo, Redo) are context menu-only.

## Files Modified

1. **main.js**
   - Added `isQuitting` flag for proper exit handling
   - Updated Quit menu item to set quitting flag
   - Updated `window-all-closed` handler to respect quitting flag
   - Kept hotkey handling simple and reliable (always works)

2. **src/board.js**
   - Added undo/redo stack variables and constants
   - Enhanced drop event handler to support image element drops (not just files)
   - Added undo state tracking before all modifications
   - Implemented `pushUndoState()`, `undo()`, and `redo()` functions
   - Removed keyboard shortcuts (Delete, Ctrl+Z, Ctrl+Y)
   - Enhanced context menu system with two types:
     - Image context menu: Remove, Undo, Redo
     - Board context menu (blank area): Undo, Redo
   - Added disabled state for undo/redo when no history
   - Added menu divider styling
   - Kept Escape key for exiting edit mode

3. **src/board.css**
   - Added `.context-menu-item.disabled` styling
   - Added `.context-menu-divider` styling
   - Visual feedback for disabled menu items

4. **SPECS.md** (New)
   - Comprehensive technical specification document
   - Documents architectural constraints and design decisions
   - Explains keyboard input limitation and solution rationale
   - Implementation details for all features

## Testing Recommendations

1. **Test dragging images**: Try dragging an image from a browser or file explorer to the board in edit mode
2. **Test context menu on images**: Right-click on an image to see Remove, Undo, Redo options
3. **Test context menu on blank area**: Right-click on blank space in edit mode to see Undo, Redo options
4. **Test remove**: Select an image, right-click, choose Remove
5. **Test undo/redo**: Make several changes, right-click and use Undo/Redo from menu
6. **Test disabled menu items**: Check that Undo/Redo are greyed out when no history available
7. **Test hotkey**: Press the hotkey (default Ctrl+Shift+D) to toggle edit mode on and off
8. **Test quit**: Right-click tray icon and select Quit to ensure app exits completely
9. **Test escape**: Press Escape in edit mode to exit
10. **Test menu closing**: Click outside menu to close it
