# XRefHub OAuth Setup Guide

## Current Status
Your XRefHub extension has OAuth integration issues that need to be resolved. The main problems are:
- ❌ Bad client ID error
- ❌ Password connection not present
- ❌ OAuth flow blocked by Chrome

## Quick Fix Options

### Option 1: Test Without OAuth (Immediate)
Run this command to temporarily disable OAuth and test the extension:
```bash
node fix-oauth-temp.js
```

### Option 2: Fix OAuth Properly (Recommended)

#### Step 1: Get Your Extension ID
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Find "Xrefhub" in the list
4. Copy the "ID" field (looks like: `abcdefghijklmnopqrstuvwxyz123456`)

#### Step 2: Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Name it "Xrefhub-Extension"
4. Click "Create"

#### Step 3: Enable Required APIs
In your new project, go to "APIs & Services" → "Library" and enable:
- **Google Drive API**
- **Google Sheets API**
- **Google+ API** (for user profile)

#### Step 4: Configure OAuth Consent Screen
1. Go to "APIs & Services" → "OAuth consent screen"
2. Choose "External" user type
3. Fill in:
   - App name: "Xrefhub"
   - User support email: Your email
   - Developer contact information: Your email
4. Add scopes:
   ```
   https://www.googleapis.com/auth/drive.readonly
   https://www.googleapis.com/auth/spreadsheets
   https://www.googleapis.com/auth/userinfo.email
   https://www.googleapis.com/auth/userinfo.profile
   ```

#### Step 5: Create OAuth Client ID
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth 2.0 Client IDs"
3. Choose "Chrome Extension" as application type
4. Enter your extension ID from Step 1
5. Click "Create"
6. Copy the new client ID

#### Step 6: Update Manifest.json
Replace the OAuth section in your `manifest.json`:

```json
"oauth2": {
    "client_id": "YOUR_NEW_CLIENT_ID_HERE",
    "scopes": [
        "https://www.googleapis.com/auth/drive.readonly",
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/userinfo.profile",
        "openid"
    ]
}
```

#### Step 7: Test the Fix
1. Reload the extension in Chrome
2. Open the settings page
3. Click "Sign In with Google"
4. Should now work without errors

## Troubleshooting

### If OAuth Still Fails:
1. **Check extension ID**: Make sure it matches exactly
2. **Verify APIs**: Ensure all required APIs are enabled
3. **Check consent screen**: Make sure all scopes are added
4. **Clear cache**: Clear Chrome's OAuth cache
5. **Try different browser**: Test in incognito mode

### If Password Connection Still Fails:
1. **Reset permissions**: Reset extension permissions
2. **Reinstall extension**: Remove and reload the extension
3. **Check Chrome version**: Ensure you're using the latest Chrome
4. **Disable other extensions**: Temporarily disable other extensions

## Success Indicators

When the fix is working:
- ✅ No "bad client id" errors
- ✅ Google sign-in popup appears
- ✅ "Load from Drive" button works
- ✅ Connection status shows green checkmarks
- ✅ No password connection errors

## Next Steps

Once OAuth is working:
1. Set up your Google Drive folder
2. Configure your Google Sheets
3. Test the full extension functionality
4. Configure AI provider settings

## Commands Summary

```bash
# Test without OAuth
node fix-oauth-temp.js

# Restore OAuth when ready
node restore-oauth.js

# Get help
node get-extension-id.js
``` 