/**
 * OAuth Fix for Settings Page
 * Provides better error handling and user guidance for OAuth issues
 */

class SettingsOAuthFix {
    constructor() {
        this.oauthStatus = 'unknown';
        this.errorDetails = null;
    }

    // Enhanced Google sign-in with better error handling
    async handleGoogleSignIn() {
        console.log('[Settings OAuth Fix] Starting enhanced Google sign-in...');
        
        const googleSigninButton = document.getElementById('google-signin-button');
        const googleStatusIcon = document.getElementById('google-status-icon');
        const googleStatusText = document.getElementById('google-status-text');
        
        // Update UI to loading state
        this.updateGoogleStatus('loading', 'Checking OAuth configuration...');
        this.animateButton(googleSigninButton, 'loading');
        
        try {
            // Step 1: Check OAuth configuration
            console.log('[Settings OAuth Fix] Step 1: Checking OAuth configuration...');
            const oauthConfig = this.checkOAuthConfiguration();
            
            if (!oauthConfig.isValid) {
                throw new Error(oauthConfig.error);
            }
            
            // Step 2: Test OAuth client ID
            console.log('[Settings OAuth Fix] Step 2: Testing OAuth client ID...');
            this.updateGoogleStatus('loading', 'Testing OAuth client ID...');
            
            const clientIdTest = await this.testOAuthClientId();
            if (!clientIdTest.isValid) {
                throw new Error(clientIdTest.error);
            }
            
            // Step 3: Attempt authentication
            console.log('[Settings OAuth Fix] Step 3: Attempting authentication...');
            this.updateGoogleStatus('loading', 'Please follow the sign-in prompt...');
            
            const authResult = await this.attemptAuthentication();
            
            // Step 4: Test API access
            console.log('[Settings OAuth Fix] Step 4: Testing API access...');
            this.updateGoogleStatus('loading', 'Testing API access...');
            
            const apiTest = await this.testAPIAccess(authResult.token);
            
            // Step 5: Update UI with success
            this.updateGoogleStatus('connected', `Connected as ${authResult.profile.name}`);
            this.animateButton(googleSigninButton, 'success');
            
            console.log('[Settings OAuth Fix] Google sign-in completed successfully');
            
        } catch (error) {
            console.error('[Settings OAuth Fix] Sign-in failed:', error);
            this.handleSignInError(error);
        }
    }

    // Check OAuth configuration in manifest
    checkOAuthConfiguration() {
        const manifest = chrome.runtime.getManifest();
        
        if (!manifest.oauth2) {
            return {
                isValid: false,
                error: 'OAuth is not configured in manifest.json. Please add OAuth2 configuration.'
            };
        }
        
        if (!manifest.oauth2.client_id) {
            return {
                isValid: false,
                error: 'OAuth client ID is missing in manifest.json.'
            };
        }
        
        if (!manifest.oauth2.scopes || manifest.oauth2.scopes.length === 0) {
            return {
                isValid: false,
                error: 'OAuth scopes are missing in manifest.json.'
            };
        }
        
        return {
            isValid: true,
            config: manifest.oauth2
        };
    }

    // Test OAuth client ID
    async testOAuthClientId() {
        try {
            const manifest = chrome.runtime.getManifest();
            const clientId = manifest.oauth2.client_id;
            
            // Test if client ID format is valid
            if (!clientId || clientId.length < 10) {
                return {
                    isValid: false,
                    error: 'OAuth client ID appears to be invalid (too short).'
                };
            }
            
            // Test if client ID is the default/placeholder
            if (clientId.includes('your-client-id') || clientId.includes('placeholder')) {
                return {
                    isValid: false,
                    error: 'OAuth client ID is still set to placeholder value. Please update with your actual client ID.'
                };
            }
            
            return {
                isValid: true,
                clientId: clientId
            };
            
        } catch (error) {
            return {
                isValid: false,
                error: `Error testing OAuth client ID: ${error.message}`
            };
        }
    }

    // Attempt authentication
    async attemptAuthentication() {
        return new Promise((resolve, reject) => {
            chrome.identity.getAuthToken({ interactive: true }, async (token) => {
                if (chrome.runtime.lastError) {
                    const error = chrome.runtime.lastError;
                    console.error('[Settings OAuth Fix] Chrome identity error:', error);
                    
                    // Handle specific error cases
                    if (error.message.includes('bad client id')) {
                        reject(new Error('OAuth client ID is invalid. Please check Google Cloud Console configuration.'));
                    } else if (error.message.includes('access denied')) {
                        reject(new Error('Access denied. Please check OAuth consent screen and scopes.'));
                    } else if (error.message.includes('network error')) {
                        reject(new Error('Network error. Please check your internet connection.'));
                    } else {
                        reject(new Error(`Authentication failed: ${error.message}`));
                    }
                } else if (!token) {
                    reject(new Error('No token received from Chrome identity API.'));
                } else {
                    try {
                        // Fetch user profile
                        const profile = await this.fetchUserProfile(token);
                        resolve({ token, profile });
                    } catch (profileError) {
                        reject(new Error(`Failed to fetch user profile: ${profileError.message}`));
                    }
                }
            });
        });
    }

    // Fetch user profile
    async fetchUserProfile(token) {
        const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
            throw new Error(`Failed to fetch user profile: ${response.status} ${response.statusText}`);
        }
        
        return await response.json();
    }

    // Test API access
    async testAPIAccess(token) {
        const tests = [
            { name: 'User Info API', url: 'https://www.googleapis.com/oauth2/v2/userinfo' },
            { name: 'Drive API', url: 'https://www.googleapis.com/drive/v3/files?pageSize=1' },
            { name: 'Sheets API', url: 'https://sheets.googleapis.com/v4/spreadsheets' }
        ];
        
        const results = [];
        
        for (const test of tests) {
            try {
                const response = await fetch(test.url, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                results.push({
                    name: test.name,
                    success: response.ok,
                    status: response.status,
                    message: response.ok ? 'Access granted' : `Access denied (${response.status})`
                });
                
            } catch (error) {
                results.push({
                    name: test.name,
                    success: false,
                    status: 'error',
                    message: error.message
                });
            }
        }
        
        console.log('[Settings OAuth Fix] API access test results:', results);
        
        return {
            success: results.some(r => r.success),
            results: results
        };
    }

    // Handle sign-in errors with specific guidance
    handleSignInError(error) {
        const googleSigninButton = document.getElementById('google-signin-button');
        const googleStatusIcon = document.getElementById('google-status-icon');
        const googleStatusText = document.getElementById('google-status-text');
        
        let errorMessage = '';
        let guidance = '';
        
        if (error.message.includes('bad client id')) {
            errorMessage = 'OAuth client ID is invalid';
            guidance = `
                <div class="oauth-guidance">
                    <h4>How to fix OAuth client ID:</h4>
                    <ol>
                        <li>Get your extension ID: <code>${chrome.runtime.id}</code></li>
                        <li>Go to <a href="https://console.cloud.google.com" target="_blank">Google Cloud Console</a></li>
                        <li>Create a new OAuth 2.0 client ID</li>
                        <li>Add your extension ID to authorized origins</li>
                        <li>Update manifest.json with the new client ID</li>
                    </ol>
                </div>
            `;
        } else if (error.message.includes('access denied')) {
            errorMessage = 'Access denied';
            guidance = 'Please check OAuth consent screen and scopes in Google Cloud Console.';
        } else if (error.message.includes('network error')) {
            errorMessage = 'Network error';
            guidance = 'Please check your internet connection and try again.';
        } else if (error.message.includes('OAuth is not configured')) {
            errorMessage = 'OAuth not configured';
            guidance = 'Please add OAuth2 configuration to manifest.json.';
        } else {
            errorMessage = `Sign-in failed: ${error.message}`;
            guidance = 'Please check your OAuth configuration and try again.';
        }
        
        this.updateGoogleStatus('error', errorMessage);
        this.animateButton(googleSigninButton, 'error');
        
        // Show guidance if available
        if (guidance) {
            this.showOAuthGuidance(guidance);
        }
    }

    // Show OAuth guidance
    showOAuthGuidance(guidance) {
        let guidanceContainer = document.getElementById('oauth-guidance-container');
        
        if (!guidanceContainer) {
            guidanceContainer = document.createElement('div');
            guidanceContainer.id = 'oauth-guidance-container';
            guidanceContainer.className = 'oauth-guidance-container';
            
            const settingsSection = document.querySelector('.settings-section');
            if (settingsSection) {
                settingsSection.appendChild(guidanceContainer);
            }
        }
        
        guidanceContainer.innerHTML = guidance;
        guidanceContainer.style.display = 'block';
    }

    // Update Google status
    updateGoogleStatus(status, message) {
        const googleStatusIcon = document.getElementById('google-status-icon');
        const googleStatusText = document.getElementById('google-status-text');
        
        if (googleStatusIcon && googleStatusText) {
            switch (status) {
                case 'connected':
                    googleStatusIcon.textContent = '✅';
                    break;
                case 'loading':
                    googleStatusIcon.textContent = '⏳';
                    break;
                case 'error':
                    googleStatusIcon.textContent = '❌';
                    break;
                default:
                    googleStatusIcon.textContent = '⚪️';
            }
            
            googleStatusText.textContent = message;
        }
    }

    // Animate button
    animateButton(button, state, duration = 2000) {
        if (!button) return;
        
        button.classList.remove('loading', 'success', 'error');
        
        if (state === 'loading') {
            button.classList.add('loading');
        } else if (state === 'success') {
            button.classList.add('success');
            setTimeout(() => button.classList.remove('success'), duration);
        } else if (state === 'error') {
            button.classList.add('error');
            setTimeout(() => button.classList.remove('error'), duration);
        }
    }

    // Get extension ID for user
    getExtensionId() {
        return chrome.runtime.id;
    }

    // Show extension ID in settings
    showExtensionId() {
        const extensionIdElement = document.getElementById('extension-id');
        if (extensionIdElement) {
            extensionIdElement.textContent = chrome.runtime.id;
        }
    }
}

// Export for use in settings.js
window.SettingsOAuthFix = SettingsOAuthFix; 