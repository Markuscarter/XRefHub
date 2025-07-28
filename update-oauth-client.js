#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

console.log('=== XRefHub OAuth Client ID Updater ===\n');

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

console.log('📋 Current OAuth Configuration:');
console.log('Client ID:', manifest.oauth2?.client_id || 'Not set');
console.log('Scopes:', manifest.oauth2?.scopes?.length || 0, 'scopes configured');

console.log('\n=== Steps to Fix OAuth Client ID ===');
console.log('1. Get your extension ID from chrome://extensions/');
console.log('2. Go to https://console.cloud.google.com/');
console.log('3. Create OAuth 2.0 Client ID for Chrome Extension');
console.log('4. Use your extension ID when creating the client');
console.log('5. Copy the new client ID');

console.log('\n=== To Update Client ID ===');
console.log('Run this command with your new client ID:');
console.log('node update-oauth-client.js YOUR_NEW_CLIENT_ID_HERE');

// Check if client ID was provided as argument
const newClientId = process.argv[2];
if (newClientId) {
    console.log('\n🔄 Updating client ID...');
    
    if (!manifest.oauth2) {
        console.error('❌ No OAuth2 configuration found in manifest.json');
        process.exit(1);
    }
    
    // Create backup
    const backupPath = path.join(__dirname, 'manifest.json.backup');
    fs.writeFileSync(backupPath, JSON.stringify(manifest, null, 4));
    console.log('✅ Created backup: manifest.json.backup');
    
    // Update client ID
    manifest.oauth2.client_id = newClientId;
    
    // Write updated manifest
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 4));
    console.log('✅ Updated client ID in manifest.json');
    
    console.log('\n=== Next Steps ===');
    console.log('1. Reload the extension in Chrome (chrome://extensions/)');
    console.log('2. Test Google sign-in in settings');
    console.log('3. Test "Load from Drive" functionality');
    
} else {
    console.log('\n=== Current Extension Status ===');
    if (manifest.oauth2?.client_id) {
        console.log('✅ OAuth is configured');
        console.log('❌ Client ID may be invalid (causing "Invalid OAuth2 Client ID" error)');
    } else {
        console.log('❌ OAuth is not configured');
    }
    
    console.log('\n=== To Get Your Extension ID ===');
    console.log('1. Open Chrome and go to: chrome://extensions/');
    console.log('2. Enable "Developer mode" (toggle in top right)');
    console.log('3. Find "Xrefhub" in the list');
    console.log('4. Copy the "ID" field');
    console.log('5. Use that ID to create OAuth client in Google Cloud Console');
} 