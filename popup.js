/**
 * @file Manages the logic for the popup UI, now with an automated workflow.
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- Element Selectors ---
    const analyzeButton = document.getElementById('analyze-button');
    const deeperAnalysisButton = document.getElementById('deeper-analysis-button');
    const copyButton = document.getElementById('copy-button');
    const submitButton = document.getElementById('submit-button');
    const postContent = document.getElementById('post-content');
    const aiSummary = document.getElementById('ai-summary');
    const aiResolution = document.getElementById('ai-resolution');
    const deeperAnalysisResult = document.getElementById('deeper-analysis-result');
    const labelsContainer = document.getElementById('labels-container');
    const finalOutput = document.getElementById('final-output');
    const settingsLink = document.getElementById('settings-link');
    const openInTabButton = document.getElementById('open-in-tab-button');
    const chatInput = document.getElementById('chat-input');
    const chatSendButton = document.getElementById('chat-send-button');
    const chatLog = document.getElementById('chat-log');
    
    let currentAnalysis = {}; // Store the latest analysis
    let chatHistory = []; // Store the conversation history

    // --- Initial State & Page Scan ---
    async function initialize() {
        setLoadingState(true, 'Scanning page...');
        try {
            const activeTab = await getActiveTab();
            if (activeTab && activeTab.url && !activeTab.url.startsWith('chrome://')) {
                // Add timeout protection for the scan message
                const response = await Promise.race([
                    chrome.runtime.sendMessage({ action: 'scanPage', tabId: activeTab.id }),
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Scan timeout after 10 seconds')), 10000)
                    )
                ]);
                
                if (response && response.error) {
                    throw new Error(response.error);
                }
                
                if (response && response.content && response.content.adText && response.content.adText !== 'Not found') {
                    postContent.value = response.content.adText;
                } else if (response && response.content) {
                    // Try to get any useful text from the response
                    const fallbackText = response.content.metadata?.bodyText || 
                                       Object.values(response.content.reviewContext || {}).map(r => r.content).join('\n') ||
                                       'Could not automatically scan content. Please paste it manually.';
                    postContent.value = fallbackText;
                } else {
                    postContent.value = 'Could not automatically scan content. Please paste it manually.';
                }
            } else {
                postContent.value = 'Cannot scan internal browser pages. Please paste content manually.';
                analyzeButton.disabled = true;
            }
        } catch (error) {
            console.error('Error during initialization:', error);
            postContent.value = `Error: ${error.message}`;
            
            // Show user-friendly error message
            showToast(`Scan failed: ${error.message}`, 'error');
        } finally {
            setLoadingState(false);
        }
    }
    
    // --- Event Listeners ---
    
    analyzeButton.addEventListener('click', async () => {
        setLoadingState(true, 'Analyzing...');
        try {
            const response = await chrome.runtime.sendMessage({
                action: 'analyze',
                content: postContent.value,
                mediaUrl: '' // TODO: Extract media URL if possible from scanner
            });
            handleAnalysisResponse(response);
        } catch (error) {
            handleError(error, 'Analysis failed');
        } finally {
            setLoadingState(false);
        }
    });

    deeperAnalysisButton.addEventListener('click', async () => {
        setLoadingState(true, 'Getting deeper analysis...');
        deeperAnalysisResult.style.display = 'block';
        deeperAnalysisResult.textContent = 'Fetching...';
        try {
            const response = await chrome.runtime.sendMessage({
                action: 'deeperAnalysis',
                content: postContent.value,
                mediaUrl: '' // TODO
            });
            if (response.error) {
                deeperAnalysisResult.textContent = `Error: ${response.error}`;
            } else {
                deeperAnalysisResult.textContent = response.deeperAnalysis;
            }
        } catch (error) {
            handleError(error, 'Deeper analysis failed');
        } finally {
            setLoadingState(false);
        }
    });

    copyButton.addEventListener('click', () => {
        navigator.clipboard.writeText(finalOutput.value)
            .then(() => showToast('Copied to clipboard!'))
            .catch(err => handleError(err, 'Failed to copy'));
    });
    
    submitButton.addEventListener('click', async () => {
        const output = finalOutput.value;
        if (!output || submitButton.disabled) return;

        setLoadingState(true, 'Submitting...');
        submitButton.textContent = 'Submitting...';

        try {
            // The data should be an array of columns for the sheet
            const data = output.split(' - ');
            const response = await chrome.runtime.sendMessage({ action: 'writeToSheet', data });
            if (response.error) throw new Error(response.error);
            
            showToast('Successfully submitted to sheet!');
            submitButton.textContent = 'Success!';
            setTimeout(() => {
                submitButton.textContent = 'Submit to Sheet';
            }, 2000);

        } catch (error) {
            handleError(error, 'Submission failed');
            submitButton.textContent = 'Error!';
        } finally {
            setLoadingState(false);
        }
    });

    chatSendButton.addEventListener('click', handleChat);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleChat();
    });

    openInTabButton.addEventListener('click', () => {
        chrome.tabs.create({ url: 'popup.html' });
    });

    // --- UI Update Functions ---

    function setLoadingState(isLoading, message = '') {
        analyzeButton.disabled = isLoading;
        analyzeButton.textContent = isLoading ? message : 'Analyze Page';
        deeperAnalysisButton.disabled = isLoading;
    }

    function handleAnalysisResponse(response) {
        if (response.error) {
            handleError(new Error(response.error), 'Analysis Error');
            return;
        }
        currentAnalysis = response;
        aiSummary.textContent = response.summary || 'No summary provided.';
        aiResolution.textContent = response.resolution || 'No resolution provided.';
        
        populateLabels(response.suggestedLabels || []);

        // Add the initial analysis to the chat history as the AI's first turn
        chatHistory = [{ role: 'assistant', content: `Initial analysis complete. Summary: ${response.summary}. Resolution: ${response.resolution}` }];
        updateChatLog();
        updateFinalOutput(); // Update output field after analysis
    }

    function populateLabels(suggestedLabels) {
        labelsContainer.innerHTML = ''; // Clear previous labels
        chrome.storage.local.get(['labelsCache'], (result) => {
            const allLabels = result.labelsCache?.labels || [];
            if (allLabels.length === 0) {
                labelsContainer.innerHTML = '<p>No labels found. Check Google Sheet settings.</p>';
                return;
            }
            allLabels.forEach(label => {
                const isSuggested = suggestedLabels.includes(label.name);
                const wrapper = document.createElement('div');
                wrapper.className = 'checkbox-wrapper';
                if (isSuggested) {
                    wrapper.classList.add('highlighted');
                }
                wrapper.innerHTML = `
                    <input type="checkbox" id="label-${label.name}" name="${label.name}" ${isSuggested ? 'checked' : ''}>
                    <label for="label-${label.name}">${label.name}</label>
                `;
                wrapper.querySelector('input').addEventListener('change', updateFinalOutput);
                labelsContainer.appendChild(wrapper);
            });
        });
    }

    function updateFinalOutput() {
        const selectedLabels = Array.from(labelsContainer.querySelectorAll('input:checked')).map(cb => cb.name);
        const resolution = currentAnalysis.resolution || "No resolution yet.";
        const username = "User"; // TODO: Get from settings
        const date = new Date().toLocaleDateString();
        
        finalOutput.value = `${selectedLabels.join(', ')} - ${resolution} - ${username} - ${date}`;
    }

    async function handleChat() {
        const message = chatInput.value.trim();
        if (!message) return;

        chatHistory.push({ role: 'user', content: message });
        updateChatLog();
        chatInput.value = '';
        setLoadingState(true, 'AI is thinking...');

        try {
            const activeTab = await getActiveTab();
            const response = await chrome.runtime.sendMessage({
                action: 'chat',
                message: message,
                history: chatHistory,
                tabId: activeTab.id // Pass tabId for NBM trigger
            });
            if (response.error) {
                handleError(new Error(response.error), 'Chat Error');
            } else {
                chatHistory.push({ role: 'assistant', content: response.reply });
                updateChatLog();
            }
        } catch (error) {
            handleError(error, 'Chat failed');
        } finally {
            setLoadingState(false);
        }
    }

    function updateChatLog() {
        chatLog.innerHTML = '';
        chatHistory.forEach(msg => {
            const msgElement = document.createElement('div');
            msgElement.className = `chat-message ${msg.role}`;
            
            // Handle both string and object replies (for NBM)
            if (typeof msg.content === 'object') {
                msgElement.innerHTML = `<pre>${JSON.stringify(msg.content, null, 2)}</pre>`;
            } else {
                msgElement.textContent = msg.content;
            }

            chatLog.appendChild(msgElement);
        });
        chatLog.scrollTop = chatLog.scrollHeight; // Scroll to bottom
    }

    function handleError(error, context) {
        console.error(`[${context}]`, error);
        const errorMessage = `Error during ${context}: ${error.message}`;
        
        // Display error in the main UI
        aiSummary.textContent = errorMessage;
        aiResolution.textContent = 'An error occurred. See summary above.';
        
        // Also log the error in the chat for immediate visibility
        chatHistory.push({ role: 'ai', content: `🚨 **System Error** 🚨\n\n**Context:** ${context}\n**Details:** ${error.message}` });
        updateChatLog();

        showToast(errorMessage, 'error');
    }

    function showToast(message, type = 'success') {
        // Create a toast notification element
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? '#ff4757' : '#2ed573'};
            color: white;
            padding: 12px 20px;
            border-radius: 6px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            font-size: 14px;
            max-width: 300px;
            word-wrap: break-word;
            animation: slideIn 0.3s ease-out;
        `;
        
        // Add animation styles
        if (!document.querySelector('#toast-styles')) {
            const styles = document.createElement('style');
            styles.id = 'toast-styles';
            styles.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(styles);
        }
        
        toast.textContent = message;
        document.body.appendChild(toast);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 5000);
        
        console.log(`[Toast: ${type}] ${message}`);
    }

    function getActiveTab() {
        return new Promise((resolve) => {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                resolve(tabs[0]);
            });
        });
    }

    initialize();
}); 