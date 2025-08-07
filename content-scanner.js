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
            metadata: {},
            images: [],
            arsLabels: [],
            iframeContent: [],
            mediaUrls: []
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

        // --- Enhanced Image Collection ---
        console.log('[Xrefhub Scanner] Extracting images with enhanced collection...');
        const images = document.querySelectorAll('img');
        console.log('[Xrefhub Scanner] Found', images.length, 'images on page');
        
        for (const img of images) {
            try {
                if (img.src && img.src.length > 0) {
                    const imageInfo = {
                        src: img.src,
                        alt: img.alt || '',
                        title: img.title || '',
                        width: img.naturalWidth || img.width || 0,
                        height: img.naturalHeight || img.height || 0,
                        className: img.className || '',
                        id: img.id || '',
                        dataAttributes: {}
                    };
                    
                    // Collect data attributes
                    for (const attr of img.attributes) {
                        if (attr.name.startsWith('data-')) {
                            imageInfo.dataAttributes[attr.name] = attr.value;
                        }
                    }
                    
                    result.images.push(imageInfo);
                }
            } catch (imgError) {
                console.log('[Xrefhub Scanner] Error processing image:', imgError.message);
            }
        }
        
        // --- ARS Label Detection ---
        console.log('[Xrefhub Scanner] Detecting ARS labels...');
        const arsSelectors = [
            '[data-testid*="ars"]',
            '[class*="ars"]',
            '[id*="ars"]',
            '[data-ars]',
            '.ars-label',
            '.ars-tag',
            '[data-label*="ars"]'
        ];
        
        for (const selector of arsSelectors) {
            try {
                const elements = document.querySelectorAll(selector);
                elements.forEach(element => {
                    const arsInfo = {
                        text: safeGetText(element),
                        selector: selector,
                        className: element.className || '',
                        id: element.id || '',
                        dataAttributes: {}
                    };
                    
                    // Collect data attributes
                    for (const attr of element.attributes) {
                        if (attr.name.startsWith('data-')) {
                            arsInfo.dataAttributes[attr.name] = attr.value;
                        }
                    }
                    
                    if (arsInfo.text && arsInfo.text.length > 0) {
                        result.arsLabels.push(arsInfo);
                    }
                });
            } catch (arsError) {
                console.log('[Xrefhub Scanner] Error with ARS selector', selector, ':', arsError.message);
            }
        }
        
        // --- Iframe Content Extraction ---
        console.log('[Xrefhub Scanner] Extracting iframe content...');
        const iframes = document.querySelectorAll('iframe');
        console.log('[Xrefhub Scanner] Found', iframes.length, 'iframes on page');
        
        for (const iframe of iframes) {
            try {
                const iframeInfo = {
                    src: iframe.src || '',
                    title: iframe.title || '',
                    width: iframe.width || 0,
                    height: iframe.height || 0,
                    className: iframe.className || '',
                    id: iframe.id || '',
                    dataAttributes: {}
                };
                
                // Collect data attributes
                for (const attr of iframe.attributes) {
                    if (attr.name.startsWith('data-')) {
                        iframeInfo.dataAttributes[attr.name] = attr.value;
                    }
                }
                
                result.iframeContent.push(iframeInfo);
            } catch (iframeError) {
                console.log('[Xrefhub Scanner] Error processing iframe:', iframeError.message);
            }
        }
        
        // --- Enhanced Media URL Collection ---
        console.log('[Xrefhub Scanner] Collecting media URLs...');
        const mediaSelectors = [
            'img[src]',
            'video[src]',
            'audio[src]',
            'iframe[src]',
            'source[src]',
            'link[href*=".jpg"], link[href*=".png"], link[href*=".gif"], link[href*=".webp"]',
            'a[href*=".jpg"], a[href*=".png"], a[href*=".gif"], a[href*=".webp"]'
        ];
        
        for (const selector of mediaSelectors) {
            try {
            const elements = document.querySelectorAll(selector);
                elements.forEach(element => {
                    const url = element.src || element.href;
                    if (url && url.length > 0) {
                        const mediaInfo = {
                            url: url,
                            type: element.tagName.toLowerCase(),
                            alt: element.alt || '',
                            title: element.title || '',
                            className: element.className || '',
                            id: element.id || ''
                        };
                        
                        result.mediaUrls.push(mediaInfo);
                    }
                });
            } catch (mediaError) {
                console.log('[Xrefhub Scanner] Error with media selector', selector, ':', mediaError.message);
            }
        }
                        alt: img.alt || '',
                        title: img.title || '',
                        width: img.width || 0,
                        height: img.height || 0,
                        naturalWidth: img.naturalWidth || 0,
                        naturalHeight: img.naturalHeight || 0,
                        className: img.className || '',
                        id: img.id || ''
                    };
                    
                    // Only include images that are likely to be content (not icons, etc.)
                    if (imageInfo.naturalWidth > 100 && imageInfo.naturalHeight > 100) {
                        result.images.push(imageInfo);
                        console.log('[Xrefhub Scanner] Added image:', imageInfo.src.substring(0, 50) + '...');
                    }
                }
            } catch (imgError) {
                console.log('[Xrefhub Scanner] Error processing image:', imgError.message);
            }
        }
        
        console.log('[Xrefhub Scanner] Extracted', result.images.length, 'content images');

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

        // --- Enhanced Image Collection ---
        console.log('[Xrefhub Scanner] Collecting images...');
        try {
            const images = document.querySelectorAll('img');
            images.forEach((img, index) => {
                try {
                    if (img.src && img.src.startsWith('http')) {
                        result.images.push({
                            src: img.src,
                            alt: img.alt || '',
                            title: img.title || '',
                            width: img.naturalWidth || img.width,
                            height: img.naturalHeight || img.height,
                            className: img.className || '',
                            id: img.id || ''
                        });
                    }
                } catch (imgError) {
                    console.log('[Xrefhub Scanner] Error processing image:', imgError.message);
                }
            });
            console.log('[Xrefhub Scanner] Collected', result.images.length, 'images');
        } catch (imageError) {
            console.log('[Xrefhub Scanner] Error collecting images:', imageError.message);
        }

        // --- ARS Label Detection ---
        console.log('[Xrefhub Scanner] Scanning for ARS labels...');
        try {
            const arsSelectors = [
                '[data-testid*="ars"]',
                '[class*="ars"]',
                '[id*="ars"]',
                '[aria-label*="ars"]',
                '[title*="ars"]'
            ];
            
            arsSelectors.forEach(selector => {
                try {
                    const elements = document.querySelectorAll(selector);
                    elements.forEach((el, index) => {
                        const text = safeGetText(el);
                        if (text && text.length > 0) {
                            result.arsLabels.push({
                                text: text,
                                selector: selector,
                                className: el.className || '',
                                id: el.id || '',
                                index: index
                            });
                        }
                    });
                } catch (selectorError) {
                    console.log('[Xrefhub Scanner] Error with ARS selector', selector, ':', selectorError.message);
                }
            });
            console.log('[Xrefhub Scanner] Found', result.arsLabels.length, 'ARS labels');
        } catch (arsError) {
            console.log('[Xrefhub Scanner] Error scanning ARS labels:', arsError.message);
        }

        // --- Iframe Content Extraction ---
        console.log('[Xrefhub Scanner] Extracting iframe content...');
        try {
            const iframes = document.querySelectorAll('iframe');
            iframes.forEach((iframe, index) => {
                try {
                    if (iframe.src && iframe.src.startsWith('http')) {
                        result.iframeContent.push({
                            src: iframe.src,
                            title: iframe.title || '',
                            width: iframe.width || '',
                            height: iframe.height || '',
                            className: iframe.className || '',
                            id: iframe.id || ''
                        });
                    }
                } catch (iframeError) {
                    console.log('[Xrefhub Scanner] Error processing iframe:', iframeError.message);
                }
            });
            console.log('[Xrefhub Scanner] Found', result.iframeContent.length, 'iframes');
        } catch (iframeError) {
            console.log('[Xrefhub Scanner] Error extracting iframe content:', iframeError.message);
        }

        // --- Enhanced Media URL Collection ---
        console.log('[Xrefhub Scanner] Collecting media URLs...');
        try {
            const mediaSelectors = [
                'img[src*="http"]',
                'video[src*="http"]',
                'audio[src*="http"]',
                'iframe[src*="http"]',
                'source[src*="http"]'
            ];
            
            mediaSelectors.forEach(selector => {
                try {
                    const elements = document.querySelectorAll(selector);
                    elements.forEach(el => {
                        if (el.src && el.src.startsWith('http')) {
                            result.mediaUrls.push({
                                type: el.tagName.toLowerCase(),
                                src: el.src,
                                alt: el.alt || '',
                                title: el.title || '',
                                width: el.naturalWidth || el.width || '',
                                height: el.naturalHeight || el.height || ''
                            });
                        }
                    });
                } catch (selectorError) {
                    console.log('[Xrefhub Scanner] Error with media selector', selector, ':', selectorError.message);
                }
            });
            console.log('[Xrefhub Scanner] Collected', result.mediaUrls.length, 'media URLs');
        } catch (mediaError) {
            console.log('[Xrefhub Scanner] Error collecting media URLs:', mediaError.message);
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