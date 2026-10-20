# Deskboard - Quick Start Guide

## Installation

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start the Application**
   ```bash
   npm start
   ```

## First Time Setup

1. When you start Deskboard, a system tray icon will appear
2. The board window is invisible until you add images
3. Default keyboard shortcut: `Ctrl+Shift+D` (Windows/Linux) or `Cmd+Shift+D` (macOS)

## Adding Your First Image

### Option 1: Use the Tray Menu
1. Click the Deskboard tray icon
2. Select "Add Image…"
3. Choose an image file
4. The image appears on your desktop

### Option 2: Drag and Drop
1. Press `Ctrl+Shift+D` to enter edit mode
2. Drag an image file onto your desktop
3. Drop it where you want it placed

## Editing Your Board

### Enter Edit Mode
Press `Ctrl+Shift+D` (or your configured shortcut)
- A semi-transparent white overlay appears
- Images become interactive
- Your desktop icons still work normally

### Manipulate Images

**Select an Image**
- Click on any image to select it
- A blue outline appears with handles

**Move**
- Click and drag the image to reposition

**Resize**
- Drag the blue handle (bottom-right corner)
- Aspect ratio is maintained automatically

**Rotate**
- Drag the green handle (top center)
- Automatically snaps to 0°, 90°, 180°, 270°

**Delete**
- Select an image
- Press the `Delete` key

**Context Menu**
- Right-click an image for more options

### Exit Edit Mode
Press `Ctrl+Shift+D` again
- Changes are saved automatically
- Overlay disappears
- Board returns to display-only mode

## Customizing Settings

1. Click tray icon → "Settings…"
2. Available options:
   - **Keyboard Shortcut**: Click the input field and press your desired key combination
   - **Launch at Login**: Check to start Deskboard automatically
   - **Open Data Folder**: View where your images are stored
3. Click "Save" to apply changes

## Tips

- **Normal Use**: The board is click-through - you can click icons and use the desktop normally
- **Auto-save**: All changes are saved automatically
- **Persistence**: Your board layout is preserved when you close and restart
- **Multi-select**: Currently not supported (coming in future versions)
- **Undo**: Not yet available - delete and re-add if needed

## Keyboard Shortcuts

| Action | Windows/Linux | macOS |
|--------|---------------|-------|
| Toggle Edit Mode | `Ctrl+Shift+D` | `Cmd+Shift+D` |
| Delete Selected | `Delete` | `Delete` |
| Deselect | `Escape` | `Escape` |

*Note: The edit mode shortcut is configurable in Settings*

## Troubleshooting

**Can't see my images**
- Make sure you're not in edit mode - press `Ctrl+Shift+D` twice
- Check that the application is running (look for tray icon)

**Images won't stay on desktop**
- They're saved automatically - restart the app to verify
- Check Settings → Open Data Folder to see stored images

**Keyboard shortcut doesn't work**
- Another app might be using the same shortcut
- Change it in Settings to something else
- Try `Alt+Shift+D` or `Ctrl+Alt+V`

**Board covers my desktop icons**
- This shouldn't happen - the board stays behind icons
- If it does, restart the application
- Report this as a bug

**Tray icon not appearing**
- Check your system tray / notification area
- May be hidden - look for overflow icons (^)

## Uninstalling

1. Quit Deskboard (tray icon → Quit)
2. Remove the application folder
3. Optionally delete your data:
   - Windows: `%APPDATA%/deskboard`
   - macOS: `~/Library/Application Support/deskboard`
   - Linux: `~/.config/deskboard`

## Need Help?

- Check DEVELOPMENT.md for technical details
- Review PRODUCT.md for feature specifications
- File issues on the project repository

---

**Enjoy your vision board!** Keep your goals and inspiration visible every day.
