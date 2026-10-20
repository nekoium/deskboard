param(
    [Parameter(Mandatory=$true)]
    [int]$WindowHandle
)

Add-Type @"
using System;
using System.Runtime.InteropServices;

public class Win32 {
    [DllImport("user32.dll")]
    public static extern IntPtr FindWindow(string lpClassName, string lpWindowName);
    
    [DllImport("user32.dll")]
    public static extern IntPtr FindWindowEx(IntPtr hwndParent, IntPtr hwndChildAfter, string lpszClass, string lpszWindow);
    
    [DllImport("user32.dll")]
    public static extern int SendMessage(IntPtr hWnd, int Msg, int wParam, int lParam);
    
    [DllImport("user32.dll")]
    public static extern IntPtr SetParent(IntPtr hWndChild, IntPtr hWndNewParent);
    
    [DllImport("user32.dll")]
    [return: MarshalAs(UnmanagedType.Bool)]
    public static extern bool SetWindowPos(IntPtr hWnd, IntPtr hWndInsertAfter, int X, int Y, int cx, int cy, uint uFlags);
    
    public static readonly IntPtr HWND_BOTTOM = new IntPtr(1);
    public const uint SWP_NOSIZE = 0x0001;
    public const uint SWP_NOMOVE = 0x0002;
    public const uint SWP_NOACTIVATE = 0x0010;
    public const uint SWP_SHOWWINDOW = 0x0040;
}
"@

try {
    # Find Progman window (Desktop)
    $progman = [Win32]::FindWindow("Progman", $null)
    
    if ($progman -eq [IntPtr]::Zero) {
        Write-Error "Could not find Progman window"
        exit 1
    }
    
    # Send message to Progman to spawn WorkerW window
    # This is the magic trick that Wallpaper Engine uses
    [Win32]::SendMessage($progman, 0x052C, 0, 0) | Out-Null
    
    # Find the WorkerW window that sits between desktop icons and wallpaper
    $workerw = [IntPtr]::Zero
    $enumResult = [IntPtr]::Zero
    
    # Enumerate windows to find WorkerW with SHELLDLL_DefView child
    do {
        $workerw = [Win32]::FindWindowEx([IntPtr]::Zero, $workerw, "WorkerW", $null)
        if ($workerw -ne [IntPtr]::Zero) {
            $shellDll = [Win32]::FindWindowEx($workerw, [IntPtr]::Zero, "SHELLDLL_DefView", $null)
            if ($shellDll -ne [IntPtr]::Zero) {
                # Found the right WorkerW - it has SHELLDLL_DefView as child
                # Get the next WorkerW, which is the one we want to parent to
                $targetWorkerW = [Win32]::FindWindowEx([IntPtr]::Zero, $workerw, "WorkerW", $null)
                if ($targetWorkerW -ne [IntPtr]::Zero) {
                    $workerw = $targetWorkerW
                    break
                }
            }
        }
    } while ($workerw -ne [IntPtr]::Zero)
    
    if ($workerw -eq [IntPtr]::Zero) {
        Write-Error "Could not find WorkerW window"
        exit 1
    }
    
    # Convert window handle to IntPtr
    $hwnd = [IntPtr]$WindowHandle
    
    # Set the Electron window as child of WorkerW
    # This places it between the wallpaper and desktop icons
    $result = [Win32]::SetParent($hwnd, $workerw)
    
    if ($result -eq [IntPtr]::Zero) {
        Write-Error "Failed to set parent window"
        exit 1
    }
    
    # Position window at bottom of z-order within the parent
    $flags = [Win32]::SWP_NOSIZE -bor [Win32]::SWP_NOMOVE -bor [Win32]::SWP_NOACTIVATE -bor [Win32]::SWP_SHOWWINDOW
    [Win32]::SetWindowPos($hwnd, [Win32]::HWND_BOTTOM, 0, 0, 0, 0, $flags) | Out-Null
    
    Write-Host "Successfully placed window behind desktop icons"
    exit 0
    
} catch {
    Write-Error "Error: $_"
    exit 1
}
