# Deskboard — Product Spec

A tray application that displays images on the desktop layer, behind icons but above the wallpaper. The board stays click-through during normal use and becomes interactive when the user enters edit mode.

## User experience

### Normal use

The board displays images on the desktop. Desktop icons, file operations, and right-click context menus work normally. Clicks pass through the board to the desktop below.

### Edit mode

The user activates edit mode with a keyboard shortcut. While editing:

- A semi-transparent white overlay appears over the desktop background. Images remain fully opaque.
- The board becomes interactive and accepts clicks and drags.
- Normal application windows stay above the board.
- The board does not steal focus. Typing in other applications continues to work.
- The user can move, resize, rotate, and remove images.

Leaving edit mode saves changes and returns to click-through display mode.

### Trigger behavior

The keyboard shortcut is configurable. It must not produce an unintended system action when pressed.

## Safety requirements

- Deskboard must not modify the desktop environment in a way that persists after exit.
- Closing or crashing must leave the wallpaper, icons, taskbar, and keyboard state unchanged.
- A failed load must remain invisible.
- Normal application windows must always stay above the board.
- The display window must remain click-through outside edit mode.

## Features

### Image management

- Add images via drag-and-drop or tray menu
- Move by dragging
- Resize with aspect ratio locked
- Rotate with handles (snaps to 0/90/180/270 degrees)
- Remove selected images with Delete key
- Images are copied to local storage and do not break when the original file moves

### Editing interactions

- Click to select (handles appear)
- Click empty space to deselect
- Right-click menu: copy, save as, reset aspect ratio, remove

## Interface

### Tray menu

- Add Image…
- Settings…
- Quit

### Settings window

- Configure keyboard shortcut for edit mode
- Launch at login
- Open data folder
- Version display

## Persistence

- Board state and settings saved to local application data directory
- Images copied to local cache
- Autosave while editing
- Immediate save on exit

## Scope

### MVP (first version)

- Images only
- Single board
- Primary monitor
- Local storage

### Future

- Text notes
- Multiple boards
- Multiple monitors
- Cloud sync