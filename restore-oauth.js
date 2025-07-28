#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

console.log('=== XRefHub OAuth Restore ===\n');

// Check for backup
const backupPath = path.join(__dirname, 'manifest.json.backup');
if (!fs.existsSync(backupPath)) {
    console.error('❌ No backup found. Please run fix-oauth-temp.js first to create a backup.');
    process.exit(1);
}

// Read backup
let backupManifest;
try {
    backupManifest = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
    console.log('✅ Backup manifest loaded');
} catch (error) {
    console.error('❌ Error reading backup:', error.message);
    process.exit(1);
}

// Restore OAuth configuration
const manifestPath = path.join(__dirname, 'manifest.json');
let currentManifest;

try {
    currentManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    console.log('✅ Current manifest loaded');
} catch (error) {
    console.error('❌ Error reading current manifest:', error.message);
    process.exit(1);
}

// Restore OAuth
currentManifest.oauth2 = backupManifest.oauth2;

// Write restored manifest
fs.writeFileSync(manifestPath, JSON.stringify(currentManifest, null, 4));
console.log('✅ OAuth configuration restored');

console.log('\n=== Next Steps ===');
console.log('1. Reload the extension in Chrome (chrome://extensions/)');
console.log('2. Fix the OAuth client ID in Google Cloud Console');
console.log('3. Test Google integration');

console.log('\n=== To Fix OAuth Client ID ===');
console.log('1. Get your extension ID from chrome://extensions/');
console.log('2. Go to https://console.cloud.google.com/');
console.log('3. Create proper OAuth 2.0 Client ID for Chrome Extension');
console.log('4. Update the client_id in manifest.json'); 