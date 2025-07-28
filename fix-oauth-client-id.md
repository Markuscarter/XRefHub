# Fix Invalid OAuth2 Client ID Error

## Current Problem
Your extension is getting "Invalid OAuth2 Client ID" errors because the client ID in your manifest.json is not properly configured in Google Cloud Console.

**Current Client ID**: `1035106798421-medf7c3svu83nj4mqbeau3bkumdc5d3k.apps.googleusercontent.com`

## Step-by-Step Fix

### Step 1: Get Your Extension ID
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Find "Xrefhub" in the list
4. Copy the "ID" field (looks like: `abcdefghijklmnopqrstuvwxyz123456`)

### Step 2: Create/Update Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Name it "Xrefhub-Extension" (or similar)

### Step 3: Enable Required APIs
In your project, go to "APIs & Services" → "Library" and enable:
- **Google Drive API**
- **Google Sheets API**
- **Google+ API** (for user profile)

### Step 4: Configure OAuth Consent Screen
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

### Step 5: Create OAuth Client ID
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth 2.0 Client IDs"
3. Choose "Chrome Extension" as application type
4. Enter your extension ID from Step 1
5. Click "Create"
6. Copy the new client ID

### Step 6: Update Manifest.json
Replace the client ID in your `manifest.json`:

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

### Step 7: Test the Fix
1. Reload the extension in Chrome
2. Open the settings page
3. Click "Sign In with Google"
4. Should now work without "Invalid Client ID" errors

## Quick Commands

```bash
# Get help with extension ID
node get-extension-id.js

# Test OAuth after fixing
node test-oauth.html
```

## Troubleshooting

### If Still Getting "Invalid Client ID":
1. **Double-check extension ID** - Must match exactly
2. **Verify project selection** - Make sure you're in the right Google Cloud project
3. **Check API enablement** - All required APIs must be enabled
4. **Clear Chrome cache** - Go to `chrome://settings/clearBrowserData`
5. **Reset extension** - Remove and reload the extension

### Common Issues:
- **Wrong project**: Make sure you're creating the client ID in the correct project
- **Missing APIs**: Ensure Google Drive API and Google Sheets API are enabled
- **Incorrect scopes**: Make sure all required scopes are added to consent screen
- **Extension ID mismatch**: The ID must match exactly what's in chrome://extensions/

## Success Indicators

When fixed correctly:
- ✅ No "Invalid OAuth2 Client ID" errors
- ✅ Google sign-in popup appears
- ✅ "Load from Drive" button works
- ✅ Connection status shows green checkmarks
- ✅ Analysis works with Google integration

## Next Steps After Fix

1. Test Google Drive integration
2. Test Google Sheets integration
3. Configure your Google Drive folder
4. Set up your Google Sheets
5. Test the full extension functionality 