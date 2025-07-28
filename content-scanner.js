/**
 * @file This script is injected into a page to extract structured data.
 * It returns an object containing multiple fields with enhanced review page support.
 */

// Immediate confirmation that script is loaded
console.log('[Xrefhub Scanner] 🚀 Content scanner script loaded and executing!');
console.log('[Xrefhub Scanner] Current URL:', window.location.href);

// Enhanced content scanning function
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