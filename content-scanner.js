/**
 * @file This script is injected into a page to extract structured data.
 * It returns an object containing multiple fields with enhanced review page support.
 */

// A more robust, single-function structure for content scanning.
(async () => {
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

        // --- All other data extraction logic from the original file ---
        // (This includes statusIndicators, formData, tables, buttons, metadata, etc.)

        const statusElements = document.querySelectorAll('[class*="status"], [class*="label"], [class*="badge"], [class*="tag"]');
        statusElements.forEach((el, index) => {
            const text = el.innerText.trim();
            if (text && text.length < 100) result.statusIndicators[`status_${index}`] = { text, className: el.className, element: el.tagName.toLowerCase() };
        });

        const formInputs = document.querySelectorAll('input, select, textarea, button');
        formInputs.forEach((input, index) => {
            const type = input.type || input.tagName.toLowerCase();
            const name = input.name || input.id || `input_${index}`;
            if (input.value || input.placeholder) result.formData[name] = { type, value: input.value, placeholder: input.placeholder, element: input.tagName.toLowerCase() };
        });

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

        const buttons = document.querySelectorAll('button, [role="button"], [class*="btn"], [class*="button"]');
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

        const metaTags = document.querySelectorAll('meta');
        metaTags.forEach((meta) => {
            const name = meta.getAttribute('name') || meta.getAttribute('property') || meta.getAttribute('itemprop');
            const content = meta.getAttribute('content');
            if (name && content) {
                result.metadata[name] = content;
            }
        });

        const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
        jsonLdScripts.forEach((script, index) => {
            try {
                const jsonData = JSON.parse(script.innerText);
                result.metadata[`jsonLd_${index}`] = jsonData;
            } catch (e) {
                console.warn('[Xrefhub Scanner] Could not parse JSON-LD data');
            }
        });

        function findContentAfterHeading(keywords) {
            for (const tag of ['h1', 'h2', 'h3', 'h4', 'strong', 'b']) {
                for (const el of document.querySelectorAll(tag)) {
                    const headingText = el.innerText.toLowerCase();
                    if (keywords.some(k => headingText.includes(k))) {
                        let nextEl = el.nextElementSibling;
                        while (nextEl && (nextEl.tagName === 'BR' || nextEl.children.length > 0)) {
                            nextEl = nextEl.nextElementSibling;
                        }
                        if (nextEl && nextEl.innerText) return nextEl.innerText.trim();
                    }
                }
            }
            return null;
        }

        result.reviewContext.agentNotes = findContentAfterHeading(['notes', 'comments', 'feedback', 'review history']);
        result.reviewContext.targetingInfo = findContentAfterHeading(['targeting', 'audience', 'location', 'market']);
        result.reviewContext.userBio = findContentAfterHeading(['about the user', 'user profile', 'bio']);
        
        const labelsContainerText = findContentAfterHeading(['existing labels', 'current tags', 'labels applied']);
        if (labelsContainerText) {
            result.reviewContext.existingLabels = labelsContainerText.split('\n').filter(l => l.trim() !== '');
        }

        // Look for common review page patterns
        const reviewKeywords = ['review', 'approve', 'reject', 'pending', 'proved', 'rejected', 'escalate', 'risk', 'violation'];
        reviewKeywords.forEach(keyword => {
            const elements = document.querySelectorAll(`[class*="${keyword}"],id*="${keyword}", data-*="${keyword}"`);
            elements.forEach((el, index) => {
                const text = el.innerText.trim();
                if (text && text.length < 200) {
                    result.reviewContext[`${keyword}_${index}`] = {
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
            risk_level: document.querySelector('[class*="risk"], [class*="danger"], [class*="warning"]'),
            reviewer_info: document.querySelector('[class*="reviewer"], [class*="moderator"], [class*="admin"]'),
            timestamp: document.querySelector('[class*="time"], [class*="date"], [datetime]'),
            escalation: document.querySelector('[class*="escalate"], [class*="flag"], [class*="report"]')
        };

        Object.entries(reviewIndicators).forEach(([key, element]) => {
            if (element) {
                result.reviewContext[key] = {
                    text: element.innerText.trim(),
                    element: element.tagName.toLowerCase(),
                    className: element.className
                };
            }
        });

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

        console.log('[Xrefhub Scanner] Scan complete.', result);
        return result;

    } catch (error) {
        console.error('[Xrefhub Scanner] A critical error occurred during scanning:', error);
        return { error: `Scanner failed: ${error.message}`, adText: 'Error during scan.' };
    }
})(); 