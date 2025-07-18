/**
 * @file This script is injected into a page to extract structured data.
 * It returns an object containing multiple fields with enhanced review page support.
 */

// Enhanced content scanning function
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

        // --- Status Indicators ---
        const statusElements = document.querySelectorAll('[class*="status"], [class*="label"], [class*="badge"], [class*="tag"]');
        statusElements.forEach((el, index) => {
            const text = el.innerText.trim();
            if (text && text.length < 100) result.statusIndicators[`status_${index}`] = { text, className: el.className, element: el.tagName.toLowerCase() };
        });

        // --- Form Data ---
        const formInputs = document.querySelectorAll('input, select, textarea, button');
        formInputs.forEach((input, index) => {
            const key = `input_${index}`;
            result.formData[key] = {
                type: input.type || input.tagName.toLowerCase(),
                value: input.value || input.innerText || '',
                placeholder: input.placeholder || '',
                name: input.name || '',
                id: input.id || ''
            };
        });

        // --- Table Data ---
        const tables = document.querySelectorAll('table');
        tables.forEach((table, index) => {
            const rows = table.querySelectorAll('tr');
            result.tableData[`table_${index}`] = {
                rowCount: rows.length,
                headers: [],
                sampleData: []
            };
            
            const headers = table.querySelectorAll('th');
            headers.forEach(th => result.tableData[`table_${index}`].headers.push(th.innerText.trim()));
            
            if (rows.length > 1) {
                const firstDataRow = rows[1].querySelectorAll('td');
                firstDataRow.forEach(td => result.tableData[`table_${index}`].sampleData.push(td.innerText.trim()));
            }
        });

        // --- UI Elements (buttons, links, etc.) ---
        const buttons = document.querySelectorAll('button, .btn, [role="button"]');
        buttons.forEach((btn, index) => {
            const text = btn.innerText.trim();
            if (text && text.length < 50) {
                result.uiElements[`button_${index}`] = {
                    text,
                    className: btn.className,
                    disabled: btn.disabled || false
                };
            }
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

        // --- Metadata ---
        result.metadata = {
            title: document.title || 'No title',
            url: window.location.href,
            userAgent: navigator.userAgent.substring(0, 100) + '...',
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
enhancedContentScan(); 