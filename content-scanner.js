/**
 * @file This script is injected into a page to extract structured data.
 * It returns an object containing multiple fields with enhanced review page support.
 */

function getPostContent() {
    const adText = document.body.innerText;
    let mediaUrl = '';

    // Try to find the main image (works for many sites)
    const mainImage = document.querySelector('meta[property="og:image"]');
    if (mainImage) {
        mediaUrl = mainImage.content;
    } else {
        // Fallback for sites that use a different structure (e.g., Twitter)
        const twitterImage = document.querySelector('meta[name="twitter:image"]');
        if (twitterImage) {
            mediaUrl = twitterImage.content;
        }
    }

    // Try to find the main video
    const mainVideo = document.querySelector('meta[property="og:video"]');
    if (mainVideo) {
        mediaUrl = mainVideo.content;
    }

    return {
        adText,
        mediaUrl,
    };
}

(() => {
    console.log('[Xrefhub Scanner] Starting enhanced structured data scan on:', window.location.href);

    const result = {
        postId: 'Not found',
        adText: 'Not found',
        landingUrl: 'Not found',
        pageUrl: window.location.href,
        extractedAt: new Date().toLocaleString(),
        // Enhanced fields for review pages
        reviewContext: {},
        formData: {},
        statusIndicators: {},
        tableData: {},
        uiElements: {},
        metadata: {}
    };

    // --- Strategy for Post ID (from URL) ---
    try {
        const urlParts = window.location.pathname.split('/');
        const statusIndex = urlParts.indexOf('status');
        if (statusIndex > -1 && urlParts[statusIndex + 1]) {
            result.postId = urlParts[statusIndex + 1];
        }
    } catch (e) {
        console.warn('[Xrefhub Scanner] Could not parse Post ID from URL.');
    }

    // --- Enhanced Strategy for Ad Text ---
    const tweetTextElement = document.querySelector('[data-testid="tweetText"]');
    if (tweetTextElement && tweetTextElement.innerText) {
        result.adText = tweetTextElement.innerText.trim();
        
        // --- Strategy for Landing URL (finds first link in the post) ---
        const linkElement = tweetTextElement.querySelector('a');
        if (linkElement && linkElement.href) {
            result.landingUrl = linkElement.href;
        }
    } else {
         const article = document.querySelector('article');
         if (article && article.innerText) {
             result.adText = article.innerText.trim();
             const linkInArticle = article.querySelector('a');
             if (linkInArticle && linkInArticle.href) {
                result.landingUrl = linkInArticle.href;
             }
         }
    }
    
    // --- Enhanced Review Page Context Extraction ---
    
    // Extract review-specific labels and status indicators
    const statusElements = document.querySelectorAll('[class*=status],class*="label],class*="badge],[class*="tag"]');
    statusElements.forEach((el, index) => {
        const text = el.innerText.trim();
        const className = el.className;
        if (text && text.length < 100) {
            result.statusIndicators[`status_${index}`] = {
                text: text,
                className: className,
                element: el.tagName.toLowerCase()
            };
        }
    });

    // Extract form data and inputs
    const formInputs = document.querySelectorAll('input, select, textarea, button');
    formInputs.forEach((input, index) => {
        const type = input.type || input.tagName.toLowerCase();
        const value = input.value || input.innerText || input.placeholder || input.name || input.id || `input_${index}`;
        
        if (value) {
            result.formData[value] = {
                type: type,
                value: value,
                placeholder: input.placeholder,
                element: input.tagName.toLowerCase()
            };
        }
    });

    // Extract table data
    const tables = document.querySelectorAll('table');
    tables.forEach((table, tableIndex) => {
        const tableData = [];
        const rows = table.querySelectorAll('tr');
        rows.forEach((row, rowIndex) => {
            const cells = row.querySelectorAll('td, th');
            const rowData = [];
            cells.forEach((cell, cellIndex) => {
                rowData.push({
                    text: cell.innerText.trim(),
                    isHeader: cell.tagName.toLowerCase() === 'th'
                });
            });
            if (rowData.length > 0) {
                tableData.push(rowData);
            }
        });
        if (tableData.length > 0) {
            result.tableData[`table_${tableIndex}`] = tableData;
        }
    });

    // Extract UI elements (buttons, dropdowns, etc.)
    const buttons = document.querySelectorAll('button, [role=button"], [class*="btn"], [class*="button"]');
    buttons.forEach((btn, index) => {
        const text = btn.innerText.trim();
        const className = btn.className;
        const disabled = btn.disabled;
        if (text && text.length <50) {
            result.uiElements[`button_${index}`] = {
                text: text,
                className: className,
                disabled: disabled,
                element: btn.tagName.toLowerCase()
            };
        }
    });

    // Extract metadata and structured data
    const metaTags = document.querySelectorAll('meta');
    metaTags.forEach((meta) => {
        const name = meta.getAttribute('name') || meta.getAttribute('property') || meta.getAttribute('itemprop');
        const content = meta.getAttribute('content');
        if (name && content) {
            result.metadata[name] = content;
        }
    });

    // Extract JSON-LD structured data
    const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
    jsonLdScripts.forEach((script, index) => {
        try {
            const jsonData = JSON.parse(script.innerText);
            result.metadata[`jsonLd_${index}`] = jsonData;
        } catch (e) {
            console.warn('[Xrefhub Scanner] Could not parse JSON-LD data');
        }
    });

    // Extract review-specific context (common patterns)
    const reviewContext = {};
    
    // Look for common review page patterns
    const reviewKeywords = ['review', 'approve', 'reject', 'pending', 'proved', 'rejected', 'escalate', 'risk', 'violation'];
    reviewKeywords.forEach(keyword => {
        const elements = document.querySelectorAll(`[class*="${keyword}"],id*="${keyword}", data-*="${keyword}"`);
        elements.forEach((el, index) => {
            const text = el.innerText.trim();
            if (text && text.length < 200) {
                reviewContext[`${keyword}_${index}`] = {
                    text: text,
                    element: el.tagName.toLowerCase(),
                    className: el.className
                };
            }
        });
    });

    // Look for specific review page indicators
    const reviewIndicators = {
        approval_status: document.querySelector('[class*="approved"], [class*="rejected"], [class*="pending"]'),
        risk_level: document.querySelector('[class*=risk], [class*=danger"], [class*="warning"]'),
        reviewer_info: document.querySelector('[class*="reviewer"],[class*="moderator"], [class*="admin"]'),
        timestamp: document.querySelector('[class*=time"], [class*=date], [datetime]'), 
        escalation: document.querySelector('[class*="escalate"], [class*=flag], [class*="report"]')
    };

    Object.entries(reviewIndicators).forEach(([key, element]) => {
        if (element) {
            reviewContext[key] = {
                text: element.innerText.trim(),
                element: element.tagName.toLowerCase(),
                className: element.className
            };
        }
    });

    result.reviewContext = reviewContext;

    if (result.adText === 'Not found') {
        console.error('[Xrefhub Scanner] Could not extract post text.');
    }

    console.log('[Xrefhub Scanner] Enhanced scan complete. Returning comprehensive data:', result);
    return result;
})(); 