import { analyzePost, getChatReply, getDeeperAnalysis as getDeeperAnalysisFromAI } from './ai-analyzer.js';

// --- Google Sheets Integration ---

// This function requires the user to be authenticated via chrome.identity
async function getAuthToken() {
    return new Promise((resolve, reject) => {
        chrome.identity.getAuthToken({ interactive: true }, (token) => {
            if (chrome.runtime.lastError) {
                console.error('[Xrefhub Background] Auth token error:', chrome.runtime.lastError.message);
                return reject(chrome.runtime.lastError);
            }
            resolve(token);
        });
    });
}

async function getSheetId() {
    return new Promise((resolve) => {
        chrome.storage.local.get(['settings'], (result) => {
            let sheetId = result.settings?.googleSheetId;
            if (sheetId) {
                // Check if the user pasted the full URL instead of just the ID.
                const match = sheetId.match(/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
                if (match && match[1]) {
                    sheetId = match[1];
                }
            }
            resolve(sheetId);
        });
    });
}

async function getLabelsFromSheet() {
    // Check cache first
    const now = new Date().getTime();
    const cache = await chrome.storage.local.get(['labelsCache']);
    if (cache.labelsCache && (now - cache.labelsCache.timestamp < 3600000)) { // 1 hour TTL
        return cache.labelsCache.labels;
    }

    const sheetId = await getSheetId();
    if (!sheetId) {
        throw new Error("Google Sheet ID is not set. Please set it in the extension's options page.");
    }

    try {
        const token = await getAuthToken();
        const range = 'A3:A'; // Start from A3 to skip header row
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}`;

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error('[Xrefhub Background] Sheets API Error Response:', {
                status: response.status,
                statusText: response.statusText,
                body: errorBody
            });
            throw new Error(`Failed to fetch from Google Sheet. Status: ${response.status}. Check the service worker console for details.`);
        }

        const data = await response.json();
        let labels = [];
        if (data.values) {
            labels = data.values.map(row => ({ name: row[0] })).filter(label => label.name);
        }
        
        // Store in cache
        await chrome.storage.local.set({ 
            labelsCache: { labels, timestamp: new Date().getTime() }
        });

        return labels;

    } catch (error) {
        console.error("[Xrefhub Background] A critical error occurred while trying to fetch labels:", error);
        throw error; // Re-throw the error so the caller knows it failed
    }
}

export async function writeToSheet(data) {
    const sheetId = await getSheetId();
    if (!sheetId) throw new Error("Google Sheet ID not set.");

    const token = await getAuthToken();
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/A1:append?valueInputOption=USER_ENTERED`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            values: [data] // data should be an array of values for the row
        })
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.error('[Xrefhub Background] Sheets API Error on Write:', {
            status: response.status,
            statusText: response.statusText,
            body: errorBody
        });
        throw new Error(`Failed to write to Google Sheet. Status: ${response.status}`);
    }

    return await response.json();
}


// --- Message Listener ---
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // Keep the message channel open for async operations
    (async () => {
        try {
            if (request.action === 'scanPage') {
                const content = await scanPage(request.tabId);
                sendResponse({ content });
            } else if (request.action === 'analyze') {
                const analysis = await handleAnalysis(request.content, request.mediaUrl);
                sendResponse(analysis);
            } else if (request.action === 'deeperAnalysis') {
                const deeperAnalysis = await getDeeperAnalysis(request.content, request.mediaUrl);
                sendResponse({ deeperAnalysis });
            } else if (request.action === 'writeToSheet') {
                const result = await writeToSheet(request.data);
                sendResponse({ success: true, result });
            } else if (request.action === 'getLabels') {
                const labels = await getLabels();
                sendResponse({ data: labels });
            } else if (request.action === 'chat') {
                const reply = await getChatReply(request.message, request.history);
                sendResponse({ reply });
            }
        } catch (error) {
            console.error(`Error during action "${request.action}":`, error);
            sendResponse({ error: error.message });
        }
    })();
    return true; // Indicates that the response is sent asynchronously
});


// --- Action Handlers ---

/**
 * Injects the content scanner into the specified tab to extract page content.
 * @param {number} tabId The ID of the tab to scan.
 * @returns {Promise<string>} The extracted content of the page.
 */
async function scanPage(tabId) {
    const results = await chrome.scripting.executeScript({
        target: { tabId },
        files: ['content-scanner.js'],
    });

    if (chrome.runtime.lastError) {
        throw new Error(`Script injection failed: ${chrome.runtime.lastError.message}`);
    }

    if (results && results.length > 0 && results[0].result) {
        return results[0].result;
    } else {
        console.error('[Xrefhub Background] Failed to retrieve content from the page.');
        throw new Error('Could not retrieve content from the page.');
    }
}

/**
 * Handles the analysis process by fetching label rules and calling the AI.
 * @param {string} content The content to analyze.
 * @returns {Promise<object>} The analysis result from the AI.
 */
async function handleAnalysis(content, mediaUrl) {
    // First, get the latest rules from the Google Sheet.
    // This makes our AI context-aware of the current labels.
    const labelsData = await getLabelsFromSheet();
    
    // We'll format the labels as a simple string for the prompt.
    // This could be improved to include descriptions if available.
    const rules = labelsData.map(label => `- ${label.name}`).join('\n');
    
    const analysis = await analyzePost(content, mediaUrl, rules);
    return analysis;
}

/**
 * Handles the deeper analysis process.
 * @param {string} content The content to analyze.
 * @returns {Promise<string>} The detailed analysis text.
 */
async function getDeeperAnalysis(content, mediaUrl) {
    const labelsData = await getLabelsFromSheet();
    const rules = labelsData.map(label => `- ${label.name}`).join('\n');
    const analysis = await getDeeperAnalysisFromAI(content, mediaUrl, rules);
    return analysis;
}

/**
 * Retrieves and caches the labels from the Google Sheet.
 * @returns {Promise<Array<object>>} A list of label objects.
 */
async function getLabels() {
    // For now, we fetch them every time. Caching could be added later.
    const labels = await getLabelsFromSheet();
    return labels;
}

// Open the settings page on installation
chrome.runtime.onInstalled.addListener(() => {
    chrome.runtime.openOptionsPage();
});