/**
 * @file Multilayer Contextual Understanding System
 * Analyzes content across multiple contextual layers before semantic search
 */

// Context Layer Definitions
const CONTEXT_LAYERS = {
    SURFACE: {
        name: 'Surface Level',
        description: 'Literal meaning, explicit content, direct statements',
        examples: ['Product arrived late', 'Service was good', 'Price is high'],
        keywords: ['explicit', 'literal', 'direct', 'stated', 'obvious']
    },
    EMOTIONAL: {
        name: 'Emotional Context',
        description: 'Underlying emotions, sentiment, affective responses',
        examples: ['Frustration', 'Disappointment', 'Excitement', 'Anger', 'Joy'],
        keywords: ['feel', 'emotion', 'sentiment', 'mood', 'tone', 'attitude']
    },
    IMPLICIT: {
        name: 'Implicit Meaning',
        description: 'Unstated assumptions, implied expectations, hidden meanings',
        examples: ['Expectations about standards', 'Assumed quality levels', 'Implicit promises'],
        keywords: ['assume', 'expect', 'imply', 'suggest', 'hint', 'implicit']
    },
    COMPARATIVE: {
        name: 'Comparative Context',
        description: 'How this compares to other experiences, benchmarks, alternatives',
        examples: ['Better than competitors', 'Worse than expected', 'Similar to previous'],
        keywords: ['compare', 'versus', 'relative', 'benchmark', 'alternative', 'competitor']
    },
    TEMPORAL: {
        name: 'Temporal Context',
        description: 'Time-based patterns, recurring issues, historical context',
        examples: ['Recurring problem', 'One-time issue', 'Seasonal pattern', 'Trend'],
        keywords: ['always', 'never', 'sometimes', 'recurring', 'pattern', 'trend', 'history']
    },
    CULTURAL_SOCIAL: {
        name: 'Cultural/Social Context',
        description: 'Cultural norms, social expectations, demographic factors',
        examples: ['Cultural expectations', 'Social norms', 'Demographic factors', 'Regional differences'],
        keywords: ['culture', 'social', 'norm', 'demographic', 'regional', 'community']
    },
    INTENTIONAL: {
        name: 'Intentional Context',
        description: 'Purpose, goals, motivations, desired outcomes',
        examples: ['Marketing intent', 'Complaint purpose', 'Feedback goal', 'Request objective'],
        keywords: ['intent', 'purpose', 'goal', 'motivation', 'objective', 'aim']
    },
    RELATIONSHIP: {
        name: 'Relationship Context',
        description: 'Power dynamics, authority, customer-vendor relationships',
        examples: ['Customer-vendor', 'User-platform', 'Consumer-brand', 'Authority-subject'],
        keywords: ['relationship', 'power', 'authority', 'customer', 'vendor', 'platform']
    },
    TECHNICAL: {
        name: 'Technical Context',
        description: 'Platform-specific, technical constraints, system limitations',
        examples: ['Platform policies', 'Technical limitations', 'System constraints', 'API restrictions'],
        keywords: ['platform', 'technical', 'system', 'API', 'constraint', 'limitation']
    },
    LEGAL_REGULATORY: {
        name: 'Legal/Regulatory Context',
        description: 'Compliance requirements, legal implications, regulatory standards',
        examples: ['Legal compliance', 'Regulatory requirements', 'Policy violations', 'Standards'],
        keywords: ['legal', 'regulatory', 'compliance', 'policy', 'violation', 'standard']
    }
};

/**
 * Multilayer Context Analyzer Class
 */
export class MultilayerContextAnalyzer {
    constructor() {
        this.layerProcessors = this.initializeLayerProcessors();
        this.contextCache = new Map();
        this.analysisCache = new Map();
    }

    /**
     * Initialize processors for each context layer
     */
    initializeLayerProcessors() {
        return {
            [CONTEXT_LAYERS.SURFACE.name]: this.analyzeSurfaceLayer.bind(this),
            [CONTEXT_LAYERS.EMOTIONAL.name]: this.analyzeEmotionalLayer.bind(this),
            [CONTEXT_LAYERS.IMPLICIT.name]: this.analyzeImplicitLayer.bind(this),
            [CONTEXT_LAYERS.COMPARATIVE.name]: this.analyzeComparativeLayer.bind(this),
            [CONTEXT_LAYERS.TEMPORAL.name]: this.analyzeTemporalLayer.bind(this),
            [CONTEXT_LAYERS.CULTURAL_SOCIAL.name]: this.analyzeCulturalSocialLayer.bind(this),
            [CONTEXT_LAYERS.INTENTIONAL.name]: this.analyzeIntentionalLayer.bind(this),
            [CONTEXT_LAYERS.RELATIONSHIP.name]: this.analyzeRelationshipLayer.bind(this),
            [CONTEXT_LAYERS.TECHNICAL.name]: this.analyzeTechnicalLayer.bind(this),
            [CONTEXT_LAYERS.LEGAL_REGULATORY.name]: this.analyzeLegalRegulatoryLayer.bind(this)
        };
    }

    /**
     * Main analysis function - analyzes content across all layers
     */
    async analyzeContent(content, context = {}) {
        const cacheKey = this.generateCacheKey(content, context);
        
        // Check cache first
        if (this.analysisCache.has(cacheKey)) {
            return this.analysisCache.get(cacheKey);
        }

        console.log('[MultilayerContext] Starting multilayer analysis...');
        
        const analysis = {
            content: content,
            context: context,
            layers: {},
            summary: {},
            semanticQuery: '',
            timestamp: Date.now()
        };

        // Analyze each layer
        for (const [layerName, layerInfo] of Object.entries(CONTEXT_LAYERS)) {
            try {
                const layerAnalysis = await this.layerProcessors[layerInfo.name](content, context);
                analysis.layers[layerInfo.name] = layerAnalysis;
                console.log(`[MultilayerContext] Completed ${layerInfo.name} analysis`);
            } catch (error) {
                console.error(`[MultilayerContext] Error in ${layerInfo.name} analysis:`, error);
                analysis.layers[layerInfo.name] = { error: error.message };
            }
        }

        // Generate summary and semantic query
        analysis.summary = this.generateSummary(analysis.layers);
        analysis.semanticQuery = this.generateSemanticQuery(analysis);

        // Cache the result
        this.analysisCache.set(cacheKey, analysis);

        console.log('[MultilayerContext] Multilayer analysis completed');
        return analysis;
    }

    /**
     * Surface Layer Analysis
     */
    async analyzeSurfaceLayer(content, context) {
        return {
            type: CONTEXT_LAYERS.SURFACE.name,
            description: 'Literal meaning and explicit content',
            analysis: {
                explicitStatements: this.extractExplicitStatements(content),
                directClaims: this.extractDirectClaims(content),
                factualContent: this.extractFactualContent(content),
                surfaceKeywords: this.extractSurfaceKeywords(content)
            },
            confidence: this.calculateConfidence(content, CONTEXT_LAYERS.SURFACE.keywords),
            relevance: this.calculateRelevance(content, CONTEXT_LAYERS.SURFACE.keywords)
        };
    }

    /**
     * Emotional Layer Analysis
     */
    async analyzeEmotionalLayer(content, context) {
        const emotionKeywords = [
            'frustrated', 'angry', 'happy', 'sad', 'excited', 'disappointed',
            'satisfied', 'upset', 'pleased', 'annoyed', 'grateful', 'worried'
        ];

        return {
            type: CONTEXT_LAYERS.EMOTIONAL.name,
            description: 'Emotional context and sentiment analysis',
            analysis: {
                primaryEmotion: this.identifyPrimaryEmotion(content, emotionKeywords),
                emotionalIntensity: this.calculateEmotionalIntensity(content),
                sentimentScore: this.calculateSentimentScore(content),
                emotionalTriggers: this.identifyEmotionalTriggers(content)
            },
            confidence: this.calculateConfidence(content, emotionKeywords),
            relevance: this.calculateRelevance(content, emotionKeywords)
        };
    }

    /**
     * Implicit Layer Analysis
     */
    async analyzeImplicitLayer(content, context) {
        const implicitKeywords = [
            'should', 'ought', 'expect', 'assume', 'imply', 'suggest',
            'normally', 'usually', 'typically', 'supposed to'
        ];

        return {
            type: CONTEXT_LAYERS.IMPLICIT.name,
            description: 'Unstated assumptions and implied meanings',
            analysis: {
                implicitAssumptions: this.extractImplicitAssumptions(content),
                unstatedExpectations: this.extractUnstatedExpectations(content),
                hiddenMeanings: this.extractHiddenMeanings(content),
                impliedStandards: this.extractImpliedStandards(content)
            },
            confidence: this.calculateConfidence(content, implicitKeywords),
            relevance: this.calculateRelevance(content, implicitKeywords)
        };
    }

    /**
     * Comparative Layer Analysis
     */
    async analyzeComparativeLayer(content, context) {
        const comparativeKeywords = [
            'better', 'worse', 'compared', 'versus', 'than', 'relative',
            'competitor', 'alternative', 'benchmark', 'similar', 'different'
        ];

        return {
            type: CONTEXT_LAYERS.COMPARATIVE.name,
            description: 'Comparative context and benchmarking',
            analysis: {
                comparisons: this.extractComparisons(content),
                benchmarks: this.identifyBenchmarks(content),
                alternatives: this.extractAlternatives(content),
                competitiveContext: this.analyzeCompetitiveContext(content)
            },
            confidence: this.calculateConfidence(content, comparativeKeywords),
            relevance: this.calculateRelevance(content, comparativeKeywords)
        };
    }

    /**
     * Temporal Layer Analysis
     */
    async analyzeTemporalLayer(content, context) {
        const temporalKeywords = [
            'always', 'never', 'sometimes', 'often', 'rarely', 'recurring',
            'pattern', 'trend', 'history', 'previous', 'future', 'ongoing'
        ];

        return {
            type: CONTEXT_LAYERS.TEMPORAL.name,
            description: 'Time-based patterns and historical context',
            analysis: {
                temporalPatterns: this.extractTemporalPatterns(content),
                frequencyIndicators: this.identifyFrequencyIndicators(content),
                historicalContext: this.extractHistoricalContext(content),
                trendAnalysis: this.analyzeTrends(content)
            },
            confidence: this.calculateConfidence(content, temporalKeywords),
            relevance: this.calculateRelevance(content, temporalKeywords)
        };
    }

    /**
     * Cultural/Social Layer Analysis
     */
    async analyzeCulturalSocialLayer(content, context) {
        const culturalKeywords = [
            'culture', 'social', 'norm', 'community', 'society', 'demographic',
            'regional', 'local', 'traditional', 'modern', 'acceptable', 'unacceptable'
        ];

        return {
            type: CONTEXT_LAYERS.CULTURAL_SOCIAL.name,
            description: 'Cultural and social context analysis',
            analysis: {
                culturalNorms: this.extractCulturalNorms(content),
                socialExpectations: this.identifySocialExpectations(content),
                demographicFactors: this.extractDemographicFactors(content),
                regionalContext: this.analyzeRegionalContext(content)
            },
            confidence: this.calculateConfidence(content, culturalKeywords),
            relevance: this.calculateRelevance(content, culturalKeywords)
        };
    }

    /**
     * Intentional Layer Analysis
     */
    async analyzeIntentionalLayer(content, context) {
        const intentionalKeywords = [
            'intent', 'purpose', 'goal', 'objective', 'aim', 'target',
            'want', 'need', 'desire', 'hope', 'plan', 'strategy'
        ];

        return {
            type: CONTEXT_LAYERS.INTENTIONAL.name,
            description: 'Purpose, goals, and motivations',
            analysis: {
                primaryIntent: this.identifyPrimaryIntent(content),
                goals: this.extractGoals(content),
                motivations: this.analyzeMotivations(content),
                desiredOutcomes: this.extractDesiredOutcomes(content)
            },
            confidence: this.calculateConfidence(content, intentionalKeywords),
            relevance: this.calculateRelevance(content, intentionalKeywords)
        };
    }

    /**
     * Relationship Layer Analysis
     */
    async analyzeRelationshipLayer(content, context) {
        const relationshipKeywords = [
            'customer', 'vendor', 'user', 'platform', 'service', 'provider',
            'authority', 'power', 'relationship', 'interaction', 'engagement'
        ];

        return {
            type: CONTEXT_LAYERS.RELATIONSHIP.name,
            description: 'Power dynamics and relationship context',
            analysis: {
                relationshipType: this.identifyRelationshipType(content),
                powerDynamics: this.analyzePowerDynamics(content),
                authorityContext: this.extractAuthorityContext(content),
                interactionPattern: this.analyzeInteractionPattern(content)
            },
            confidence: this.calculateConfidence(content, relationshipKeywords),
            relevance: this.calculateRelevance(content, relationshipKeywords)
        };
    }

    /**
     * Technical Layer Analysis
     */
    async analyzeTechnicalLayer(content, context) {
        const technicalKeywords = [
            'platform', 'technical', 'system', 'API', 'constraint', 'limitation',
            'feature', 'functionality', 'bug', 'error', 'performance', 'compatibility'
        ];

        return {
            type: CONTEXT_LAYERS.TECHNICAL.name,
            description: 'Technical context and system constraints',
            analysis: {
                technicalConstraints: this.extractTechnicalConstraints(content),
                platformContext: this.analyzePlatformContext(content),
                systemLimitations: this.identifySystemLimitations(content),
                technicalRequirements: this.extractTechnicalRequirements(content)
            },
            confidence: this.calculateConfidence(content, technicalKeywords),
            relevance: this.calculateRelevance(content, technicalKeywords)
        };
    }

    /**
     * Legal/Regulatory Layer Analysis
     */
    async analyzeLegalRegulatoryLayer(content, context) {
        const legalKeywords = [
            'legal', 'regulatory', 'compliance', 'policy', 'violation', 'standard',
            'rule', 'law', 'regulation', 'requirement', 'obligation', 'liability'
        ];

        return {
            type: CONTEXT_LAYERS.LEGAL_REGULATORY.name,
            description: 'Legal and regulatory context analysis',
            analysis: {
                complianceIssues: this.extractComplianceIssues(content),
                policyViolations: this.identifyPolicyViolations(content),
                regulatoryContext: this.analyzeRegulatoryContext(content),
                legalImplications: this.extractLegalImplications(content)
            },
            confidence: this.calculateConfidence(content, legalKeywords),
            relevance: this.calculateRelevance(content, legalKeywords)
        };
    }

    /**
     * Generate summary from all layer analyses
     */
    generateSummary(layers) {
        const summary = {
            primaryContext: this.identifyPrimaryContext(layers),
            keyInsights: this.extractKeyInsights(layers),
            riskFactors: this.identifyRiskFactors(layers),
            recommendations: this.generateRecommendations(layers),
            confidenceScore: this.calculateOverallConfidence(layers)
        };

        return summary;
    }

    /**
     * Generate semantic query based on multilayer analysis
     */
    generateSemanticQuery(analysis) {
        const { layers, summary } = analysis;
        
        // Build query from most relevant layers
        const relevantLayers = Object.entries(layers)
            .filter(([name, layer]) => layer.relevance > 0.3)
            .sort((a, b) => b[1].relevance - a[1].relevance);

        let query = analysis.content;
        
        // Add context from relevant layers
        for (const [layerName, layer] of relevantLayers.slice(0, 3)) {
            if (layer.analysis && layer.confidence > 0.5) {
                const contextKeywords = this.extractContextKeywords(layer);
                if (contextKeywords.length > 0) {
                    query += ` ${contextKeywords.join(' ')}`;
                }
            }
        }

        // Add summary insights
        if (summary.keyInsights && summary.keyInsights.length > 0) {
            query += ` ${summary.keyInsights.join(' ')}`;
        }

        return query.trim();
    }

    // Helper methods for analysis
    extractExplicitStatements(content) {
        // Implementation for extracting explicit statements
        return content.split('.').filter(sentence => 
            sentence.trim().length > 10 && 
            !sentence.includes('?') && 
            !sentence.includes('!')
        );
    }

    extractDirectClaims(content) {
        // Implementation for extracting direct claims
        const claimPatterns = [
            /(?:I|we|they|it|this|that)\s+(?:is|are|was|were|has|have|had)\s+/gi,
            /(?:clearly|obviously|definitely|certainly)\s+/gi
        ];
        
        return claimPatterns.flatMap(pattern => 
            content.match(pattern) || []
        );
    }

    extractFactualContent(content) {
        // Implementation for extracting factual content
        return content.split(' ').filter(word => 
            /^\d+$/.test(word) || 
            /^(?:true|false|yes|no)$/i.test(word)
        );
    }

    extractSurfaceKeywords(content) {
        // Implementation for extracting surface keywords
        const surfaceWords = CONTEXT_LAYERS.SURFACE.keywords;
        return surfaceWords.filter(word => 
            content.toLowerCase().includes(word.toLowerCase())
        );
    }

    identifyPrimaryEmotion(content, emotionKeywords) {
        // Implementation for identifying primary emotion
        const foundEmotions = emotionKeywords.filter(emotion => 
            content.toLowerCase().includes(emotion.toLowerCase())
        );
        return foundEmotions[0] || 'neutral';
    }

    calculateEmotionalIntensity(content) {
        // Implementation for calculating emotional intensity
        const intensityWords = ['very', 'extremely', 'slightly', 'somewhat'];
        const foundIntensity = intensityWords.filter(word => 
            content.toLowerCase().includes(word.toLowerCase())
        );
        return foundIntensity.length > 0 ? 'high' : 'medium';
    }

    calculateSentimentScore(content) {
        // Implementation for calculating sentiment score
        const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful'];
        const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'disappointing'];
        
        const positiveCount = positiveWords.filter(word => 
            content.toLowerCase().includes(word.toLowerCase())
        ).length;
        const negativeCount = negativeWords.filter(word => 
            content.toLowerCase().includes(word.toLowerCase())
        ).length;
        
        return positiveCount - negativeCount;
    }

    identifyEmotionalTriggers(content) {
        // Implementation for identifying emotional triggers
        const triggerWords = ['because', 'since', 'due to', 'as a result'];
        return triggerWords.filter(word => 
            content.toLowerCase().includes(word.toLowerCase())
        );
    }

    extractImplicitAssumptions(content) {
        // Implementation for extracting implicit assumptions
        const assumptionPatterns = [
            /(?:should|ought|must)\s+/gi,
            /(?:normally|usually|typically)\s+/gi
        ];
        
        return assumptionPatterns.flatMap(pattern => 
            content.match(pattern) || []
        );
    }

    extractUnstatedExpectations(content) {
        // Implementation for extracting unstated expectations
        const expectationWords = ['expect', 'assume', 'suppose', 'presume'];
        return expectationWords.filter(word => 
            content.toLowerCase().includes(word.toLowerCase())
        );
    }

    extractHiddenMeanings(content) {
        // Implementation for extracting hidden meanings
        const hiddenPatterns = [
            /(?:imply|suggest|hint)\s+/gi,
            /(?:between the lines)/gi
        ];
        
        return hiddenPatterns.flatMap(pattern => 
            content.match(pattern) || []
        );
    }

    extractImpliedStandards(content) {
        // Implementation for extracting implied standards
        const standardWords = ['standard', 'quality', 'level', 'expectation'];
        return standardWords.filter(word => 
            content.toLowerCase().includes(word.toLowerCase())
        );
    }

    extractComparisons(content) {
        // Implementation for extracting comparisons
        const comparisonWords = ['better', 'worse', 'than', 'compared', 'versus'];
        return comparisonWords.filter(word => 
            content.toLowerCase().includes(word.toLowerCase())
        );
    }

    identifyBenchmarks(content) {
        // Implementation for identifying benchmarks
        const benchmarkWords = ['benchmark', 'standard', 'baseline', 'reference'];
        return benchmarkWords.filter(word => 
            content.toLowerCase().includes(word.toLowerCase())
        );
    }

    extractAlternatives(content) {
        // Implementation for extracting alternatives
        const alternativeWords = ['alternative', 'option', 'choice', 'instead'];
        return alternativeWords.filter(word => 
            content.toLowerCase().includes(word.toLowerCase())
        );
    }

    analyzeCompetitiveContext(content) {
        // Implementation for analyzing competitive context
        const competitiveWords = ['competitor', 'rival', 'competition', 'market'];
        return competitiveWords.filter(word => 
            content.toLowerCase().includes(word.toLowerCase())
        );
    }

    extractTemporalPatterns(content) {
        // Implementation for extracting temporal patterns
        const temporalWords = ['always', 'never', 'sometimes', 'often', 'rarely'];
        return temporalWords.filter(word => 
            content.toLowerCase().includes(word.toLowerCase())
        );
    }

    identifyFrequencyIndicators(content) {
        // Implementation for identifying frequency indicators
        const frequencyWords = ['recurring', 'pattern', 'trend', 'regular'];
        return frequencyWords.filter(word => 
            content.toLowerCase().includes(word.toLowerCase())
        );
    }

    extractHistoricalContext(content) {
        // Implementation for extracting historical context
        const historicalWords = ['history', 'previous', 'past', 'before'];
        return historicalWords.filter(word => 
            content.toLowerCase().includes(word.toLowerCase())
        );
    }

    analyzeTrends(content) {
        // Implementation for analyzing trends
        const trendWords = ['trend', 'increasing', 'decreasing', 'growing'];
        return trendWords.filter(word => 
            content.toLowerCase().includes(word.toLowerCase())
        );
    }

    extractCulturalNorms(content) {
        // Implementation for extracting cultural norms
        const culturalWords = ['culture', 'norm', 'traditional', 'acceptable'];
        return culturalWords.filter(word => 
            content.toLowerCase().includes(word.toLowerCase())
        );
    }

    identifySocialExpectations(content) {
        // Implementation for identifying social expectations
        const socialWords = ['social', 'community', 'society', 'expectation'];
        return socialWords.filter(word => 
            content.toLowerCase().includes(word.toLowerCase())
        );
    }

    extractDemographicFactors(content) {
        // Implementation for extracting demographic factors
        const demographicWords = ['demographic', 'age', 'gender', 'location'];
        return demographicWords.filter(word => 
            content.toLowerCase().includes(word.toLowerCase())
        );
    }

    analyzeRegionalContext(content) {
        // Implementation for analyzing regional context
        const regionalWords = ['regional', 'local', 'area', 'location'];
        return regionalWords.filter(word => 
            content.toLowerCase().includes(word.toLowerCase())
        );
    }

    identifyPrimaryIntent(content) {
        // Implementation for identifying primary intent
        const intentWords = ['want', 'need', 'desire', 'hope', 'plan'];
        const foundIntents = intentWords.filter(word => 
            content.toLowerCase().includes(word.toLowerCase())
        );
        return foundIntents[0] || 'inform';
    }

    extractGoals(content) {
        // Implementation for extracting goals
        const goalWords = ['goal', 'objective', 'target', 'aim', 'purpose'];
        return goalWords.filter(word => 
            content.toLowerCase().includes(word.toLowerCase())
        );
    }

    analyzeMotivations(content) {
        // Implementation for analyzing motivations
        const motivationWords = ['motivation', 'reason', 'cause', 'driver'];
        return motivationWords.filter(word => 
            content.toLowerCase().includes(word.toLowerCase())
        );
    }

    extractDesiredOutcomes(content) {
        // Implementation for extracting desired outcomes
        const outcomeWords = ['outcome', 'result', 'effect', 'consequence'];
        return outcomeWords.filter(word => 
            content.toLowerCase().includes(word.toLowerCase())
        );
    }

    identifyRelationshipType(content) {
        // Implementation for identifying relationship type
        const relationshipWords = ['customer', 'vendor', 'user', 'platform'];
        const foundRelationships = relationshipWords.filter(word => 
            content.toLowerCase().includes(word.toLowerCase())
        );
        return foundRelationships[0] || 'general';
    }

    analyzePowerDynamics(content) {
        // Implementation for analyzing power dynamics
        const powerWords = ['authority', 'power', 'control', 'influence'];
        return powerWords.filter(word => 
            content.toLowerCase().includes(word.toLowerCase())
        );
    }

    extractAuthorityContext(content) {
        // Implementation for extracting authority context
        const authorityWords = ['authority', 'official', 'representative', 'agent'];
        return authorityWords.filter(word => 
            content.toLowerCase().includes(word.toLowerCase())
        );
    }

    analyzeInteractionPattern(content) {
        // Implementation for analyzing interaction pattern
        const interactionWords = ['interaction', 'engagement', 'communication', 'contact'];
        return interactionWords.filter(word => 
            content.toLowerCase().includes(word.toLowerCase())
        );
    }

    extractTechnicalConstraints(content) {
        // Implementation for extracting technical constraints
        const technicalWords = ['technical', 'constraint', 'limitation', 'restriction'];
        return technicalWords.filter(word => 
            content.toLowerCase().includes(word.toLowerCase())
        );
    }

    analyzePlatformContext(content) {
        // Implementation for analyzing platform context
        const platformWords = ['platform', 'system', 'application', 'software'];
        return platformWords.filter(word => 
            content.toLowerCase().includes(word.toLowerCase())
        );
    }

    identifySystemLimitations(content) {
        // Implementation for identifying system limitations
        const limitationWords = ['limitation', 'restriction', 'constraint', 'boundary'];
        return limitationWords.filter(word => 
            content.toLowerCase().includes(word.toLowerCase())
        );
    }

    extractTechnicalRequirements(content) {
        // Implementation for extracting technical requirements
        const requirementWords = ['requirement', 'need', 'specification', 'standard'];
        return requirementWords.filter(word => 
            content.toLowerCase().includes(word.toLowerCase())
        );
    }

    extractComplianceIssues(content) {
        // Implementation for extracting compliance issues
        const complianceWords = ['compliance', 'regulation', 'policy', 'rule'];
        return complianceWords.filter(word => 
            content.toLowerCase().includes(word.toLowerCase())
        );
    }

    identifyPolicyViolations(content) {
        // Implementation for identifying policy violations
        const violationWords = ['violation', 'breach', 'infringement', 'offense'];
        return violationWords.filter(word => 
            content.toLowerCase().includes(word.toLowerCase())
        );
    }

    analyzeRegulatoryContext(content) {
        // Implementation for analyzing regulatory context
        const regulatoryWords = ['regulatory', 'legal', 'law', 'regulation'];
        return regulatoryWords.filter(word => 
            content.toLowerCase().includes(word.toLowerCase())
        );
    }

    extractLegalImplications(content) {
        // Implementation for extracting legal implications
        const legalWords = ['legal', 'liability', 'obligation', 'responsibility'];
        return legalWords.filter(word => 
            content.toLowerCase().includes(word.toLowerCase())
        );
    }

    // Utility methods
    calculateConfidence(content, keywords) {
        const foundKeywords = keywords.filter(keyword => 
            content.toLowerCase().includes(keyword.toLowerCase())
        );
        return Math.min(foundKeywords.length / keywords.length, 1.0);
    }

    calculateRelevance(content, keywords) {
        const foundKeywords = keywords.filter(keyword => 
            content.toLowerCase().includes(keyword.toLowerCase())
        );
        return foundKeywords.length > 0 ? 0.5 + (foundKeywords.length * 0.1) : 0.0;
    }

    identifyPrimaryContext(layers) {
        const layerScores = Object.entries(layers)
            .map(([name, layer]) => ({ name, score: layer.relevance * layer.confidence }))
            .sort((a, b) => b.score - a.score);
        
        return layerScores[0]?.name || 'Surface';
    }

    extractKeyInsights(layers) {
        const insights = [];
        for (const [name, layer] of Object.entries(layers)) {
            if (layer.relevance > 0.5 && layer.confidence > 0.3) {
                insights.push(`${name}: ${layer.description}`);
            }
        }
        return insights;
    }

    identifyRiskFactors(layers) {
        const riskFactors = [];
        const riskKeywords = ['violation', 'breach', 'error', 'problem', 'issue'];
        
        for (const [name, layer] of Object.entries(layers)) {
            if (layer.analysis) {
                const hasRisk = riskKeywords.some(keyword => 
                    JSON.stringify(layer.analysis).toLowerCase().includes(keyword)
                );
                if (hasRisk) {
                    riskFactors.push(`${name}: Potential risk detected`);
                }
            }
        }
        return riskFactors;
    }

    generateRecommendations(layers) {
        const recommendations = [];
        
        for (const [name, layer] of Object.entries(layers)) {
            if (layer.relevance > 0.7) {
                recommendations.push(`Focus on ${name} context for analysis`);
            }
        }
        
        return recommendations;
    }

    calculateOverallConfidence(layers) {
        const confidences = Object.values(layers).map(layer => layer.confidence);
        return confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length;
    }

    extractContextKeywords(layer) {
        if (!layer.analysis) return [];
        
        const keywords = [];
        for (const [key, value] of Object.entries(layer.analysis)) {
            if (Array.isArray(value)) {
                keywords.push(...value);
            } else if (typeof value === 'string') {
                keywords.push(value);
            }
        }
        return keywords.filter(keyword => keyword && keyword.length > 2);
    }

    generateCacheKey(content, context) {
        return btoa(`${content.substring(0, 100)}_${JSON.stringify(context)}`);
    }

    /**
     * Clear analysis cache
     */
    clearCache() {
        this.analysisCache.clear();
        this.contextCache.clear();
        console.log('[MultilayerContext] Cache cleared');
    }

    /**
     * Get analysis statistics
     */
    getStats() {
        return {
            cacheSize: this.analysisCache.size,
            contextCacheSize: this.contextCache.size,
            layersAnalyzed: Object.keys(CONTEXT_LAYERS).length
        };
    }
}

// Singleton instance
let multilayerAnalyzer = null;

/**
 * Get or create the multilayer context analyzer instance
 */
export function getMultilayerAnalyzer() {
    if (!multilayerAnalyzer) {
        multilayerAnalyzer = new MultilayerContextAnalyzer();
    }
    return multilayerAnalyzer;
}

/**
 * Enhanced semantic search with multilayer context analysis
 */
export async function enhancedSemanticSearch(content, context = {}) {
    const analyzer = getMultilayerAnalyzer();
    
    // Perform multilayer analysis
    const analysis = await analyzer.analyzeContent(content, context);
    
    // Use the generated semantic query for search
    const semanticQuery = analysis.semanticQuery;
    
    console.log('[EnhancedSemanticSearch] Generated semantic query:', semanticQuery);
    console.log('[EnhancedSemanticSearch] Analysis summary:', analysis.summary);
    
    return {
        originalContent: content,
        semanticQuery: semanticQuery,
        analysis: analysis,
        searchResults: null // Will be populated by the search engine
    };
}

/**
 * Initialize multilayer analyzer
 */
export async function initializeMultilayerAnalyzer() {
    const analyzer = getMultilayerAnalyzer();
    console.log('[MultilayerAnalyzer] Initialized with', Object.keys(CONTEXT_LAYERS).length, 'context layers');
    return analyzer;
} 