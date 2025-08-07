import { fetchConfiguration } from './google-drive.js';
import { getAuthToken, fetchGoogleUserProfile, isAuthenticated, signOut, testDriveAccess, testSheetsAccess } from './google-auth.js';

// Add error handling for module loading
window.addEventListener('error', (event) => {
    console.error('[Xrefhub Settings] Module error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('[Xrefhub Settings] Unhandled promise rejection:', event.reason);
});

document.addEventListener('DOMContentLoaded', () => {
    console.log('[Xrefhub Settings] DOM loaded, initializing...');
    
    // --- DOM Elements ---
    const providerCards = document.querySelectorAll('.provider-card');
    const saveButton = document.getElementById('save-button');
    const loadFromDriveButton = document.getElementById('load-from-drive-button');
    const saveStatus = document.getElementById('save-status');
    const usernameInput = document.getElementById('username');
const geminiApiKeyInput = document.getElementById('gemini-api-key');
const chatgptApiKeyInput = document.getElementById('chatgpt-api-key');
    const grockSigninButton = document.getElementById('grock-signin-button');
    const googleSheetIdInput = document.getElementById('google-sheet-id');
    const googleFolderIdInput = document.getElementById('google-folder-id');
    const googleStatusIcon = document.getElementById('google-status-icon');
    const googleStatusText = document.getElementById('google-status-text');
    const googleSigninButton = document.getElementById('google-signin-button');

    // Connection status elements
    const driveStatus = document.getElementById('drive-status');
    const sheetsStatus = document.getElementById('sheets-status');
    const geminiStatus = document.getElementById('gemini-status');
    const openaiStatus = document.getElementById('openai-status');
    const grockStatus = document.getElementById('grock-status');

    // --- State ---
    let selectedProvider = 'gemini';

    // --- Utility Functions ---
    
    const generateChecksum = (input) => {
        if (!input) return '';
        const hash = input.split('').reduce((a, b) => {
            a = ((a << 5) - a) + b.charCodeAt(0);
            return a & a;
        }, 0);
        return Math.abs(hash).toString(36).substring(0, 6).toUpperCase();
    };

    const animateButton = (button, state, duration = 2000) => {
        button.classList.remove('loading', 'success');
        if (state === 'loading') {
            button.classList.add('loading');
        } else if (state === 'success') {
            button.classList.add('success');
            setTimeout(() => button.classList.remove('success'), duration);
        }
    };

    const updateConnectionStatus = (element, status, text, checksum = '') => {
        const icon = element.querySelector('.status-icon');
        const statusText = element.querySelector('.status-text');
        const checksumEl = element.querySelector('.checksum');
        
        element.classList.remove('connected', 'error');
        
        switch (status) {
            case 'connected':
                icon.textContent = '✅';
                element.classList.add('connected');
                break;
            case 'error':
                icon.textContent = '❌';
                element.classList.add('error');
                break;
            default:
                icon.textContent = '⚪️';
        }
        
        if (text) statusText.textContent = text;
        checksumEl.textContent = checksum;
    };

    const checkAllConnections = async () => {
        console.log('[Xrefhub Settings] Checking all connections...');
        const settings = await chrome.storage.local.get('settings');
        const { googleSheetId, googleFolderId, chatgptApiKey, geminiApiKey } = settings.settings || {};
        
        // Check Gemini API (no auth required)
        if (geminiApiKey) {
            updateConnectionStatus(geminiStatus, 'connected', 'Gemini API', generateChecksum(geminiApiKey));
        } else {
            updateConnectionStatus(geminiStatus, 'error', 'Gemini API not configured');
        }
        
        // Check OpenAI API (no auth required)
        if (chatgptApiKey) {
            updateConnectionStatus(openaiStatus, 'connected', 'OpenAI API', generateChecksum(chatgptApiKey));
        } else {
            updateConnectionStatus(openaiStatus, 'error', 'OpenAI API not configured');
        }
        
        // Check Grock (X sign-in required)
        const grockToken = await getGrockToken();
        if (grockToken) {
            updateConnectionStatus(grockStatus, 'connected', 'Grock (X Sign-in)', generateChecksum(grockToken));
        } else {
            updateConnectionStatus(grockStatus, 'error', 'Grock not signed in');
        }
        
        // Check Google services only if OAuth is enabled
        if (!chrome.runtime.getManifest().oauth2) {
            updateConnectionStatus(driveStatus, 'error', 'OAuth disabled - using Gemini API instead');
            updateConnectionStatus(sheetsStatus, 'error', 'OAuth disabled - using Gemini API instead');
            return;
        }
        
        // Check Google Drive
        try {
            const token = await getAuthToken(false); // Non-interactive
            if (!token) {
                updateConnectionStatus(driveStatus, 'error', 'Drive: Not authenticated');
            } else {
                // Test Drive API access without requiring a folder ID
                console.log('[Xrefhub Settings] Testing Drive API access...');
                const testResponse = await fetch('https://www.googleapis.com/drive/v3/about?fields=user', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (testResponse.ok) {
                    console.log('[Xrefhub Settings] Drive API access confirmed');
                    if (googleFolderId) {
                        // Extract folder ID from URL if it's a full URL
                        let folderId = googleFolderId;
                        if (googleFolderId.includes('drive.google.com')) {
                            const match = googleFolderId.match(/\/folders\/([a-zA-Z0-9-_]+)/);
                            if (match) {
                                folderId = match[1];
                                console.log('[Xrefhub Settings] Extracted folder ID from URL:', folderId);
                            }
                        }
                        
                        // Now test the specific folder
                        console.log('[Xrefhub Settings] Testing Drive API with folder ID:', folderId);
                        const response = await fetch(`https://www.googleapis.com/drive/v3/files/${folderId}`, {
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        
                        console.log('[Xrefhub Settings] Drive API response status:', response.status);
                        
                        if (response.ok) {
                            updateConnectionStatus(driveStatus, 'connected', 'Google Drive', generateChecksum(folderId));
                        } else {
                            const errorText = await response.text();
                            console.error('[Xrefhub Settings] Drive API error response:', errorText);
                            updateConnectionStatus(driveStatus, 'error', `Drive: ${response.status} - ${response.statusText}`);
                        }
                    } else {
                        updateConnectionStatus(driveStatus, 'connected', 'Google Drive (no folder ID)');
                    }
                } else {
                    const errorText = await testResponse.text();
                    console.error('[Xrefhub Settings] Drive API access test failed:', errorText);
                    updateConnectionStatus(driveStatus, 'error', `Drive: ${testResponse.status} - ${testResponse.statusText}`);
                }
            }
        } catch (error) {
            console.error('[Xrefhub Settings] Drive connection error:', error);
            updateConnectionStatus(driveStatus, 'error', `Drive: ${error.message}`);
        }
        
        // Check Google Sheets
        if (googleSheetId) {
            try {
                const token = await getAuthToken(false); // Non-interactive
                if (!token) {
                    updateConnectionStatus(sheetsStatus, 'error', 'Sheets: Not authenticated');
                    return;
                }
                
                const sheetId = googleSheetId.includes('/') ? 
                    googleSheetId.match(/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)?.[1] : googleSheetId;
                const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    updateConnectionStatus(sheetsStatus, 'connected', 'Google Sheets', generateChecksum(sheetId));
                } else {
                    updateConnectionStatus(sheetsStatus, 'error', `Sheets: ${response.status} - ${response.statusText}`);
                }
            } catch (error) {
                console.error('[Xrefhub Settings] Sheets connection error:', error);
                updateConnectionStatus(sheetsStatus, 'error', `Sheets: ${error.message}`);
            }
        } else {
            // If no sheet ID is configured, test if the API is accessible
            try {
                const token = await getAuthToken(false);
                if (token) {
                    // Test basic API access
                    const response = await fetch('https://sheets.googleapis.com/$discovery/rest?version=v4', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    
                    if (response.ok) {
                        updateConnectionStatus(sheetsStatus, 'connected', 'Google Sheets API (no sheet configured)');
                    } else {
                        updateConnectionStatus(sheetsStatus, 'error', 'Sheets: API not accessible');
                    }
                } else {
                    updateConnectionStatus(sheetsStatus, 'error', 'Sheets: Not authenticated');
                }
            } catch (error) {
                updateConnectionStatus(sheetsStatus, 'error', 'Sheets: API not accessible');
            }
        }
    };

    const updateGoogleStatus = (status, message) => {
        googleSigninButton.style.display = 'none';
        saveButton.disabled = false; // Always enable save button
        loadFromDriveButton.disabled = !chrome.runtime.getManifest().oauth2; // Disable only if OAuth disabled

        switch (status) {
            case 'connected':
                googleStatusIcon.textContent = '✅';
                googleStatusText.textContent = message || 'Connected to Google';
                loadFromDriveButton.disabled = false;
                checkAllConnections(); // Check other services when Google is connected
                break;
            case 'disconnected':
                googleStatusIcon.textContent = '⚪️';
                googleStatusText.textContent = message || 'Not connected to Google';
                googleSigninButton.style.display = 'block';
                break;
            case 'loading':
                googleStatusIcon.textContent = '⏳';
                googleStatusText.textContent = message || 'Connecting...';
                break;
            case 'error':
                googleStatusIcon.textContent = '❌';
                googleStatusText.textContent = message || 'Connection Failed';
                if (message && message.includes('OAuth')) {
                    googleSigninButton.style.display = 'none'; // Don't show sign-in if OAuth disabled
                } else {
                    googleSigninButton.style.display = 'block';
                }
                break;
        }
    };

    const checkGoogleConnection = async () => {
        updateGoogleStatus('loading', 'Checking connection...');
        
        // Check if OAuth is configured
        if (!chrome.runtime.getManifest().oauth2) {
            updateGoogleStatus('error', 'OAuth is disabled. Google integration unavailable.');
            console.log('[Xrefhub Settings] OAuth is not configured in manifest.json');
            return;
        }
        
        try {
            const token = await chrome.identity.getAuthToken({ interactive: false });
            if (!token) throw new Error("Not signed in.");
            
            const profile = await fetchGoogleUserProfile();
            updateGoogleStatus('connected', `Connected as ${profile.name}`);
        } catch (error) {
            console.warn('Silent sign-in failed:', error.message);
            
            // Provide specific guidance for OAuth client ID errors
            if (error.message.includes('bad client id')) {
                updateGoogleStatus('error', 'OAuth configuration issue. Please check the instructions.');
                console.error('OAuth Client ID Error: The client ID in manifest.json needs to be updated. See oauth-fix-instructions.md for details.');
            } else if (error.message.includes('OAuth is not configured')) {
                updateGoogleStatus('error', 'OAuth is disabled. Google integration unavailable.');
            } else {
                updateGoogleStatus('disconnected');
            }
        }
        
        // Fallback: ensure Google sign-in button is always visible
        setTimeout(() => {
            if (googleSigninButton.style.display === 'none') {
                console.log('[Xrefhub Settings] Making Google sign-in button visible');
                googleSigninButton.style.display = 'block';
            }
        }, 2000);
    };

    const handleGoogleSignIn = async () => {
        console.log('[Xrefhub Settings] Starting Google sign-in...');
        
        // Check if OAuth is configured
        if (!chrome.runtime.getManifest().oauth2) {
            updateGoogleStatus('error', 'OAuth is disabled. Please enable OAuth in manifest.json first.');
            console.log('[Xrefhub Settings] Cannot sign in - OAuth is not configured');
            return;
        }
        
        animateButton(googleSigninButton, 'loading');
        updateGoogleStatus('loading', 'Please follow the sign-in prompt...');
        try {
            console.log('[Xrefhub Settings] Requesting auth token...');
            const token = await getAuthToken();
            console.log('[Xrefhub Settings] Auth token received, fetching profile...');
            const profile = await fetchGoogleUserProfile();
            console.log('[Xrefhub Settings] Profile received:', profile);
            updateGoogleStatus('connected', `Connected as ${profile.name}`);
            animateButton(googleSigninButton, 'success');
        } catch (error) {
            console.error('Explicit sign-in failed:', error);
            
            // Provide specific guidance for OAuth client ID errors
            if (error.message.includes('bad client id')) {
                updateGoogleStatus('error', 'OAuth configuration issue. Please check the instructions.');
                console.error('OAuth Client ID Error: The client ID in manifest.json needs to be updated. See oauth-fix-instructions.md for details.');
            } else if (error.message.includes('OAuth is not configured')) {
                updateGoogleStatus('error', 'OAuth is disabled. Please enable OAuth in manifest.json first.');
            } else {
                updateGoogleStatus('error', 'Sign-in failed. Please try again.');
            }
        }
    };

    // Fallback sign-in method
    const handleGoogleSignInFallback = async () => {
        console.log('[Xrefhub Settings] Using fallback sign-in method...');
        
        animateButton(googleSigninButton, 'loading');
        updateGoogleStatus('loading', 'Please follow the sign-in prompt...');
        
        try {
            const token = await getAuthToken(true);
            const profile = await fetchGoogleUserProfile();
            
            updateGoogleStatus('connected', `Connected as ${profile.name}`);
            animateButton(googleSigninButton, 'success');
            
        } catch (error) {
            console.error('[Xrefhub Settings] Fallback sign-in failed:', error);
            
            if (error.message.includes('bad client id')) {
                updateGoogleStatus('error', 'OAuth client ID is invalid. Please check Google Cloud Console configuration.');
            } else {
                updateGoogleStatus('error', `Sign-in failed: ${error.message}`);
            }
            
            animateButton(googleSigninButton, 'error');
        }
    };

    // Add sign-out functionality
        const handleGoogleSignOut = async () => {
        console.log('[Xrefhub Settings] Starting Google sign-out...');

        try {
            await signOut();
            updateGoogleStatus('disconnected', 'Signed out successfully');
            console.log('[Xrefhub Settings] Google sign-out completed');

            // Refresh connection status
            await checkAllConnections();
        } catch (error) {
            console.error('[Xrefhub Settings] Sign-out failed:', error);
            updateGoogleStatus('error', 'Sign-out failed. Please try again.');
        }
    };

    // Grock sign-in functionality
    const handleGrockSignIn = async () => {
        console.log('[Xrefhub Settings] Starting Grock sign-in...');
        
        try {
            // Open X.com in a new tab for sign-in
            const tab = await chrome.tabs.create({
                url: 'https://x.com/login',
                active: true
            });
            
            // Show instructions to user
            updateGrockStatus('loading', 'Please sign in to X.com in the new tab, then return here');
            
            // Listen for tab updates to detect when user returns
            chrome.tabs.onUpdated.addListener(async function listener(tabId, changeInfo, tab) {
                if (tabId === tab.id && changeInfo.status === 'complete') {
                    if (tab.url && tab.url.includes('x.com') && !tab.url.includes('login')) {
                        // User has signed in, try to get token
                        chrome.tabs.onUpdated.removeListener(listener);
                        await getGrockTokenFromPage(tab.id);
                    }
                }
            });
            
        } catch (error) {
            console.error('[Xrefhub Settings] Grock sign-in failed:', error);
            updateGrockStatus('error', 'Sign-in failed. Please try again.');
        }
    };

    const getGrockTokenFromPage = async (tabId) => {
        try {
            // Inject script to get X session token
            const results = await chrome.scripting.executeScript({
                target: { tabId },
                function: () => {
                    // Try to get X session token from cookies or localStorage
                    const token = localStorage.getItem('x-session-token') || 
                                 document.cookie.match(/x-session-token=([^;]+)/)?.[1];
                    return token || null;
                }
            });
            
            if (results && results[0] && results[0].result) {
                const token = results[0].result;
                await chrome.storage.local.set({ 'grockToken': token });
                updateGrockStatus('connected', 'Grock sign-in successful');
                await checkAllConnections();
            } else {
                updateGrockStatus('error', 'Could not get X session token');
            }
        } catch (error) {
            console.error('[Xrefhub Settings] Failed to get Grock token:', error);
            updateGrockStatus('error', 'Failed to get session token');
        }
    };

    const getGrockToken = async () => {
        const result = await chrome.storage.local.get(['grockToken']);
        return result.grockToken || null;
    };

    const updateGrockStatus = (status, message) => {
        const grockStatusIcon = grockStatus.querySelector('.status-icon');
        const grockStatusText = grockStatus.querySelector('.status-text');
        
        switch (status) {
            case 'connected':
                grockStatusIcon.textContent = '✅';
                grockStatusText.textContent = message || 'Grock Connected';
                break;
            case 'loading':
                grockStatusIcon.textContent = '⏳';
                grockStatusText.textContent = message || 'Connecting...';
                break;
            case 'error':
                grockStatusIcon.textContent = '❌';
                grockStatusText.textContent = message || 'Connection Failed';
                break;
            default:
                grockStatusIcon.textContent = '⚪️';
                grockStatusText.textContent = message || 'Not Connected';
        }
    };

    const loadSettings = () => {
        chrome.storage.local.get(['settings'], (result) => {
            if (result.settings) {
                const { provider, username, geminiApiKey, chatgptApiKey, grockToken, googleSheetId, googleFolderId } = result.settings;
                selectedProvider = provider || 'gemini';
                        usernameInput.value = username || '';
        geminiApiKeyInput.value = geminiApiKey || 'AIzaSyCA0FJp0Bs5TindfCtEbRVoEImXW9zj8po';
        chatgptApiKeyInput.value = chatgptApiKey || '';
                // Grock token is stored separately, no input field needed
                googleSheetIdInput.value = googleSheetId || '';
                googleFolderIdInput.value = googleFolderId || '';
                updateProviderSelection();
                checkAllConnections(); // Check connections after loading settings
            }
        });
    };

    const updateProviderSelection = () => {
        providerCards.forEach(card => {
            card.classList.toggle('selected', card.dataset.provider === selectedProvider);
        });
    };

    // --- Event Listeners ---
    
    googleSigninButton.addEventListener('click', handleGoogleSignIn);
    
    // Add sign-out button event listener
    const googleSignoutButton = document.getElementById('google-signout-button');
    if (googleSignoutButton) {
        googleSignoutButton.addEventListener('click', handleGoogleSignOut);
    grockSigninButton.addEventListener('click', handleGrockSignIn);
    }

    providerCards.forEach(card => {
        card.addEventListener('click', () => {
            selectedProvider = card.dataset.provider;
            updateProviderSelection();
        });
    });

    // Enhanced load from Drive functionality
    loadFromDriveButton.addEventListener('click', async () => {
        console.log('[Xrefhub Settings] Starting enhanced load from Drive...');
        
        // Check if OAuth is available
        if (!chrome.runtime.getManifest().oauth2) {
            saveStatus.textContent = 'OAuth is disabled. Google Drive integration unavailable.';
            saveStatus.className = 'error';
            console.log('[Xrefhub Settings] Cannot load from Drive - OAuth is not configured');
            return;
        }
        
        animateButton(loadFromDriveButton, 'loading');
        saveStatus.textContent = 'Loading from Google Drive...';
        saveStatus.className = 'loading';
        
        try {
            // Step 1: Get user profile and basic config
            console.log('[Xrefhub Settings] Step 1: Fetching user profile and config...');
            const [config, userProfile] = await Promise.all([
                fetchConfiguration().catch(e => ({})), // Don't fail if config doesn't exist
                fetchGoogleUserProfile()
            ]);
            
            console.log('[Xrefhub Settings] User profile loaded:', userProfile);
            console.log('[Xrefhub Settings] Config loaded:', config);
            
            // Step 2: Auto-populate fields
            usernameInput.value = userProfile.name || config.username || '';
            geminiApiKeyInput.value = config.geminiApiKey || '';
            chatgptApiKeyInput.value = config.chatgptApiKey || '';
            googleSheetIdInput.value = config.googleSheetId || '';
            googleFolderIdInput.value = config.googleFolderId || '';
            
            console.log('[Xrefhub Settings] Loaded config:', config);
            
            // Step 3: Auto-save the loaded settings
            saveStatus.textContent = 'Auto-saving loaded settings...';
            await saveSettings(true); // Silent save
            
            // Step 4: Try to auto-discover folder if not set
            if (!config.googleFolderId) {
                saveStatus.textContent = 'Auto-discovering XRefHub folder...';
                try {
                    const discoveredFolder = await discoverXRefHubFolder();
                    if (discoveredFolder) {
                        googleFolderIdInput.value = discoveredFolder.id;
                        saveStatus.textContent = `Found XRefHub folder: ${discoveredFolder.name}`;
                        await saveSettings(true); // Silent save
                    }
                } catch (folderError) {
                    console.log('[Xrefhub Settings] Could not auto-discover folder:', folderError.message);
                }
            }
            
            // Step 5: Try to auto-discover sheets if not set
            if (!config.googleSheetId) {
                saveStatus.textContent = 'Auto-discovering XRefHub sheets...';
                try {
                    const discoveredSheet = await discoverXRefHubSheet();
                    if (discoveredSheet) {
                        googleSheetIdInput.value = discoveredSheet.id;
                        saveStatus.textContent = `Found XRefHub sheet: ${discoveredSheet.name}`;
                        await saveSettings(true); // Silent save
                    }
                } catch (sheetError) {
                    console.log('[Xrefhub Settings] Could not auto-discover sheet:', sheetError.message);
                }
            }
            
            saveStatus.textContent = 'Settings loaded and auto-saved successfully!';
            saveStatus.className = 'success';
            animateButton(loadFromDriveButton, 'success');
            
            // Refresh connection status
            await checkAllConnections();
            
        } catch (error) {
            console.error('[Xrefhub Settings] Failed to load from Drive:', error);
            saveStatus.textContent = `Error: ${error.message}`;
            saveStatus.className = 'error';
            animateButton(loadFromDriveButton, 'error');
        }
    });

    // Auto-discover XRefHub folder
    async function discoverXRefHubFolder() {
        try {
            const token = await getAuthToken();
            if (!token) {
                throw new Error('Not authenticated with Google');
            }
            const response = await fetch('https://www.googleapis.com/drive/v3/files?q=mimeType=\'application/vnd.google-apps.folder\' and name contains \'XRefHub\' and trashed=false&fields=files(id,name)', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (!response.ok) throw new Error(`Drive API error: ${response.status}`);
            
            const data = await response.json();
            if (data.files && data.files.length > 0) {
                // Return the first matching folder
                return data.files[0];
            }
            return null;
        } catch (error) {
            console.error('[Xrefhub Settings] Folder discovery error:', error);
            throw error;
        }
    }

    // Auto-discover XRefHub sheet
    async function discoverXRefHubSheet() {
        try {
            const token = await getAuthToken();
            if (!token) {
                throw new Error('Not authenticated with Google');
            }
            const response = await fetch('https://www.googleapis.com/drive/v3/files?q=mimeType=\'application/vnd.google-apps.spreadsheet\' and name contains \'XRefHub\' and trashed=false&fields=files(id,name)', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (!response.ok) throw new Error(`Drive API error: ${response.status}`);
            
            const data = await response.json();
            if (data.files && data.files.length > 0) {
                // Return the first matching sheet
                return data.files[0];
            }
            return null;
        } catch (error) {
            console.error('[Xrefhub Settings] Sheet discovery error:', error);
            throw error;
        }
    }

    // Auto-save functionality
    let autoSaveTimeout;
    const autoSave = () => {
        clearTimeout(autoSaveTimeout);
        autoSaveTimeout = setTimeout(() => {
            saveSettings(true); // true = silent save
        }, 1000); // Save after 1 second of inactivity
    };

    // Enhanced save function
    const saveSettings = async (silent = false) => {
        if (!silent) {
            animateButton(saveButton, 'loading');
            saveStatus.textContent = 'Saving settings...';
            saveStatus.className = 'loading';
        }

        try {
            const settings = {
                provider: selectedProvider,
                username: usernameInput.value.trim(),
                chatgptApiKey: chatgptApiKeyInput.value.trim(),
                groqApiKey: groqApiKeyInput.value.trim(),
                googleSheetId: googleSheetIdInput.value.trim(),
                googleFolderId: googleFolderIdInput.value.trim(),
            };

            // Validate required fields
            const errors = [];
            if (!settings.username) errors.push('Username is required');
            if (!settings.chatgptApiKey && !settings.groqApiKey) {
                errors.push('At least one AI API key is required');
            }

            if (errors.length > 0 && !silent) {
                saveStatus.textContent = `Error: ${errors.join(', ')}`;
                saveStatus.className = 'error';
                return;
            }

            await new Promise((resolve, reject) => {
                chrome.storage.local.set({ settings }, () => {
                    if (chrome.runtime.lastError) {
                        reject(chrome.runtime.lastError);
                    } else {
                        resolve();
                    }
                });
            });

            if (!silent) {
                saveStatus.textContent = 'Settings saved successfully!';
                saveStatus.className = 'success';
                animateButton(saveButton, 'success');
                setTimeout(() => { 
                    saveStatus.textContent = ''; 
                    saveStatus.className = '';
                }, 3000);
            }

            // Refresh connection status after saving
            await checkAllConnections();
            
            console.log('[Xrefhub Settings] Settings saved successfully:', settings);
        } catch (error) {
            console.error('[Xrefhub Settings] Save error:', error);
            if (!silent) {
                saveStatus.textContent = `Error: ${error.message}`;
                saveStatus.className = 'error';
                setTimeout(() => { 
                    saveStatus.textContent = ''; 
                    saveStatus.className = '';
                }, 5000);
            }
        }
    };

    saveButton.addEventListener('click', () => {
        saveSettings(false); // false = show feedback
    });

    // Auto-save on input changes
    [usernameInput, chatgptApiKeyInput, groqApiKeyInput, googleSheetIdInput, googleFolderIdInput].forEach(input => {
        input.addEventListener('input', () => {
            clearTimeout(autoSaveTimeout);
            autoSaveTimeout = setTimeout(() => {
                saveSettings(true); // true = silent save
            }, 1000); // Save after 1 second of inactivity
        });
    });

    // --- Initializers ---
    console.log('[Xrefhub Settings] Starting initialization...');
    
    // Test Chrome identity API availability
    if (typeof chrome !== 'undefined' && chrome.identity) {
        console.log('[Xrefhub Settings] Chrome identity API is available');
    } else {
        console.error('[Xrefhub Settings] Chrome identity API is not available');
    }
    
    loadSettings();
    
    // Check if OAuth is enabled
    if (chrome.runtime.getManifest().oauth2) {
        console.log('[Xrefhub Settings] OAuth is enabled, checking Google connection...');
        checkGoogleConnection();
    } else {
        console.log('[Xrefhub Settings] OAuth is disabled, skipping Google connection check');
        updateGoogleStatus('error', 'OAuth is disabled');
        // Enable save button and disable load from drive
        saveButton.disabled = false;
        loadFromDriveButton.disabled = true;
        // Check other connections
        checkAllConnections();
    }
    
    console.log('[Xrefhub Settings] Initialization complete');
}); 