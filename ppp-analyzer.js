/**
 * PPP (Paid Partnership Policy) Analyzer
 * Handles X/Twitter policy violations, user matching, and multi-link analysis
 */

class PPPAnalyzer {
    constructor() {
        this.policySelectors = {
            body: '#issue-view-layout-templates-tabs-0-tab > div > div:nth-child(1) > div',
            reporterUser: '[data-prosemirror-node-content]',
            username: '[data-prosemirror-node-pleaseshare]',
            reviewFor: '[review-for]',
            issueEditor: '[data-resol]',
            issueEditorEnd: '.issue-editor-end'
        };
        
        this.policyViolations = [];
        this.userMatches = [];
        this.linkAnalysis = [];
    }

    // Initialize PPP analysis
    async initialize() {
        console.log('[PPP Analyzer] Initializing PPP analysis...');
        
        // Load policy documents
        await this.loadPolicyDocuments();
        
        // Set up DOM observers
        this.setupObservers();
        
        console.log('[PPP Analyzer] PPP analysis initialized');
    }

    // Load policy documents
    async loadPolicyDocuments() {
        try {
            const response = await chrome.runtime.sendMessage({
                action: 'getPolicyDocuments'
            });

            if (response && response.policies) {
                this.policyDocuments = response.policies;
                console.log('[PPP Analyzer] Loaded policy documents:', Object.keys(this.policyDocuments));
            } else {
                console.warn('[PPP Analyzer] Could not load policy documents');
                this.policyDocuments = {};
            }
        } catch (error) {
            console.error('[PPP Analyzer] Error loading policy documents:', error);
            this.policyDocuments = {};
        }
    }

    // Setup DOM observers for dynamic content
    setupObservers() {
        // Observe for new policy violation elements
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            this.checkForPolicyViolations(node);
                        }
                    });
                }
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // Check for policy violations in element
    checkForPolicyViolations(element) {
        // Check if element contains policy violation indicators
        const violationSelectors = [
            '[data-testid*="violation"]',
            '[class*="violation"]',
            '[data-violation]',
            '.policy-violation',
            '.violation-indicator'
        ];

        violationSelectors.forEach(selector => {
            const elements = element.querySelectorAll(selector);
            elements.forEach(el => {
                this.analyzePolicyViolation(el);
            });
        });
    }

    // Analyze individual policy violation
    async analyzePolicyViolation(element) {
        console.log('[PPP Analyzer] Analyzing policy violation element:', element);

        const violation = {
            element: element,
            timestamp: new Date().toISOString(),
            userMatch: null,
            policyMatch: null,
            links: [],
            resolution: null
        };

        // Check user match
        violation.userMatch = this.checkUserMatch(element);
        
        // Check policy match
        violation.policyMatch = await this.checkPolicyMatch(element);
        
        // Extract links
        violation.links = this.extractPolicyLinks(element);
        
        // Analyze links
        if (violation.links.length > 0) {
            violation.linkAnalysis = await this.analyzeLinks(violation.links);
        }
        
        // Generate resolution
        violation.resolution = this.generateResolution(violation);
        
        this.policyViolations.push(violation);
        
        console.log('[PPP Analyzer] Policy violation analyzed:', violation);
        
        return violation;
    }

    // Check user match
    checkUserMatch(element) {
        console.log('[PPP Analyzer] Checking user match...');
        
        // Look for reporter user data
        const reporterElements = element.querySelectorAll(this.policySelectors.reporterUser);
        const usernameElements = element.querySelectorAll(this.policySelectors.username);
        const reviewForElements = element.querySelectorAll(this.policySelectors.reviewFor);
        
        let userMatch = {
            found: false,
            reporterUser: null,
            username: null,
            reviewFor: null,
            matchConfirmed: false
        };

        // Extract reporter user
        if (reporterElements.length > 0) {
            const reporterElement = reporterElements[0];
            userMatch.reporterUser = this.safeGetText(reporterElement);
            console.log('[PPP Analyzer] Found reporter user:', userMatch.reporterUser);
        }

        // Extract username
        if (usernameElements.length > 0) {
            const usernameElement = usernameElements[0];
            userMatch.username = this.safeGetText(usernameElement);
            console.log('[PPP Analyzer] Found username:', userMatch.username);
        }

        // Check review-for value
        if (reviewForElements.length > 0) {
            const reviewForElement = reviewForElements[0];
            const reviewForValue = reviewForElement.getAttribute('review-for');
            userMatch.reviewFor = reviewForValue === 'true';
            console.log('[PPP Analyzer] Review-for value:', userMatch.reviewFor);
        }

        // Determine if user match is confirmed
        if (userMatch.reporterUser && userMatch.username) {
            userMatch.found = true;
            userMatch.matchConfirmed = userMatch.reporterUser === userMatch.username;
            
            if (!userMatch.matchConfirmed) {
                console.log('[PPP Analyzer] User match not confirmed - different users');
            } else {
                console.log('[PPP Analyzer] User match confirmed');
            }
        }

        return userMatch;
    }

    // Check policy match
    async checkPolicyMatch(element) {
        console.log('[PPP Analyzer] Checking policy match...');
        
        const policyMatch = {
            found: false,
            matchedPolicies: [],
            violationType: null,
            severity: null
        };

        // Look for policy violation content
        const violationText = this.safeGetText(element);
        
        if (violationText) {
            // Check against policy documents
            for (const [policyName, policyContent] of Object.entries(this.policyDocuments)) {
                if (this.textMatchesPolicy(violationText, policyContent)) {
                    policyMatch.matchedPolicies.push({
                        name: policyName,
                        content: policyContent
                    });
                }
            }
            
            if (policyMatch.matchedPolicies.length > 0) {
                policyMatch.found = true;
                policyMatch.violationType = this.determineViolationType(policyMatch.matchedPolicies);
                policyMatch.severity = this.determineSeverity(policyMatch.matchedPolicies);
                
                console.log('[PPP Analyzer] Policy match found:', policyMatch.violationType);
            }
        }

        return policyMatch;
    }

    // Extract policy links
    extractPolicyLinks(element) {
        console.log('[PPP Analyzer] Extracting policy links...');
        
        const links = [];
        const linkElements = element.querySelectorAll('a[href]');
        
        linkElements.forEach((link, index) => {
            const href = link.getAttribute('href');
            if (href && this.isPolicyLink(href)) {
                links.push({
                    index: index + 1,
                    url: href,
                    text: this.safeGetText(link),
                    element: link
                });
            }
        });
        
        console.log('[PPP Analyzer] Extracted', links.length, 'policy links');
        return links;
    }

    // Analyze links sequentially
    async analyzeLinks(links) {
        console.log('[PPP Analyzer] Analyzing', links.length, 'links...');
        
        const analysis = [];
        
        for (const link of links) {
            try {
                console.log(`[PPP Analyzer] Analyzing link ${link.index}:`, link.url);
                
                const linkAnalysis = await this.analyzeSingleLink(link);
                analysis.push({
                    linkNumber: link.index,
                    url: link.url,
                    analysis: linkAnalysis
                });
                
                // Add delay between requests to avoid overwhelming
                await new Promise(resolve => setTimeout(resolve, 1000));
                
            } catch (error) {
                console.error(`[PPP Analyzer] Error analyzing link ${link.index}:`, error);
                analysis.push({
                    linkNumber: link.index,
                    url: link.url,
                    error: error.message
                });
            }
        }
        
        return analysis;
    }

    // Analyze single link
    async analyzeSingleLink(link) {
        try {
            // Fetch link content
            const response = await fetch(link.url);
            const content = await response.text();
            
            // Analyze content for policy violations
            const violations = this.findViolationsInContent(content);
            
            return {
                status: 'analyzed',
                violations: violations,
                contentLength: content.length,
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            return {
                status: 'error',
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    // Generate resolution
    generateResolution(violation) {
        console.log('[PPP Analyzer] Generating resolution...');
        
        let resolution = {
            action: 'none',
            reason: '',
            userMatch: violation.userMatch.matchConfirmed,
            policyViolation: violation.policyMatch.found,
            linkViolations: violation.linkAnalysis?.filter(a => a.analysis?.violations?.length > 0) || []
        };

        // Check user match
        if (!violation.userMatch.matchConfirmed) {
            resolution.action = 'no_action';
            resolution.reason = 'No violation due to unconnected account';
            console.log('[PPP Analyzer] Resolution: No action - unconnected account');
        }
        // Check policy violation
        else if (violation.policyMatch.found) {
            resolution.action = 'action_required';
            resolution.reason = `Policy violation found: ${violation.policyMatch.violationType}`;
            console.log('[PPP Analyzer] Resolution: Action required - policy violation');
        }
        // Check link violations
        else if (resolution.linkViolations.length > 0) {
            resolution.action = 'action_required';
            resolution.reason = `Link violations found in ${resolution.linkViolations.length} links`;
            console.log('[PPP Analyzer] Resolution: Action required - link violations');
        }
        // No violations found
        else {
            resolution.action = 'no_action';
            resolution.reason = 'No violations found in organic content';
            console.log('[PPP Analyzer] Resolution: No action - no violations');
        }

        return resolution;
    }

    // Helper methods
    safeGetText(element) {
        try {
            return element.innerText || element.textContent || '';
        } catch (error) {
            return '';
        }
    }

    textMatchesPolicy(text, policyContent) {
        const textLower = text.toLowerCase();
        const policyLower = policyContent.toLowerCase();
        
        // Simple keyword matching
        const keywords = ['violation', 'policy', 'compliance', 'regulation', 'guideline'];
        return keywords.some(keyword => textLower.includes(keyword) && policyLower.includes(keyword));
    }

    determineViolationType(policies) {
        const types = policies.map(p => p.name);
        return types.join(', ');
    }

    determineSeverity(policies) {
        // Simple severity determination
        if (policies.length > 2) return 'high';
        if (policies.length > 1) return 'medium';
        return 'low';
    }

    isPolicyLink(url) {
        const policyDomains = ['twitter.com', 'x.com', 'help.twitter.com', 'help.x.com'];
        return policyDomains.some(domain => url.includes(domain));
    }

    findViolationsInContent(content) {
        const violations = [];
        const violationKeywords = ['violation', 'policy', 'compliance', 'regulation'];
        
        const lines = content.split('\n');
        lines.forEach((line, index) => {
            if (violationKeywords.some(keyword => line.toLowerCase().includes(keyword))) {
                violations.push({
                    line: index + 1,
                    content: line.trim(),
                    keywords: violationKeywords.filter(keyword => line.toLowerCase().includes(keyword))
                });
            }
        });
        
        return violations;
    }

    // Get analysis results
    getAnalysisResults() {
        return {
            violations: this.policyViolations,
            summary: {
                totalViolations: this.policyViolations.length,
                userMatches: this.policyViolations.filter(v => v.userMatch.matchConfirmed).length,
                policyViolations: this.policyViolations.filter(v => v.policyMatch.found).length,
                linkViolations: this.policyViolations.filter(v => v.linkAnalysis?.some(a => a.analysis?.violations?.length > 0)).length
            },
            timestamp: new Date().toISOString()
        };
    }

    // Create resolution display
    createResolutionDisplay(violation) {
        const resolution = violation.resolution;
        
        let display = `<div class="ppp-resolution" data-resol="${resolution.action === 'action_required' ? 'true' : 'false'}">`;
        display += `<div class="resolution-header">`;
        display += `<span class="resolution-number">${this.policyViolations.indexOf(violation) + 1}</span>`;
        display += `<span class="resolution-action ${resolution.action}">${resolution.action.replace('_', ' ').toUpperCase()}</span>`;
        display += `</div>`;
        display += `<div class="resolution-reason">${resolution.reason}</div>`;
        
        if (violation.linkAnalysis && violation.linkAnalysis.length > 0) {
            display += `<div class="link-analysis">`;
            violation.linkAnalysis.forEach(link => {
                display += `<div class="link-result">`;
                display += `<span class="link-number">${link.linkNumber}</span>`;
                display += `<span class="link-status">${link.analysis?.status || 'error'}</span>`;
                display += `</div>`;
            });
            display += `</div>`;
        }
        
        display += `</div>`;
        
        return display;
    }
}

// Export for use in other modules
window.PPPAnalyzer = PPPAnalyzer; 