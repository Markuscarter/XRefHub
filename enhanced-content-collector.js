/**
 * Enhanced Content Collector
 * Collects images, ARS labels, iframe content, and media URLs
 */

class EnhancedContentCollector {
    constructor() {
        this.collectedData = {
            images: [],
            arsLabels: [],
            iframeContent: [],
            mediaUrls: []
        };
    }

    // Collect all images with enhanced metadata
    collectImages() {
        console.log('[Enhanced Collector] Collecting images...');
        const images = document.querySelectorAll('img');
        
        images.forEach((img, index) => {
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
                    
                    this.collectedData.images.push(imageInfo);
                }
            } catch (error) {
                console.log('[Enhanced Collector] Error processing image:', error.message);
            }
        });
        
        console.log('[Enhanced Collector] Collected', this.collectedData.images.length, 'images');
    }

    // Collect ARS labels
    collectARSLabels() {
        console.log('[Enhanced Collector] Collecting ARS labels...');
        const arsSelectors = [
            '[data-testid*="ars"]',
            '[class*="ars"]',
            '[id*="ars"]',
            '[data-ars]',
            '.ars-label',
            '.ars-tag',
            '[data-label*="ars"]'
        ];
        
        arsSelectors.forEach(selector => {
            try {
                const elements = document.querySelectorAll(selector);
                elements.forEach(element => {
                    const arsInfo = {
                        text: this.safeGetText(element),
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
                        this.collectedData.arsLabels.push(arsInfo);
                    }
                });
            } catch (error) {
                console.log('[Enhanced Collector] Error with ARS selector', selector, ':', error.message);
            }
        });
        
        console.log('[Enhanced Collector] Collected', this.collectedData.arsLabels.length, 'ARS labels');
    }

    // Collect iframe content
    collectIframeContent() {
        console.log('[Enhanced Collector] Collecting iframe content...');
        const iframes = document.querySelectorAll('iframe');
        
        iframes.forEach(iframe => {
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
                
                this.collectedData.iframeContent.push(iframeInfo);
            } catch (error) {
                console.log('[Enhanced Collector] Error processing iframe:', error.message);
            }
        });
        
        console.log('[Enhanced Collector] Collected', this.collectedData.iframeContent.length, 'iframes');
    }

    // Collect media URLs
    collectMediaUrls() {
        console.log('[Enhanced Collector] Collecting media URLs...');
        const mediaSelectors = [
            'img[src]',
            'video[src]',
            'audio[src]',
            'iframe[src]',
            'source[src]',
            'link[href*=".jpg"], link[href*=".png"], link[href*=".gif"], link[href*=".webp"]',
            'a[href*=".jpg"], a[href*=".png"], a[href*=".gif"], a[href*=".webp"]'
        ];
        
        mediaSelectors.forEach(selector => {
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
                        
                        this.collectedData.mediaUrls.push(mediaInfo);
                    }
                });
            } catch (error) {
                console.log('[Enhanced Collector] Error with media selector', selector, ':', error.message);
            }
        });
        
        console.log('[Enhanced Collector] Collected', this.collectedData.mediaUrls.length, 'media URLs');
    }

    // Safe text extraction helper
    safeGetText(element) {
        try {
            if (element && element.innerText && typeof element.innerText === 'string') {
                return element.innerText.trim();
            }
            return '';
        } catch (error) {
            console.log('[Enhanced Collector] Error getting text from element:', error.message);
            return '';
        }
    }

    // Collect all enhanced content
    collectAll() {
        console.log('[Enhanced Collector] Starting enhanced content collection...');
        
        this.collectImages();
        this.collectARSLabels();
        this.collectIframeContent();
        this.collectMediaUrls();
        
        console.log('[Enhanced Collector] Enhanced content collection completed');
        return this.collectedData;
    }

    // Get specific data type
    getImages() {
        return this.collectedData.images;
    }

    getARSLabels() {
        return this.collectedData.arsLabels;
    }

    getIframeContent() {
        return this.collectedData.iframeContent;
    }

    getMediaUrls() {
        return this.collectedData.mediaUrls;
    }

    // Clear collected data
    clear() {
        this.collectedData = {
            images: [],
            arsLabels: [],
            iframeContent: [],
            mediaUrls: []
        };
    }
}

// Export for use in other modules
window.EnhancedContentCollector = EnhancedContentCollector; 