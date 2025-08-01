/**
 * Get Extension ID and OAuth Client ID Helper
 * Run this in the browser console to get your extension ID
 */

console.log('=== Xrefhub Extension ID Helper ===');

// Method 1: Get extension ID from chrome.runtime
if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
    console.log('✅ Extension ID found:', chrome.runtime.id);
    console.log('📋 Use this ID in Google Cloud Console OAuth setup');
} else {
    console.log('❌ Extension ID not available in this context');
    console.log('📋 Please check chrome://extensions/ for your extension ID');
}

// Method 2: Check if we're in the extension context
if (typeof chrome !== 'undefined' && chrome.runtime) {
    console.log('✅ Running in Chrome extension context');
    
    // Get extension info
    chrome.management.getSelf((extensionInfo) => {
        if (chrome.runtime.lastError) {
            console.log('❌ Error getting extension info:', chrome.runtime.lastError);
        } else {
            console.log('📋 Extension Details:');
            console.log('   Name:', extensionInfo.name);
            console.log('   ID:', extensionInfo.id);
            console.log('   Version:', extensionInfo.version);
            console.log('   Enabled:', extensionInfo.enabled);
            
            console.log('\n🔧 OAuth Setup Instructions:');
            console.log('1. Go to https://console.cloud.google.com/');
            console.log('2. Create or select your project');
            console.log('3. Go to "APIs & Services" → "Credentials"');
            console.log('4. Click "Create Credentials" → "OAuth 2.0 Client IDs"');
            console.log('5. Choose "Chrome Extension" as application type');
            console.log('6. Enter this extension ID:', extensionInfo.id);
            console.log('7. Copy the new client ID and update manifest.json');
        }
    });
} else {
    console.log('❌ Not running in Chrome extension context');
    console.log('📋 Please run this in the extension popup or background page');
}

// Method 3: Manual instructions
console.log('\n📖 Manual Steps:');
console.log('1. Open Chrome and go to chrome://extensions/');
console.log('2. Enable "Developer mode" (top right toggle)');
console.log('3. Find your Xrefhub extension');
console.log('4. Copy the "ID" field (looks like: abcdefghijklmnopqrstuvwxyz123456)');
console.log('5. Use that ID in Google Cloud Console OAuth setup');

console.log('\n🔗 Useful Links:');
console.log('- Google Cloud Console: https://console.cloud.google.com/');
console.log('- Chrome Extensions: chrome://extensions/');
console.log('- OAuth Consent Screen: https://console.cloud.google.com/apis/credentials/consent'); 