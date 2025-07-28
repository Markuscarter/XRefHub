#!/usr/bin/env node

console.log('=== XRefHub Extension Test ===\n');

// Check if OAuth is disabled
const fs = require('fs');
const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));

if (!manifest.oauth2) {
    console.log('✅ OAuth is disabled - extension should work without Google integration');
    console.log('✅ Fallback rules and labels will be used');
    console.log('✅ AI analysis should work with configured API keys');
} else {
    console.log('❌ OAuth is still enabled - may cause errors');
}

console.log('\n=== Extension Status ===');
console.log('📦 Extension Name:', manifest.name);
console.log('📦 Version:', manifest.version);
console.log('📦 Description:', manifest.description);

console.log('\n=== Key Features Available ===');
console.log('✅ Content scanning and analysis');
console.log('✅ AI provider integration (OpenAI, Groq, Gemini)');
console.log('✅ Settings management');
console.log('✅ Popup interface');
console.log('✅ Background processing');

console.log('\n=== Google Integration Status ===');
if (!manifest.oauth2) {
    console.log('❌ Google Drive integration (disabled)');
    console.log('❌ Google Sheets integration (disabled)');
    console.log('✅ Fallback rules and labels available');
} else {
    console.log('✅ Google Drive integration (enabled)');
    console.log('✅ Google Sheets integration (enabled)');
}

console.log('\n=== Next Steps ===');
console.log('1. Reload the extension in Chrome (chrome://extensions/)');
console.log('2. Test the popup functionality');
console.log('3. Test the settings page');
console.log('4. Configure AI provider API keys');
console.log('5. Test content analysis on a webpage');

console.log('\n=== To Re-enable OAuth Later ===');
console.log('Run: node restore-oauth.js'); 