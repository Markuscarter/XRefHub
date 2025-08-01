/**
 * Confidence Weighting System
 * Handles complex reasoning vs execution conflicts in AI responses
 */

class ConfidenceWeightingSystem {
    constructor() {
        this.weights = {
            reasoning: 0.4,
            execution: 0.3,
            policyMatch: 0.2,
            contentClarity: 0.1
        };
        
        this.confidenceThresholds = {
            high: 0.8,
            medium: 0.6,
            low: 0.4
        };
    }

    // Calculate confidence score for a response
    calculateConfidence(analysis) {
        const scores = {
            reasoning: this.calculateReasoningConfidence(analysis),
            execution: this.calculateExecutionConfidence(analysis),
            policyMatch: this.calculatePolicyMatchConfidence(analysis),
            contentClarity: this.calculateContentClarityConfidence(analysis)
        };

        // Calculate weighted average
        let totalScore = 0;
        let totalWeight = 0;

        Object.keys(this.weights).forEach(key => {
            totalScore += scores[key] * this.weights[key];
            totalWeight += this.weights[key];
        });

        const weightedConfidence = totalScore / totalWeight;

        // Detect conflicts
        const conflicts = this.detectConflicts(analysis, scores);

        return {
            overallConfidence: weightedConfidence,
            componentScores: scores,
            conflicts: conflicts,
            confidenceLevel: this.getConfidenceLevel(weightedConfidence),
            recommendations: this.generateRecommendations(scores, conflicts)
        };
    }

    // Calculate reasoning confidence
    calculateReasoningConfidence(analysis) {
        let score = 0.5; // Base score

        // Check for logical structure
        if (analysis.summary && analysis.summary.length > 50) score += 0.2;
        if (analysis.details && Array.isArray(analysis.details)) score += 0.1;
        if (analysis.recommendations && Array.isArray(analysis.recommendations)) score += 0.1;

        // Check for reasoning indicators
        const reasoningIndicators = ['because', 'therefore', 'however', 'although', 'while', 'since'];
        const text = JSON.stringify(analysis).toLowerCase();
        const indicatorCount = reasoningIndicators.filter(indicator => text.includes(indicator)).length;
        score += Math.min(indicatorCount * 0.05, 0.1);

        return Math.min(score, 1.0);
    }

    // Calculate execution confidence
    calculateExecutionConfidence(analysis) {
        let score = 0.5; // Base score

        // Check for actionable content
        const actionIndicators = ['should', 'must', 'need to', 'require', 'implement', 'execute', 'perform'];
        const text = JSON.stringify(analysis).toLowerCase();
        const actionCount = actionIndicators.filter(indicator => text.includes(indicator)).length;
        score += Math.min(actionCount * 0.1, 0.3);

        // Check for specific steps
        if (analysis.steps && Array.isArray(analysis.steps)) score += 0.2;
        if (analysis.actionItems && Array.isArray(analysis.actionItems)) score += 0.2;

        return Math.min(score, 1.0);
    }

    // Calculate policy match confidence
    calculatePolicyMatchConfidence(analysis) {
        let score = 0.5; // Base score

        // Check for policy references
        const policyIndicators = ['policy', 'compliance', 'regulation', 'guideline', 'standard', 'rule'];
        const text = JSON.stringify(analysis).toLowerCase();
        const policyCount = policyIndicators.filter(indicator => text.includes(indicator)).length;
        score += Math.min(policyCount * 0.1, 0.3);

        // Check for specific policy matches
        if (analysis.policyMatches && Array.isArray(analysis.policyMatches)) score += 0.2;

        return Math.min(score, 1.0);
    }

    // Calculate content clarity confidence
    calculateContentClarityConfidence(analysis) {
        let score = 0.5; // Base score

        // Check for clear language
        const clarityIndicators = ['clear', 'specific', 'detailed', 'comprehensive', 'thorough'];
        const text = JSON.stringify(analysis).toLowerCase();
        const clarityCount = clarityIndicators.filter(indicator => text.includes(indicator)).length;
        score += Math.min(clarityCount * 0.1, 0.3);

        // Check for structured content
        if (analysis.structure && typeof analysis.structure === 'object') score += 0.2;

        return Math.min(score, 1.0);
    }

    // Detect conflicts between reasoning and execution
    detectConflicts(analysis, scores) {
        const conflicts = [];

        // Check for reasoning vs execution conflicts
        if (scores.reasoning > 0.7 && scores.execution < 0.4) {
            conflicts.push({
                type: 'reasoning_execution_mismatch',
                description: 'High reasoning confidence but low execution confidence',
                severity: 'medium',
                recommendation: 'Consider adding more actionable steps'
            });
        }

        // Check for policy vs execution conflicts
        if (scores.policyMatch > 0.7 && scores.execution < 0.4) {
            conflicts.push({
                type: 'policy_execution_mismatch',
                description: 'High policy match but low execution confidence',
                severity: 'high',
                recommendation: 'Need specific implementation guidance'
            });
        }

        // Check for content clarity issues
        if (scores.contentClarity < 0.4) {
            conflicts.push({
                type: 'clarity_issue',
                description: 'Low content clarity confidence',
                severity: 'medium',
                recommendation: 'Improve clarity and specificity'
            });
        }

        return conflicts;
    }

    // Get confidence level
    getConfidenceLevel(score) {
        if (score >= this.confidenceThresholds.high) return 'high';
        if (score >= this.confidenceThresholds.medium) return 'medium';
        if (score >= this.confidenceThresholds.low) return 'low';
        return 'very_low';
    }

    // Generate recommendations based on scores and conflicts
    generateRecommendations(scores, conflicts) {
        const recommendations = [];

        // Low reasoning confidence
        if (scores.reasoning < 0.5) {
            recommendations.push({
                type: 'reasoning',
                priority: 'high',
                action: 'Add more detailed reasoning and analysis'
            });
        }

        // Low execution confidence
        if (scores.execution < 0.5) {
            recommendations.push({
                type: 'execution',
                priority: 'high',
                action: 'Include specific actionable steps'
            });
        }

        // Low policy match confidence
        if (scores.policyMatch < 0.5) {
            recommendations.push({
                type: 'policy',
                priority: 'medium',
                action: 'Reference specific policies and regulations'
            });
        }

        // Add conflict-specific recommendations
        conflicts.forEach(conflict => {
            recommendations.push({
                type: 'conflict_resolution',
                priority: conflict.severity === 'high' ? 'high' : 'medium',
                action: conflict.recommendation
            });
        });

        return recommendations;
    }

    // Apply confidence weighting to AI response
    applyConfidenceWeighting(aiResponse) {
        const confidence = this.calculateConfidence(aiResponse);
        
        // Add confidence information to response
        const weightedResponse = {
            ...aiResponse,
            confidence: confidence,
            confidenceLevel: confidence.confidenceLevel,
            hasConflicts: confidence.conflicts.length > 0,
            recommendations: confidence.recommendations
        };

        return weightedResponse;
    }

    // Get confidence display for UI
    getConfidenceDisplay(confidence) {
        const level = confidence.confidenceLevel;
        const score = confidence.overallConfidence;
        
        const displays = {
            high: { icon: '🟢', color: '#10b981', text: 'High Confidence' },
            medium: { icon: '🟡', color: '#f59e0b', text: 'Medium Confidence' },
            low: { icon: '🟠', color: '#f97316', text: 'Low Confidence' },
            very_low: { icon: '🔴', color: '#ef4444', text: 'Very Low Confidence' }
        };

        return {
            ...displays[level],
            score: Math.round(score * 100),
            conflicts: confidence.conflicts.length,
            recommendations: confidence.recommendations.length
        };
    }

    // Update weights based on user feedback
    updateWeights(newWeights) {
        this.weights = { ...this.weights, ...newWeights };
        console.log('[Confidence Weighting] Updated weights:', this.weights);
    }

    // Reset to default weights
    resetWeights() {
        this.weights = {
            reasoning: 0.4,
            execution: 0.3,
            policyMatch: 0.2,
            contentClarity: 0.1
        };
        console.log('[Confidence Weighting] Reset to default weights');
    }
}

// Export for use in other modules
window.ConfidenceWeightingSystem = ConfidenceWeightingSystem; 