# Temporary OAuth Fix for Testing

## Quick Solution to Test Extension Functionality

Since you're getting the "bad client id" error, here's a temporary solution to test the extension while you fix the OAuth configuration:

### Option 1: Use a Different OAuth Client ID (Recommended)

1. **Create a new Google Cloud project:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Click "Select a project" → "New Project"
   - Name it something like "Xrefhub-Test"
   - Click "Create"

2. **Enable required APIs:**
   - Go to "APIs & Services" → "Library"
   - Search for and enable:
     - Google Drive API
     - Google Sheets API
     - Google+ API

3. **Create OAuth consent screen:**
   - Go to "APIs & Services" → "OAuth consent screen"
   - Choose "External" user type
   - Fill in app name: "Xrefhub"
   - Add your email as developer contact
   - Add scopes:
     - `https://www.googleapis.com/auth/drive.readonly`
     - `https://www.googleapis.com/auth/spreadsheets`
     - `https://www.googleapis.com/auth/userinfo.email`
     - `https://www.googleapis.com/auth/userinfo.profile`

4. **Create OAuth client ID:**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth 2.0 Client IDs"
   - Choose "Chrome Extension"
   - Enter your extension ID (from chrome://extensions/)
   - Click "Create"
   - Copy the new client ID

5. **Update manifest.json:**
   - Replace the client ID in manifest.json with your new one

### Option 2: Use a Working Test Client ID

If you want to test immediately, you can temporarily use this test client ID:

```json
"oauth2": {
    "client_id": "YOUR_EXTENSION_ID.apps.googleusercontent.com",
    "scopes": [
        "https://www.googleapis.com/auth/drive.readonly",
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/userinfo.profile",
        "openid"
    ]
}
```

**Note:** Replace `YOUR_EXTENSION_ID` with your actual extension ID from chrome://extensions/

### Option 3: Disable OAuth Temporarily

If you just want to test the settings page functionality without Google integration:

1. Comment out the OAuth section in manifest.json
2. Test the save/load functionality
3. Re-enable OAuth when ready

### Testing Steps

1. **Get your extension ID:**
   - Open `chrome://extensions/`
   - Enable Developer mode
   - Copy the ID under Xrefhub

2. **Update manifest.json** with your new client ID

3. **Reload the extension** in Chrome

4. **Test the settings page:**
   - Open settings
   - Try "Sign In with Google"
   - Test "Load from Drive"
   - Test "Save Settings"

### Common Issues and Solutions

- **"Invalid client"**: Make sure you're using the correct extension ID
- **"Access denied"**: Check that all required APIs are enabled
- **"Consent screen not configured"**: Set up the OAuth consent screen properly
- **"Scopes not allowed"**: Add all required scopes to the consent screen

### Next Steps

Once you have a working OAuth configuration:
1. Test all Google integration features
2. Set up your Google Drive folder and Sheets
3. Configure your AI provider settings
4. Test the full extension functionality 