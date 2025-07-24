# OAuth Client ID Fix Instructions

## Problem
The error "bad client id: 1035106798421-medf7c3svu83nj4mqbeau3bkumdc5d3k.apps.googleusercontent.com" indicates that the OAuth client ID in your manifest.json is not properly configured.

## Solution Steps

### 1. Get Your Extension ID
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Find your Xrefhub extension
4. Copy the "ID" field (it looks like: `abcdefghijklmnopqrstuvwxyz123456`)

### 2. Create New OAuth Client ID
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create a new one)
3. Navigate to "APIs & Services" → "Credentials"
4. Click "Create Credentials" → "OAuth 2.0 Client IDs"
5. Choose "Chrome Extension" as application type
6. Enter your extension ID from step 1
7. Click "Create"
8. Copy the new client ID

### 3. Update Manifest.json
Replace `YOUR_NEW_CLIENT_ID_HERE` in manifest.json with your actual client ID.

### 4. Enable Required APIs
In Google Cloud Console, enable these APIs:
- Google Drive API
- Google Sheets API
- Google+ API (for user profile)

### 5. Configure OAuth Consent Screen
1. Go to "OAuth consent screen"
2. Set up the consent screen with your app name
3. Add the required scopes:
   - `https://www.googleapis.com/auth/drive.readonly`
   - `https://www.googleapis.com/auth/spreadsheets`
   - `https://www.googleapis.com/auth/userinfo.email`
   - `https://www.googleapis.com/auth/userinfo.profile`

### 6. Test the Fix
1. Reload the extension in Chrome
2. Open settings page
3. Click "Sign In with Google"
4. Should now work without the "bad client id" error

## Alternative Quick Fix
If you need a working solution immediately, you can:
1. Use a different Google account
2. Create a new Google Cloud project
3. Use the new project's OAuth client ID

## Common Issues
- **Wrong extension ID**: Make sure you're using the correct ID from chrome://extensions/
- **APIs not enabled**: Ensure Google Drive and Sheets APIs are enabled
- **Consent screen not configured**: Set up the OAuth consent screen properly
- **Wrong scopes**: Make sure all required scopes are added to the consent screen 