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
    const labelCorrectionSection = document.getElementById('label-correction-section');
    const correctionOptions = document.getElementById('correction-options');
    const rescanButton = document.getElementById('rescan-button');
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
    let userCorrections = [];
    let availableLabels = [];

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
        availableLabels = suggestedLabels || [];
        
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

        // Show correction interface
        showCorrectionInterface();
    }

    // --- Enhanced Final Output Update ---
    async function updateFinalOutput() {
        console.log('[Xrefhub Popup] Updating final output...');
        
        const selectedLabels = Array.from(labelsContainer.querySelectorAll('input:checked'))
            .map(input => input.nextElementSibling.textContent);
        
        // Apply user corrections to selected labels
        const correctedLabels = applyUserCorrections(selectedLabels);
        
        // Format final output in expected format with policy-based reasons
        const formattedOutput = await formatFinalOutput(correctedLabels);
        
        finalOutput.value = formattedOutput;
        console.log('[Xrefhub Popup] Final output updated with policy-based corrections');
    }

    // --- Label Correction Interface ---
    function showCorrectionInterface() {
        console.log('[Xrefhub Popup] Showing correction interface...');
        
        labelCorrectionSection.style.display = 'block';
        correctionOptions.innerHTML = '';
        
        // Add "Add Correction" button
        const addButton = document.createElement('button');
        addButton.className = 'add-correction-btn';
        addButton.textContent = '+ Add Correction';
        addButton.addEventListener('click', addCorrectionItem);
        correctionOptions.appendChild(addButton);
    }

    function addCorrectionItem() {
        console.log('[Xrefhub Popup] Adding correction item...');
        
        const correctionItem = document.createElement('div');
        correctionItem.className = 'correction-item';
        
        // Create select dropdown for available labels
        const labelSelect = document.createElement('select');
        labelSelect.innerHTML = '<option value="">Select AI Label to Correct</option>';
        availableLabels.forEach(label => {
            const option = document.createElement('option');
            option.value = label;
            option.textContent = label;
            labelSelect.appendChild(option);
        });
        
        // Create input for corrected label
        const correctedInput = document.createElement('input');
        correctedInput.type = 'text';
        correctedInput.placeholder = 'Enter corrected label';
        correctedInput.maxLength = 50;
        
        // Create reason input
        const reasonInput = document.createElement('input');
        reasonInput.type = 'text';
        reasonInput.placeholder = 'Reason (max 100 chars)';
        reasonInput.maxLength = 100;
        
        // Create remove button
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-btn';
        removeBtn.textContent = '×';
        removeBtn.addEventListener('click', () => {
            correctionItem.remove();
            updateFinalOutput();
        });
        
        // Add event listeners for real-time updates
        [labelSelect, correctedInput, reasonInput].forEach(element => {
            element.addEventListener('input', updateFinalOutput);
        });
        
        correctionItem.appendChild(labelSelect);
        correctionItem.appendChild(correctedInput);
        correctionItem.appendChild(reasonInput);
        correctionItem.appendChild(removeBtn);
        
        // Insert before the add button
        const addButton = correctionOptions.querySelector('.add-correction-btn');
        correctionOptions.insertBefore(correctionItem, addButton);
        
        updateFinalOutput();
    }

    function applyUserCorrections(selectedLabels) {
        const corrections = Array.from(correctionOptions.querySelectorAll('.correction-item'))
            .map(item => {
                const originalLabel = item.querySelector('select').value;
                const correctedLabel = item.querySelector('input[type="text"]:first-of-type').value;
                const reason = item.querySelector('input[type="text"]:last-of-type').value;
                
                if (originalLabel && correctedLabel && reason) {
                    return {
                        original: originalLabel,
                        corrected: correctedLabel,
                        reason: reason
                    };
                }
                return null;
            })
            .filter(correction => correction !== null);

        // Apply corrections to selected labels
        return selectedLabels.map(label => {
            const correction = corrections.find(c => c.original === label);
            return correction ? correction.corrected : label;
        });
    }

    async function formatFinalOutput(correctedLabels) {
        if (correctedLabels.length === 0) {
            return 'No labels selected for output.';
        }

        const username = 'Reviewer'; // Could be made configurable
        const date = new Date().toLocaleDateString('en-US', {
            month: '2-digit',
            day: '2-digit',
            year: '2-digit'
        });

        // Get detailed policy-based reasons
        const policyReasons = await getPolicyBasedReasons(correctedLabels);
        
        // Format each label according to specification
        const formattedLabels = correctedLabels.map((label, index) => {
            // Truncate label if too long
            const truncatedLabel = label.length > 20 ? label.substring(0, 17) + '...' : label;
            
            // Get policy-based reason or fallback to resolution
            const reason = policyReasons[index] || aiResolution.textContent || 'No resolution available';
            const truncatedReason = reason.length > 100 ? reason.substring(0, 97) + '...' : reason;
            
            // Format: Label - reason (less than 100 chars) - Username - Date(mm/dd/yy)
            return `${truncatedLabel} - ${truncatedReason} - ${username} - ${date}`;
        });

        return formattedLabels.join('\n');
    }

    async function getPolicyBasedReasons(labels) {
        try {
            console.log('[Xrefhub Popup] Fetching policy-based reasons for labels...');
            
            // Get corrections to understand the context
            const corrections = Array.from(correctionOptions.querySelectorAll('.correction-item'))
                .map(item => {
                    const originalLabel = item.querySelector('select').value;
                    const correctedLabel = item.querySelector('input[type="text"]:first-of-type').value;
                    const reason = item.querySelector('input[type="text"]:last-of-type').value;
                    
                    if (originalLabel && correctedLabel && reason) {
                        return {
                            original: originalLabel,
                            corrected: correctedLabel,
                            userReason: reason
                        };
                    }
                    return null;
                })
                .filter(correction => correction !== null);

            // Fetch policy documents from Google Drive
            const policyResponse = await chrome.runtime.sendMessage({
                action: 'getPolicyDocuments'
            });

            if (!policyResponse || policyResponse.error) {
                console.warn('[Xrefhub Popup] Could not fetch policy documents:', policyResponse?.error);
                return [];
            }

            const policyDocuments = policyResponse.policies;
            console.log('[Xrefhub Popup] Fetched policy documents:', Object.keys(policyDocuments));

            // Match labels to policy sections
            const policyReasons = labels.map(label => {
                const correction = corrections.find(c => c.corrected === label);
                const userReason = correction?.userReason || '';
                
                // Find matching policy section
                const policyMatch = findPolicyMatch(label, policyDocuments);
                
                if (policyMatch) {
                    return `${userReason} | Policy: ${policyMatch.section} - ${policyMatch.details}`;
                } else {
                    return userReason || 'Policy violation detected';
                }
            });

            return policyReasons;

        } catch (error) {
            console.error('[Xrefhub Popup] Error getting policy-based reasons:', error);
            return [];
        }
    }

    function findPolicyMatch(label, policyDocuments) {
        // Convert label to search terms
        const searchTerms = label.toLowerCase().split(' ');
        
        for (const [docName, content] of Object.entries(policyDocuments)) {
            const docContent = content.toLowerCase();
            
            // Look for policy sections that match the label
            for (const term of searchTerms) {
                if (docContent.includes(term)) {
                    // Extract the relevant policy section
                    const sectionMatch = extractPolicySection(docContent, term);
                    if (sectionMatch) {
                        return {
                            document: docName,
                            section: sectionMatch.section,
                            details: sectionMatch.details
                        };
                    }
                }
            }
        }
        
        return null;
    }

    function extractPolicySection(content, searchTerm) {
        // Split content into sections (looking for headers, numbered lists, etc.)
        const sections = content.split(/\n\s*\n/);
        
        for (const section of sections) {
            if (section.toLowerCase().includes(searchTerm)) {
                // Extract the first sentence or bullet point that contains the term
                const lines = section.split('\n');
                for (const line of lines) {
                    if (line.toLowerCase().includes(searchTerm) && line.trim().length > 10) {
                        return {
                            section: line.trim().substring(0, 50) + '...',
                            details: line.trim()
                        };
                    }
                }
            }
        }
        
        return null;
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
        const buttons = [analyzeButton, deeperAnalysisButton, testScanButton, debugScanButton, rescanButton, copyButton, submitButton];
        
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

    // Rescan with corrections button
    rescanButton.addEventListener('click', async () => {
        console.log('[Xrefhub Popup] Rescan with corrections requested');
        setLoadingState(true, 'Rescanning with corrections...');
        
        try {
            // Get user corrections as context
            const corrections = Array.from(correctionOptions.querySelectorAll('.correction-item'))
                .map(item => {
                    const originalLabel = item.querySelector('select').value;
                    const correctedLabel = item.querySelector('input[type="text"]:first-of-type').value;
                    const reason = item.querySelector('input[type="text"]:last-of-type').value;
                    
                    if (originalLabel && correctedLabel && reason) {
                        return `${originalLabel} → ${correctedLabel} (${reason})`;
                    }
                    return null;
                })
                .filter(correction => correction !== null);

            if (corrections.length === 0) {
                showToast('No corrections to apply', 'warning');
                return;
            }

            // Add corrections as context to the analysis
            const correctionContext = `User Corrections:\n${corrections.join('\n')}\n\nPlease consider these corrections when analyzing the content.`;
            
            const response = await chrome.runtime.sendMessage({
                action: 'analyze',
                content: postContent.value + '\n\n' + correctionContext,
                mediaUrl: scanData?.landingUrl || ''
            });
            
            if (response && response.error) {
                throw new Error(response.error);
            }

            if (response) {
                handleAnalysisResponse(response);
                showToast('Rescan completed with corrections', 'success');
            } else {
                throw new Error('No response from rescan');
            }
            
        } catch (error) {
            console.error('[Xrefhub Popup] Rescan failed:', error);
            showToast(`Rescan failed: ${error.message}`, 'error');
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