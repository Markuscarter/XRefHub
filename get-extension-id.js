#!/usr/bin/env node

console.log('=== XRefHub Extension ID Helper ===\n');

console.log('To get your extension ID:');
console.log('1. Open Chrome and go to: chrome://extensions/');
console.log('2. Enable "Developer mode" (toggle in top right)');
console.log('3. Find "Xrefhub" in the list');
console.log('4. Copy the "ID" field (looks like: abcdefghijklmnopqrstuvwxyz123456)\n');

console.log('=== Current OAuth Issues ===');
console.log('❌ Bad client ID error');
console.log('❌ Password connection not present');
console.log('❌ OAuth flow blocked by Chrome\n');

console.log('=== Quick Fix Steps ===');
console.log('1. Get your extension ID (see above)');
console.log('2. Go to: https://console.cloud.google.com/');
console.log('3. Create a new project or select existing one');
console.log('4. Enable APIs: Google Drive API, Google Sheets API');
console.log('5. Set up OAuth consent screen (External user type)');
console.log('6. Create OAuth 2.0 Client ID (Chrome Extension type)');
console.log('7. Use your extension ID when creating the client');
console.log('8. Update manifest.json with the new client ID\n');

console.log('=== Alternative: Test Without OAuth ===');
console.log('If you want to test the extension without Google integration:');
console.log('1. Comment out the oauth2 section in manifest.json');
console.log('2. Test the settings page functionality');
console.log('3. Re-enable OAuth when ready\n');

console.log('Would you like me to help you with any of these steps?'); 