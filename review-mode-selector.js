/**
 * Review Mode Selector for Xrefhub Extension
 * Allows switching between different AI review approaches and display formats
 */

class ReviewModeSelector {
    constructor() {
        this.currentMode = 'adReview'; // default mode
        this.modes = {
            adReview: {
                name: 'Ad Review',
                description: 'Standard content analysis focusing on intent and context',
                icon: '📋',
                color: '#3b82f6',
                aiPrompt: `You are a Content Policy Analyst. Analyze this content focusing on:

CONTENT ANALYSIS:
- Identify the main intent and purpose of the post
- Determine the target audience and messaging approach
- Assess the tone, style, and communication strategy
- Evaluate if content is promotional, informational, or entertainment

POLICY COMPLIANCE:
- Check for potential policy violations (inappropriate content, misleading claims, etc.)
- Assess accuracy and truthfulness of claims
- Evaluate potential harm or risk to users

Return a JSON object with:
- "summary": Brief description of content intent and purpose (focus on what the post is trying to achieve)
- "resolution": Policy compliance assessment (violation status and reasoning)
- "suggestedLabels": Relevant policy labels
- "policyDocument": Most relevant policy section
- "policyReasoning": Specific policy justification`,
                displayFormat: 'standard'
            },
            paidPartnership: {
                name: 'Paid Partnership Review',
                description: 'X/Twitter paid partnership policy analysis',
                icon: '💰',
                color: '#f59e0b',
                aiPrompt: `You are a Paid Partnership Policy Specialist. Analyze this content specifically for X/Twitter's paid partnership compliance:

PAID PARTNERSHIP DETECTION:
- Check for commercial relationships (sponsored content, affiliate links, brand partnerships)
- Identify promotional language and call-to-action elements
- Assess if content promotes products/services for compensation
- Look for disclosure indicators (#ad, #sponsored, #paid, etc.)

PROHIBITED INDUSTRIES CHECK:
- Financial services, gambling, adult content, weapons, etc.
- Health/wellness supplements, weight loss products
- Political content for commercial purposes

COMPLIANCE ASSESSMENT:
- Determine if proper disclosure is present
- Assess if content violates prohibited industry rules
- Evaluate overall paid partnership policy compliance

Return a JSON object with:
- "summary": Content intent and commercial nature assessment
- "resolution": Paid partnership compliance status and specific violations
- "suggestedLabels": Paid partnership specific labels
- "policyDocument": Relevant paid partnership policy
- "policyReasoning": Specific policy violation reasoning
- "workflowSteps": Step-by-step analysis process
- "commissionDetected": Boolean for commission/compensation
- "promotionDetected": Boolean for promotional content
- "prohibitedIndustries": List of detected prohibited industries
- "disclaimerPresent": Boolean for proper disclosure
- "violation": Boolean for policy violation
- "action": Recommended enforcement action`,
                displayFormat: 'paidPartnership'
            }
        };
    }

    // Get current mode
    getCurrentMode() {
        return this.currentMode;
    }

    // Get mode configuration
    getModeConfig(mode = this.currentMode) {
        return this.modes[mode] || this.modes.standard;
    }

    // Set review mode
    setMode(mode) {
        if (this.modes[mode]) {
            this.currentMode = mode;
            this.updateUI();
            this.saveMode();
            console.log(`[Review Mode] Switched to: ${this.modes[mode].name}`);
            return true;
        }
        return false;
    }

    // Get AI prompt for current mode
    getAIPrompt() {
        return this.getModeConfig().aiPrompt;
    }

    // Get display format for current mode
    getDisplayFormat() {
        return this.getModeConfig().displayFormat;
    }

    // Update UI to reflect current mode
    updateUI() {
        const modeConfig = this.getModeConfig();
        const modeIndicator = document.getElementById('review-mode-indicator');
        const modeName = document.getElementById('review-mode-name');
        const modeDescription = document.getElementById('review-mode-description');
        
        if (modeIndicator) {
            modeIndicator.textContent = modeConfig.icon;
            modeIndicator.style.color = modeConfig.color;
        }
        
        if (modeName) {
            modeName.textContent = modeConfig.name;
        }
        
        if (modeDescription) {
            modeDescription.textContent = modeConfig.description;
        }

        // Update button states
        this.updateModeButtons();
    }

    // Update compact mode selection buttons
    updateModeButtons() {
        const buttons = document.querySelectorAll('.compact-review-mode-button');
        buttons.forEach(button => {
            const mode = button.dataset.mode;
            if (mode === this.currentMode) {
                button.classList.add('active');
                button.style.backgroundColor = this.getModeConfig().color;
            } else {
                button.classList.remove('active');
                button.style.backgroundColor = '';
            }
        });
    }

    // Create compact mode selector UI
    createModeSelector() {
        const container = document.createElement('div');
        container.className = 'review-mode-selector compact';
        container.innerHTML = `
            <div class="compact-mode-buttons">
                ${Object.entries(this.modes).map(([key, mode]) => `
                    <button class="compact-review-mode-button" data-mode="${key}" title="${mode.description}">
                        <span class="mode-icon">${mode.icon}</span>
                        <span class="mode-name">${mode.name}</span>
                    </button>
                `).join('')}
            </div>
        `;

        // Add event listeners
        const buttons = container.querySelectorAll('.compact-review-mode-button');
        buttons.forEach(button => {
            button.addEventListener('click', () => {
                const mode = button.dataset.mode;
                this.setMode(mode);
            });
        });

        return container;
    }

    // Format analysis results based on current mode
    formatAnalysisResults(results, mode = this.currentMode) {
        const modeConfig = this.getModeConfig(mode);
        
        switch (modeConfig.displayFormat) {
            case 'paidPartnership':
                return this.formatPaidPartnershipResults(results);
            default:
                return this.formatStandardResults(results);
        }
    }

    // Format standard results
    formatStandardResults(results) {
        return {
            summary: results.summary || 'Standard analysis completed',
            details: results.details || [],
            recommendations: results.recommendations || [],
            format: 'standard'
        };
    }



    // Format paid partnership-focused results
    formatPaidPartnershipResults(results) {
        return {
            summary: `💰 Paid Partnership Analysis: ${results.summary || 'Paid partnership review completed'}`,
            workflowSteps: results.workflowSteps || [],
            commissionDetected: results.commissionDetected || false,
            promotionDetected: results.promotionDetected || false,
            prohibitedIndustries: results.prohibitedIndustries || [],
            disclaimerPresent: results.disclaimerPresent || false,
            violation: results.violation || false,
            action: results.action || 'No action needed',
            reasoning: results.reasoning || 'Analysis based on X/Twitter enforcement workflow',
            format: 'paidPartnership'
        };
    }

    // Save current mode to storage
    saveMode() {
        chrome.storage.local.set({ 'reviewMode': this.currentMode }, () => {
            console.log(`[Review Mode] Saved mode: ${this.currentMode}`);
        });
    }

    // Load saved mode from storage
    loadMode() {
        chrome.storage.local.get(['reviewMode'], (result) => {
            if (result.reviewMode && this.modes[result.reviewMode]) {
                this.currentMode = result.reviewMode;
                console.log(`[Review Mode] Loaded saved mode: ${this.currentMode}`);
            }
        });
    }

    // Get mode-specific analysis prompt
    getModeSpecificPrompt(content, mediaUrl = '') {
        const modeConfig = this.getModeConfig();
        const basePrompt = modeConfig.aiPrompt;
        
        return `${basePrompt}

Content to analyze: ${content}
${mediaUrl ? `Media URL: ${mediaUrl}` : ''}

Please provide analysis in the following format:
- Summary
- Key findings
- Recommendations
- ${this.getModeSpecificSections()}`;
    }

    // Get mode-specific sections for the prompt
    getModeSpecificSections() {
        switch (this.currentMode) {
            case 'paidPartnership':
                return 'Paid partnership indicators, X/Twitter policy compliance, Partnership disclosure requirements, Sponsored content analysis';
            default:
                return 'General analysis points';
        }
    }

    // Initialize the selector
    init() {
        this.loadMode();
        this.updateUI();
        console.log(`[Review Mode] Initialized with mode: ${this.currentMode}`);
    }
}

// Export for use in other modules
window.ReviewModeSelector = ReviewModeSelector; 