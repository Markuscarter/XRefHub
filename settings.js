import { fetchConfiguration, fetchGoogleUserProfile, getAuthToken } from './google-drive.js';

document.addEventListener('DOMContentLoaded', () => {
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

    // --- State ---
    let selectedProvider = 'gemini';

    // --- Functions ---

    const updateGoogleStatus = (status, message) => {
        googleSigninButton.style.display = 'none'; // Hide by default
        saveButton.disabled = true;
        loadFromDriveButton.disabled = true;

        switch (status) {
            case 'connected':
                googleStatusIcon.textContent = '✅';
                googleStatusText.textContent = message || 'Connected to Google';
                saveButton.disabled = false;
                loadFromDriveButton.disabled = false;
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
            // Use a non-interactive token check first
            const token = await chrome.identity.getAuthToken({ interactive: false });
            if (!token) throw new Error("Not signed in.");
            
            const profile = await fetchGoogleUserProfile();
            updateGoogleStatus('connected', `Connected as ${profile.name}`);
        } catch (error) {
            console.warn('Silent sign-in failed:', error.message);
            updateGoogleStatus('disconnected');
        }
    };
    
    const handleGoogleSignIn = async () => {
        updateGoogleStatus('loading', 'Please follow the sign-in prompt...');
        try {
            const token = await getAuthToken(); // This will force the interactive prompt
            const profile = await fetchGoogleUserProfile();
            updateGoogleStatus('connected', `Connected as ${profile.name}`);
        } catch (error) {
            console.error('Explicit sign-in failed:', error);
            updateGoogleStatus('error', 'Sign-in failed. Please try again.');
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
        saveStatus.textContent = 'Loading from Google Drive...';
        try {
            const [config, userProfile] = await Promise.all([fetchConfiguration(), fetchGoogleUserProfile()]);
            usernameInput.value = userProfile.name || config.username || '';
            chatgptApiKeyInput.value = config.chatgptApiKey || '';
            groqApiKeyInput.value = config.groqApiKey || '';
            googleSheetIdInput.value = config.googleSheetId || '';
            googleFolderIdInput.value = config.googleFolderId || '';
            saveStatus.textContent = 'Settings loaded! Please click Save.';
        } catch (error) {
            console.error('Failed to load settings from Drive:', error);
            saveStatus.textContent = `Error: ${error.message}`;
        }
    });

    saveButton.addEventListener('click', () => {
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
            setTimeout(() => { saveStatus.textContent = ''; }, 3000);
        });
    });

    // --- Initializers ---
    loadSettings();
    checkGoogleConnection();
}); 