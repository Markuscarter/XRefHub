#!/usr/bin/env node

/**
 * Xrefhub Chrome Extension Build Script
 * Validates project structure, dependencies, and performs build checks
 */

const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
    log(`\n${colors.bright}${colors.cyan}=== ${title} ===${colors.reset}`);
}

function logSuccess(message) {
    log(`✅ ${message}`, 'green');
}

function logError(message) {
    log(`❌ ${message}`, 'red');
}

function logWarning(message) {
    log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
    log(`ℹ️  ${message}`, 'blue');
}

// Project configuration
const config = {
    name: 'Xrefhub',
    version: '2.0.0',
    requiredFiles: [
        'manifest.json',
        'background.js',
        'popup.html',
        'popup.js',
        'popup.css',
        'content-scanner.js',
        'ai-analyzer.js',
        'settings.html',
        'settings.js',
        'google-auth.js',
        'google-drive.js',
        'google-sheets.js'
    ],
    optionalFiles: [
        'shared-styles.css',
        'policy-data.json',
        'xrefhub_config.json'
    ],
    iconSizes: [16, 32, 48, 128],
    permissions: [
        'storage',
        'activeTab',
        'scripting',
        'identity',
        'tabs'
    ]
};

// Validation functions
function validateFileExists(filePath, required = true) {
    const exists = fs.existsSync(filePath);
    if (exists) {
        logSuccess(`Found: ${filePath}`);
        return true;
    } else {
        if (required) {
            logError(`Missing required file: ${filePath}`);
            return false;
        } else {
            logWarning(`Missing optional file: ${filePath}`);
            return true; // Optional files don't fail the build
        }
    }
}

function validateManifest() {
    logSection('Validating Manifest');
    
    try {
        const manifestPath = 'manifest.json';
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        
        // Check manifest version
        if (manifest.manifest_version !== 3) {
            logError('Manifest version must be 3');
            return false;
        }
        logSuccess('Manifest version: 3');
        
        // Check required permissions
        const missingPermissions = config.permissions.filter(
            perm => !manifest.permissions.includes(perm)
        );
        
        if (missingPermissions.length > 0) {
            logError(`Missing permissions: ${missingPermissions.join(', ')}`);
            return false;
        }
        logSuccess('All required permissions present');
        
        // Check OAuth configuration
        if (!manifest.oauth2 || !manifest.oauth2.client_id) {
            logWarning('OAuth2 client_id not configured');
        } else {
            logSuccess('OAuth2 client_id configured');
        }
        
        // Check service worker
        if (!manifest.background || !manifest.background.service_worker) {
            logError('Service worker not configured');
            return false;
        }
        logSuccess('Service worker configured');
        
        return true;
    } catch (error) {
        logError(`Manifest validation failed: ${error.message}`);
        return false;
    }
}

function validateJavaScriptSyntax(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Basic syntax checks
        const issues = [];
        
        // Check for common syntax errors
        if (content.includes('undefined.trim()') || content.includes('null.trim()')) {
            issues.push('Potential trim() on undefined/null');
        }
        
        if (content.includes('console.log') && !content.includes('console.error')) {
            issues.push('Missing error logging');
        }
        
        if (content.includes('chrome.runtime.sendMessage') && !content.includes('catch')) {
            issues.push('Missing error handling for chrome.runtime.sendMessage');
        }
        
        if (issues.length > 0) {
            logWarning(`${filePath}: ${issues.join(', ')}`);
        } else {
            logSuccess(`JavaScript syntax: ${filePath}`);
        }
        
        return issues.length === 0;
    } catch (error) {
        logError(`Failed to validate ${filePath}: ${error.message}`);
        return false;
    }
}

function validateHTML(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Basic HTML validation
        const issues = [];
        
        if (!content.includes('<!DOCTYPE html>')) {
            issues.push('Missing DOCTYPE');
        }
        
        if (!content.includes('<html')) {
            issues.push('Missing html tag');
        }
        
        if (!content.includes('<head>')) {
            issues.push('Missing head tag');
        }
        
        if (!content.includes('<body>')) {
            issues.push('Missing body tag');
        }
        
        if (issues.length > 0) {
            logWarning(`${filePath}: ${issues.join(', ')}`);
        } else {
            logSuccess(`HTML structure: ${filePath}`);
        }
        
        return issues.length === 0;
    } catch (error) {
        logError(`Failed to validate ${filePath}: ${error.message}`);
        return false;
    }
}

function validateCSS(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Basic CSS validation
        const issues = [];
        
        if (!content.includes('{') || !content.includes('}')) {
            issues.push('Missing CSS rules');
        }
        
        if (content.includes('!important') && content.split('!important').length > 5) {
            issues.push('Too many !important declarations');
        }
        
        if (issues.length > 0) {
            logWarning(`${filePath}: ${issues.join(', ')}`);
        } else {
            logSuccess(`CSS structure: ${filePath}`);
        }
        
        return issues.length === 0;
    } catch (error) {
        logError(`Failed to validate ${filePath}: ${error.message}`);
        return false;
    }
}

function validateIcons() {
    logSection('Validating Icons');
    
    const iconsDir = 'icons';
    if (!fs.existsSync(iconsDir)) {
        logError('Icons directory not found');
        return false;
    }
    
    let allIconsPresent = true;
    config.iconSizes.forEach(size => {
        const iconPath = path.join(iconsDir, `icon${size}.png`);
        if (fs.existsSync(iconPath)) {
            logSuccess(`Icon ${size}x${size} found`);
        } else {
            logError(`Icon ${size}x${size} missing`);
            allIconsPresent = false;
        }
    });
    
    return allIconsPresent;
}

function checkContentScraping() {
    logSection('Content Scraping Validation');
    
    try {
        const scannerPath = 'content-scanner.js';
        const content = fs.readFileSync(scannerPath, 'utf8');
        
        const checks = [
            { name: 'Safe text extraction', pattern: 'safeGetText', required: true },
            { name: 'Error handling', pattern: 'catch', required: true },
            { name: 'Console logging', pattern: 'console.log', required: true },
            { name: 'DOM selectors', pattern: 'querySelector', required: true },
            { name: 'Async function', pattern: 'async function', required: true }
        ];
        
        let allChecksPassed = true;
        checks.forEach(check => {
            if (content.includes(check.pattern)) {
                logSuccess(`${check.name}: Found`);
            } else if (check.required) {
                logError(`${check.name}: Missing`);
                allChecksPassed = false;
            } else {
                logWarning(`${check.name}: Missing (optional)`);
            }
        });
        
        return allChecksPassed;
    } catch (error) {
        logError(`Content scraping validation failed: ${error.message}`);
        return false;
    }
}

function checkAIIntegration() {
    logSection('AI Integration Validation');
    
    try {
        const aiPath = 'ai-analyzer.js';
        const content = fs.readFileSync(aiPath, 'utf8');
        
        const checks = [
            { name: 'Gemini API integration', pattern: 'gemini', required: true },
            { name: 'API key handling', pattern: 'apiKey', required: true },
            { name: 'Error handling', pattern: 'catch', required: true },
            { name: 'Response processing', pattern: 'response', required: true }
        ];
        
        let allChecksPassed = true;
        checks.forEach(check => {
            if (content.includes(check.pattern)) {
                logSuccess(`${check.name}: Found`);
            } else if (check.required) {
                logError(`${check.name}: Missing`);
                allChecksPassed = false;
            } else {
                logWarning(`${check.name}: Missing (optional)`);
            }
        });
        
        return allChecksPassed;
    } catch (error) {
        logError(`AI integration validation failed: ${error.message}`);
        return false;
    }
}

function generateBuildReport(results) {
    logSection('Build Report');
    
    const totalChecks = Object.keys(results).length;
    const passedChecks = Object.values(results).filter(Boolean).length;
    const failedChecks = totalChecks - passedChecks;
    
    logInfo(`Total checks: ${totalChecks}`);
    logSuccess(`Passed: ${passedChecks}`);
    
    if (failedChecks > 0) {
        logError(`Failed: ${failedChecks}`);
        logError('Build validation failed. Please fix the issues above.');
        return false;
    } else {
        logSuccess('All checks passed! Build is ready.');
        return true;
    }
}

// Main build function
async function build() {
    log(`${colors.bright}${colors.magenta}🚀 Xrefhub Chrome Extension Build v${config.version}${colors.reset}\n`);
    
    const results = {};
    
    // 1. Validate project structure
    logSection('Project Structure Validation');
    let structureValid = true;
    
    config.requiredFiles.forEach(file => {
        if (!validateFileExists(file, true)) {
            structureValid = false;
        }
    });
    
    config.optionalFiles.forEach(file => {
        validateFileExists(file, false);
    });
    
    results.structure = structureValid;
    
    // 2. Validate manifest
    results.manifest = validateManifest();
    
    // 3. Validate icons
    results.icons = validateIcons();
    
    // 4. Validate JavaScript files
    logSection('JavaScript Validation');
    const jsFiles = ['background.js', 'popup.js', 'content-scanner.js', 'ai-analyzer.js', 'settings.js'];
    let jsValid = true;
    
    jsFiles.forEach(file => {
        if (fs.existsSync(file)) {
            if (!validateJavaScriptSyntax(file)) {
                jsValid = false;
            }
        }
    });
    
    results.javascript = jsValid;
    
    // 5. Validate HTML files
    logSection('HTML Validation');
    const htmlFiles = ['popup.html', 'settings.html'];
    let htmlValid = true;
    
    htmlFiles.forEach(file => {
        if (fs.existsSync(file)) {
            if (!validateHTML(file)) {
                htmlValid = false;
            }
        }
    });
    
    results.html = htmlValid;
    
    // 6. Validate CSS files
    logSection('CSS Validation');
    const cssFiles = ['popup.css', 'settings.css', 'shared-styles.css'];
    let cssValid = true;
    
    cssFiles.forEach(file => {
        if (fs.existsSync(file)) {
            if (!validateCSS(file)) {
                cssValid = false;
            }
        }
    });
    
    results.css = cssValid;
    
    // 7. Validate content scraping
    results.contentScraping = checkContentScraping();
    
    // 8. Validate AI integration
    results.aiIntegration = checkAIIntegration();
    
    // Generate final report
    const buildSuccess = generateBuildReport(results);
    
    if (buildSuccess) {
        log(`\n${colors.bright}${colors.green}🎉 Build completed successfully!${colors.reset}`);
        logInfo('The extension is ready for testing and deployment.');
        logInfo('Next steps:');
        logInfo('1. Load the extension in Chrome (chrome://extensions/)');
        logInfo('2. Test content scraping on various websites');
        logInfo('3. Verify AI analysis functionality');
        logInfo('4. Check Google Drive/Sheets integration');
    } else {
        log(`\n${colors.bright}${colors.red}💥 Build failed!${colors.reset}`);
        logError('Please fix the issues above before proceeding.');
        process.exit(1);
    }
}

// Run the build
if (require.main === module) {
    build().catch(error => {
        logError(`Build script failed: ${error.message}`);
        process.exit(1);
    });
}

module.exports = { build, config }; 