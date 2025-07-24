import { fetchConfiguration, fetchGoogleUserProfile, getAuthToken } from './google-drive.js';

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
    const chatgptApiKeyInput = document.getElementById('chatgpt-api-key');
    const groqApiKeyInput = document.getElementById('groq-api-key');
    const googleSheetIdInput = document.getElementById('google-sheet-id');
    const googleFolderIdInput = document.getElementById('google-folder-id');
    const googleStatusIcon = document.getElementById('google-status-icon');
    const googleStatusText = document.getElementById('google-status-text');
    const googleSigninButton = document.getElementById('google-signin-button');

    // Connection status elements
    const driveStatus = document.getElementById('drive-status');
    const sheetsStatus = document.getElementById('sheets-status');
    const openaiStatus = document.getElementById('openai-status');
    const groqStatus = document.getElementById('groq-status');

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
        const settings = await chrome.storage.local.get('settings');
        const { googleSheetId, googleFolderId, chatgptApiKey, groqApiKey } = settings.settings || {};
        
        // Check Google Drive
        if (googleFolderId) {
            try {
                const response = await fetch(`https://www.googleapis.com/drive/v3/files/${googleFolderId}`, {
                    headers: { 'Authorization': `Bearer ${await getAuthToken()}` }
                });
                if (response.ok) {
                    updateConnectionStatus(driveStatus, 'connected', 'Google Drive', generateChecksum(googleFolderId));
                } else {
                    updateConnectionStatus(driveStatus, 'error', 'Drive: Invalid ID');
                }
            } catch (error) {
                updateConnectionStatus(driveStatus, 'error', 'Drive: No access');
            }
        }
        
        // Check Google Sheets
        if (googleSheetId) {
            try {
                const sheetId = googleSheetId.includes('/') ? 
                    googleSheetId.match(/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)?.[1] : googleSheetId;
                const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}`, {
                    headers: { 'Authorization': `Bearer ${await getAuthToken()}` }
                });
                if (response.ok) {
                    updateConnectionStatus(sheetsStatus, 'connected', 'Google Sheets', generateChecksum(sheetId));
                } else {
                    updateConnectionStatus(sheetsStatus, 'error', 'Sheets: Invalid ID');
                }
            } catch (error) {
                updateConnectionStatus(sheetsStatus, 'error', 'Sheets: No access');
            }
        }
        
        // Check OpenAI API
        if (chatgptApiKey) {
            updateConnectionStatus(openaiStatus, 'connected', 'OpenAI API', generateChecksum(chatgptApiKey));
        }
        
        // Check Groq API
        if (groqApiKey) {
            updateConnectionStatus(groqStatus, 'connected', 'Groq API', generateChecksum(groqApiKey));
        }
    };

    const updateGoogleStatus = (status, message) => {
        googleSigninButton.style.display = 'none';
        saveButton.disabled = true;
        loadFromDriveButton.disabled = true;

        switch (status) {
            case 'connected':
                googleStatusIcon.textContent = '✅';
                googleStatusText.textContent = message || 'Connected to Google';
                saveButton.disabled = false;
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
                googleSigninButton.style.display = 'block';
                break;
        }
    };
    
    const checkGoogleConnection = async () => {
        updateGoogleStatus('loading', 'Checking connection...');
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
            } else {
                updateGoogleStatus('error', 'Sign-in failed. Please try again.');
            }
        }
    };

    const loadSettings = () => {
        chrome.storage.local.get(['settings'], (result) => {
            if (result.settings) {
                const { provider, username, chatgptApiKey, groqApiKey, googleSheetId, googleFolderId } = result.settings;
                selectedProvider = provider || 'gemini';
                usernameInput.value = username || '';
                chatgptApiKeyInput.value = chatgptApiKey || '';
                groqApiKeyInput.value = groqApiKey || '';
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

    providerCards.forEach(card => {
        card.addEventListener('click', () => {
            selectedProvider = card.dataset.provider;
            updateProviderSelection();
        });
    });

    loadFromDriveButton.addEventListener('click', async () => {
        console.log('[Xrefhub Settings] Starting load from Drive...');
        animateButton(loadFromDriveButton, 'loading');
        saveStatus.textContent = 'Loading from Google Drive...';
        saveStatus.className = 'loading';
        try {
            console.log('[Xrefhub Settings] Fetching configuration and profile...');
            const [config, userProfile] = await Promise.all([fetchConfiguration(), fetchGoogleUserProfile()]);
            console.log('[Xrefhub Settings] Configuration loaded:', config);
            console.log('[Xrefhub Settings] User profile loaded:', userProfile);
            usernameInput.value = userProfile.name || config.username || '';
            chatgptApiKeyInput.value = config.chatgptApiKey || '';
            groqApiKeyInput.value = config.groqApiKey || '';
            googleSheetIdInput.value = config.googleSheetId || '';
            googleFolderIdInput.value = config.googleFolderId || '';
            saveStatus.textContent = 'Settings loaded! Please click Save.';
            saveStatus.className = 'success';
            animateButton(loadFromDriveButton, 'success');
            checkAllConnections(); // Refresh connection status
        } catch (error) {
            console.error('Failed to load settings from Drive:', error);
            saveStatus.textContent = `Error: ${error.message}`;
            saveStatus.className = 'error';
        }
    });

    saveButton.addEventListener('click', () => {
        animateButton(saveButton, 'loading');
        const settings = {
            provider: selectedProvider,
            username: usernameInput.value.trim(),
            chatgptApiKey: chatgptApiKeyInput.value.trim(),
            groqApiKey: groqApiKeyInput.value.trim(),
            googleSheetId: googleSheetIdInput.value.trim(),
            googleFolderId: googleFolderIdInput.value.trim(),
        };
        chrome.storage.local.set({ settings }, () => {
            saveStatus.textContent = 'Settings saved successfully!';
            saveStatus.className = 'success';
            animateButton(saveButton, 'success');
            setTimeout(() => { 
                saveStatus.textContent = ''; 
                saveStatus.className = '';
            }, 3000);
            checkAllConnections(); // Refresh connection status after saving
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
    checkGoogleConnection();
    
    // Ensure buttons are enabled after a short delay if Google connection fails
    setTimeout(() => {
        if (saveButton.disabled && loadFromDriveButton.disabled) {
            console.log('[Xrefhub Settings] Enabling buttons after timeout');
            saveButton.disabled = false;
            loadFromDriveButton.disabled = false;
        }
    }, 3000);
    
    console.log('[Xrefhub Settings] Initialization complete');
}); 