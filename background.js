// Import AI analyzer functions - using script injection instead of dynamic imports
let analyzePost, getChatReply, getDeeperAnalysisFromAI, getNBMResponse;
let fetchAllRules, fetchImagesFromDrive;

// Load modules using a CSP-compatible approach
async function loadModules() {
    try {
        console.log('[Xrefhub Background] Loading modules with CSP-compatible method...');
        
        // For now, use the fallback system since dynamic loading is restricted
        // In a real implementation, we'd need to restructure the modules
        await loadModulesFallback();
        
        console.log('[Xrefhub Background] Using fallback module system');
    } catch (error) {
        console.error('[Xrefhub Background] Error loading modules:', error);
        await loadModulesFallback();
    }
}

// Fallback method for module loading with basic AI functionality
async function loadModulesFallback() {
    try {
        console.log('[Xrefhub Background] Using fallback module loading...');
        
        // Basic AI provider functions
        async function getAiProvider() {
            return new Promise((resolve) => {
                chrome.storage.local.get(['settings'], (result) => {
                    resolve(result.settings?.provider || 'gemini');
                });
            });
        }

        async function getApiKey(provider) {
            return new Promise((resolve) => {
                chrome.storage.local.get(['settings'], (result) => {
                    console.log('[Xrefhub Background] Storage result:', result);
                    console.log('[Xrefhub Background] Settings:', result.settings);
                    
                    if (provider === 'gemini') {
                        const apiKey = result.settings?.geminiApiKey;
                        console.log('[Xrefhub Background] Gemini API key found:', !!apiKey, apiKey ? `${apiKey.substring(0, 10)}...` : 'none');
                        resolve(apiKey);
                    } else if (provider === 'chatgpt') {
                        const apiKey = result.settings?.chatgptApiKey;
                        console.log('[Xrefhub Background] ChatGPT API key found:', !!apiKey, apiKey ? `${apiKey.substring(0, 10)}...` : 'none');
                        resolve(apiKey);
                    } else {
                        console.log('[Xrefhub Background] Unknown provider:', provider);
                        resolve(null);
                    }
                });
            });
        }

        // Get Grock token from storage
        async function getGrockToken() {
            return new Promise((resolve) => {
                chrome.storage.local.get(['grockToken'], (result) => {
                    resolve(result.grockToken || null);
                });
            });
        }

        // Basic Grock API call
        async function callGrock(prompt, token) {
            try {
                const body = {
                    model: "grock-beta",
                    messages: [{ role: "user", content: prompt }],
                    max_tokens: 4096,
                    temperature: 0.7,
                    response_format: { "type": "json_object" }
                };

                const response = await fetch('https://api.x.ai/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify(body)
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('Grock API Error Response:', errorText);
                    try {
                        const errorBody = JSON.parse(errorText);
                        throw new Error(`Grock API error: ${errorBody.error?.message || response.statusText}`);
                    } catch (parseError) {
                        throw new Error(`Grock API error: ${response.status} - ${errorText}`);
                    }
                }

                const data = await response.json();
                const content = data.choices[0].message.content;
                console.log('Raw Grock API Response content:', content);
                
                try {
                    return JSON.parse(content);
                } catch (e) {
                    return { error: 'Failed to parse AI response', rawResponse: content };
                }
            } catch (error) {
                console.error('Grock API Error:', error);
                throw new Error(`Grock API error: ${error.message}`);
            }
        }

        // Basic OpenAI API call
        async function callOpenAI(prompt, apiKey) {
            try {
                const body = {
                    model: "gpt-3.5-turbo",
                    messages: [{ role: "user", content: prompt }],
                    max_tokens: 4096,
                    response_format: { "type": "json_object" }
                };

                const response = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`,
                    },
                    body: JSON.stringify(body)
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('OpenAI API Error Response:', errorText);
                    try {
                        const errorBody = JSON.parse(errorText);
                        throw new Error(`OpenAI API error: ${errorBody.error?.message || response.statusText}`);
                    } catch (parseError) {
                        throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
                    }
                }

                const data = await response.json();
                const content = data.choices[0].message.content;
                console.log('Raw OpenAI API Response content:', content);
                
                try {
                    return JSON.parse(content);
                } catch (e) {
                    return { error: 'Failed to parse AI response', rawResponse: content };
                }
            } catch (error) {
                console.error('OpenAI API Error:', error);
                throw new Error(`OpenAI API error: ${error.message}`);
            }
        }

        // Basic Gemini API call
        async function callGeminiAPI(prompt, apiKey) {
            try {
                const model = 'gemini-1.5-flash';
                const body = {
                    contents: [{
                        parts: [{ text: prompt }]
                    }],
                    generationConfig: {
                        maxOutputTokens: 4096,
                        temperature: 0.7
                    }
                };

                const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(body)
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('Gemini API Error Response:', errorText);
                    try {
                        const errorBody = JSON.parse(errorText);
                        throw new Error(`Gemini API error: ${errorBody.error?.message || response.statusText}`);
                    } catch (parseError) {
                        throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
                    }
                }

                const data = await response.json();
                const content = data.candidates[0].content.parts[0].text;
                console.log('Raw Gemini API Response content:', content);
                
                try {
                    return JSON.parse(content);
                } catch (e) {
                    return { error: 'Failed to parse AI response', rawResponse: content };
                }
            } catch (error) {
                console.error('Gemini API Error:', error);
                throw new Error(`Gemini API error: ${error.message}`);
            }
        }

        // Define the AI functions with fallback system
        analyzePost = async (content, mediaUrl, rules, images = []) => {
            const primaryProvider = await getAiProvider();
            console.log('[Xrefhub Background] Primary AI Provider:', primaryProvider);
            
            // Check if rules is actually a mode-specific prompt
            const isModeSpecificPrompt = typeof rules === 'string' && rules.includes('STEP 1:') && rules.includes('VIOLATION ACTIONS:');
            
            let prompt;
            if (isModeSpecificPrompt) {
                // Use the mode-specific prompt directly
                prompt = rules;
                console.log('[Xrefhub Background] Using mode-specific prompt for analysis');
            } else {
                // Use standard prompt
                prompt = `
                    You are an Expert Content Policy Analyst. Analyze this content:
                    
                    Content: "${content}"
                    ${mediaUrl ? `Media URL: ${mediaUrl}` : ''}
                    ${images.length > 0 ? `Images: ${images.length} found` : ''}
                    
                    Rules: ${rules}
                    
                    Return a JSON object with: summary, resolution, suggestedLabels, policyDocument, policyReasoning
                `;
                console.log('[Xrefhub Background] Using standard prompt for analysis');
            }

            // Try providers in order: primary provider, then fallbacks
            const providers = [primaryProvider];
            
            // Add fallback providers if primary is not already in the list
            if (primaryProvider !== 'gemini') providers.push('gemini');
            if (primaryProvider !== 'chatgpt') providers.push('chatgpt');
            if (primaryProvider !== 'grock') providers.push('grock');
            
            console.log('[Xrefhub Background] Will try providers in order:', providers);
            
            // Try each provider until one works
            for (const provider of providers) {
                try {
                    console.log(`[Xrefhub Background] Trying provider: ${provider}`);
                    
                    const apiKey = await getApiKey(provider);
                    console.log(`[Xrefhub Background] ${provider} API Key retrieved:`, !!apiKey, apiKey ? `${apiKey.substring(0, 10)}...` : 'none');
                    
                    if (!apiKey) {
                        console.log(`[Xrefhub Background] No API key for ${provider}, trying next provider`);
                        continue;
                    }
                    
                    // Try the API call
                    if (provider === 'gemini') {
                        const result = await callGeminiAPI(prompt, apiKey);
                        console.log(`[Xrefhub Background] ✅ ${provider} analysis successful`);
                        return { ...result, providerUsed: provider };
                    } else if (provider === 'chatgpt') {
                        const result = await callOpenAI(prompt, apiKey);
                        console.log(`[Xrefhub Background] ✅ ${provider} analysis successful`);
                        return { ...result, providerUsed: provider };
                    } else if (provider === 'grock') {
                        const token = await getGrockToken();
                        if (!token) {
                            console.log(`[Xrefhub Background] No Grock token available, trying next provider`);
                            continue;
                        }
                        const result = await callGrock(prompt, token);
                        console.log(`[Xrefhub Background] ✅ ${provider} analysis successful`);
                        return { ...result, providerUsed: provider };
                    }
                    
                } catch (error) {
                    console.log(`[Xrefhub Background] ❌ ${provider} failed:`, error.message);
                    // Continue to next provider
                }
            }
            
            // If all providers failed
            throw new Error(`All AI providers failed. Please check your API keys in settings.`);
        };
        
        getChatReply = async (message, history) => {
            const provider = await getAiProvider();
            const apiKey = await getApiKey(provider);
            
            if (!apiKey) {
                return 'API key not configured. Please set up in settings.';
            }

            const prompt = `Chat history: ${JSON.stringify(history)}\n\nUser: ${message}\n\nAssistant:`;
            const response = await callGeminiAPI(prompt, apiKey);
            return response.summary || response.rawResponse || 'No response from AI';
        };
        
        getDeeperAnalysisFromAI = async (content, mediaUrl, rules) => {
            const provider = await getAiProvider();
            const apiKey = await getApiKey(provider);
            
            if (!apiKey) {
                throw new Error('API key not set. Please configure in settings.');
            }

            const prompt = `
                Provide a deeper analysis of this content:
                
                Content: "${content}"
                ${mediaUrl ? `Media URL: ${mediaUrl}` : ''}
                
                Rules: ${rules}
                
                Provide detailed analysis with specific policy references.
            `;

            const response = await callGeminiAPI(prompt, apiKey);
            return response.summary || response.rawResponse || 'No analysis available';
        };
        
        getNBMResponse = async (content, mediaUrl, rules) => {
            return await analyzePost(content, mediaUrl, rules);
        };
        
        fetchAllRules = async () => {
            return 'Basic content analysis rules:\n- Check for inappropriate content\n- Verify accuracy\n- Assess tone and context';
        };
        
        fetchImagesFromDrive = async () => {
            return [];
        };
        
        console.log('[Xrefhub Background] Fallback modules loaded with basic AI functionality');
    } catch (error) {
        console.error('[Xrefhub Background] Fallback loading failed:', error);
    }
}

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
            console.log(`📨 Received message with action: ${request.action}`);
            
            if (request.action === 'scanPage') {
                console.log('🔍 Starting page scan for tab:', request.tabId);
                const scanResult = await scanPage(request.tabId);
                
                // Handle error case
                if (scanResult.error) {
                    console.log('❌ Scan failed:', scanResult.error);
                    sendResponse({ error: scanResult.error });
                    return;
                }
                
                // Extract content from the scan result
                const content = scanResult.content;
                const contentLength = content?.adText?.length || 
                             (content?.metadata?.bodyText?.length || 0) ||
                             (Object.values(content?.reviewContext || {}).map(r => r?.content?.length || 0).reduce((a, b) => a + b, 0));
                console.log('✅ Page scan completed, content length:', contentLength);
                sendResponse({ content });
            } else if (request.action === 'analyze') {
                console.log('🤖 Starting analysis for content length:', request.content?.length || 0);
                console.log('📝 Content preview:', request.content?.substring(0, 100) + '...');
                console.log('🖼️ Images to analyze:', request.images?.length || 0);
                console.log('🎯 Review mode:', request.reviewMode || 'adReview');
                console.log('📋 Mode prompt available:', !!request.modePrompt);
                
                const analysis = await handleAnalysis(request.content, request.mediaUrl, request.images, request.reviewMode, request.modePrompt);
                console.log('✅ Analysis completed:', {
                    hasSummary: !!analysis.summary,
                    hasResolution: !!analysis.resolution,
                    suggestedLabels: analysis.suggestedLabels?.length || 0,
                    reviewMode: request.reviewMode || 'adReview'
                });
                
                sendResponse(analysis);
            } else if (request.action === 'deeperAnalysis') {
                console.log('🔬 Starting deeper analysis...');
                const deeperAnalysis = await getDeeperAnalysis(request.content, request.mediaUrl);
                console.log('✅ Deeper analysis completed');
                sendResponse({ deeperAnalysis });
            } else if (request.action === 'writeToSheet') {
                console.log('📊 Writing to sheet, data length:', request.data?.length || 0);
                const result = await writeToSheet(request.data);
                console.log('✅ Sheet write completed');
                sendResponse({ success: true, result });
            } else if (request.action === 'getLabels') {
                console.log('🏷️ Fetching labels...');
                const labels = await getLabels();
                console.log('✅ Labels fetched:', labels?.length || 0);
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
            } else if (request.action === 'getPolicyDocuments') {
                try {
                    console.log('[📋 POLICY] Fetching policy documents for detailed reasons...');
                    const policies = await fetchPolicyDocuments();
                    console.log('[✅ POLICY] Successfully fetched policy documents');
                    sendResponse({ policies });
                } catch (error) {
                    console.log('[❌ POLICY ERROR]:', error.message);
                    sendResponse({ error: error.message });
                }
            } else if (request.action === 'getDriveImages') {
                try {
                    console.log('[🖼️ DRIVE] Fetching images from Google Drive...');
                    const images = await fetchImagesFromDrive();
                    console.log('[✅ DRIVE] Successfully fetched images:', images.length);
                    sendResponse({ images });
                } catch (error) {
                    console.log('[❌ DRIVE IMAGES ERROR]:', error.message);
                    sendResponse({ error: error.message });
                }
            } else if (request.action === 'fetchURLContent') {
                try {
                    console.log('🌐 Fetching content from URL:', request.url);
                    const content = await fetchURLContent(request.url);
                    console.log('✅ URL content fetched successfully');
                    sendResponse({ content });
                } catch (error) {
                    console.error('❌ URL fetch failed:', error);
                    sendResponse({ error: error.message });
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
        // Wait a moment for the page to be fully loaded
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const results = await chrome.scripting.executeScript({
            target: { tabId },
            function: async () => {
                // Enhanced content scanning function (inline to avoid file dependency issues)
                async function enhancedContentScan() {
                    console.log('[Xrefhub Scanner] Starting enhanced scan...');
                    console.log('[Xrefhub Scanner] Scanner script loaded successfully!');
                    console.log('[Xrefhub Scanner] Page URL:', window.location.href);
                    console.log('[Xrefhub Scanner] Page title:', document.title);
                    console.log('[Xrefhub Scanner] Document ready state:', document.readyState);

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
                        // Safe text extraction helper
                        const safeGetText = (element) => {
                            try {
                                if (element && element.innerText && typeof element.innerText === 'string') {
                                    return element.innerText.trim();
                                }
                                return '';
                            } catch (error) {
                                console.log('[Xrefhub Scanner] Error getting text from element:', error.message);
                                return '';
                            }
                        };

                        // --- Ad Text & Core Content ---
                        console.log('[Xrefhub Scanner] Looking for main content...');
                        
                        // Try Twitter/X specific content first
                        const tweetTextElement = document.querySelector('[data-testid="tweetText"]');
                        if (tweetTextElement) {
                            const text = safeGetText(tweetTextElement);
                            if (text && text.length > 10) {
                                result.adText = text;
                                console.log('[Xrefhub Scanner] Found tweet text:', text.substring(0, 100) + '...');
                                
                                // Look for links in the tweet
                                const linkElement = tweetTextElement.querySelector('a');
                                if (linkElement && linkElement.href) {
                                    result.landingUrl = linkElement.href;
                                }
                            }
                        }

                        // If no tweet content, try general content selectors
                        if (result.adText === 'Not found') {
                            const contentSelectors = [
                                'article',
                                '[data-testid*="text"]',
                                '.post-content',
                                '.content',
                                '.text',
                                'p',
                                'div[class*="content"]',
                                'div[class*="text"]'
                            ];
                            
                            for (const selector of contentSelectors) {
                                try {
                                    const element = document.querySelector(selector);
                                    if (element) {
                                        const text = safeGetText(element);
                                        if (text && text.length > 10) {
                                            result.adText = text;
                                            console.log('[Xrefhub Scanner] Found content with selector', selector, ':', text.substring(0, 100) + '...');
                                            
                                            // Look for links
                                            const linkElement = element.querySelector('a');
                                            if (linkElement && linkElement.href) {
                                                result.landingUrl = linkElement.href;
                                            }
                                            break;
                                        }
                                    }
                                } catch (selectorError) {
                                    console.log('[Xrefhub Scanner] Error with selector', selector, ':', selectorError.message);
                                }
                            }
                        }

                        // Final fallback: get page title and some body text
                        if (result.adText === 'Not found') {
                            console.log('[Xrefhub Scanner] No specific content found, using fallback...');
                            
                            const title = document.title || 'No title';
                            let bodyText = 'No body text';
                            
                            if (document.body) {
                                try {
                                    const allText = document.body.innerText;
                                    console.log('[Xrefhub Scanner] Raw body text length:', allText?.length || 0);
                                    
                                    if (allText && typeof allText === 'string' && allText.length > 0) {
                                        // Split into lines and filter out empty lines and very short lines
                                        const lines = allText.split('\n')
                                            .map(line => typeof line === 'string' ? line.trim() : '')
                                            .filter(line => line.length > 10 && line.length < 1000)
                                            .slice(0, 10); // Take first 10 meaningful lines
                                        
                                        bodyText = lines.join('\n');
                                        console.log('[Xrefhub Scanner] Processed body text length:', bodyText.length);
                                    }
                                } catch (bodyError) {
                                    console.log('[Xrefhub Scanner] Error processing body text:', bodyError.message);
                                    bodyText = 'Error processing page content';
                                }
                            }
                            
                            result.adText = `Page: ${title}\n\nContent: ${bodyText}`;
                            console.log('[Xrefhub Scanner] Using fallback content, total length:', result.adText.length);
                        }

                        // --- Status Indicators (simplified) ---
                        console.log('[Xrefhub Scanner] Looking for status indicators...');
                        try {
                            const statusElements = document.querySelectorAll('[class*="status"], [class*="label"], [class*="badge"], [class*="tag"]');
                            statusElements.forEach((el, index) => {
                                try {
                                    const text = safeGetText(el);
                                    if (text && text.length < 100) {
                                        result.statusIndicators[`status_${index}`] = { 
                                            text, 
                                            className: el.className || '', 
                                            element: el.tagName.toLowerCase() 
                                        };
                                    }
                                } catch (statusError) {
                                    // Skip this element
                                }
                            });
                        } catch (statusSectionError) {
                            console.log('[Xrefhub Scanner] Error in status indicators section:', statusSectionError.message);
                        }

                        // --- Form Data (simplified) ---
                        console.log('[Xrefhub Scanner] Looking for form data...');
                        try {
                            const formInputs = document.querySelectorAll('input, select, textarea, button');
                            formInputs.forEach((input, index) => {
                                try {
                                    const key = `input_${index}`;
                                    result.formData[key] = {
                                        type: input.type || input.tagName.toLowerCase(),
                                        value: input.value || safeGetText(input) || '',
                                        placeholder: input.placeholder || '',
                                        name: input.name || '',
                                        id: input.id || ''
                                    };
                                } catch (formError) {
                                    // Skip this input
                                }
                            });
                        } catch (formSectionError) {
                            console.log('[Xrefhub Scanner] Error in form data section:', formSectionError.message);
                        }

                        // --- Metadata ---
                        console.log('[Xrefhub Scanner] Creating metadata...');
                        try {
                            result.metadata = {
                                title: document.title || 'No title',
                                url: window.location.href,
                                userAgent: navigator.userAgent.substring(0, 100) + '...',
                                timestamp: Date.now(),
                                domain: window.location.hostname,
                                totalElements: document.querySelectorAll('*').length,
                                bodyText: document.body && typeof document.body.innerText === 'string' ? 
                                    document.body.innerText.substring(0, 500) + '...' : 'No body'
                            };
                        } catch (metadataError) {
                            console.log('[Xrefhub Scanner] Error creating metadata:', metadataError.message);
                            result.metadata = {
                                title: 'Error getting title',
                                url: window.location.href,
                                error: metadataError.message
                            };
                        }

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

                        console.log('[Xrefhub Scanner] Scan complete. Final adText length:', result.adText?.length || 0);
                        return result;

                    } catch (error) {
                        console.error('[Xrefhub Scanner] A critical error occurred during scanning:', error);
                        console.error('[Xrefhub Scanner] Error stack:', error.stack);
                        return { 
                            error: `Scanner failed: ${error.message}`, 
                            adText: 'Error during scan.',
                            pageUrl: window.location.href,
                            title: document.title || 'No title'
                        };
                    }
                }

                // Execute the scan and return the result
                console.log('[Xrefhub Scanner] Starting scan execution...');
                console.log('[Xrefhub Scanner] Document body exists:', !!document.body);
                console.log('[Xrefhub Scanner] Document body text length:', document.body?.innerText?.length || 0);

                const scanResult = await enhancedContentScan();
                console.log('[Xrefhub Scanner] Scan completed, returning:', scanResult);
                console.log('[Xrefhub Scanner] Final adText length:', scanResult.adText?.length || 0);
                return scanResult;
            },
            world: 'MAIN' // Execute in the page's context for better reliability
        });

        if (chrome.runtime.lastError) {
            console.error(`Script injection error: ${chrome.runtime.lastError.message}`);
            throw new Error(`Script injection failed: ${chrome.runtime.lastError.message}`);
        }

        // The result is often nested in an array, and the actual value is in the first element.
        console.log('🔍 Raw scan results:', results);
        
        if (results && results.length > 0 && results[0].result) {
            const scanResult = results[0].result;
            console.log('✅ Scan successful, returning result:', scanResult);
            console.log('🔍 Scan result structure:', {
                adText: scanResult.adText,
                adTextLength: scanResult.adText?.length || 0,
                hasReviewContext: !!scanResult.reviewContext,
                reviewContextKeys: Object.keys(scanResult.reviewContext || {}),
                hasMetadata: !!scanResult.metadata,
                metadataKeys: Object.keys(scanResult.metadata || {}),
                pageUrl: scanResult.pageUrl,
                extractedAt: scanResult.extractedAt
            });
            console.log('🔍 Full scan result:', JSON.stringify(scanResult, null, 2));
            return { content: scanResult };
        } else {
            console.error('[Xrefhub Background] Failed to retrieve content from the page. The scanner might have returned null or an empty result.');
            console.error('Results structure:', results);
            throw new Error('Could not retrieve valid content from the page. The page structure may be unsupported or it may still be loading.');
        }
    } catch (error) {
        console.error('An unexpected error occurred during scanPage:', error);
        // Return error in expected format
        return { error: error.message };
    }
}

/**
 * Handles the analysis process by fetching label rules and calling the AI.
 * @param {string} content The content to analyze.
 * @param {string} mediaUrl Optional media URL.
 * @param {Array} images Optional array of images to analyze.
 * @returns {Promise<object>} The analysis result from the AI.
 */
export async function handleAnalysis(content, mediaUrl, images = [], reviewMode = 'adReview', modePrompt = null) {
    let rules = '';
    
    // Try to get rules from Google Sheet first
    try {
        const labelsData = await getLabelsFromSheet();
        rules = labelsData.map(label => `- ${label.name}`).join('\n');
        console.log('Using sheet rules for analysis');
    } catch (error) {
        console.log('Sheet rules not available, using basic rules:', error.message);
        rules = 'Basic content analysis rules:\n- Check for inappropriate content\n- Verify accuracy\n- Assess tone and context';
    }
    
    // Try to get enhanced rules from Google Drive if available
    try {
        const driveRules = await fetchAllRules();
        if (driveRules && driveRules.trim().length > 0) {
            rules = driveRules + '\n\n--- Sheet Labels ---\n' + rules;
            console.log('Enhanced analysis using both Drive and Sheet rules');
        } else {
            console.log('No Drive rules available, using Sheet rules only');
        }
    } catch (error) {
        console.log('Drive rules not available, continuing with available rules:', error.message);
    }
    
    // Enhanced mode-specific analysis with structured policy access
    if (modePrompt && reviewMode === 'paidPartnership') {
        console.log('🎯 Using Paid Partnership mode analysis');
        
        // Get structured policy documents for paid partnership
        const policyDocuments = await fetchPolicyDocuments();
        const paidPartnershipPolicies = Object.entries(policyDocuments)
            .filter(([name, content]) => 
                name.toLowerCase().includes('paid') || 
                name.toLowerCase().includes('partnership') ||
                name.toLowerCase().includes('commercial') ||
                name.toLowerCase().includes('sponsored')
            )
            .map(([name, content]) => `<policy_document name="${name}">\n${content}\n</policy_document>`)
            .join('\n\n');
        
        const enhancedPrompt = `${modePrompt}

CONTENT TO ANALYZE:
"${content}"
${mediaUrl ? `Media URL: ${mediaUrl}` : ''}
${images.length > 0 ? `Images: ${images.length} found` : ''}

PAID PARTNERSHIP POLICY DOCUMENTS:
${paidPartnershipPolicies}

SHEET LABELS:
${rules}

ANALYSIS INSTRUCTIONS:
1. First, review the PAID PARTNERSHIP POLICY DOCUMENTS above
2. Identify which specific policy documents apply to this content
3. Reference specific policy sections by name when making decisions
4. Follow the step-by-step workflow for paid partnership compliance
5. Use the SHEET LABELS as reference for final labeling

Return a JSON object with: summary, resolution, suggestedLabels, policyDocument, policyReasoning, workflowSteps, commissionDetected, promotionDetected, prohibitedIndustries, disclaimerPresent, violation, action, reasoning`;

        const analysis = await analyzePost(content, mediaUrl, enhancedPrompt, images);
        return {
            ...analysis,
            reviewMode: 'paidPartnership',
            modeUsed: 'paidPartnership',
            policiesUsed: Object.keys(policyDocuments).filter(name => 
                name.toLowerCase().includes('paid') || 
                name.toLowerCase().includes('partnership')
            )
        };
    } else {
        console.log('📋 Using standard Ad Review mode analysis');
        
        // Get structured policy documents for general content review
        const policyDocuments = await fetchPolicyDocuments();
        const generalPolicies = Object.entries(policyDocuments)
            .filter(([name, content]) => 
                !name.toLowerCase().includes('paid') && 
                !name.toLowerCase().includes('partnership') &&
                !name.toLowerCase().includes('commercial')
            )
            .map(([name, content]) => `<policy_document name="${name}">\n${content}\n</policy_document>`)
            .join('\n\n');
        
        const enhancedPrompt = `You are a Content Policy Analyst. Analyze this content focusing on:

CONTENT ANALYSIS:
- Identify the main intent and purpose of the post
- Determine the target audience and messaging approach
- Assess the tone, style, and communication strategy
- Evaluate if content is promotional, informational, or entertainment

POLICY COMPLIANCE:
- Check for potential policy violations (inappropriate content, misleading claims, etc.)
- Assess accuracy and truthfulness of claims
- Evaluate potential harm or risk to users

CONTENT TO ANALYZE:
"${content}"
${mediaUrl ? `Media URL: ${mediaUrl}` : ''}
${images.length > 0 ? `Images: ${images.length} found` : ''}

GENERAL POLICY DOCUMENTS:
${generalPolicies}

SHEET LABELS:
${rules}

ANALYSIS INSTRUCTIONS:
1. First, review the GENERAL POLICY DOCUMENTS above
2. Identify which specific policy documents apply to this content
3. Reference specific policy sections by name when making decisions
4. Focus on content intent and general policy compliance
5. Use the SHEET LABELS as reference for final labeling

Return a JSON object with: summary, resolution, suggestedLabels, policyDocument, policyReasoning`;

        const analysis = await analyzePost(content, mediaUrl, enhancedPrompt, images);
        return {
            ...analysis,
            reviewMode: 'adReview',
            modeUsed: 'adReview',
            policiesUsed: Object.keys(policyDocuments).filter(name => 
                !name.toLowerCase().includes('paid') && 
                !name.toLowerCase().includes('partnership')
            )
        };
    }
}

/**
 * Fetches policy documents from Google Drive for detailed labeling reasons.
 * @returns {Promise<object>} Object with document names as keys and content as values.
 */
async function fetchPolicyDocuments() {
    try {
        const rules = await fetchAllRules();
        if (!rules || rules.trim().length === 0) {
            console.log('[📋 POLICY] No policy documents available');
            return {};
        }

        // Parse the rules content to extract individual documents
        const documents = {};
        const policyBlocks = rules.split('<policy_document name="');
        
        for (let i = 1; i < policyBlocks.length; i++) {
            const block = policyBlocks[i];
            const nameEnd = block.indexOf('">');
            const contentEnd = block.indexOf('</policy_document>');
            
            if (nameEnd !== -1 && contentEnd !== -1) {
                const docName = block.substring(0, nameEnd);
                const content = block.substring(nameEnd + 2, contentEnd).trim();
                documents[docName] = content;
            }
        }

        console.log(`[📋 POLICY] Extracted ${Object.keys(documents).length} policy documents`);
        return documents;
    } catch (error) {
        console.error('[📋 POLICY] Error fetching policy documents:', error);
        return {};
    }
}

/**
 * Handles the deeper analysis process.
 * @param {string} content The content to analyze.
 * @returns {Promise<string>} The detailed analysis text.
 */
async function getDeeperAnalysis(content, mediaUrl) {
    console.log('[Xrefhub Background] Starting deeper analysis with web research...');
    
    let rules = '';
    
    // Try to get rules from Google Sheet first
    try {
        const labelsData = await getLabelsFromSheet();
        rules = labelsData.map(label => `- ${label.name}`).join('\n');
        console.log('Using sheet rules for deeper analysis');
    } catch (error) {
        console.log('Sheet rules not available, using basic rules for deeper analysis:', error.message);
        rules = 'Basic content analysis rules:\n- Check for inappropriate content\n- Verify accuracy\n- Assess tone and context';
    }
    
    // Try to get enhanced rules from Google Drive if available
    try {
        const driveRules = await fetchAllRules();
        if (driveRules && driveRules.trim().length > 0) {
            rules = driveRules + '\n\n--- Sheet Labels ---\n' + rules;
            console.log('Enhanced deeper analysis using both Drive and Sheet rules');
        } else {
            console.log('No Drive rules available for deeper analysis, using Sheet rules only');
        }
    } catch (error) {
        console.log('Drive rules not available for deeper analysis, continuing with available rules:', error.message);
    }
    
    // Enhanced prompt for deeper analysis with structured policy access
    const policyDocuments = await fetchPolicyDocuments();
    const structuredPolicies = Object.entries(policyDocuments)
        .map(([name, content]) => `<policy_document name="${name}">\n${content}\n</policy_document>`)
        .join('\n\n');
    
    const enhancedPrompt = `You are an Expert Content Policy Analyst conducting a comprehensive "tell me why" analysis. 

CONTENT TO ANALYZE:
"${content}"
${mediaUrl ? `Media URL: ${mediaUrl}` : ''}

STRUCTURED POLICY DOCUMENTS:
${structuredPolicies}

SHEET LABELS:
${rules}

DEEPER ANALYSIS REQUIREMENTS:
1. **WHY** - Explain the reasoning behind the policy assessment
2. **REAL DATA** - Reference specific policy sections by name, industry standards, and enforcement precedents
3. **WEB SOURCES** - Include relevant external sources, case studies, and industry examples
4. **CONTEXT** - Consider the broader social media landscape and platform-specific policies
5. **IMPACT** - Assess potential user impact and platform risk

ANALYSIS INSTRUCTIONS:
1. First, review the STRUCTURED POLICY DOCUMENTS above
2. Identify which specific policy documents apply to this content
3. Reference specific policy sections by name when making decisions
4. Quote relevant policy text when explaining reasoning
5. Provide detailed "tell me why" explanations with policy citations

Provide a comprehensive analysis that includes:
- Detailed reasoning for policy decisions with specific policy references
- Specific policy citations and references by document name
- Industry context and precedents
- Risk assessment and impact analysis
- Recommendations for content creators and platform enforcement

Format as a detailed explanation with clear sections and supporting evidence.`;

    const analysis = await getDeeperAnalysisFromAI(content, mediaUrl, enhancedPrompt);
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

// Initialize modules on startup
loadModules();

// Message listener for popup communication
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('[Xrefhub Background] Received message:', request.action);
    
    // Handle different message types
    switch (request.action) {
        case 'scanPage':
            scanPage(request.tabId).then(sendResponse).catch(error => {
                console.error('[Xrefhub Background] Scan error:', error);
                sendResponse({ error: error.message });
            });
            return true; // Keep message channel open for async response
            
        case 'analyze':
            handleAnalysis(request.content, request.mediaUrl, request.images).then(sendResponse).catch(error => {
                console.error('[Xrefhub Background] Analysis error:', error);
                sendResponse({ error: error.message });
            });
            return true;
            
        case 'deeperAnalysis':
            getDeeperAnalysis(request.content, request.mediaUrl).then(sendResponse).catch(error => {
                console.error('[Xrefhub Background] Deeper analysis error:', error);
                sendResponse({ error: error.message });
            });
            return true;
            
        case 'getLabels':
            getLabels().then(sendResponse).catch(error => {
                console.error('[Xrefhub Background] Get labels error:', error);
                sendResponse({ error: error.message });
            });
            return true;
            
        case 'writeToSheet':
            writeToSheet(request.data).then(sendResponse).catch(error => {
                console.error('[Xrefhub Background] Write to sheet error:', error);
                sendResponse({ error: error.message });
            });
            return true;
            
        case 'getPolicyDocuments':
            fetchPolicyDocuments().then(sendResponse).catch(error => {
                console.error('[Xrefhub Background] Get policy documents error:', error);
                sendResponse({ error: error.message });
            });
            return true;
            
        case 'fetchURLContent':
            fetchURLContent(request.url).then(sendResponse).catch(error => {
                console.error('[Xrefhub Background] URL fetch error:', error);
                sendResponse({ error: error.message });
            });
            return true;
            
        case 'chat':
            getChatReply(request.message, request.history).then(sendResponse).catch(error => {
                console.error('[Xrefhub Background] Chat error:', error);
                sendResponse({ error: error.message });
            });
            return true;
            
        default:
            console.warn('[Xrefhub Background] Unknown action:', request.action);
            sendResponse({ error: 'Unknown action' });
            return false;
    }
});

// Open the settings page on installation
chrome.runtime.onInstalled.addListener(() => {
    chrome.runtime.openOptionsPage();
});

// --- URL Content Fetching ---
async function fetchURLContent(url) {
    try {
        console.log('[Background] Fetching content from URL:', url);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const html = await response.text();
        
        // Extract text content from HTML
        const textContent = extractTextFromHTML(html);
        
        console.log('[Background] Successfully fetched content from URL, length:', textContent.length);
        
        return {
            url: url,
            html: html,
            text: textContent,
            timestamp: new Date().toISOString()
        };
        
    } catch (error) {
        console.error('[Background] Error fetching URL content:', error);
        throw new Error(`Failed to fetch content from ${url}: ${error.message}`);
    }
}

// Extract text content from HTML
function extractTextFromHTML(html) {
    try {
        // Simple text extraction - remove HTML tags and decode entities
        let text = html
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // Remove scripts
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '') // Remove styles
            .replace(/<[^>]+>/g, ' ') // Remove HTML tags
            .replace(/&nbsp;/g, ' ') // Replace non-breaking spaces
            .replace(/&amp;/g, '&') // Replace HTML entities
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim();
        
        // Limit text length to prevent memory issues
        if (text.length > 50000) {
            text = text.substring(0, 50000) + '... [Content truncated]';
        }
        
        return text;
        
    } catch (error) {
        console.error('[Background] Error extracting text from HTML:', error);
        return 'Error extracting content from HTML';
    }
}