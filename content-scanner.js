/**
 * @file This script is injected into a page to extract structured data.
 * It returns an object containing multiple fields.
 */

(() => {
    console.log('[Xrefhub Scanner] Starting structured data scan on:', window.location.href);

    const result = {
        postId: 'Not found',
        adText: 'Not found',
        landingUrl: 'Not found',
        pageUrl: window.location.href,
        extractedAt: new Date().toLocaleString()
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

    // --- Strategy for Ad Text ---
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
    
    if (result.adText === 'Not found') {
        console.error('[Xrefhub Scanner] Could not extract post text.');
    }

    console.log('[Xrefhub Scanner] Scan complete. Returning data:', result);
    return result;
})(); 