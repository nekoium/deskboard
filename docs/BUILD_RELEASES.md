# Building Releases

## Prerequisites

- Node.js 16+ installed
- npm installed
- Windows (for Windows builds)

## Build Targets

The project is configured to build three types of Windows releases:

1. **NSIS Installer** - Setup wizard installer
2. **Portable** - Single executable that runs without installation
3. **ZIP Archive** - Unpacked files for manual distribution

## Building Releases

### Step 1: Clean Build Environment

Before building, ensure no Electron processes are running and the release directory is clear:

```bash
# Kill any running Electron instances
taskkill /F /IM electron.exe

# Wait a moment for file handles to release
timeout /t 5

# Remove old build artifacts
rmdir /s /q release
```

**Important**: Close File Explorer windows viewing the `release/` folder, as Windows may lock files being viewed.

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Build

```bash
npm run dist
```

This will create three release artifacts in the `release/` folder:

- `Deskboard-0.1.0-Windows-x64.exe` - NSIS installer
- `Deskboard-0.1.0-Windows-x64-portable.exe` - Portable executable
- `Deskboard-0.1.0-Windows-x64.zip` - ZIP archive

## Troubleshooting

### File Lock Errors (EBUSY)

If you encounter `EBUSY: resource busy or locked` errors:

1. **Close File Explorer** - Windows locks files when viewing them
2. **Disable Windows Defender real-time scanning** temporarily during build
3. **Kill Electron processes**:
   ```bash
   taskkill /F /IM electron.exe
   ```
4. **Exclude release folder** from antivirus scanning
5. **Reboot** if file locks persist

### Build to Different Location

If file locks are persistent, build to a different output directory:

```json
// In package.json, change:
"directories": {
  "output": "dist"  // Instead of "release"
}
```

### Manual Cleanup

If automated cleanup fails:

1. Reboot your computer
2. Delete `release/` folder manually
3. Run build again

## Publishing to GitHub Releases

### Automatic (via electron-builder)

Set your GitHub token:

```bash
# Windows
set GH_TOKEN=your_github_token

# Then build with publish
npm run release
```

### Manual

1. Build the releases: `npm run dist`
2. Go to GitHub repository → Releases → Create new release
3. Upload files from `release/` folder:
   - `Deskboard-0.1.0-Windows-x64.exe`
   - `Deskboard-0.1.0-Windows-x64-portable.exe`
   - `Deskboard-0.1.0-Windows-x64.zip`

## Release Checklist

Before publishing a release:

- [ ] Update version in `package.json`
- [ ] Update CHANGELOG or release notes
- [ ] Test the application thoroughly
- [ ] Run `npm run dist` successfully
- [ ] Test installer on clean Windows machine
- [ ] Test portable version
- [ ] Create Git tag: `git tag v0.1.0 && git push --tags`
- [ ] Upload to GitHub releases with release notes

## Distribution Types Explained

### NSIS Installer (.exe)
- **Best for**: Most users
- **Includes**: Uninstaller, Start Menu shortcuts
- **Installation**: `C:\Users\<User>\AppData\Local\Programs\Deskboard`
- **Auto-updates**: Supported (if configured)
- **User action**: Run installer, click through wizard

### Portable (.exe)
- **Best for**: USB drives, no-install environments
- **Includes**: Single executable with embedded resources
- **Installation**: None - run from any location
- **Auto-updates**: Not supported
- **User action**: Double-click to run
- **Data storage**: Same folder as executable (portable mode) or AppData

### ZIP Archive (.zip)
- **Best for**: Advanced users, custom deployments
- **Includes**: All application files unpacked
- **Installation**: Manual - extract and run
- **Auto-updates**: Not supported
- **User action**: Extract, then run `Deskboard.exe`

## Version Bump Workflow

To release a new version:

1. Update version:
   ```bash
   npm version patch  # 0.1.0 -> 0.1.1
   npm version minor  # 0.1.1 -> 0.2.0
   npm version major  # 0.2.0 -> 1.0.0
   ```

2. Commit and tag:
   ```bash
   git push && git push --tags
   ```

3. Build releases:
   ```bash
   npm run dist
   ```

4. Create GitHub release with the built artifacts

## Build Configuration

The build configuration is in `package.json` under the `"build"` section:

```json
{
  "build": {
    "appId": "com.nekoium.deskboard",
    "productName": "Deskboard",
    "asar": true,
    "win": {
      "target": ["nsis", "portable", "zip"]
    }
  }
}
```

To customize builds, see [electron-builder documentation](https://www.electron.build/).
