#!/usr/bin/env node

/**
 * Xrefhub Design System Sync Script
 * Automatically updates popup.css CSS variables from design.json
 * 
 * Usage: node sync-design.js
 * 
 * This script reads the design.json file and automatically updates
 * the CSS custom properties in popup.css to match the design system.
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

function logSection(title) {
    log(`\n${colors.bright}${colors.cyan}=== ${title} ===${colors.reset}`);
}

/**
 * Generate CSS variables from design.json
 */
function generateCSSVariables(design) {
    const colors = design.color_palette;
    const spacing = design.spacing.scale;
    const radius = design.border_radius;
    const shadows = design.shadows;
    const typography = design.typography;
    
    return `    /* Primary Colors from design.json - AUTO GENERATED */
    --primary-gradient-start: ${colors.primary.gradient_start};
    --primary-gradient-end: ${colors.primary.gradient_end};
    --primary-solid: ${colors.primary.solid};
    --primary-light: ${colors.primary.light};
    
    /* Secondary Colors */
    --secondary-main: ${colors.secondary.main};
    --secondary-hover: ${colors.secondary.hover};
    
    /* Background Colors */
    --bg-primary: ${colors.background.primary};
    --bg-secondary: ${colors.background.secondary};
    --bg-tertiary: ${colors.background.tertiary};
    --bg-card: ${colors.background.card};
    
    /* Text Colors */
    --text-primary: ${colors.text.primary};
    --text-secondary: ${colors.text.secondary};
    --text-muted: ${colors.text.muted};
    --text-light: ${colors.text.light};
    --text-on-primary: ${colors.text.on_primary};
    
    /* Border Colors */
    --border-light: ${colors.border.light};
    --border-medium: ${colors.border.medium};
    --border-focus: ${colors.border.focus};
    
    /* Status Colors - Success */
    --success-main: ${colors.status.success.main};
    --success-bg: ${colors.status.success.background};
    --success-light: ${colors.status.success.light};
    --success-text: ${colors.status.success.text};
    
    /* Status Colors - Error */
    --error-main: ${colors.status.error.main};
    --error-bg: ${colors.status.error.background};
    --error-light: ${colors.status.error.light};
    --error-text: ${colors.status.error.text};
    
    /* Status Colors - Warning */
    --warning-main: ${colors.status.warning.main};
    --warning-bg: ${colors.status.warning.background};
    --warning-light: ${colors.status.warning.light};
    --warning-text: ${colors.status.warning.text};
    
    /* Status Colors - Info */
    --info-main: ${colors.status.info.main};
    --info-bg: ${colors.status.info.background};
    --info-light: ${colors.status.info.light};
    --info-text: ${colors.status.info.text};
    
    /* Industry Detection Colors */
    --industry-high-risk-bg: ${colors.industry_detection.high_risk.background};
    --industry-high-risk-border: ${colors.industry_detection.high_risk.border};
    --industry-high-risk-text: ${colors.industry_detection.high_risk.text};
    --industry-safe-bg: ${colors.industry_detection.safe.background};
    --industry-safe-border: ${colors.industry_detection.safe.border};
    --industry-safe-text: ${colors.industry_detection.safe.text};
    --industry-neutral-bg: ${colors.industry_detection.neutral.background};
    --industry-neutral-border: ${colors.industry_detection.neutral.border};
    --industry-neutral-text: ${colors.industry_detection.neutral.text};
    
    /* Spacing Scale */
    --spacing-xs: ${spacing.xs};
    --spacing-sm: ${spacing.sm};
    --spacing-md: ${spacing.md};
    --spacing-base: ${spacing.base};
    --spacing-lg: ${spacing.lg};
    --spacing-xl: ${spacing.xl};
    --spacing-xxl: ${spacing.xxl};
    --spacing-xxxl: ${spacing.xxxl};
    
    /* Border Radius */
    --radius-sm: ${radius.sm};
    --radius-base: ${radius.base};
    --radius-md: ${radius.md};
    --radius-lg: ${radius.lg};
    --radius-xl: ${radius.xl};
    --radius-full: ${radius.full};
    
    /* Shadows */
    --shadow-card: ${shadows.card};
    --shadow-card-hover: ${shadows.card_hover};
    --shadow-button: ${shadows.button};
    --shadow-focus: ${shadows.focus};
    --shadow-toast: ${shadows.toast};
    
    /* Typography */
    --font-family: ${typography.font_family.primary};
    --font-mono: ${typography.font_family.monospace};
    --font-xs: ${typography.font_sizes.xs};
    --font-sm: ${typography.font_sizes.sm};
    --font-base: ${typography.font_sizes.base};`;
}

/**
 * Create backup of CSS file
 */
function createBackup(cssPath) {
    const backupPath = cssPath + '.backup';
    if (fs.existsSync(cssPath)) {
        fs.copyFileSync(cssPath, backupPath);
        logInfo(`Backup created: ${backupPath}`);
        return backupPath;
    }
    return null;
}

/**
 * Restore CSS from backup
 */
function restoreFromBackup(cssPath, backupPath) {
    if (backupPath && fs.existsSync(backupPath)) {
        fs.copyFileSync(backupPath, cssPath);
        logWarning(`CSS restored from backup: ${backupPath}`);
        return true;
    }
    return false;
}

/**
 * Validate design.json structure
 */
function validateDesign(design) {
    const required = [
        'color_palette.primary.gradient_start',
        'color_palette.primary.gradient_end',
        'color_palette.secondary.main',
        'color_palette.secondary.hover',
        'spacing.scale.base',
        'border_radius.base',
        'shadows.card',
        'typography.font_family.primary'
    ];
    
    for (const path of required) {
        const keys = path.split('.');
        let current = design;
        for (const key of keys) {
            if (!current || !current[key]) {
                logError(`Missing required field: ${path}`);
                return false;
            }
            current = current[key];
        }
    }
    
    logSuccess('Design system validation passed');
    return true;
}

/**
 * Main sync function
 */
function syncDesignSystem() {
    logSection('Xrefhub Design System Sync');
    
    try {
        // Check if design.json exists
        const designPath = 'design.json';
        if (!fs.existsSync(designPath)) {
            logError('design.json not found in current directory');
            logInfo('Make sure you are running this script from the Xrefhub project root');
            return false;
        }
        
        // Read and parse design.json
        logInfo('Reading design.json...');
        const designContent = fs.readFileSync(designPath, 'utf8');
        const design = JSON.parse(designContent);
        
        // Validate design structure
        if (!validateDesign(design)) {
            return false;
        }
        
        // Check if popup.css exists
        const cssPath = 'popup.css';
        if (!fs.existsSync(cssPath)) {
            logError('popup.css not found in current directory');
            logInfo('Make sure you are running this script from the Xrefhub project root');
            return false;
        }
        
        // Create backup
        const backupPath = createBackup(cssPath);
        
        // Read CSS file
        logInfo('Reading popup.css...');
        let cssContent = fs.readFileSync(cssPath, 'utf8');
        
        // Find the :root section
        const rootStart = cssContent.indexOf(':root {');
        const rootEnd = cssContent.indexOf('}', rootStart);
        
        if (rootStart === -1 || rootEnd === -1) {
            logError('Could not find :root section in popup.css');
            if (backupPath) {
                restoreFromBackup(cssPath, backupPath);
            }
            return false;
        }
        
        // Generate new CSS variables
        logInfo('Generating CSS variables from design.json...');
        const newCSSVars = generateCSSVariables(design);
        
        // Replace the :root section
        const newCSSContent = cssContent.substring(0, rootStart) + 
                            ':root {\n' + newCSSVars + '\n}' + 
                            cssContent.substring(rootEnd + 1);
        
        // Write updated CSS back to file
        logInfo('Updating popup.css...');
        fs.writeFileSync(cssPath, newCSSContent, 'utf8');
        
        logSuccess('Design system synced successfully!');
        logInfo('popup.css has been updated with new design values');
        
        // Show next steps
        logSection('Next Steps');
        logInfo('1. Reload the Chrome extension in chrome://extensions/');
        logInfo('2. Open the extension popup to see your design changes');
        logInfo('3. If something goes wrong, restore from backup:');
        logInfo(`   cp popup.css.backup popup.css`);
        
        return true;
        
    } catch (error) {
        logError(`Design system sync failed: ${error.message}`);
        
        // Try to restore from backup if available
        if (error.message.includes('popup.css')) {
            logWarning('Attempting to restore from backup...');
            restoreFromBackup('popup.css', 'popup.css.backup');
        }
        
        return false;
    }
}

/**
 * Show help information
 */
function showHelp() {
    logSection('Xrefhub Design System Sync - Help');
    logInfo('This script automatically syncs design.json changes to popup.css');
    logInfo('');
    logInfo('Usage:');
    logInfo('  node sync-design.js          # Sync design system');
    logInfo('  node sync-design.js --help   # Show this help');
    logInfo('');
    logInfo('What it does:');
    logInfo('  1. Reads design.json from current directory');
    logInfo('  2. Validates the design system structure');
    logInfo('  3. Creates backup of popup.css');
    logInfo('  4. Updates CSS custom properties');
    logInfo('  5. Provides reload instructions');
    logInfo('');
    logInfo('Requirements:');
    logInfo('  - Node.js installed');
    logInfo('  - Run from Xrefhub project root directory');
    logInfo('  - design.json and popup.css must exist');
}

// Main execution
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args.includes('--help') || args.includes('-h')) {
        showHelp();
        process.exit(0);
    }
    
    const success = syncDesignSystem();
    process.exit(success ? 0 : 1);
}

module.exports = { syncDesignSystem, generateCSSVariables, validateDesign };
