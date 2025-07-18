import { analyzePost, getChatReply, getDeeperAnalysis as getDeeperAnalysisFromAI, getNBMResponse } from './ai-analyzer.js';
import { fetchAllRules } from './google-drive.js';

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
            } else if (request.action === 'verifyDriveConnection') {
                try {
                    const result = await fetchAllRules();
                    console.log('[✅ DRIVE VERIFIED] Successfully connected and fetched rules');
                    sendResponse({ success: true, result });
                } catch (error) {
                    console.log('[❌ DRIVE ERROR]:', error.message);
                    sendResponse({ success: false, error: error.message });
                }
            } else if (request.action === 'chat') {
                // Check if message is "NBM" trigger
                if (request.message.trim().toUpperCase() === 'NBM') {
                    // Get current page content for NBM analysis
                    const scanResult = await scanPage(request.tabId);
                    const labelsData = await getLabelsFromSheet();
                    let rules = labelsData.map(label => `- ${label.name}`).join('\n');
                    
                    // Try to get enhanced rules from Google Drive if available
                    try {
                        const driveRules = await fetchAllRules();
                        if (driveRules) {
                            rules = driveRules + '\n\n--- Sheet Labels ---\n' + rules;
                            console.log('Enhanced NBM analysis using both Drive and Sheet rules');
                        }
                    } catch (error) {
                        console.log('Using sheet rules only for NBM (Drive not available):', error.message);
                    }
                    
                    // Pass the full scan result as the review page context
                    const nbmResult = await getNBMResponse(scanResult.adText, scanResult.mediaUrl, rules, scanResult);
                    sendResponse({ reply: nbmResult });
                } else {
                    const reply = await getChatReply(request.message, request.history);
                    sendResponse({ reply });
                }
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
    try {
        // First, inject and execute the scanner script
        const results = await chrome.scripting.executeScript({
            target: { tabId },
            function: async () => {
                // Enhanced content scanning function (inline to avoid file dependency issues)
                async function enhancedContentScan() {
                    console.log('[Xrefhub Scanner] Starting enhanced scan...');

                    const result = {
                        postId: 'Not found',
                        adText: 'Not found',
                        landingUrl: 'Not found',
                        pageUrl: window.location.href,
                        extractedAt: new Date().toLocaleString(),
                        reviewContext: {},
                        formData: {},
                        statusIndicators: {},
                        tableData: {},
                        uiElements: {},
                        metadata: {}
                    };

                    try {
                        // --- Ad Text & Core Content ---
                        const tweetTextElement = document.querySelector('[data-testid="tweetText"]');
                        if (tweetTextElement && tweetTextElement.innerText) {
                            result.adText = tweetTextElement.innerText.trim();
                            const linkElement = tweetTextElement.querySelector('a');
                            if (linkElement && linkElement.href) result.landingUrl = linkElement.href;
                        } else {
                            const article = document.querySelector('article');
                            if (article && article.innerText) {
                                result.adText = article.innerText.trim();
                                const linkInArticle = article.querySelector('a');
                                if (linkInArticle && linkInArticle.href) result.landingUrl = linkInArticle.href;
                            }
                        }

                        // --- Enhanced text extraction for any content that might be useful ---
                        const contentSelectors = [
                            'p', 'div[class*="content"]', 'div[class*="text"]', 'span[class*="text"]',
                            '[data-testid*="text"]', '[aria-label]', '.post', '.message', '.content'
                        ];
                        
                        let allText = '';
                        contentSelectors.forEach(selector => {
                            const elements = document.querySelectorAll(selector);
                            elements.forEach(el => {
                                const text = el.innerText.trim();
                                if (text && text.length > 20 && !allText.includes(text)) {
                                    allText += text + '\n';
                                }
                            });
                        });

                        // If we haven't found good content yet, use the enhanced text
                        if (result.adText === 'Not found' && allText.length > 50) {
                            result.adText = allText.substring(0, 2000); // Limit length
                        }

                        // --- Status Indicators ---
                        const statusElements = document.querySelectorAll('[class*="status"], [class*="label"], [class*="badge"], [class*="tag"]');
                        statusElements.forEach((el, index) => {
                            const text = el.innerText.trim();
                            if (text && text.length < 100) result.statusIndicators[`status_${index}`] = { text, className: el.className, element: el.tagName.toLowerCase() };
                        });

                        // --- Review-Specific Context (for work pages) ---
                        const reviewKeywords = ['agent', 'review', 'note', 'targeting', 'bio', 'label', 'policy', 'violation'];
                        const allElements = document.querySelectorAll('*');
                        allElements.forEach((el, index) => {
                            if (index > 1000) return; // Limit to prevent overwhelming
                            const text = el.innerText;
                            if (text && text.length > 10 && text.length < 500) {
                                const hasReviewKeyword = reviewKeywords.some(keyword => 
                                    text.toLowerCase().includes(keyword)
                                );
                                if (hasReviewKeyword) {
                                    result.reviewContext[`review_${Object.keys(result.reviewContext).length}`] = {
                                        content: text.trim(),
                                        element: el.tagName.toLowerCase(),
                                        className: el.className
                                    };
                                }
                            }
                        });

                        // --- Metadata ---
                        result.metadata = {
                            title: document.title || 'No title',
                            url: window.location.href,
                            timestamp: Date.now(),
                            domain: window.location.hostname,
                            totalElements: document.querySelectorAll('*').length,
                            bodyText: document.body ? document.body.innerText.substring(0, 500) + '...' : 'No body'
                        };

                        // --- Extract Post ID (for Twitter/X posts) ---
                        try {
                            const urlParts = window.location.pathname.split('/');
                            const statusIndex = urlParts.indexOf('status');
                            if (statusIndex > -1 && urlParts[statusIndex + 1]) {
                                result.postId = urlParts[statusIndex + 1];
                            }
                        } catch (e) {
                            console.warn('[Xrefhub Scanner] Could not parse Post ID from URL.');
                        }

                        console.log('[Xrefhub Scanner] Scan complete.', result);
                        return result;

                    } catch (error) {
                        console.error('[Xrefhub Scanner] A critical error occurred during scanning:', error);
                        return { error: `Scanner failed: ${error.message}`, adText: 'Error during scan.' };
                    }
                }

                // Execute the scan and return the result
                return await enhancedContentScan();
            },
            world: 'MAIN' // Execute in the page's context for better reliability
        });

        if (chrome.runtime.lastError) {
            console.error(`Script injection error: ${chrome.runtime.lastError.message}`);
            throw new Error(`Script injection failed: ${chrome.runtime.lastError.message}`);
        }

        // The result is often nested in an array, and the actual value is in the first element.
        if (results && results.length > 0 && results[0].result) {
            console.log('Scan successful, returning result:', results[0].result);
            return results[0].result;
        } else {
            console.error('[Xrefhub Background] Failed to retrieve content from the page. The scanner might have returned null or an empty result.');
            throw new Error('Could not retrieve valid content from the page. The page structure may be unsupported or it may still be loading.');
        }
    } catch (error) {
        console.error('An unexpected error occurred during scanPage:', error);
        // Re-throw the error so the popup can handle it.
        throw error;
    }
}

/**
 * Handles the analysis process by fetching label rules and calling the AI.
 * @param {string} content The content to analyze.
 * @returns {Promise<object>} The analysis result from the AI.
 */
export async function handleAnalysis(content, mediaUrl) {
    // First, get the latest rules from the Google Sheet.
    // This makes our AI context-aware of the current labels.
    const labelsData = await getLabelsFromSheet();
    
    // We'll format the labels as a simple string for the prompt.
    // This could be improved to include descriptions if available.
    let rules = labelsData.map(label => `- ${label.name}`).join('\n');
    
    // Try to get enhanced rules from Google Drive if available
    try {
        const driveRules = await fetchAllRules();
        if (driveRules) {
            rules = driveRules + '\n\n--- Sheet Labels ---\n' + rules;
            console.log('Enhanced analysis using both Drive and Sheet rules');
        }
    } catch (error) {
        console.log('Using sheet rules only (Drive not available):', error.message);
    }
    
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
    let rules = labelsData.map(label => `- ${label.name}`).join('\n');
    
    // Try to get enhanced rules from Google Drive if available
    try {
        const driveRules = await fetchAllRules();
        if (driveRules) {
            rules = driveRules + '\n\n--- Sheet Labels ---\n' + rules;
            console.log('Enhanced deeper analysis using both Drive and Sheet rules');
        }
    } catch (error) {
        console.log('Using sheet rules only for deeper analysis (Drive not available):', error.message);
    }
    
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