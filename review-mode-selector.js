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
                description: 'Standard ad review approach',
                icon: '📋',
                color: '#3b82f6',
                aiPrompt: 'Analyze this content for general policy compliance and provide a standard review.',
                displayFormat: 'standard'
            },
            paidPartnership: {
                name: 'Paid Partnership Review',
                description: 'X/Twitter paid partnership policy analysis',
                icon: '💰',
                color: '#f59e0b',
                aiPrompt: `Analyze this content following X/Twitter's exact Paid Partnership Enforcement workflow:

STEP 1: Check if products/services generate commission for the user from sales (referral codes, affiliate links, discount codes, etc.)
- If NO commission → No violation, stop here
- If YES commission → Continue to Step 2

STEP 2: Check if the post promotes or encourages users to use a product or service
- If NO promotion → No violation, stop here  
- If YES promotion → Continue to Step 3

STEP 3: Check if post promotes content within a prohibited industry:
- Adult merchandise, Alcoholic beverages, Contraceptives, Dating & Marriage Services
- Drugs and drug-related products, Financial/financial-related products/services
- Gambling products/services, Geo-political/political issues for commercial purposes
- Health and wellness supplements, Tobacco products, Weapons/weapons-related products
- Weight loss products and services
- If YES prohibited industry → Continue to Step 4
- If NO prohibited industry → Continue to Step 4

STEP 4: Check if post contains disclaimer (#ad, #sponsored, #sponsoredpost, etc.)
- If YES disclaimer AND NO prohibited industry → No violation
- If NO disclaimer OR YES prohibited industry → VIOLATION

VIOLATION ACTIONS:
- Prohibited industry detected → BOUNCE POST (account locked)
- No disclaimer found → BOUNCE POST (account locked)

Focus on this exact step-by-step process to determine violation status.`,
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