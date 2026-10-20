# Deskboard v0.1.0 - Initial Release 🎯

## What is Deskboard?

A desktop vision board that stays visible without getting in your way. Deskboard lives at your desktop layer - always present, never intrusive - so your goals remain in sight even while you work.

## Why Deskboard?

Traditional digital vision boards fail because:
- They require active effort to check (easy to forget)
- They're either intrusive (annoying) or hidden (ineffective)
- Motivation to open them fades quickly

**Deskboard is different**: It sits between your wallpaper and desktop icons, passively visible every time you see your desktop. Your vision board becomes part of your digital environment.

## Features

### Core Functionality
- 🖼️ **Desktop Layer Display** - Images live between wallpaper and icons
- ⚡ **Quick Edit Mode** - Toggle with `Ctrl+Shift+D` (customizable)
- 🎨 **Full Image Control** - Drag, resize, rotate your vision board
- 💾 **Persistent** - Layout automatically saved
- 🚀 **Launch at Login** - Optional auto-start

### Edit Mode
- **Drag & drop** images from browsers or file explorer
- **Move** images anywhere on your board
- **Resize** with aspect ratio lock (bottom-right handle)
- **Rotate** with snap to cardinal directions (top handle)
- **Context menu** - Right-click for Remove, Undo, Redo
- **Undo/Redo** - 50-state history for all changes
- **Press Escape** or toggle hotkey to exit

### User Experience
- Click-through in normal mode (never blocks your work)
- Edit mode stays below normal windows (non-intrusive editing)
- System tray integration for quick access
- Clean, minimal interface - your images are the focus

## Installation

### Windows

**Installer (Recommended)**
- Download `Deskboard-Setup-0.1.0.exe`
- Run installer and follow setup wizard
- Includes uninstaller and start menu shortcut

**Portable**
- Download `Deskboard-0.1.0-Portable.exe`
- Run directly from any location
- No installation required

### First Run
Windows SmartScreen may show a warning because the app is not code-signed. Click "More info" → "Run anyway" to proceed.

## Getting Started

1. **Launch** - Deskboard runs in your system tray
2. **Add images** - Right-click tray icon → "Add Image..." or drag directly in edit mode
3. **Arrange** - Press `Ctrl+Shift+D` to enter edit mode
4. **Enjoy** - Your vision board is now always visible on your desktop

## Technical Details

- **Built with**: Electron 27
- **Platform**: Windows 64-bit (macOS/Linux support planned)
- **Storage**: Images and settings stored in `%APPDATA%\deskboard`
- **License**: MIT

## Known Limitations

- **Desktop icon layering**: On some Windows configurations, images may appear above desktop icons instead of below. This is due to OS-level limitations with window z-ordering.
- **Keyboard shortcuts in edit mode**: Delete, Undo, Redo are context menu-only (right-click) due to desktop window focus constraints. See [technical documentation](https://github.com/nekoium/deskboard/blob/master/docs/SPECS.md#keyboard-input-limitation) for details.

## Documentation

- 📖 [Full Documentation](https://github.com/nekoium/deskboard/tree/master/docs)
- 🔧 [Technical Specs](https://github.com/nekoium/deskboard/blob/master/docs/SPECS.md)
- 🏗️ [Building from Source](https://github.com/nekoium/deskboard/blob/master/docs/BUILD_RELEASES.md)

## Feedback & Support

- 🐛 [Report Issues](https://github.com/nekoium/deskboard/issues)
- 💡 [Feature Requests](https://github.com/nekoium/deskboard/issues)
- ⭐ Star this repo if you find it useful!

## What's Next?

Future plans include:
- macOS and Linux support
- Multi-monitor support
- Image filters and effects
- Text labels
- Templates and presets

---

**Download now and keep your goals in sight!** 🎯
