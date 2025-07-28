/**
 * @file Enhanced popup with improved content scraping and analysis workflow
 * @version 2.0.0
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log('[Xrefhub Popup] Initializing enhanced popup...');
    
    // --- Element Selectors ---
    const analyzeButton = document.getElementById('analyze-button');
    const deeperAnalysisButton = document.getElementById('deeper-analysis-button');
    const testScanButton = document.getElementById('test-scan-button');
    const debugScanButton = document.getElementById('debug-scan-button');
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
    
    // --- State Management ---
    let currentAnalysis = {};
    let chatHistory = [];
    let currentTab = null;
    let scanData = null;

    // --- Enhanced Content Scraping ---
    async function enhancedPageScan() {
        console.log('[Xrefhub Popup] Starting enhanced page scan...');
        
        try {
            // Get current active tab
            currentTab = await getActiveTab();
            if (!currentTab || !currentTab.url) {
                throw new Error('No active tab found');
            }

            // Check if we can scan this page
            if (currentTab.url.startsWith('chrome://') || currentTab.url.startsWith('chrome-extension://')) {
                throw new Error('Cannot scan internal browser pages');
            }

            console.log('[Xrefhub Popup] Scanning tab:', currentTab.id, 'URL:', currentTab.url);

            // Perform the scan with timeout protection
            const scanResponse = await Promise.race([
                chrome.runtime.sendMessage({ 
                    action: 'scanPage', 
                    tabId: currentTab.id 
                }),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Scan timeout after 15 seconds')), 15000)
                )
            ]);

            console.log('[Xrefhub Popup] Raw scan response:', scanResponse);

            // Validate scan response
            if (!scanResponse) {
                throw new Error('No response from content scanner');
            }

            if (scanResponse.error) {
                throw new Error(`Scanner error: ${scanResponse.error}`);
            }

            if (!scanResponse.content) {
                throw new Error('No content data in scan response');
            }

            scanData = scanResponse.content;
            console.log('[Xrefhub Popup] Scan data captured:', {
                adText: scanData.adText,
                adTextLength: scanData.adText?.length || 0,
                hasMetadata: !!scanData.metadata,
                hasReviewContext: !!scanData.reviewContext,
                pageUrl: scanData.pageUrl
            });

            return scanData;

        } catch (error) {
            console.error('[Xrefhub Popup] Enhanced scan failed:', error);
            throw error;
        }
    }

    // --- Smart Content Extraction ---
    function extractBestContent(scanData) {
        console.log('[Xrefhub Popup] Extracting best content from scan data...');
        console.log('[Xrefhub Popup] Available data:', {
            hasAdText: !!scanData.adText,
            adTextLength: scanData.adText?.length || 0,
            hasMetadata: !!scanData.metadata,
            hasReviewContext: !!scanData.reviewContext,
            reviewContextKeys: Object.keys(scanData.reviewContext || {})
        });
        
        let bestContent = '';
        let contentSource = '';

        // Priority 1: Main adText content (most reliable)
        if (scanData.adText && scanData.adText !== 'Not found' && scanData.adText.length > 10) {
            bestContent = scanData.adText;
            contentSource = 'adText';
            console.log('[Xrefhub Popup] Using adText content, length:', bestContent.length);
        }
        // Priority 2: Metadata body text
        else if (scanData.metadata?.bodyText && scanData.metadata.bodyText.length > 50) {
            bestContent = scanData.metadata.bodyText;
            contentSource = 'metadata.bodyText';
            console.log('[Xrefhub Popup] Using metadata bodyText, length:', bestContent.length);
        }
        // Priority 3: Review context content
        else if (scanData.reviewContext && Object.keys(scanData.reviewContext).length > 0) {
            const reviewContent = Object.values(scanData.reviewContext)
                .map(r => r?.content || '')
                .filter(content => content.length > 0)
                .join('\n\n');
            
            if (reviewContent.length > 50) {
                bestContent = reviewContent;
                contentSource = 'reviewContext';
                console.log('[Xrefhub Popup] Using review context, length:', bestContent.length);
            }
        }
        // Priority 4: Page title + any available text
        else if (scanData.metadata?.title) {
            const title = scanData.metadata.title;
            const anyText = scanData.metadata.bodyText || 'No additional content available';
            bestContent = `Page: ${title}\n\nContent: ${anyText}`;
            contentSource = 'fallback';
            console.log('[Xrefhub Popup] Using fallback content, length:', bestContent.length);
        }
        // Priority 5: Any available text from form data or other sources
        else if (scanData.formData && Object.keys(scanData.formData).length > 0) {
            const formContent = Object.values(scanData.formData)
                .map(input => input?.value || '')
                .filter(value => value && value.length > 5)
                .join('\n');
            
            if (formContent.length > 20) {
                bestContent = formContent;
                contentSource = 'formData';
                console.log('[Xrefhub Popup] Using form data content, length:', bestContent.length);
            }
        }

        console.log('[Xrefhub Popup] Final extraction result:', {
            hasContent: !!bestContent,
            contentLength: bestContent.length,
            source: contentSource
        });

        return { content: bestContent, source: contentSource };
    }

    // --- Enhanced Initialization ---
    async function initialize() {
        console.log('[Xrefhub Popup] Starting enhanced initialization...');
        
        setLoadingState(true, 'Scanning page for content...');
        
        try {
            // Perform enhanced page scan
            const scanData = await enhancedPageScan();
            
            // Extract best content
            const { content, source } = extractBestContent(scanData);
            
            console.log('[Xrefhub Popup] Content extraction result:', {
                hasContent: !!content,
                contentLength: content?.length || 0,
                source: source,
                contentPreview: content?.substring(0, 100) + '...'
            });
            
            if (content && content.length > 10) {
                // Update UI with extracted content
                postContent.value = content;
                console.log(`[Xrefhub Popup] ✅ Content captured from ${source}, length: ${content.length}`);
                
                // Show success message
                showToast(`Content captured from ${source}`, 'success');
                
                // Auto-trigger analysis for good content
                if (content.length > 20) {
                    console.log('[Xrefhub Popup] Auto-triggering analysis...');
                    setTimeout(() => triggerAnalysis(), 500);
                }
            } else {
                // No good content found
                postContent.value = 'Could not automatically extract content from this page. Please paste content manually.';
                console.log('[Xrefhub Popup] ⚠️ No suitable content found for auto-analysis');
                console.log('[Xrefhub Popup] Scan data debug:', {
                    adText: scanData.adText,
                    adTextLength: scanData.adText?.length || 0,
                    hasMetadata: !!scanData.metadata,
                    metadataBodyText: scanData.metadata?.bodyText?.substring(0, 100),
                    hasReviewContext: !!scanData.reviewContext,
                    reviewContextKeys: Object.keys(scanData.reviewContext || {})
                });
                showToast('Please paste content manually', 'warning');
            }

        } catch (error) {
            console.error('[Xrefhub Popup] Initialization failed:', error);
            
            // Set appropriate error message
            if (error.message.includes('Cannot scan internal browser pages')) {
                postContent.value = 'Cannot scan internal browser pages. Please paste content manually.';
                analyzeButton.disabled = true;
            } else {
                postContent.value = `Scan failed: ${error.message}. Please paste content manually.`;
            }
            
            showToast(`Scan failed: ${error.message}`, 'error');
        } finally {
            setLoadingState(false);
        }
    }

    // --- Enhanced Analysis Trigger ---
    async function triggerAnalysis() {
        console.log('[Xrefhub Popup] Triggering content analysis...');
        
        if (!postContent.value || postContent.value.trim().length < 10) {
            showToast('Please enter content to analyze', 'warning');
            return;
        }

        setLoadingState(true, 'Analyzing content with AI...');
        
        try {
            const analysisResponse = await Promise.race([
                chrome.runtime.sendMessage({
                    action: 'analyze',
                    content: postContent.value,
                    mediaUrl: scanData?.landingUrl || ''
                }),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Analysis timeout after 30 seconds')), 30000)
                )
            ]);

            console.log('[Xrefhub Popup] Analysis response:', analysisResponse);

            if (analysisResponse && analysisResponse.error) {
                throw new Error(analysisResponse.error);
            }

            if (analysisResponse) {
                handleAnalysisResponse(analysisResponse);
                showToast('Analysis completed successfully', 'success');
            } else {
                throw new Error('No response from analysis');
            }

        } catch (error) {
            console.error('[Xrefhub Popup] Analysis failed:', error);
            handleError(error, 'Content analysis failed');
            showToast(`Analysis failed: ${error.message}`, 'error');
        } finally {
            setLoadingState(false);
        }
    }

    // --- Enhanced Analysis Response Handler ---
    function handleAnalysisResponse(response) {
        console.log('[Xrefhub Popup] Handling analysis response...');
        
        currentAnalysis = response;

        // Update summary
        if (response.summary) {
            aiSummary.textContent = response.summary;
            aiSummary.style.display = 'block';
        }

        // Update resolution
        if (response.resolution) {
            aiResolution.textContent = response.resolution;
            aiResolution.style.display = 'block';
        }

        // Populate labels
        if (response.suggestedLabels && Array.isArray(response.suggestedLabels)) {
            populateLabels(response.suggestedLabels);
        }

        // Update final output
        updateFinalOutput();

        // Enable deeper analysis
        deeperAnalysisButton.disabled = false;
        
        console.log('[Xrefhub Popup] Analysis response handled successfully');
    }

    // --- Enhanced Label Population ---
    function populateLabels(suggestedLabels) {
        console.log('[Xrefhub Popup] Populating labels:', suggestedLabels);
        
        labelsContainer.innerHTML = '';
        
        if (!suggestedLabels || suggestedLabels.length === 0) {
            labelsContainer.innerHTML = '<p>No labels suggested for this content.</p>';
            return;
        }

        suggestedLabels.forEach((label, index) => {
            const wrapper = document.createElement('div');
            wrapper.className = 'label-item';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `label-${index}`;
            checkbox.checked = true;
            
            const labelElement = document.createElement('label');
            labelElement.htmlFor = `label-${index}`;
            labelElement.textContent = label;
            
            wrapper.appendChild(checkbox);
            wrapper.appendChild(labelElement);
            labelsContainer.appendChild(wrapper);
            
            // Add change listener for final output updates
            checkbox.addEventListener('change', updateFinalOutput);
        });
    }

    // --- Enhanced Final Output Update ---
    function updateFinalOutput() {
        console.log('[Xrefhub Popup] Updating final output...');
        
        const selectedLabels = Array.from(labelsContainer.querySelectorAll('input:checked'))
            .map(input => input.nextElementSibling.textContent);
        
        const output = {
            content: postContent.value,
            summary: aiSummary.textContent,
            resolution: aiResolution.textContent,
            labels: selectedLabels,
            timestamp: new Date().toISOString(),
            url: currentTab?.url || 'Unknown'
        };
        
        finalOutput.value = JSON.stringify(output, null, 2);
        console.log('[Xrefhub Popup] Final output updated');
    }

    // --- Enhanced Error Handling ---
    function handleError(error, context) {
        console.error(`[Xrefhub Popup] Error in ${context}:`, error);
        
        // Update UI to show error
        aiSummary.textContent = `Error: ${error.message}`;
        aiResolution.textContent = 'Analysis failed. Please try again.';
        
        // Disable buttons
        deeperAnalysisButton.disabled = true;
    }

    // --- Enhanced Loading State ---
    function setLoadingState(isLoading, message = '') {
        const buttons = [analyzeButton, deeperAnalysisButton, testScanButton, debugScanButton, copyButton, submitButton];
        
        buttons.forEach(button => {
            button.disabled = isLoading;
        });
        
        if (isLoading) {
            aiSummary.textContent = message || 'Processing...';
            aiResolution.textContent = 'Please wait...';
        }
    }

    // --- Enhanced Toast Notifications ---
    function showToast(message, type = 'success') {
        console.log(`[Xrefhub Popup] Toast (${type}): ${message}`);
        
        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 10000;
            animation: slideIn 0.3s ease-out;
            background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#ff9800'};
        `;
        
        document.body.appendChild(toast);
        
        // Remove after 3 seconds
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => document.body.removeChild(toast), 300);
        }, 3000);
    }

    // --- Event Listeners ---
    
    // Test scan button
    testScanButton.addEventListener('click', async () => {
        console.log('[Xrefhub Popup] Test scan button clicked');
        setLoadingState(true, 'Testing scan...');
        
        try {
            const scanData = await enhancedPageScan();
            console.log('[Xrefhub Popup] Test scan successful:', scanData);
            showToast('Scan test successful! Check console for details.', 'success');
        } catch (error) {
            console.error('[Xrefhub Popup] Test scan failed:', error);
            showToast(`Test scan failed: ${error.message}`, 'error');
        } finally {
            setLoadingState(false);
        }
    });

    // Debug scan button
    debugScanButton.addEventListener('click', async () => {
        console.log('[Xrefhub Popup] Debug scan button clicked');
        setLoadingState(true, 'Debug scanning...');
        
        try {
            const scanData = await enhancedPageScan();
            console.log('[Xrefhub Popup] Debug scan data:', scanData);
            
            // Extract content and show detailed debug info
            const { content, source } = extractBestContent(scanData);
            console.log('[Xrefhub Popup] Debug content extraction:', {
                hasContent: !!content,
                contentLength: content?.length || 0,
                source: source,
                contentPreview: content?.substring(0, 200) + '...'
            });
            
            // Update the textarea with debug info
            const debugInfo = `DEBUG SCAN RESULTS:
            
Content Source: ${source}
Content Length: ${content?.length || 0}
Has Content: ${!!content}

Raw Scan Data:
${JSON.stringify(scanData, null, 2)}

Extracted Content:
${content || 'No content extracted'}`;
            
            postContent.value = debugInfo;
            showToast('Debug scan completed! Check textarea for details.', 'success');
        } catch (error) {
            console.error('[Xrefhub Popup] Debug scan failed:', error);
            showToast(`Debug scan failed: ${error.message}`, 'error');
        } finally {
            setLoadingState(false);
        }
    });

    // Analyze button
    analyzeButton.addEventListener('click', triggerAnalysis);

    // Deeper analysis button
    deeperAnalysisButton.addEventListener('click', async () => {
        console.log('[Xrefhub Popup] Deeper analysis requested');
        setLoadingState(true, 'Getting deeper analysis...');
        
        try {
            const response = await chrome.runtime.sendMessage({
                action: 'deeperAnalysis',
                content: postContent.value
            });
            
            if (response && response.error) {
                throw new Error(response.error);
            }
            
            deeperAnalysisResult.textContent = response || 'No deeper analysis available';
            deeperAnalysisResult.style.display = 'block';
            showToast('Deeper analysis completed', 'success');
            
        } catch (error) {
            console.error('[Xrefhub Popup] Deeper analysis failed:', error);
            showToast(`Deeper analysis failed: ${error.message}`, 'error');
        } finally {
            setLoadingState(false);
        }
    });

    // Copy button
    copyButton.addEventListener('click', () => {
        navigator.clipboard.writeText(finalOutput.value).then(() => {
            showToast('Output copied to clipboard', 'success');
        }).catch(() => {
            showToast('Failed to copy to clipboard', 'error');
        });
    });

    // Submit button
    submitButton.addEventListener('click', async () => {
        console.log('[Xrefhub Popup] Submit button clicked');
        setLoadingState(true, 'Submitting to sheet...');
        
        try {
            const response = await chrome.runtime.sendMessage({
                action: 'writeToSheet',
                data: JSON.parse(finalOutput.value)
            });
            
            if (response && response.error) {
                throw new Error(response.error);
            }
            
            showToast('Successfully submitted to sheet', 'success');
            
        } catch (error) {
            console.error('[Xrefhub Popup] Submit failed:', error);
            showToast(`Submit failed: ${error.message}`, 'error');
        } finally {
            setLoadingState(false);
        }
    });

    // Chat functionality
    chatSendButton.addEventListener('click', async () => {
        const message = chatInput.value.trim();
        if (!message) return;
        
        chatInput.value = '';
        chatHistory.push({ role: 'user', content: message });
        updateChatLog();
        
        try {
            const response = await chrome.runtime.sendMessage({
                action: 'chat',
                message,
                history: chatHistory
            });
            
            if (response && response.error) {
                throw new Error(response.error);
            }
            
            chatHistory.push({ role: 'assistant', content: response });
            updateChatLog();
            
        } catch (error) {
            console.error('[Xrefhub Popup] Chat failed:', error);
            chatHistory.push({ role: 'assistant', content: `Error: ${error.message}` });
            updateChatLog();
        }
    });

    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            chatSendButton.click();
        }
    });

    // Utility functions
    function updateChatLog() {
        chatLog.innerHTML = chatHistory.map(msg => 
            `<div class="chat-message ${msg.role}">${msg.content}</div>`
        ).join('');
        chatLog.scrollTop = chatLog.scrollHeight;
    }

    function getActiveTab() {
        return new Promise((resolve) => {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                resolve(tabs[0]);
            });
        });
    }

    // --- Initialize ---
    console.log('[Xrefhub Popup] Starting initialization...');
    initialize();
}); 