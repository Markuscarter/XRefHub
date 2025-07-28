#!/usr/bin/env node

/**
 * Google Drive Setup Test Script
 * Helps users verify their Google Drive integration is working correctly
 */

const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
    log(`\n${colors.bright}${colors.cyan}=== ${title} ===${colors.reset}`);
}

function logSuccess(message) {
    log(`✅ ${message}`, 'green');
}

function logError(message) {
    log(`❌ ${message}`, 'red');
}

function logWarning(message) {
    log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
    log(`ℹ️  ${message}`, 'blue');
}

async function testGoogleDriveSetup() {
    log(`${colors.bright}${colors.blue}🔍 Google Drive Setup Test${colors.reset}\n`);
    
    logSection('Configuration Check');
    
    // Check if manifest.json exists
    if (!fs.existsSync('manifest.json')) {
        logError('manifest.json not found in current directory');
        return false;
    }
    logSuccess('manifest.json found');
    
    // Check OAuth2 configuration
    try {
        const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
        
        if (!manifest.oauth2 || !manifest.oauth2.client_id) {
            logError('OAuth2 client_id not configured in manifest.json');
            logInfo('Please add your OAuth2 client_id to manifest.json');
            return false;
        }
        
        if (manifest.oauth2.client_id.includes('YOUR_CLIENT_ID') || manifest.oauth2.client_id.length < 50) {
            logWarning('OAuth2 client_id appears to be a placeholder');
            logInfo('Please replace with your actual Google Cloud OAuth2 client ID');
            return false;
        }
        
        logSuccess('OAuth2 client_id configured');
        
        // Check required scopes
        const requiredScopes = [
            'https://www.googleapis.com/auth/drive.readonly',
            'https://www.googleapis.com/auth/spreadsheets'
        ];
        
        const missingScopes = requiredScopes.filter(scope => 
            !manifest.oauth2.scopes.includes(scope)
        );
        
        if (missingScopes.length > 0) {
            logError(`Missing required scopes: ${missingScopes.join(', ')}`);
            return false;
        }
        
        logSuccess('All required OAuth2 scopes configured');
        
    } catch (error) {
        logError(`Error reading manifest.json: ${error.message}`);
        return false;
    }
    
    logSection('Google Cloud Console Setup');
    
    logInfo('To complete Google Drive setup, please ensure:');
    logInfo('1. You have a Google Cloud Console project');
    logInfo('2. Google Drive API is enabled');
    logInfo('3. Google Sheets API is enabled');
    logInfo('4. OAuth2 credentials are created');
    logInfo('5. OAuth consent screen is configured');
    
    logSection('Extension Setup Instructions');
    
    logInfo('1. Load the extension in Chrome (chrome://extensions/)');
    logInfo('2. Open the extension popup');
    logInfo('3. Click the settings icon (⚙️)');
    logInfo('4. Sign in with your Google account');
    logInfo('5. Configure your Google Drive folder ID');
    logInfo('6. Test the connection');
    
    logSection('Troubleshooting Common Issues');
    
    logWarning('404 Error (Folder Not Found):');
    logInfo('- Check that the Google Drive folder ID is correct');
    logInfo('- Ensure the folder exists and is not deleted');
    logInfo('- Verify you have access to the folder');
    
    logWarning('403 Error (Access Denied):');
    logInfo('- Check folder permissions');
    logInfo('- Ensure you are signed in with the correct Google account');
    logInfo('- Verify the folder is shared with your account if needed');
    
    logWarning('401 Error (Unauthorized):');
    logInfo('- Check OAuth2 client_id configuration');
    logInfo('- Ensure OAuth consent screen is properly configured');
    logInfo('- Try signing out and signing back in');
    
    logSection('Testing Steps');
    
    logInfo('1. Create a folder in Google Drive named "Xrefhub"');
    logInfo('2. Add some Google Doc files with your content rules');
    logInfo('3. Copy the folder ID from the URL');
    logInfo('4. Paste the folder ID in the extension settings');
    logInfo('5. Test the "Test Scan" button in the popup');
    
    logSection('Folder ID Instructions');
    
    logInfo('To get your Google Drive folder ID:');
    logInfo('1. Open the folder in Google Drive');
    logInfo('2. Copy the URL from your browser');
    logInfo('3. The folder ID is the long string after /folders/');
    logInfo('4. Example: https://drive.google.com/drive/folders/1ABC123DEF456...');
    logInfo('5. The ID is: 1ABC123DEF456...');
    
    log(`\n${colors.bright}${colors.green}🎯 Setup test completed!${colors.reset}`);
    logInfo('Follow the instructions above to complete your Google Drive setup.');
    
    return true;
}

// Run the test
if (require.main === module) {
    testGoogleDriveSetup().catch(error => {
        logError(`Test failed: ${error.message}`);
        process.exit(1);
    });
}

module.exports = { testGoogleDriveSetup }; 