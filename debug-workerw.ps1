Add-Type @"
using System;
using System.Runtime.InteropServices;

public class Win32Debug {
    [DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Unicode)]
    public static extern IntPtr FindWindow(string lpClassName, string lpWindowName);
    
    [DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Unicode)]
    public static extern IntPtr FindWindowEx(IntPtr hwndParent, IntPtr hwndChildAfter, string lpszClass, string lpszWindow);
    
    [DllImport("user32.dll", SetLastError = true)]
    public static extern int SendMessage(IntPtr hWnd, int Msg, int wParam, int lParam);
}
"@

$progman = [Win32Debug]::FindWindow("Progman", "Program Manager")
Write-Host "Progman: $progman"

# Check if Progman has SHELLDLL_DefView
$shellInProgman = [Win32Debug]::FindWindowEx($progman, [IntPtr]::Zero, "SHELLDLL_DefView", $null)
Write-Host "SHELLDLL_DefView in Progman: $shellInProgman"

# Send the magic message
$result = [Win32Debug]::SendMessage($progman, 0x052C, 0, 0)
Write-Host "SendMessage result: $result"

Start-Sleep -Milliseconds 200

# Now search for WorkerW with SHELLDLL_DefView
$workerw = [IntPtr]::Zero
Write-Host "`nSearching WorkerW windows:"

do {
    $workerw = [Win32Debug]::FindWindowEx([IntPtr]::Zero, $workerw, "WorkerW", $null)
    if ($workerw -ne [IntPtr]::Zero) {
        $shellDll = [Win32Debug]::FindWindowEx($workerw, [IntPtr]::Zero, "SHELLDLL_DefView", $null)
        if ($shellDll -ne [IntPtr]::Zero) {
            Write-Host "WorkerW $workerw has SHELLDLL_DefView: $shellDll"
        } else {
            Write-Host "WorkerW $workerw - no SHELLDLL_DefView"
        }
    }
} while ($workerw -ne [IntPtr]::Zero)
