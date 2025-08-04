/**
 * @file Enhanced popup with improved content scraping and analysis workflow
 * @version 2.0.0
 */

// Check if we're in a popup context
if (typeof window !== 'undefined') {
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

            // Perform the scan with extended timeout protection
            const scanResponse = await Promise.race([
                chrome.runtime.sendMessage({ 
                    action: 'scanPage', 
                    tabId: currentTab.id 
                }),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Scan timeout after 30 seconds')), 30000)
                )
            ]);

            console.log('[Xrefhub Popup] Raw scan response:', scanResponse);

            // Validate scan response
            if (!scanResponse) {
                throw new Error('No response from content scanner - service worker may not be ready');
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
        console.log('[Xrefhub Popup] Triggering enhanced content analysis with industry detection...');
        
        if (!postContent.value || postContent.value.trim().length < 10) {
            showToast('Please enter content to analyze', 'warning');
            return;
        }

        // Get current review mode
        const reviewMode = window.reviewModeSelector ? window.reviewModeSelector.getCurrentMode() : 'adReview';
        const modeConfig = window.reviewModeSelector ? window.reviewModeSelector.getModeConfig() : null;
        
        console.log(`[Xrefhub Popup] Using review mode: ${reviewMode}`);
        
        setLoadingState(true, `Analyzing content with industry detection (${modeConfig ? modeConfig.name : 'Standard'} mode)...`);
        
        try {
            // First, detect prohibited industries
            const industryAnalysis = detectProhibitedIndustries(postContent.value);
            console.log('[Xrefhub Popup] Industry detection completed:', {
                primaryIndustry: industryAnalysis.primaryIndustry,
                confidence: industryAnalysis.confidence,
                detectedIndustries: industryAnalysis.detectedIndustries.length
            });

            // Perform AI analysis
            const analysisResponse = await Promise.race([
                chrome.runtime.sendMessage({
                    action: 'analyze',
                    content: postContent.value,
                    mediaUrl: scanData?.landingUrl || '',
                    images: scanData?.images || [],
                    reviewMode: reviewMode,
                    modePrompt: modeConfig ? modeConfig.aiPrompt : null
                }),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Analysis timeout after 30 seconds')), 30000)
                )
            ]);

            console.log('[Xrefhub Popup] AI analysis response:', analysisResponse);

            if (analysisResponse && analysisResponse.error) {
                throw new Error(analysisResponse.error);
            }

            if (analysisResponse) {
                // Combine AI analysis with industry detection
                const enhancedResponse = {
                    ...analysisResponse,
                    industryDetection: industryAnalysis,
                    combinedLabels: [...(analysisResponse.suggestedLabels || []), ...industryAnalysis.suggestedLabels],
                    violationRisk: industryAnalysis.primaryIndustry !== "NONE" ? "HIGH" : "LOW",
                    enforcementAction: industryAnalysis.primaryIndustry !== "NONE" ? "BOUNCE POST" : "REVIEW"
                };

                console.log('[Xrefhub Popup] Enhanced analysis completed:', {
                    primaryIndustry: enhancedResponse.industryDetection.primaryIndustry,
                    confidence: enhancedResponse.industryDetection.confidence,
                    violationRisk: enhancedResponse.violationRisk,
                    enforcementAction: enhancedResponse.enforcementAction,
                    suggestedLabels: enhancedResponse.combinedLabels?.length || 0
                });

                handleAnalysisResponse(enhancedResponse);
                showToast('Enhanced analysis completed successfully', 'success');
            } else {
                throw new Error('No response from analysis');
            }

        } catch (error) {
            console.error('[Xrefhub Popup] Enhanced analysis failed:', error);
            handleError(error, 'Enhanced content analysis failed');
            showToast(`Enhanced analysis failed: ${error.message}`, 'error');
        } finally {
            setLoadingState(false);
        }
    }

    // --- URL Analysis Trigger ---
    async function triggerURLAnalysis() {
        console.log('[Xrefhub Popup] Triggering URL analysis...');
        
        const urlInput = document.getElementById('url-input');
        const url = urlInput.value.trim();
        
        if (!url) {
            showToast('Please enter a URL to analyze', 'warning');
            return;
        }

        // Validate URL format
        if (!isValidURL(url)) {
            showToast('Please enter a valid URL', 'error');
            return;
        }

        // Get current review mode
        const reviewMode = window.reviewModeSelector ? window.reviewModeSelector.getCurrentMode() : 'adReview';
        const modeConfig = window.reviewModeSelector ? window.reviewModeSelector.getModeConfig() : null;
        
        console.log(`[Xrefhub Popup] Analyzing URL with mode: ${reviewMode}`);
        
        setLoadingState(true, `Analyzing URL (${modeConfig ? modeConfig.name : 'Standard'} mode)...`);
        
        try {
            // Initialize URL analyzer if not already done
            if (!window.urlAnalyzer) {
                window.urlAnalyzer = new URLAnalyzer();
            }
            
            const analysisResponse = await window.urlAnalyzer.analyzeURL(url, reviewMode);
            
            console.log('[Xrefhub Popup] URL analysis response:', analysisResponse);

            if (analysisResponse && analysisResponse.error) {
                throw new Error(analysisResponse.error);
            }

            if (analysisResponse) {
                handleAnalysisResponse(analysisResponse);
                showToast('URL analysis completed successfully', 'success');
            } else {
                throw new Error('No response from URL analysis');
            }

        } catch (error) {
            console.error('[Xrefhub Popup] URL analysis failed:', error);
            handleError(error, 'URL analysis failed');
            showToast(`URL analysis failed: ${error.message}`, 'error');
        } finally {
            setLoadingState(false);
        }
    }

    // URL validation helper
    function isValidURL(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    // --- Enhanced Analysis Response Handler ---
    function handleAnalysisResponse(response) {
        console.log('[Xrefhub Popup] Handling enhanced analysis response...');
        
        currentAnalysis = response;

        // Display industry detection results if available
        if (response.industryDetection) {
            const industryInfo = response.industryDetection;
            console.log('[Xrefhub Popup] Industry detection results:', industryInfo);
            
            // Create industry detection display
            let industryDisplay = '';
            if (industryInfo.primaryIndustry !== "NONE") {
                industryDisplay = `
                    <div class="industry-detection">
                        <h4>🚨 Industry Detection Results</h4>
                        <p><strong>Primary Industry:</strong> ${industryInfo.primaryIndustry}</p>
                        <p><strong>Confidence:</strong> ${(industryInfo.confidence * 100).toFixed(1)}%</p>
                        <p><strong>Severity:</strong> ${industryInfo.severity}</p>
                        <p><strong>Violation Risk:</strong> ${response.violationRisk}</p>
                        <p><strong>Enforcement Action:</strong> ${response.enforcementAction}</p>
                        ${industryInfo.detectedIndustries.length > 1 ? 
                            `<p><strong>Other Detected:</strong> ${industryInfo.detectedIndustries.slice(1).map(d => d.industry).join(', ')}</p>` : 
                            ''
                        }
                    </div>
                `;
            } else {
                industryDisplay = `
                    <div class="industry-detection">
                        <h4>✅ Industry Detection Results</h4>
                        <p><strong>Status:</strong> No prohibited industries detected</p>
                        <p><strong>Violation Risk:</strong> ${response.violationRisk}</p>
                        <p><strong>Enforcement Action:</strong> ${response.enforcementAction}</p>
                    </div>
                `;
            }
            
            // Add industry detection to summary
            if (response.summary) {
                aiSummary.innerHTML = industryDisplay + '<hr>' + response.summary;
            } else {
                aiSummary.innerHTML = industryDisplay;
            }
            aiSummary.style.display = 'block';
        } else {
            // Update summary (fallback)
            if (response.summary) {
                aiSummary.textContent = response.summary;
                aiSummary.style.display = 'block';
            }
        }

        // Update resolution
        if (response.resolution) {
            aiResolution.textContent = response.resolution;
            aiResolution.style.display = 'block';
        }

        // Populate labels (use combined labels if available)
        const labelsToUse = response.combinedLabels || response.suggestedLabels;
        if (labelsToUse && Array.isArray(labelsToUse)) {
            populateLabels(labelsToUse);
        }

        // Update final output
        updateFinalOutput();

        // Enable deeper analysis
        deeperAnalysisButton.disabled = false;
        
        console.log('[Xrefhub Popup] Enhanced analysis response handled successfully');
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
        
        // Handle new structured output format
        if (typeof formattedOutput === 'object' && formattedOutput.text) {
            finalOutput.value = formattedOutput.text;
            
            // Store structured data for copy/paste functionality
            window.currentStructuredOutput = formattedOutput.structured;
            window.currentCopyText = formattedOutput.copyText;
            
            console.log('[Xrefhub Popup] Final output updated with structured format');
        } else {
            // Fallback to string output
            finalOutput.value = formattedOutput;
            console.log('[Xrefhub Popup] Final output updated with fallback format');
        }
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

        // Get username from settings or use default
        let username = 'Reviewer';
        try {
            const settings = await chrome.storage.local.get(['settings']);
            if (settings.settings?.username) {
                username = settings.settings.username;
            }
        } catch (error) {
            console.warn('[Xrefhub Popup] Could not get username from settings:', error);
        }

        const date = new Date().toLocaleDateString('en-US', {
            month: '2-digit',
            day: '2-digit',
            year: '2-digit'
        });

        // Get content summary from AI analysis
        let contentSummary = '';
        if (aiSummary && aiSummary.textContent) {
            contentSummary = aiSummary.textContent.trim();
        }

        // Clean and truncate summary to 120 characters
        contentSummary = contentSummary.replace(/[^\w\s\-_.,!?]/g, '').trim();
        const shortSummary = contentSummary.length > 120 ? contentSummary.substring(0, 117) + '...' : contentSummary;

        // Format labels as simple list
        const formattedLabels = correctedLabels.map((label, index) => {
            // Ensure label is a string
            let safeLabel = '';
            if (typeof label === 'string') {
                safeLabel = label;
            } else if (typeof label === 'object' && label !== null) {
                if (label.text) safeLabel = label.text;
                else if (label.label) safeLabel = label.label;
                else if (label.name) safeLabel = label.name;
                else safeLabel = JSON.stringify(label);
            } else {
                safeLabel = String(label);
            }
            
            // Clean label
            safeLabel = safeLabel.replace(/[^\w\s\-_]/g, '').trim();
            return safeLabel;
        });

        // Create final output format: Summary + Labels + Short Summary + Date/Signoff
        const finalOutput = {
            summary: contentSummary,
            labels: formattedLabels,
            shortSummary: shortSummary,
            date: date,
            username: username,
            text: `${contentSummary}\n\nLabels: ${formattedLabels.join(', ')}\n\nSummary: ${shortSummary}\n\n${date} - ${username}`
        };

        return finalOutput;
    }

    // --- Enhanced Object Serialization ---
    function safeStringify(obj, indent = 2) {
        try {
            if (typeof obj === 'object' && obj !== null) {
                return JSON.stringify(obj, null, indent);
            }
            return String(obj);
        } catch (error) {
            console.error('[Xrefhub Popup] Stringify error:', error);
            return String(obj);
        }
    }

    // --- Structured Username Logging ---
    function logStructuredData(data) {
        const structured = {
            timestamp: new Date().toISOString(),
            username: data.username || 'unknown',
            content: data.content || '',
            metadata: {
                source: data.source || 'manual',
                confidence: data.confidence || 0,
                labels: data.labels || []
            }
        };
        return JSON.stringify(structured, null, 2);
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

    // --- Enhanced Industry Detection System ---
    
    // All prohibited industries from X/Twitter enforcement workflow
    const PROHIBITED_INDUSTRIES = {
        Adult: {
            keywords: ["adult", "sexual", "porn", "xxx", "adult content", "mature", "explicit"],
            labels: [
                "Adult Content - No Disclosure",
                "Adult Services - Policy Violation",
                "Adult Merchandise - Missing #Ad",
                "Adult Content - Commercial Content",
                "Adult Services - Unlabeled"
            ]
        },
        Alcohol: {
            keywords: ["alcohol", "beer", "wine", "liquor", "drink", "beverage", "cocktail", "spirits"],
            labels: [
                "Alcohol - No Disclosure",
                "Alcoholic Beverages - Policy Violation",
                "Alcohol Promotion - Missing #Ad",
                "Alcohol Content - Commercial Content",
                "Alcoholic Products - Unlabeled"
            ]
        },
        Contraceptives: {
            keywords: ["contraceptive", "birth control", "condom", "protection", "family planning"],
            labels: [
                "Contraceptives - No Disclosure",
                "Birth Control - Policy Violation",
                "Contraceptive Products - Missing #Ad",
                "Family Planning - Commercial Content",
                "Contraceptives - Unlabeled"
            ]
        },
        Dating: {
            keywords: ["dating", "marriage", "relationship", "match", "love", "romance", "singles"],
            labels: [
                "Dating Services - No Disclosure",
                "Dating & Marriage - Policy Violation",
                "Dating Platform - Missing #Ad",
                "Dating Services - Commercial Content",
                "Dating & Marriage Services - Unlabeled"
            ]
        },
        Drugs: {
            keywords: ["drug", "marijuana", "cannabis", "weed", "substance", "medication", "pharmaceutical"],
            labels: [
                "Drugs - No Disclosure",
                "Drug Products - Policy Violation",
                "Drug Promotion - Missing #Ad",
                "Drug Content - Commercial Content",
                "Drug Products - Unlabeled"
            ]
        },
        Financial: {
            keywords: ["crypto", "cryptocurrency", "bitcoin", "investment", "trading", "finance", "money", "earn", "profit", "returns", "financial"],
            labels: [
                "Financial Services - No Disclosure",
                "Investment Platform - Missing #Ad",
                "Crypto Trading - Policy Violation",
                "Money Making - Commercial Content",
                "Financial Products - Unlabeled"
            ]
        },
        Gambling: {
            keywords: ["gambling", "casino", "lottery", "bet", "wager", "poker", "blackjack", "roulette", "slot", "sports betting", "online casino", "gaming", "jackpot", "win", "winning", "odds", "betting", "payout", "bonus", "free spins", "deposit", "withdrawal", "real money", "cash out"],
            labels: [
                "Gambling - No Disclosure",
                "Casino Promotion - Policy Violation",
                "Sports Betting - Missing #Ad",
                "Online Gaming - Commercial Content",
                "Gambling Content - Policy Violation"
            ]
        },
        Health: {
            keywords: ["supplement", "vitamin", "diet", "weight loss", "fitness", "health", "wellness", "nutrition"],
            labels: [
                "Health & Wellness - No Disclosure",
                "Health Supplements - Policy Violation",
                "Weight Loss - Missing #Ad",
                "Health Products - Commercial Content",
                "Health & Wellness Supplements - Unlabeled"
            ]
        },
        Tobacco: {
            keywords: ["tobacco", "cigarette", "vape", "smoking", "nicotine", "cigar"],
            labels: [
                "Tobacco - No Disclosure",
                "Tobacco Products - Policy Violation",
                "Tobacco Promotion - Missing #Ad",
                "Tobacco Content - Commercial Content",
                "Tobacco Products - Unlabeled"
            ]
        },
        Weapons: {
            keywords: ["weapon", "gun", "ammunition", "firearm", "shooting", "arms", "military"],
            labels: [
                "Weapons - No Disclosure",
                "Weapon Products - Policy Violation",
                "Weapon Promotion - Missing #Ad",
                "Weapon Content - Commercial Content",
                "Weapon Products - Unlabeled"
            ]
        }
    };

    // Enhanced industry detection with confidence scoring
    function detectProhibitedIndustries(content) {
        console.log('[Xrefhub Popup] Detecting prohibited industries...');
        
        const analysis = {
            detectedIndustries: [],
            confidence: 0.0,
            severity: "NONE",
            suggestedLabels: [],
            primaryIndustry: "NONE"
        };

        // Check each prohibited industry
        for (const [industry, config] of Object.entries(PROHIBITED_INDUSTRIES)) {
            const foundKeywords = config.keywords.filter(keyword => 
                content.toLowerCase().includes(keyword.toLowerCase())
            );
            
            if (foundKeywords.length > 0) {
                analysis.detectedIndustries.push({
                    industry: industry,
                    keywords: foundKeywords,
                    confidence: Math.min(0.95, foundKeywords.length * 0.2),
                    labels: config.labels
                });
                
                console.log(`🚨 ${industry} detected with keywords: ${foundKeywords.join(', ')}`);
            }
        }

        // Determine primary industry and overall confidence
        if (analysis.detectedIndustries.length > 0) {
            // Sort by confidence and take the highest
            analysis.detectedIndustries.sort((a, b) => b.confidence - a.confidence);
            const primary = analysis.detectedIndustries[0];
            
            analysis.primaryIndustry = primary.industry;
            analysis.confidence = primary.confidence;
            analysis.severity = primary.confidence > 0.8 ? "HIGH" : primary.confidence > 0.5 ? "MEDIUM" : "LOW";
            analysis.suggestedLabels = primary.labels;
            
            console.log(`🎯 Primary industry: ${analysis.primaryIndustry} (confidence: ${analysis.confidence})`);
        }

        return analysis;
    }

    // Enhanced analysis with industry detection
    async function enhancedAnalysisWithIndustryDetection(content, mediaUrl, images = []) {
        console.log('[Xrefhub Popup] Starting enhanced analysis with industry detection...');
        
        try {
            // First, detect prohibited industries
            const industryAnalysis = detectProhibitedIndustries(content);
            
            // Get AI analysis
            const aiResponse = await chrome.runtime.sendMessage({
                action: 'handleAnalysis',
                content: content,
                mediaUrl: mediaUrl,
                images: images
            });

            if (!aiResponse || aiResponse.error) {
                throw new Error(aiResponse?.error || 'AI analysis failed');
            }

            // Combine AI analysis with industry detection
            const enhancedAnalysis = {
                ...aiResponse,
                industryDetection: industryAnalysis,
                combinedLabels: [...(aiResponse.suggestedLabels || []), ...industryAnalysis.suggestedLabels],
                violationRisk: industryAnalysis.primaryIndustry !== "NONE" ? "HIGH" : "LOW",
                enforcementAction: industryAnalysis.primaryIndustry !== "NONE" ? "BOUNCE POST" : "REVIEW"
            };

            console.log('[Xrefhub Popup] Enhanced analysis completed:', {
                primaryIndustry: enhancedAnalysis.industryDetection.primaryIndustry,
                confidence: enhancedAnalysis.industryDetection.confidence,
                violationRisk: enhancedAnalysis.violationRisk,
                enforcementAction: enhancedAnalysis.enforcementAction
            });

            return enhancedAnalysis;

        } catch (error) {
            console.error('[Xrefhub Popup] Enhanced analysis failed:', error);
            throw error;
        }
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

    // URL analyze button
    const analyzeUrlButton = document.getElementById('analyze-url-button');
    if (analyzeUrlButton) {
        analyzeUrlButton.addEventListener('click', triggerURLAnalysis);
    }

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

    // Enhanced AI Chat functionality with policy library access
    chatSendButton.addEventListener('click', async () => {
        const message = chatInput.value.trim();
        if (!message) return;
        
        chatInput.value = '';
        chatHistory.push({ role: 'user', content: message });
        updateChatLog();
        
        try {
            // Get current review mode for context
            const reviewMode = window.reviewModeSelector ? window.reviewModeSelector.getCurrentMode() : 'adReview';
            const modeConfig = window.reviewModeSelector ? window.reviewModeSelector.getModeConfig() : null;
            
            // Get policy documents for AI context
            const policyResponse = await chrome.runtime.sendMessage({
                action: 'getPolicyDocuments'
            });
            
            const policyContext = policyResponse?.policies ? 
                `Policy Library Available: ${Object.keys(policyResponse.policies).join(', ')}` : 
                'No policy documents available';
            
            const enhancedMessage = `[Review Mode: ${modeConfig?.name || 'Standard'}]
[${policyContext}]

User Question: ${message}

Please provide a comprehensive answer that:
1. Addresses the user's specific question
2. References relevant policy documents when applicable
3. Provides detailed explanations and reasoning
4. Includes practical examples and recommendations
5. Uses the policy library to quote specific sections when relevant`;

            const response = await chrome.runtime.sendMessage({
                action: 'chat',
                message: enhancedMessage,
                history: chatHistory,
                reviewMode: reviewMode,
                policyContext: policyContext
            });
            
            if (response && response.error) {
                throw new Error(response.error);
            }
            
            chatHistory.push({ role: 'assistant', content: response.reply || response });
            updateChatLog();
            
        } catch (error) {
            console.error('[Xrefhub Popup] Enhanced chat failed:', error);
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
    
    // Initialize review mode selector
    initializeReviewModeSelector();
    });
}

// --- Connection Status Management ---
async function initializeConnectionStatus() {
    try {
        console.log('[Xrefhub Popup] Initializing connection status...');
        
        // Create connection status manager
        const connectionManager = new ConnectionStatusManager();
        
        // Check all connections
        const status = await connectionManager.checkAllConnections();
        
        // Display status in popup
        connectionManager.displayStatusInPopup();
        
        console.log('[Xrefhub Popup] Connection status checked:', status);
        
        // Store manager for later use
        window.connectionManager = connectionManager;
        
    } catch (error) {
        console.error('[Xrefhub Popup] Connection status error:', error);
        
        // Show error in status container
        const statusContainer = document.getElementById('connection-status');
        if (statusContainer) {
            statusContainer.innerHTML = `
                <div class="connection-status">
                    <h3>Connection Status</h3>
                    <div class="status-item error">
                        <span class="service-name">Status Check</span>
                        <span class="status-indicator">❌</span>
                        <span class="status-message">Error checking connections: ${error.message}</span>
                    </div>
                </div>
            `;
        }
    }
}

// --- Review Mode Selector Management ---
function initializeReviewModeSelector() {
    try {
        console.log('[Xrefhub Popup] Initializing review mode selector...');
        
        // Create review mode selector
        const reviewModeSelector = new ReviewModeSelector();
        
        // Insert the selector into the container
        const container = document.getElementById('review-mode-container');
        if (container) {
            const selectorElement = reviewModeSelector.createModeSelector();
            container.appendChild(selectorElement);
            
            // Initialize the selector
            reviewModeSelector.init();
            
            // Store for later use
            window.reviewModeSelector = reviewModeSelector;
            
            console.log('[Xrefhub Popup] Review mode selector initialized');
        } else {
            console.error('[Xrefhub Popup] Review mode container not found');
        }
        
    } catch (error) {
        console.error('[Xrefhub Popup] Review mode selector error:', error);
    }
} 