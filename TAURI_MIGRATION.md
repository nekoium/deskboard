# Tauri Migration Handoff

## Context

Deskboard is a desktop vision board application that displays images on the Windows desktop layer (below desktop icons, above wallpaper). The current Electron implementation causes **severe cursor lag and GPU crashes** due to transparent full-screen window rendering issues.

## Critical Requirements

1. **Desktop layer placement (HARD REQUIREMENT)**: Images must appear **below desktop icons**, not above them
2. **No performance impact**: Cursor must remain responsive, no lag
3. **Click-through in normal mode**: Desktop icons must be clickable when not in edit mode
4. **Edit mode**: User can drag, resize, rotate images

## Current State

**Repository**: https://github.com/nekoium/deskboard
**Branch**: master
**Last commit**: 28b842b

### Working Features (Keep)
- ✅ System tray integration
- ✅ Image management (add, move, resize, rotate, delete)
- ✅ Undo/redo system (50 states)
- ✅ Context menu (Remove, Undo, Redo)
- ✅ Persistent storage (images + layout)
- ✅ Settings (shortcut, launch at login, hold/toggle mode)
- ✅ Hold or toggle edit mode

### Problem
- ❌ Electron + transparent full-screen window = severe lag
- ❌ GPU process crashes repeatedly
- ❌ WorkerW/Progman parenting via PowerShell works but causes rendering issues
- ❌ Images appear above desktop icons (not below as required)

## Why Tauri Will Solve This

1. **Native webview** (WebView2) instead of Chromium - much lighter
2. **Direct Win32 API calls** from Rust - no PowerShell overhead
3. **Proper desktop compositing** - native windows handle desktop layer correctly
4. **No separate GPU process** - uses system rendering
5. **3MB footprint** vs Electron's 100MB+

## Migration Plan

### Phase 1: Core Structure (Keep existing UI)

**Reuse as-is:**
- `src/board.html` - Main UI
- `src/board.js` - Image manipulation logic
- `src/board.css` - Styles
- `src/settings.html` - Settings UI
- `src/settings.js` - Settings logic
- `build/icon.ico` - App icon
- Images stored in AppData

**Port to Rust:**
- `main.js` → `src-tauri/src/main.rs`
  - Window creation
  - System tray
  - Global shortcuts
  - IPC handlers
  - Auto-launch
  
**Implement new in Rust:**
- `src-tauri/src/desktop_layer.rs` - Direct Win32 API for WorkerW/Progman parenting
- Use `windows-rs` crate for Win32 APIs

### Phase 2: Desktop Layer Implementation (Critical)

**Windows API approach** (no PowerShell):

```rust
use windows::Win32::UI::WindowsAndMessaging::*;

// 1. Find Progman window
let progman = FindWindowW("Progman", "Program Manager");

// 2. Check if SHELLDLL_DefView is in Progman
let shell_dll = FindWindowExW(progman, None, "SHELLDLL_DefView", None);

// 3. If found, SetParent to Progman
SetParent(hwnd, progman);

// 4. Set z-order to bottom
SetWindowPos(hwnd, HWND_BOTTOM, 0, 0, 0, 0, SWP_NOSIZE | SWP_NOMOVE | SWP_NOACTIVATE);
```

**Test case**: User's system has SHELLDLL_DefView directly in Progman (handle: 65992). This is the common case on Windows 11.

### Phase 3: Features Port

**IPC Commands** (JavaScript ↔ Rust):
- `get_board_data` → Load images from storage
- `save_board_data` → Save layout
- `get_settings` → Load settings
- `save_settings` → Save settings
- `delete_image` → Remove image file
- `copy_image_file` → Add new image
- `get_image_path` → Get image file path
- `toggle_edit_mode` → Switch modes

**Storage**:
- Use `AppData\Local\deskboard\` for images
- Use `tauri-plugin-store` for settings JSON

**System Tray**:
- Menu: "Add Image...", "Settings...", "Quit"
- Use `tauri-plugin-system-tray`

**Global Shortcuts**:
- Default: `Ctrl+Shift+D`
- Support hold mode (hold to edit, release to exit)
- Use `tauri-plugin-global-shortcut`

**Auto-launch**:
- Use `tauri-plugin-autostart`

### Phase 4: Edit Mode Toggle

**Normal mode**:
- `set_ignore_cursor_events(true)` - Click-through
- Desktop layer (below icons)
- Window blurs if focused

**Edit mode**:
- `set_ignore_cursor_events(false)` - Interactive
- Temporarily bring to normal z-order (above icons) so user can interact
- Re-apply desktop layer on exit

## File Structure

```
deskboard/
├── src-tauri/
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   ├── src/
│   │   ├── main.rs          # Main entry, window setup, tray
│   │   ├── desktop_layer.rs # Win32 WorkerW/Progman API
│   │   ├── shortcuts.rs     # Global shortcut handling
│   │   └── storage.rs       # Image file management
│   └── icons/
│       └── icon.ico
├── src/                     # Keep existing HTML/CSS/JS
│   ├── board.html
│   ├── board.js
│   ├── board.css
│   ├── settings.html
│   └── settings.js
└── docs/                    # Keep documentation
```

## Dependencies (Cargo.toml)

```toml
[dependencies]
tauri = { version = "2.x", features = ["system-tray", "global-shortcut"] }
tauri-plugin-store = "2.x"
tauri-plugin-autostart = "2.x"
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"

[target.'cfg(windows)'.dependencies]
windows = { version = "0.58", features = [
    "Win32_UI_WindowsAndMessaging",
    "Win32_Foundation",
] }
```

## Key Implementation Details

### Desktop Layer (src-tauri/src/desktop_layer.rs)

```rust
use windows::Win32::Foundation::*;
use windows::Win32::UI::WindowsAndMessaging::*;

pub fn set_window_below_icons(hwnd: HWND) -> Result<(), String> {
    unsafe {
        // Find Progman
        let progman = FindWindowW(
            w!("Progman"),
            w!("Program Manager")
        );
        
        if progman.0 == 0 {
            return Err("Progman not found".into());
        }
        
        // Check for SHELLDLL_DefView in Progman
        let shell_dll = FindWindowExW(
            progman,
            None,
            w!("SHELLDLL_DefView"),
            None
        );
        
        if shell_dll.0 != 0 {
            // Simple case: parent to Progman
            SetParent(hwnd, progman);
            SetWindowPos(
                hwnd,
                HWND_BOTTOM,
                0, 0, 0, 0,
                SWP_NOSIZE | SWP_NOMOVE | SWP_NOACTIVATE
            );
            Ok(())
        } else {
            // Complex case: Send 0x052C message to create WorkerW
            // Then find WorkerW with SHELLDLL_DefView and parent to next WorkerW
            // See set-desktop-parent.ps1 for reference logic
            Err("WorkerW method not implemented".into())
        }
    }
}
```

### Window Creation (src-tauri/src/main.rs)

```rust
use tauri::{Manager, Window};

fn create_board_window(app: &tauri::AppHandle) -> Result<Window, String> {
    let window = tauri::WindowBuilder::new(
        app,
        "board",
        tauri::WindowUrl::App("board.html".into())
    )
    .title("Deskboard")
    .transparent(true)
    .decorations(false)
    .skip_taskbar(true)
    .always_on_bottom(true)
    .resizable(false)
    .fullscreen(true)
    .build()
    .map_err(|e| e.to_string())?;
    
    // Apply desktop layer
    #[cfg(windows)]
    {
        use windows::Win32::Foundation::HWND;
        let hwnd = HWND(window.hwnd().unwrap().0 as isize);
        desktop_layer::set_window_below_icons(hwnd)?;
    }
    
    // Start in click-through mode
    window.set_ignore_cursor_events(true)
        .map_err(|e| e.to_string())?;
    
    Ok(window)
}
```

## Testing Checklist

After migration:

1. ✅ App launches without lag
2. ✅ Images appear **below** desktop icons
3. ✅ Desktop icons are clickable in normal mode
4. ✅ Cursor remains responsive
5. ✅ Edit mode (`Ctrl+Shift+D`) works
6. ✅ Can drag, resize, rotate images
7. ✅ Images persist after restart
8. ✅ Context menu works (Remove, Undo, Redo)
9. ✅ Undo/redo works (50 states)
10. ✅ Settings window works
11. ✅ System tray menu works
12. ✅ Quit properly exits
13. ✅ Launch at login works
14. ✅ Hold mode works (hold key to edit)

## Known Edge Cases

1. **Multi-monitor**: Current implementation only covers primary monitor
2. **Windows version**: Tested on Windows 11. Windows 10 may have different SHELLDLL_DefView location
3. **Display scaling**: High DPI may need adjustments
4. **Tablet mode**: May behave differently

## Reference Files

**Key files to study:**
- `set-desktop-parent.ps1` - PowerShell implementation of WorkerW technique (reference for Rust port)
- `debug-workerw.ps1` - Debugging script showing window hierarchy
- `main.js` (lines 40-90) - Window creation and event handlers
- `src/board.js` - Full image manipulation logic (reuse as-is)
- `docs/SPECS.md` - Technical constraints and decisions

## Success Criteria

1. **No lag**: Cursor moves smoothly with app running
2. **Below icons**: Images clearly appear behind desktop icons
3. **All features work**: Same functionality as current Electron version
4. **Binary size**: < 10MB (vs current 100MB+)
5. **Memory usage**: < 50MB (vs current 150MB+)

## Build & Distribution

**Development**:
```bash
cargo tauri dev
```

**Production build**:
```bash
cargo tauri build
```

**Outputs**:
- NSIS installer: `src-tauri/target/release/bundle/nsis/Deskboard_0.1.0_x64-setup.exe`
- MSI installer: `src-tauri/target/release/bundle/msi/Deskboard_0.1.0_x64_en-US.msi`

No need for portable target - Tauri installers are small enough.

## Questions to Resolve

1. Should we implement the full WorkerW method (with 0x052C message) or is Progman parenting sufficient?
   - **Answer**: Start with Progman parenting (user's system uses this). Add WorkerW if needed.

2. How to handle edit mode z-order changes?
   - **Answer**: Temporarily remove parent (`SetParent(hwnd, None)`) in edit mode, re-parent on exit.

3. Hold mode implementation in Tauri?
   - **Answer**: Use `tauri-plugin-global-shortcut` with key-down/key-up events.

## Contact & Context

- **User requirement**: "Below desktop icons is a hard requirement, no compromises"
- **User tested**: Windows 11, SHELLDLL_DefView is in Progman (handle 65992)
- **Current blocker**: Electron causes severe cursor lag, unusable
- **Repository**: https://github.com/nekoium/deskboard

## Next Steps for Agent

1. Initialize Tauri project: `cargo install tauri-cli && cargo tauri init`
2. Copy existing `src/` HTML/CSS/JS files
3. Implement `desktop_layer.rs` with Win32 APIs
4. Port `main.js` IPC handlers to Rust
5. Test desktop layer placement
6. Verify no lag with native webview
7. Port remaining features (tray, shortcuts, storage)
8. Test thoroughly with checklist above

Good luck! The core UI logic is solid - it's just the desktop integration layer that needs the Rust/Win32 rewrite.
