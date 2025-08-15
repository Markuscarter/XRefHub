# 🎨 Xrefhub Design System Automation

## Overview
This system automatically syncs design changes from `design.json` to your Chrome extension's CSS, enabling instant visual updates without manual CSS editing.

## 🚀 Quick Start

### 1. Update Design (design.json)
Edit `design.json` to change colors, spacing, typography, etc.

### 2. Sync Changes
Run the sync script to automatically update CSS:
```bash
node sync-design.js
```

### 3. Reload Extension
- Go to `chrome://extensions/`
- Click the reload button on your Xrefhub extension
- Open the popup to see your changes!

## 📁 Files

- **`design.json`** - Your design system configuration
- **`sync-design.js`** - Automated sync script
- **`popup.css`** - CSS file that gets automatically updated
- **`build.js`** - Build script with integrated design sync

## 🔧 Usage Options

### Option 1: Standalone Sync
```bash
# Sync design system only
node sync-design.js

# Show help
node sync-design.js --help
```

### Option 2: Full Build with Design Sync
```bash
# Run complete build including design sync
node build.js
```

## 🎯 What Gets Synced

The sync script automatically updates these CSS custom properties:

- **Colors**: Primary, secondary, background, text, border, status
- **Spacing**: Scale from xs to xxxl
- **Border Radius**: All radius values
- **Shadows**: Card, button, focus shadows
- **Typography**: Font families, sizes, weights

## 🔒 Safety Features

- **Automatic Backup**: Creates `popup.css.backup` before changes
- **Validation**: Checks design.json structure before syncing
- **Error Recovery**: Automatically restores from backup if sync fails
- **Rollback**: Manual restore: `cp popup.css.backup popup.css`

## 📝 Example Workflow

1. **Edit design.json** - Change button colors to black gradient
2. **Run sync** - `node sync-design.js`
3. **Reload extension** - Click reload in chrome://extensions/
4. **See changes** - Open popup to view new design

## 🚨 Troubleshooting

### Sync Fails
- Check that you're in the Xrefhub project root
- Verify `design.json` and `popup.css` exist
- Check console for specific error messages

### Design Changes Not Visible
- Ensure you reloaded the extension in chrome://extensions/
- Check that the sync script ran successfully
- Verify CSS variables were updated in popup.css

### Restore Previous Design
```bash
cp popup.css.backup popup.css
```

## 🔄 Future Updates

Now you can:
1. **Edit design.json** anytime
2. **Run `node sync-design.js`** to sync
3. **Reload extension** to see changes
4. **No more manual CSS editing!**

## 📚 Advanced Usage

### Custom Design Values
Add new properties to `design.json` and they'll automatically appear in CSS.

### Multiple Themes
The system supports multiple theme configurations (light/dark planned).

### Build Integration
Design sync is automatically included in the full build process.

---

**Happy designing! 🎨✨**
