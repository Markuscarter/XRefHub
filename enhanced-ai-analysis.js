/**
 * @file Enhanced AI Analysis with Multilayer Context Understanding
 * Integrates multilayer context analysis with semantic search and AI analysis
 */

import { getMultilayerAnalyzer, enhancedSemanticSearch } from './multilayer-context-analyzer.js';
import { getVectorSearchEngine, fetchRelevantDocuments } from './vector-search.js';

/**
 * Enhanced AI Analysis System
 */
export class EnhancedAIAnalysis {
    constructor() {
        this.multilayerAnalyzer = getMultilayerAnalyzer();
        this.vectorSearchEngine = getVectorSearchEngine();
        this.analysisCache = new Map();
    }

    /**
     * Main analysis function with multilayer context understanding
     */
    async analyzeContentWithMultilayerContext(content, context = {}, options = {}) {
        console.log('[EnhancedAIAnalysis] Starting enhanced analysis with multilayer context...');
        
        const cacheKey = this.generateCacheKey(content, context, options);
        if (this.analysisCache.has(cacheKey)) {
            return this.analysisCache.get(cacheKey);
        }

        try {
            // Step 1: Multilayer Context Analysis
            console.log('[EnhancedAIAnalysis] Step 1: Performing multilayer context analysis...');
            const multilayerAnalysis = await this.multilayerAnalyzer.analyzeContent(content, context);
            
            // Step 2: Generate Enhanced Semantic Query
            console.log('[EnhancedAIAnalysis] Step 2: Generating enhanced semantic query...');
            const semanticQuery = this.generateEnhancedSemanticQuery(multilayerAnalysis);
            
            // Step 3: Semantic Search with Context
            console.log('[EnhancedAIAnalysis] Step 3: Performing semantic search with context...');
            const searchResults = await this.performContextualSearch(semanticQuery, multilayerAnalysis);
            
            // Step 4: AI Analysis with Context
            console.log('[EnhancedAIAnalysis] Step 4: Performing AI analysis with context...');
            const aiAnalysis = await this.performContextualAIAnalysis(content, searchResults, multilayerAnalysis, options);
            
            // Step 5: Synthesize Results
            console.log('[EnhancedAIAnalysis] Step 5: Synthesizing results...');
            const finalAnalysis = this.synthesizeAnalysisResults(content, multilayerAnalysis, searchResults, aiAnalysis);
            
            // Cache the result
            this.analysisCache.set(cacheKey, finalAnalysis);
            
            console.log('[EnhancedAIAnalysis] Enhanced analysis completed successfully');
            return finalAnalysis;
            
        } catch (error) {
            console.error('[EnhancedAIAnalysis] Error in enhanced analysis:', error);
            throw error;
        }
    }

    /**
     * Generate enhanced semantic query based on multilayer analysis
     */
    generateEnhancedSemanticQuery(multilayerAnalysis) {
        const { layers, summary } = multilayerAnalysis;
        
        // Build query from original content
        let query = multilayerAnalysis.content;
        
        // Add context from most relevant layers
        const relevantLayers = Object.entries(layers)
            .filter(([name, layer]) => layer.relevance > 0.4 && layer.confidence > 0.3)
            .sort((a, b) => b[1].relevance - a[1].relevance)
            .slice(0, 3); // Top 3 most relevant layers
        
        for (const [layerName, layer] of relevantLayers) {
            const contextKeywords = this.extractLayerContextKeywords(layer);
            if (contextKeywords.length > 0) {
                query += ` ${contextKeywords.join(' ')}`;
            }
        }
        
        // Add summary insights
        if (summary.keyInsights && summary.keyInsights.length > 0) {
            query += ` ${summary.keyInsights.join(' ')}`;
        }
        
        // Add risk factors if any
        if (summary.riskFactors && summary.riskFactors.length > 0) {
            query += ` ${summary.riskFactors.join(' ')}`;
        }
        
        return query.trim();
    }

    /**
     * Perform semantic search with contextual understanding
     */
    async performContextualSearch(semanticQuery, multilayerAnalysis) {
        try {
            // Use the enhanced semantic query for search
            const searchResults = await fetchRelevantDocuments(semanticQuery, 'all', 5);
            
            // Enhance search results with context layer information
            const contextualResults = searchResults.map(result => ({
                ...result,
                contextRelevance: this.calculateContextRelevance(result, multilayerAnalysis),
                layerMatch: this.identifyMatchingLayers(result, multilayerAnalysis)
            }));
            
            return contextualResults;
        } catch (error) {
            console.error('[EnhancedAIAnalysis] Error in contextual search:', error);
            return [];
        }
    }

    /**
     * Perform AI analysis with contextual understanding
     */
    async performContextualAIAnalysis(content, searchResults, multilayerAnalysis, options) {
        try {
            // Prepare context-aware prompt
            const contextPrompt = this.buildContextAwarePrompt(content, multilayerAnalysis, searchResults);
            
            // Get AI provider
            const provider = await this.getAIProvider();
            const apiKey = await this.getAPIKey(provider);
            
            // Perform AI analysis with context
            const aiResult = await this.callAIWithContext(contextPrompt, provider, apiKey, options);
            
            return {
                aiAnalysis: aiResult,
                contextUsed: multilayerAnalysis.summary,
                searchResultsUsed: searchResults.length
            };
        } catch (error) {
            console.error('[EnhancedAIAnalysis] Error in AI analysis:', error);
            throw error;
        }
    }

    /**
     * Build context-aware prompt for AI analysis
     */
    buildContextAwarePrompt(content, multilayerAnalysis, searchResults) {
        const { layers, summary } = multilayerAnalysis;
        
        let prompt = `You are an Expert Content Policy Analyst with deep contextual understanding. Analyze this content with multilayer context awareness:

**Content to Analyze:**
"${content}"

**Multilayer Context Analysis:**
`;

        // Add relevant layer information
        const relevantLayers = Object.entries(layers)
            .filter(([name, layer]) => layer.relevance > 0.3)
            .sort((a, b) => b[1].relevance - a[1].relevance);

        for (const [layerName, layer] of relevantLayers) {
            prompt += `\n**${layerName} Context:** ${layer.description}`;
            if (layer.analysis) {
                const keyInsights = this.extractKeyInsightsFromLayer(layer);
                if (keyInsights.length > 0) {
                    prompt += `\nKey insights: ${keyInsights.join(', ')}`;
                }
            }
        }

        // Add summary information
        if (summary.primaryContext) {
            prompt += `\n\n**Primary Context:** ${summary.primaryContext}`;
        }
        
        if (summary.riskFactors && summary.riskFactors.length > 0) {
            prompt += `\n\n**Risk Factors:** ${summary.riskFactors.join(', ')}`;
        }

        // Add search results context
        if (searchResults.length > 0) {
            prompt += `\n\n**Relevant Policy Documents Found:** ${searchResults.length} documents`;
            prompt += `\n**Most Relevant Context:** ${searchResults[0]?.relevanceScore || 'N/A'}`;
        }

        prompt += `

**Your Analysis Should Consider:**
1. **Surface Level:** What is explicitly stated?
2. **Emotional Context:** What emotions are expressed or implied?
3. **Implicit Meaning:** What assumptions or expectations are hidden?
4. **Comparative Context:** How does this compare to standards or alternatives?
5. **Temporal Context:** Is this a recurring issue or one-time event?
6. **Cultural/Social Context:** What cultural or social factors are relevant?
7. **Intentional Context:** What is the likely purpose or goal?
8. **Relationship Context:** What power dynamics or relationships are involved?
9. **Technical Context:** What technical or platform factors apply?
10. **Legal/Regulatory Context:** What compliance or policy issues exist?

**Return a comprehensive analysis that addresses the most relevant contextual layers identified above.**
`;

        return prompt;
    }

    /**
     * Call AI with context-aware prompt
     */
    async callAIWithContext(prompt, provider, apiKey, options) {
        try {
            if (provider === 'gemini') {
                return await this.callGeminiAPI(prompt, apiKey, options);
            } else if (provider === 'openai') {
                return await this.callOpenAIAPI(prompt, apiKey, options);
            } else if (provider === 'grock') {
                return await this.callGrockAPI(prompt, apiKey, options);
            } else {
                throw new Error(`Unsupported AI provider: ${provider}`);
            }
        } catch (error) {
            console.error('[EnhancedAIAnalysis] Error calling AI API:', error);
            throw error;
        }
    }

    /**
     * Synthesize all analysis results
     */
    synthesizeAnalysisResults(content, multilayerAnalysis, searchResults, aiAnalysis) {
        return {
            content: content,
            timestamp: Date.now(),
            multilayerAnalysis: multilayerAnalysis,
            searchResults: searchResults,
            aiAnalysis: aiAnalysis,
            summary: {
                primaryContext: multilayerAnalysis.summary.primaryContext,
                keyInsights: multilayerAnalysis.summary.keyInsights,
                riskFactors: multilayerAnalysis.summary.riskFactors,
                recommendations: multilayerAnalysis.summary.recommendations,
                confidenceScore: multilayerAnalysis.summary.confidenceScore,
                searchRelevance: searchResults.length > 0 ? searchResults[0].relevanceScore : 0,
                aiConfidence: aiAnalysis.aiAnalysis?.confidence || 0
            },
            enhancedQuery: multilayerAnalysis.semanticQuery,
            contextLayers: Object.keys(multilayerAnalysis.layers).filter(name => 
                multilayerAnalysis.layers[name].relevance > 0.3
            )
        };
    }

    // Helper methods
    extractLayerContextKeywords(layer) {
        if (!layer.analysis) return [];
        
        const keywords = [];
        for (const [key, value] of Object.entries(layer.analysis)) {
            if (Array.isArray(value)) {
                keywords.push(...value.filter(item => typeof item === 'string' && item.length > 2));
            } else if (typeof value === 'string' && value.length > 2) {
                keywords.push(value);
            }
        }
        return keywords;
    }

    calculateContextRelevance(result, multilayerAnalysis) {
        const { layers } = multilayerAnalysis;
        let totalRelevance = 0;
        let layerCount = 0;
        
        for (const [layerName, layer] of Object.entries(layers)) {
            if (layer.relevance > 0.3) {
                totalRelevance += layer.relevance;
                layerCount++;
            }
        }
        
        return layerCount > 0 ? totalRelevance / layerCount : 0;
    }

    identifyMatchingLayers(result, multilayerAnalysis) {
        const { layers } = multilayerAnalysis;
        const matchingLayers = [];
        
        for (const [layerName, layer] of Object.entries(layers)) {
            if (layer.relevance > 0.4 && layer.confidence > 0.3) {
                matchingLayers.push({
                    name: layerName,
                    relevance: layer.relevance,
                    confidence: layer.confidence
                });
            }
        }
        
        return matchingLayers.sort((a, b) => b.relevance - a.relevance);
    }

    extractKeyInsightsFromLayer(layer) {
        if (!layer.analysis) return [];
        
        const insights = [];
        for (const [key, value] of Object.entries(layer.analysis)) {
            if (Array.isArray(value) && value.length > 0) {
                insights.push(`${key}: ${value.slice(0, 2).join(', ')}`);
            } else if (typeof value === 'string' && value.length > 5) {
                insights.push(`${key}: ${value}`);
            }
        }
        return insights;
    }

    async getAIProvider() {
        return new Promise((resolve) => {
            chrome.storage.local.get(['settings'], (result) => {
                resolve(result.settings?.provider || 'gemini');
            });
        });
    }

    async getAPIKey(provider) {
        return new Promise((resolve) => {
            chrome.storage.local.get(['settings'], (result) => {
                if (provider === 'gemini') {
                    resolve(result.settings?.geminiApiKey);
                } else if (provider === 'openai') {
                    resolve(result.settings?.chatgptApiKey);
                } else if (provider === 'grock') {
                    resolve(result.settings?.grockToken);
                } else {
                    resolve(null);
                }
            });
        });
    }

    async callGeminiAPI(prompt, apiKey, options) {
        const model = 'gemini-1.5-flash';
        const body = {
            contents: [{
                parts: [{ text: prompt }]
            }],
            generationConfig: {
                maxOutputTokens: options.maxTokens || 4096,
                temperature: options.temperature || 0.7
            }
        };

        const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            throw new Error(`Gemini API error: ${response.status}`);
        }

        const data = await response.json();
        return {
            content: data.candidates[0].content.parts[0].text,
            confidence: 0.8,
            provider: 'gemini'
        };
    }

    async callOpenAIAPI(prompt, apiKey, options) {
        const body = {
            model: 'gpt-4',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: options.maxTokens || 4096,
            temperature: options.temperature || 0.7
        };

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.status}`);
        }

        const data = await response.json();
        return {
            content: data.choices[0].message.content,
            confidence: 0.8,
            provider: 'openai'
        };
    }

    async callGrockAPI(prompt, token, options) {
        const body = {
            model: 'grock-beta',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: options.maxTokens || 4096,
            temperature: options.temperature || 0.7
        };

        const response = await fetch('https://api.x.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            throw new Error(`Grock API error: ${response.status}`);
        }

        const data = await response.json();
        return {
            content: data.choices[0].message.content,
            confidence: 0.8,
            provider: 'grock'
        };
    }

    generateCacheKey(content, context, options) {
        return btoa(`${content.substring(0, 100)}_${JSON.stringify(context)}_${JSON.stringify(options)}`);
    }

    /**
     * Clear analysis cache
     */
    clearCache() {
        this.analysisCache.clear();
        console.log('[EnhancedAIAnalysis] Cache cleared');
    }

    /**
     * Get analysis statistics
     */
    getStats() {
        return {
            cacheSize: this.analysisCache.size,
            multilayerStats: this.multilayerAnalyzer.getStats(),
            vectorSearchStats: this.vectorSearchEngine.getStats()
        };
    }
}

// Singleton instance
let enhancedAIAnalysis = null;

/**
 * Get or create the enhanced AI analysis instance
 */
export function getEnhancedAIAnalysis() {
    if (!enhancedAIAnalysis) {
        enhancedAIAnalysis = new EnhancedAIAnalysis();
    }
    return enhancedAIAnalysis;
}

/**
 * Main function for enhanced content analysis
 */
export async function analyzeContentWithMultilayerContext(content, context = {}, options = {}) {
    const analyzer = getEnhancedAIAnalysis();
    return await analyzer.analyzeContentWithMultilayerContext(content, context, options);
}

/**
 * Initialize enhanced AI analysis system
 */
export async function initializeEnhancedAIAnalysis() {
    const analyzer = getEnhancedAIAnalysis();
    console.log('[EnhancedAIAnalysis] Initialized enhanced AI analysis system');
    return analyzer;
} 