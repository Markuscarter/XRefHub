import { fetchConfiguration, fetchGoogleUserProfile } from './google-drive.js';

document.addEventListener('DOMContentLoaded', () => {
    const providerCards = document.querySelectorAll('.provider-card');
    const saveButton = document.getElementById('save-button');
    const loadFromDriveButton = document.getElementById('load-from-drive-button');
    const saveStatus = document.getElementById('save-status');
    const usernameInput = document.getElementById('username');
    const chatgptApiKeyInput = document.getElementById('chatgpt-api-key');
    const groqApiKeyInput = document.getElementById('groq-api-key');
    const googleSheetIdInput = document.getElementById('google-sheet-id');
    const googleFolderIdInput = document.getElementById('google-folder-id');

    let selectedProvider = 'gemini'; // Default provider

    // Function to load settings from chrome.storage
    const loadSettings = () => {
        chrome.storage.local.get(['settings'], (result) => {
            if (chrome.runtime.lastError) {
                console.error('Error loading settings:', chrome.runtime.lastError);
                return;
            }
            if (result.settings) {
                const { provider, username, chatgptApiKey, groqApiKey, googleSheetId, googleFolderId } = result.settings;
                
                selectedProvider = provider || 'gemini';
                updateProviderSelection();

                usernameInput.value = username || '';
                chatgptApiKeyInput.value = chatgptApiKey || '';
                groqApiKeyInput.value = groqApiKey || '';
                googleSheetIdInput.value = googleSheetId || '';
                googleFolderIdInput.value = googleFolderId || '';
            } else {
                // Set default if no settings are found
                updateProviderSelection();
            }
        });
    };

    // Function to update the visual selection of provider cards
    const updateProviderSelection = () => {
        providerCards.forEach(card => {
            if (card.dataset.provider === selectedProvider) {
                card.classList.add('selected');
            } else {
                card.classList.remove('selected');
            }
        });
    };

    // Event listener for provider card clicks
    providerCards.forEach(card => {
        card.addEventListener('click', () => {
            selectedProvider = card.dataset.provider;
            updateProviderSelection();
        });
    });

    // Event listener for the load from drive button
    loadFromDriveButton.addEventListener('click', async () => {
        saveStatus.textContent = 'Loading from Google Drive...';
        saveStatus.className = 'loading';

        try {
            // Fetch both configuration and user profile in parallel
            const [config, userProfile] = await Promise.all([
                fetchConfiguration(),
                fetchGoogleUserProfile()
            ]);

            // Populate the fields with the loaded configuration
            usernameInput.value = userProfile.name || config.username || '';
            chatgptApiKeyInput.value = config.chatgptApiKey || '';
            groqApiKeyInput.value = config.groqApiKey || '';
            googleSheetIdInput.value = config.googleSheetId || '';
            googleFolderIdInput.value = config.googleFolderId || '';
            
            saveStatus.textContent = 'Settings loaded! Please click Save.';
            saveStatus.className = 'success';
        } catch (error) {
            console.error('Failed to load settings from Drive:', error);
            saveStatus.textContent = `Error: ${error.message}`;
            saveStatus.className = 'error';
        }
    });

    // Event listener for the save button
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
            if (chrome.runtime.lastError) {
                saveStatus.textContent = 'Error saving settings!';
                saveStatus.className = 'error';
                console.error('Error saving settings:', chrome.runtime.lastError);
            } else {
                saveStatus.textContent = 'Settings saved successfully!';
                saveStatus.className = 'success';
                setTimeout(() => {
                    saveStatus.textContent = '';
                }, 3000);
            }
        });
    });

    // Initial load of settings
    loadSettings();
}); 