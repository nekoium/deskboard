// Windows-specific module to place Electron window behind desktop icons
// Uses the WorkerW technique that Wallpaper Engine uses

const { execSync } = require('child_process');
const path = require('path');

function setWindowBehindDesktopIcons(browserWindow) {
  if (process.platform !== 'win32') {
    console.warn('setWindowBehindDesktopIcons only works on Windows');
    return false;
  }

  try {
    const hwnd = browserWindow.getNativeWindowHandle();
    if (!hwnd) {
      console.error('Could not get native window handle');
      return false;
    }

    // Convert buffer to decimal handle
    const handle = hwnd.readInt32LE(0);
    
    // Call PowerShell script to manipulate window z-order
    const scriptPath = path.join(__dirname, 'set-desktop-parent.ps1');
    const command = `powershell -ExecutionPolicy Bypass -File "${scriptPath}" -WindowHandle ${handle}`;
    
    execSync(command, { stdio: 'pipe' });
    console.log('Successfully placed window behind desktop icons');
    return true;
  } catch (error) {
    console.error('Failed to set window behind desktop icons:', error.message);
    return false;
  }
}

module.exports = { setWindowBehindDesktopIcons };
