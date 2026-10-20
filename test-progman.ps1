Add-Type @"
using System;
using System.Runtime.InteropServices;

public class Win32Test {
    [DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Unicode)]
    public static extern IntPtr FindWindow(string lpClassName, string lpWindowName);
}
"@

$progman = [Win32Test]::FindWindow("Progman", $null)
Write-Host "Progman handle: $progman"

if ($progman -eq [IntPtr]::Zero) {
    $progman = [Win32Test]::FindWindow("Progman", "Program Manager")
    Write-Host "Progman with title: $progman"
}
