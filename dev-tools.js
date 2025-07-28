#!/usr/bin/env node

/**
 * Development Tools for Popup Dynamics
 * Safe development environment management
 */

const fs = require('fs');
const path = require('path');

class DevTools {
    constructor() {
        this.backupDir = 'dev-backup';
        this.currentFiles = ['popup.js', 'popup.css', 'popup.html'];
        this.trackingFile = 'popup-dynamics-dev.md';
    }

    // Check if we're in development mode
    isDevelopmentMode() {
        return fs.existsSync(this.backupDir) && fs.existsSync(this.trackingFile);
    }

    // Validate current working state
    validateWorkingState() {
        console.log('🔍 Validating current working state...');
        
        const missingFiles = this.currentFiles.filter(file => !fs.existsSync(file));
        if (missingFiles.length > 0) {
            console.error('❌ Missing files:', missingFiles);
            return false;
        }

        const backupFiles = this.currentFiles.filter(file => 
            fs.existsSync(path.join(this.backupDir, file))
        );
        if (backupFiles.length !== this.currentFiles.length) {
            console.error('❌ Missing backup files:', 
                this.currentFiles.filter(f => !backupFiles.includes(f))
            );
            return false;
        }

        console.log('✅ Working state validated');
        return true;
    }

    // Create backup of current state
    createBackup() {
        console.log('📦 Creating backup of current state...');
        
        if (!fs.existsSync(this.backupDir)) {
            fs.mkdirSync(this.backupDir);
        }

        this.currentFiles.forEach(file => {
            if (fs.existsSync(file)) {
                fs.copyFileSync(file, path.join(this.backupDir, file));
                console.log(`✅ Backed up: ${file}`);
            }
        });
    }

    // Restore from backup
    restoreFromBackup() {
        console.log('🔄 Restoring from backup...');
        
        this.currentFiles.forEach(file => {
            const backupPath = path.join(this.backupDir, file);
            if (fs.existsSync(backupPath)) {
                fs.copyFileSync(backupPath, file);
                console.log(`✅ Restored: ${file}`);
            } else {
                console.warn(`⚠️ No backup found for: ${file}`);
            }
        });
    }

    // Compare current vs backup
    compareWithBackup() {
        console.log('🔍 Comparing current files with backup...');
        
        this.currentFiles.forEach(file => {
            const currentPath = file;
            const backupPath = path.join(this.backupDir, file);
            
            if (fs.existsSync(currentPath) && fs.existsSync(backupPath)) {
                const current = fs.readFileSync(currentPath, 'utf8');
                const backup = fs.readFileSync(backupPath, 'utf8');
                
                if (current === backup) {
                    console.log(`✅ ${file}: No changes`);
                } else {
                    console.log(`📝 ${file}: Has changes`);
                }
            }
        });
    }

    // Show development status
    showStatus() {
        console.log('\n🎯 Popup Dynamics Development Status');
        console.log('=====================================');
        
        if (this.isDevelopmentMode()) {
            console.log('✅ Development mode active');
            console.log(`📁 Backup directory: ${this.backupDir}`);
            console.log(`📋 Tracking file: ${this.trackingFile}`);
            
            this.compareWithBackup();
        } else {
            console.log('❌ Not in development mode');
            console.log('Run: node dev-tools.js --setup');
        }
    }

    // Setup development environment
    setup() {
        console.log('🚀 Setting up development environment...');
        
        if (this.validateWorkingState()) {
            this.createBackup();
            console.log('✅ Development environment ready');
            console.log('📝 Edit popup-dynamics-dev.md to track changes');
        } else {
            console.error('❌ Cannot setup - working state invalid');
        }
    }
}

// CLI Interface
const devTools = new DevTools();
const args = process.argv.slice(2);

switch (args[0]) {
    case '--setup':
        devTools.setup();
        break;
    case '--status':
        devTools.showStatus();
        break;
    case '--restore':
        devTools.restoreFromBackup();
        break;
    case '--compare':
        devTools.compareWithBackup();
        break;
    default:
        console.log('🔧 Popup Dynamics Development Tools');
        console.log('===================================');
        console.log('Usage:');
        console.log('  node dev-tools.js --setup     Setup development environment');
        console.log('  node dev-tools.js --status    Show development status');
        console.log('  node dev-tools.js --restore   Restore from backup');
        console.log('  node dev-tools.js --compare   Compare with backup');
        break;
} 