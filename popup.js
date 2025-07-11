/**
 * @file Manages the logic for the popup UI, now with an automated workflow.
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const postContent = document.getElementById('post-content');
    const aiSummary = document.getElementById('ai-summary');
    const labelsContainer = document.getElementById('labels-container');
    const aiResolution = document.getElementById('ai-resolution');
    const finalOutput = document.getElementById('final-output');

    const analyzeButton = document.getElementById('analyze-button');
    const copyButton = document.getElementById('copy-button');
    const submitButton = document.getElementById('submit-button');
    const settingsLink = document.getElementById('settings-link');
    const openInTabButton = document.getElementById('open-in-tab-button');
    const deeperAnalysisButton = document.getElementById('deeper-analysis-button');
    const deeperAnalysisResult = document.getElementById('deeper-analysis-result');

    const chatLog = document.getElementById('chat-log');
    const chatInput = document.getElementById('chat-input');
    const chatSendButton = document.getElementById('chat-send-button');
    
    // --- State ---
    let username = 'Unknown User';
    let analysisResult = {};
    let chatHistory = [];
    let mediaUrl = '';

    // --- Core Functions ---
    const getUsername = async () => {
        const { settings } = await chrome.storage.local.get('settings');
        if (settings && settings.username) {
            username = settings.username;
        }
    };

    const updateFinalOutput = () => {
        const selectedLabels = Array.from(labelsContainer.querySelectorAll('input:checked')).map(cb => cb.value);
        const violationReason = analysisResult.resolution || '';
        const date = new Date();
        const formattedDate = `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}/${date.getFullYear().toString().slice(-2)}`;
        
        finalOutput.value = `${selectedLabels.join(', ')} - ${violationReason} - ${username} - ${formattedDate}`;
    };

    const populateAllLabels = (labels) => {
        labelsContainer.innerHTML = '';
        if (!labels || labels.length === 0) {
            labelsContainer.innerHTML = '<div>No labels found. Check settings.</div>';
            return;
        }
        labels.forEach(labelObj => {
            const label = labelObj.name;
            const wrapper = document.createElement('div');
            wrapper.className = 'checkbox-wrapper';
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `label-${label.replace(/\s+/g, '-')}`;
            checkbox.value = label;
            checkbox.addEventListener('change', updateFinalOutput);
            
            const labelEl = document.createElement('label');
            labelEl.setAttribute('for', checkbox.id);
            labelEl.textContent = label;
            
            wrapper.appendChild(checkbox);
            wrapper.appendChild(labelEl);
            labelsContainer.appendChild(wrapper);
        });
    };

    const displayAnalysis = (result) => {
        analysisResult = result;
        aiSummary.value = result.summary || '';
        aiResolution.value = result.resolution || '';

        // Highlight suggested labels
        const allWrappers = labelsContainer.querySelectorAll('.checkbox-wrapper');
        allWrappers.forEach(wrapper => {
            const checkbox = wrapper.querySelector('input');
            if ((result.suggestedLabels || []).includes(checkbox.value)) {
                wrapper.classList.add('highlighted');
                checkbox.checked = true;
            } else {
                wrapper.classList.remove('highlighted');
                checkbox.checked = false;
            }
        });
        updateFinalOutput();
    };

    const appendToChatLog = (message, sender = 'user') => {
        const messageEl = document.createElement('div');
        messageEl.className = `chat-message ${sender}`;
        messageEl.textContent = message;
        chatLog.appendChild(messageEl);
        chatLog.scrollTop = chatLog.scrollHeight; // Auto-scroll to bottom
    };
    
    // --- Event Handlers ---
    const handleAnalysisClick = async () => {
        const content = postContent.value.trim();
        if (!content) return;
        
        analyzeButton.disabled = true;
        analyzeButton.textContent = 'Analyzing...';
        
        try {
            const labelsResponse = await chrome.runtime.sendMessage({ action: 'getLabels' });
            const rules = (labelsResponse.data || []).map(l => l.name).join(', ');
            const result = await chrome.runtime.sendMessage({ action: 'analyze', content, mediaUrl, rules });
            if (result.error) throw new Error(result.error);
            displayAnalysis(result);
        } catch (error) {
            aiResolution.value = `Error: ${error.message}`;
        } finally {
            analyzeButton.disabled = false;
            analyzeButton.textContent = 'Analyze';
        }
    };

    const handleDeeperAnalysisClick = async () => {
        const content = postContent.value.trim();
        if (!content) return;

        deeperAnalysisButton.disabled = true;
        deeperAnalysisButton.textContent = 'Analyzing...';
        deeperAnalysisResult.style.display = 'block';
        deeperAnalysisResult.value = 'Generating deeper analysis...';

        try {
            const response = await chrome.runtime.sendMessage({ action: 'deeperAnalysis', content, mediaUrl });
            if (response.error) {
                throw new Error(response.error);
            }
            deeperAnalysisResult.value = response.deeperAnalysis;
        } catch (error) {
            deeperAnalysisResult.value = `Error: ${error.message}`;
        } finally {
            deeperAnalysisButton.disabled = false;
            deeperAnalysisButton.textContent = 'Get Deeper Analysis';
        }
    };

    const handleChatSend = async () => {
        const message = chatInput.value.trim();
        if (!message) return;

        appendToChatLog(message, 'user');
        chatHistory.push({ role: 'user', content: message });
        chatInput.value = '';
        chatSendButton.disabled = true;

        try {
            // Include the original analysis in the history for better context
            const fullHistory = [
                { role: 'system', content: `Original post for analysis: "${postContent.value}"` },
                { role: 'system', content: `Initial analysis summary: "${aiSummary.value}"` },
                { role: 'system', content: `Initial analysis resolution: "${aiResolution.value}"` },
                ...chatHistory
            ];
            const response = await chrome.runtime.sendMessage({ action: 'chat', message, history: fullHistory });
            if (response.error) {
                throw new Error(response.error);
            }
            const aiReply = response.reply; // The reply is now a direct string
            appendToChatLog(aiReply, 'ai');
            chatHistory.push({ role: 'assistant', content: aiReply });
        } catch (error) {
            appendToChatLog(`Error: ${error.message}`, 'ai');
        } finally {
            chatSendButton.disabled = false;
        }
    };

    const handleSubmitClick = async () => {
        const output = finalOutput.value;
        if (!output) return;

        submitButton.disabled = true;
        submitButton.textContent = 'Submitting...';

        try {
            // The data should be an array of columns for the sheet
            const data = output.split(' - '); 
            const response = await chrome.runtime.sendMessage({ action: 'writeToSheet', data });
            if (response.error) {
                throw new Error(response.error);
            }
            // Maybe show a temporary success message
            submitButton.textContent = 'Success!';
            setTimeout(() => {
                submitButton.textContent = 'Submit to Sheet';
            }, 2000);

        } catch (error) {
            // Display error near the button or in a status element
            console.error('Failed to submit to sheet:', error);
            submitButton.textContent = 'Error!';
        } finally {
            submitButton.disabled = false;
        }
    };

    const handleCopyClick = () => {
        finalOutput.select();
        document.execCommand('copy');
    };

    // --- Initialization ---
    const initialize = async () => {
        await getUsername();
        
        // Fetch labels
        try {
            const labelsResponse = await chrome.runtime.sendMessage({ action: 'getLabels' });
            if (labelsResponse.error) throw new Error(labelsResponse.error);
            populateAllLabels(labelsResponse.data);
        } catch (error) {
            labelsContainer.innerHTML = `<div>Error loading labels: ${error.message}</div>`;
        }

        // Scan page and auto-analyze
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab && tab.url && !tab.url.startsWith('chrome://')) {
                const results = await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    files: ['content-scanner.js'],
                });
                if (results && results[0] && results[0].result) {
                    const result = results[0].result;
                    postContent.value = result.adText;
                    mediaUrl = result.mediaUrl;
                    // Automatically trigger analysis after scanning
                    handleAnalysisClick();
                }
            }
        } catch (e) {
            postContent.placeholder = "Could not scan page. Paste content here.";
        }
    };

    analyzeButton.addEventListener('click', handleAnalysisClick);
    copyButton.addEventListener('click', handleCopyClick);
    submitButton.addEventListener('click', handleSubmitClick);
    chatSendButton.addEventListener('click', handleChatSend);
    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            handleChatSend();
        }
    });
    settingsLink.addEventListener('click', (e) => {
        e.preventDefault();
        chrome.runtime.openOptionsPage();
    });
    deeperAnalysisButton.addEventListener('click', handleDeeperAnalysisClick);
    openInTabButton.addEventListener('click', () => {
        chrome.tabs.create({ url: chrome.runtime.getURL('popup.html') });
    });

    initialize();
}); 