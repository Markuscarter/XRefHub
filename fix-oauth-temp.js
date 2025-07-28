#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

console.log('=== XRefHub OAuth Temporary Fix ===\n');

// Read current manifest
const manifestPath = path.join(__dirname, 'manifest.json');
let manifest;

try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    console.log('✅ Current manifest.json loaded');
} catch (error) {
    console.error('❌ Error reading manifest.json:', error.message);
    process.exit(1);
}

// Check if OAuth is already disabled
if (!manifest.oauth2) {
    console.log('ℹ️  OAuth is already disabled in manifest.json');
    console.log('You can test the extension without Google integration now.');
    process.exit(0);
}

// Create backup
const backupPath = path.join(__dirname, 'manifest.json.backup');
fs.writeFileSync(backupPath, JSON.stringify(manifest, null, 4));
console.log('✅ Created backup: manifest.json.backup');

// Disable OAuth temporarily
const originalOAuth = manifest.oauth2;
delete manifest.oauth2;

// Write updated manifest
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 4));
console.log('✅ Temporarily disabled OAuth in manifest.json');

console.log('\n=== Next Steps ===');
console.log('1. Reload the extension in Chrome (chrome://extensions/)');
console.log('2. Test the settings page functionality');
console.log('3. Test the popup and other features');
console.log('4. When ready to fix OAuth, run: node restore-oauth.js');

console.log('\n=== To Restore OAuth Later ===');
console.log('Run: node restore-oauth.js'); 