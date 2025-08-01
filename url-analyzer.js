/**
 * URL Analyzer for Xrefhub Extension
 * Analyzes content from URLs without navigating to the page
 */

class URLAnalyzer {
    constructor() {
        this.cache = new Map();
        this.maxCacheSize = 50;
    }

    // Analyze content from a URL
    async analyzeURL(url, reviewMode = 'adReview') {
        console.log('[URL Analyzer] Starting URL analysis:', url);
        
        try {
            // Validate URL
            if (!this.isValidURL(url)) {
                throw new Error('Invalid URL format');
            }

            // Check cache first
            const cacheKey = `${url}_${reviewMode}`;
            if (this.cache.has(cacheKey)) {
                console.log('[URL Analyzer] Using cached result for:', url);
                return this.cache.get(cacheKey);
            }

            // Fetch content from URL
            const content = await this.fetchURLContent(url);
            
            // Analyze the content
            const analysis = await this.analyzeContent(content, url, reviewMode);
            
            // Cache the result
            this.cacheResult(cacheKey, analysis);
            
            console.log('[URL Analyzer] URL analysis completed:', url);
            return analysis;
            
        } catch (error) {
            console.error('[URL Analyzer] URL analysis failed:', error);
            throw error;
        }
    }

    // Validate URL format
    isValidURL(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    // Fetch content from URL using background script
    async fetchURLContent(url) {
        console.log('[URL Analyzer] Fetching content from URL:', url);
        
        try {
            const response = await chrome.runtime.sendMessage({
                action: 'fetchURLContent',
                url: url
            });

            if (response.error) {
                throw new Error(response.error);
            }

            return response.content;
            
        } catch (error) {
            console.error('[URL Analyzer] Failed to fetch URL content:', error);
            throw new Error(`Failed to fetch content from URL: ${error.message}`);
        }
    }

    // Analyze content with specified review mode
    async analyzeContent(content, sourceUrl, reviewMode) {
        console.log('[URL Analyzer] Analyzing content with mode:', reviewMode);
        
        try {
            const analysisResponse = await chrome.runtime.sendMessage({
                action: 'analyze',
                content: content,
                sourceUrl: sourceUrl,
                reviewMode: reviewMode,
                analysisType: 'url'
            });

            if (analysisResponse.error) {
                throw new Error(analysisResponse.error);
            }

            return {
                ...analysisResponse,
                sourceUrl: sourceUrl,
                analysisType: 'url',
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            console.error('[URL Analyzer] Content analysis failed:', error);
            throw error;
        }
    }

    // Cache analysis result
    cacheResult(key, result) {
        if (this.cache.size >= this.maxCacheSize) {
            // Remove oldest entry
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        
        this.cache.set(key, result);
        console.log('[URL Analyzer] Cached result for:', key);
    }

    // Clear cache
    clearCache() {
        this.cache.clear();
        console.log('[URL Analyzer] Cache cleared');
    }

    // Get cache statistics
    getCacheStats() {
        return {
            size: this.cache.size,
            maxSize: this.maxCacheSize,
            keys: Array.from(this.cache.keys())
        };
    }

    // Batch analyze multiple URLs
    async analyzeMultipleURLs(urls, reviewMode = 'adReview') {
        console.log('[URL Analyzer] Starting batch analysis of', urls.length, 'URLs');
        
        const results = [];
        const errors = [];
        
        for (let i = 0; i < urls.length; i++) {
            const url = urls[i];
            try {
                console.log(`[URL Analyzer] Analyzing URL ${i + 1}/${urls.length}:`, url);
                
                const result = await this.analyzeURL(url, reviewMode);
                results.push({
                    url: url,
                    index: i + 1,
                    result: result,
                    status: 'success'
                });
                
                // Add delay between requests to avoid overwhelming
                if (i < urls.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
                
            } catch (error) {
                console.error(`[URL Analyzer] Error analyzing URL ${i + 1}:`, error);
                errors.push({
                    url: url,
                    index: i + 1,
                    error: error.message,
                    status: 'error'
                });
            }
        }
        
        return {
            results: results,
            errors: errors,
            total: urls.length,
            successful: results.length,
            failed: errors.length
        };
    }

    // Extract URLs from text content
    extractURLs(text) {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const urls = text.match(urlRegex) || [];
        return urls.filter(url => this.isValidURL(url));
    }

    // Analyze content that contains URLs
    async analyzeContentWithURLs(content, reviewMode = 'adReview') {
        console.log('[URL Analyzer] Analyzing content with embedded URLs');
        
        const urls = this.extractURLs(content);
        
        if (urls.length === 0) {
            // No URLs found, analyze content directly
            return await this.analyzeContent(content, null, reviewMode);
        }
        
        // Analyze each URL found in content
        const urlAnalysis = await this.analyzeMultipleURLs(urls, reviewMode);
        
        // Combine content analysis with URL analysis
        const contentAnalysis = await this.analyzeContent(content, null, reviewMode);
        
        return {
            contentAnalysis: contentAnalysis,
            urlAnalysis: urlAnalysis,
            urlsFound: urls.length,
            combinedAnalysis: this.combineAnalyses(contentAnalysis, urlAnalysis)
        };
    }

    // Combine multiple analyses into a single result
    combineAnalyses(contentAnalysis, urlAnalysis) {
        const combined = {
            summary: contentAnalysis.summary,
            resolution: contentAnalysis.resolution,
            suggestedLabels: [...(contentAnalysis.suggestedLabels || [])],
            urlResults: urlAnalysis.results,
            urlErrors: urlAnalysis.errors,
            timestamp: new Date().toISOString()
        };

        // Add labels from URL analyses
        urlAnalysis.results.forEach(urlResult => {
            if (urlResult.result.suggestedLabels) {
                combined.suggestedLabels.push(...urlResult.result.suggestedLabels);
            }
        });

        // Remove duplicates from labels
        combined.suggestedLabels = [...new Set(combined.suggestedLabels)];

        return combined;
    }
}

// Export for use in other modules
window.URLAnalyzer = URLAnalyzer; 