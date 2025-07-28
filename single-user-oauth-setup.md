# Single-User OAuth Setup for XRefHub

## 🎯 **Goal**: Set up OAuth for personal use only

This guide will help you create a working OAuth connection for your personal XRefHub extension.

## 📋 **Step-by-Step Process**

### Step 1: Get Your Extension ID
1. **Open Chrome** and go to: `chrome://extensions/`
2. **Enable "Developer mode"** (toggle in top right corner)
3. **Find "Xrefhub"** in the list of extensions
4. **Copy the "ID" field** (it looks like: `abcdefghijklmnopqrstuvwxyz123456`)

**Important**: Write this ID down - you'll need it for the next steps!

### Step 2: Create Google Cloud Project
1. **Go to**: [Google Cloud Console](https://console.cloud.google.com/)
2. **Click**: "Select a project" → "New Project"
3. **Name it**: "Xrefhub-Personal" (or any name you prefer)
4. **Click**: "Create"

### Step 3: Enable Required APIs
In your new project:
1. **Go to**: "APIs & Services" → "Library"
2. **Search for and enable**:
   - **Google Drive API**
   - **Google Sheets API**
   - **Google+ API** (for user profile)

### Step 4: Set Up OAuth Consent Screen
1. **Go to**: "APIs & Services" → "OAuth consent screen"
2. **Choose**: "External" user type
3. **Fill in**:
   - **App name**: "Xrefhub"
   - **User support email**: Your email address
   - **Developer contact information**: Your email address
4. **Add scopes**:
   ```
   https://www.googleapis.com/auth/drive.readonly
   https://www.googleapis.com/auth/spreadsheets
   https://www.googleapis.com/auth/userinfo.email
   https://www.googleapis.com/auth/userinfo.profile
   ```

### Step 5: Create OAuth Client ID
1. **Go to**: "APIs & Services" → "Credentials"
2. **Click**: "Create Credentials" → "OAuth 2.0 Client IDs"
3. **Choose**: "Chrome Extension" as application type
4. **Enter**: Your extension ID from Step 1
5. **Click**: "Create"
6. **Copy**: The new client ID (it will look like: `123456789-abcdefghijklmnop.apps.googleusercontent.com`)

### Step 6: Update Your Extension
1. **Run this command** (replace with your actual client ID):
   ```bash
   node update-oauth-client.js YOUR_NEW_CLIENT_ID_HERE
   ```

### Step 7: Test the Connection
1. **Reload the extension** in Chrome (`chrome://extensions/`)
2. **Open the settings page** (click the extension icon → settings)
3. **Click**: "Sign In with Google"
4. **Should work** without "Invalid Client ID" errors!

## 🔧 **Quick Commands**

```bash
# Check current status
node update-oauth-client.js

# Update with new client ID (after you get it)
node update-oauth-client.js YOUR_NEW_CLIENT_ID_HERE

# Get help with extension ID
node get-extension-id.js
```

## ✅ **Success Indicators**

When working correctly:
- ✅ No "Invalid OAuth2 Client ID" errors
- ✅ Google sign-in popup appears
- ✅ "Load from Drive" button works
- ✅ Connection status shows green checkmarks
- ✅ Analysis works with Google integration

## 🚨 **Troubleshooting**

### If you get "Invalid Client ID":
1. **Double-check** your extension ID matches exactly
2. **Verify** you're in the correct Google Cloud project
3. **Make sure** all APIs are enabled
4. **Check** that all scopes are added to consent screen

### If extension ID changes:
- Your extension ID might change if you reload the extension
- You'll need to update the OAuth client ID in Google Cloud Console
- Or create a new OAuth client ID with the new extension ID

## 🎉 **Next Steps After Setup**

1. **Test Google Drive integration**
2. **Test Google Sheets integration**
3. **Set up your Google Drive folder**
4. **Configure your Google Sheets**
5. **Test the full extension functionality**

## 📝 **Notes for Single-User Use**

- This setup is perfect for personal use
- Only you will be able to use the Google integration
- If you want to share with others later, you can publish to Chrome Web Store
- Keep your extension ID consistent to avoid reconfiguring OAuth 