/**
 * @file Test Google Authentication and API Access
 * Run this script to test the enhanced Google authentication system
 */

console.log('=== Google Authentication Test ===');

// Test 1: Check if OAuth is configured
console.log('\n1. Checking OAuth configuration...');
const manifest = chrome.runtime.getManifest();
if (manifest.oauth2) {
    console.log('✅ OAuth is configured');
    console.log('   Client ID:', manifest.oauth2.client_id);
    console.log('   Scopes:', manifest.oauth2.scopes);
} else {
    console.log('❌ OAuth is not configured');
}

// Test 2: Test authentication
console.log('\n2. Testing authentication...');
import('./google-auth.js').then(async ({ getAuthToken, fetchGoogleUserProfile, testDriveAccess, testSheetsAccess }) => {
    try {
        console.log('   Requesting auth token...');
        const token = await getAuthToken(true);
        console.log('✅ Authentication successful');
        console.log('   Token received:', token ? 'Yes' : 'No');

        // Test 3: Test user profile
        console.log('\n3. Testing user profile...');
        try {
            const profile = await fetchGoogleUserProfile();
            console.log('✅ User profile fetched successfully');
            console.log('   Name:', profile.name);
            console.log('   Email:', profile.email);
        } catch (error) {
            console.log('❌ User profile failed:', error.message);
        }

        // Test 4: Test Drive access
        console.log('\n4. Testing Drive access...');
        try {
            const driveData = await testDriveAccess();
            console.log('✅ Drive access successful');
            console.log('   Drive data:', driveData);
        } catch (error) {
            console.log('❌ Drive access failed:', error.message);
        }

        // Test 5: Test Sheets access with different endpoint
        console.log('\n5. Testing Sheets access...');
        try {
            // Try a different Sheets API endpoint
            const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets?pageSize=1', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.ok) {
                console.log('✅ Sheets access successful');
                const data = await response.json();
                console.log('   Response status:', response.status);
                console.log('   Response data:', data);
            } else {
                console.log('❌ Sheets access failed');
                console.log('   Status:', response.status);
                console.log('   Status text:', response.statusText);
                
                // Try to get error details
                try {
                    const errorData = await response.text();
                    console.log('   Error details:', errorData);
                } catch (e) {
                    console.log('   Could not read error details');
                }
            }
        } catch (error) {
            console.log('❌ Sheets access failed:', error.message);
        }

        // Test 6: Test alternative Sheets endpoint
        console.log('\n6. Testing alternative Sheets endpoint...');
        try {
            const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.ok) {
                console.log('✅ Alternative Sheets endpoint successful');
            } else {
                console.log('❌ Alternative Sheets endpoint failed');
                console.log('   Status:', response.status);
                console.log('   Status text:', response.statusText);
            }
        } catch (error) {
            console.log('❌ Alternative Sheets endpoint failed:', error.message);
        }

    } catch (error) {
        console.log('❌ Authentication failed:', error.message);
    }
}).catch(error => {
    console.log('❌ Could not import google-auth.js:', error.message);
});

console.log('\n=== Test Complete ===');
console.log('\nIf you see 404 errors, check:');
console.log('1. OAuth consent screen is published');
console.log('2. Your email is added as a test user (if in testing mode)');
console.log('3. The scopes are properly configured');
console.log('4. The APIs are enabled (which they are)'); 