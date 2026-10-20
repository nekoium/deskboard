# Deskboard — Product Spec

A quiet tray app that turns your desktop into a vision and note board, layered between  
the wallpaper and the desktop icons. This document is the source of truth for  
the intended user experience.

## Core loop

1. **Display mode (default).** The board lives on the desktop layer, invisible
 to the mouse: icons, drag-and-drop, and right-click on the desktop work
 exactly as if the board were not there.
2. **Edit mode — press and hold the trigger key (default `Caps Lock`).**
 Trigger handling runs through two gates:

   **Gate 1 - is edit even armed?** Only in the designed scenarios: the
    desktop shell has focus, OR the cursor is over the desktop band (e.g.
    dragging an image to the desktop). Anywhere else the key is never
    captured and behaves completely normally.

    **Gate 2 - is it held long enough (0.4 s from the first key-down)?**
   - **Short tap** (key-up first) — the key behaves completely normally:
   the capital-lock state toggles, the board never reacts. Rapid tapping
   restarts the session each press, so taps can never accumulate into a
   hold.
   - **Hold confirmed (while held):**
     - The board floats **above the desktop (wallpaper + icons) but below
     every normal window**. It never covers or blocks the user's apps,
     never steals focus, and never takes the keyboard: typing in the
     current app continues undisturbed.
     - Clicks and drags on empty desktop areas reach the board; the user's
     windows above keep working normally.
     - A **half-transparent white wash** covers the desktop background —
     images on the board stay fully opaque (macOS-dashboard style). A
     frosted hint pill appears at the bottom of the screen.
     - The capital-lock state must **never** toggle while editing; the key
     is consumed globally.

    Each physical press is handled as a **session**: it opens with the first
    captured key-down, the decision is invalidated and restarted by rapid
    re-presses, and once decided, stray key-ups are swallowed instead of
    replayed — so keyboard interceptors can neither make the board flash
    on/off nor leak a hold through as a Caps Lock press.

    **Release detection** (in order): a seen key-up exits instantly; a new
    Caps press while editing (≥ 0.6 s after the last event) exits explicitly;
    prolonged silence plus async-state agreement is the last fallback. On
    normal machines the key-up path always wins; the explicit taps are a
    working fallback for machines whose keyboard interceptors eat key-ups
    and stop auto-repeats mid-hold. Foreign injected trigger events are
    swallowed (the app is the gatekeeper of the trigger key), so synthetic
    Caps pairs from remappers can never toggle the capital state.
3. **Release the trigger key.** The board saves immediately and re-embeds into
 the desktop layer, click-through again.

### Mode transition (design)

The display-to-edit switch reads as a single visual change - transparent
background to white wash and back. The window is hidden for the few
milliseconds of the layer restructure (hide -&gt; restructure -&gt;
show-without-activation), so it never paints a half-applied state: no
"jumping", no window-frame flash, no flicker. The wash fades in over 180 ms
while the board reappears.

### Non-intrusive rules (hard requirements)

- The app never shows windows above the user's normal windows; its only
surfaces are the desktop layer, the tray, and the Settings window.
- The trigger is armed **only when the desktop shell is the foreground
surface**. While any normal window is focused, the trigger key behaves
completely normally - the app never reacts to it.
- The board window becomes visible only after its UI actually loaded — a
failed webview load can never cover the desktop with a blank page.
- While editing, only the trigger key and Delete/Escape (for the selected
image) are consumed; every other keystroke passes through untouched.

## Editing (edit mode)

- **Move** — drag an image.
- **Select** — click an image; handles appear.
- **Resize** — drag corner/edge handles; **aspect ratio is locked**.
- **Rotate** — drag the rotate handle; rotation **snaps to 0/90/180/270**
when close (quality-of-life).
- **Delete** — select + press `Delete` (captured only while editing).
- **Deselect** — click empty board space.

There is no right-click context menu in edit mode.

## Adding images

- **Drag &amp; drop** — while edit mode is active, drag image files from Explorer  
(or drop an image from an image viewer) onto the desktop area; they land on  
the board, not the desktop folder. Dropping while in display mode is left  
to the OS (normal desktop behavior).
- **Tray → Add Image…** — opens a file picker.

Imported files are **copied into the app's asset cache**, so the board never
breaks when the original file moves or is deleted.

## Tray (the only UI surface besides editing)

- **Add Image…**
- **Settings…**
- **Quit**

There is deliberately **no** edit-mode toggle in the tray: edit mode is
momentary by design (hold the trigger key).

## Settings page

Opened from the tray as a small normal window:

- **Edit trigger key** — dropdown: Caps Lock (default), Insert,
Scroll Lock, F4. Some systems remap Caps Lock (HID tools, IMEs) so it
never reaches apps; the dropdown lets users pick a key that works.
Changes apply immediately and persist.
- **Launch at login** — toggle (OS autostart).
- **Data folder** — button that opens the app-data folder in the file manager.
- **Version** — read-only.

Closing the window hides it; state is kept.

## Persistence

- Element state: `canvas.json` in the OS app-data directory
(Windows: `%APPDATA%\dev.nekoium.deskboard`).
- Trigger key: `settings.json` next to it.
- Image cache: `assets/` next to it; orphaned files are removed on save.
- Debounced autosave while editing; immediate save on leaving edit mode.

## Non-goals (for now)

- Text/sticky notes, boards with multiple pages, cloud sync, per-board
settings, multi-monitor layouts, z-order UI.