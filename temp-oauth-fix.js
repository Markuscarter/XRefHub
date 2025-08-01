/**
 * Temporary OAuth Fix for Xrefhub Extension
 * Run this to temporarily disable OAuth and test other functionality
 */

console.log('=== Temporary OAuth Fix ===');

// Function to temporarily disable OAuth
function disableOAuth() {
    console.log('🔧 Temporarily disabling OAuth...');
    
    // Store original OAuth settings
    chrome.storage.local.set({
        'temp_oauth_disabled': true,
        'original_oauth_client_id': '1035106798421-h5k288bsu649ei9nisq7bjvv60m6d907.apps.googleusercontent.com'
    }, () => {
        console.log('✅ OAuth temporarily disabled');
        console.log('📋 You can now test other extension features');
        console.log('📋 To re-enable OAuth, run: enableOAuth()');
    });
}

// Function to re-enable OAuth
function enableOAuth() {
    console.log('🔧 Re-enabling OAuth...');
    
    chrome.storage.local.remove(['temp_oauth_disabled'], () => {
        console.log('✅ OAuth re-enabled');
        console.log('📋 You will need to fix the client ID issue');
    });
}

// Function to get extension ID
function getExtensionId() {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
        console.log('✅ Extension ID:', chrome.runtime.id);
        return chrome.runtime.id;
    } else {
        console.log('❌ Extension ID not available');
        return null;
    }
}

// Function to check current OAuth status
function checkOAuthStatus() {
    chrome.storage.local.get(['temp_oauth_disabled'], (result) => {
        if (result.temp_oauth_disabled) {
            console.log('📋 OAuth is currently DISABLED');
            console.log('📋 Run enableOAuth() to re-enable');
        } else {
            console.log('📋 OAuth is currently ENABLED');
            console.log('📋 Run disableOAuth() to temporarily disable');
        }
    });
}

// Function to update OAuth client ID
function updateOAuthClientId(newClientId) {
    console.log('🔧 Updating OAuth client ID...');
    
    // This would require updating manifest.json
    console.log('📋 To update client ID:');
    console.log('1. Open manifest.json');
    console.log('2. Find the oauth2 section');
    console.log('3. Replace the client_id with:', newClientId);
    console.log('4. Reload the extension');
}

// Display available functions
console.log('\n📋 Available Functions:');
console.log('- disableOAuth() - Temporarily disable OAuth');
console.log('- enableOAuth() - Re-enable OAuth');
console.log('- getExtensionId() - Get your extension ID');
console.log('- checkOAuthStatus() - Check current OAuth status');
console.log('- updateOAuthClientId("NEW_CLIENT_ID") - Update client ID');

// Check current status
checkOAuthStatus();
getExtensionId();

console.log('\n🔗 Quick Fix Steps:');
console.log('1. Run: disableOAuth()');
console.log('2. Test extension functionality');
console.log('3. Get your extension ID: getExtensionId()');
console.log('4. Create new OAuth client in Google Cloud Console');
console.log('5. Update manifest.json with new client ID');
console.log('6. Run: enableOAuth()'); 