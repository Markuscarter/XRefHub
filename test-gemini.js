/**
 * @file Test Gemini API Integration
 * Simple test to verify Gemini API is working
 */

console.log('=== Testing Gemini API Integration ===');

// Test 1: Check if Gemini API key is configured
console.log('\n1. Checking Gemini API key...');
chrome.storage.local.get(['settings'], (result) => {
    const geminiApiKey = result.settings?.geminiApiKey;
    if (geminiApiKey) {
        console.log('✅ Gemini API key found');
        console.log('   Key:', geminiApiKey.substring(0, 10) + '...');
        
        // Test 2: Test Gemini API call
        console.log('\n2. Testing Gemini API call...');
        testGeminiAPI(geminiApiKey);
    } else {
        console.log('❌ Gemini API key not found');
        console.log('   Please add your Gemini API key in settings');
    }
});

async function testGeminiAPI(apiKey) {
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: 'Hello! Please respond with "Gemini API is working!"' }]
                }],
                generationConfig: {
                    maxOutputTokens: 100,
                    temperature: 0.7
                }
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            const content = data.candidates[0].content.parts[0].text;
            console.log('✅ Gemini API test successful!');
            console.log('   Response:', content);
        } else {
            const errorText = await response.text();
            console.log('❌ Gemini API test failed');
            console.log('   Status:', response.status);
            console.log('   Error:', errorText);
        }
    } catch (error) {
        console.log('❌ Gemini API test failed:', error.message);
    }
}

console.log('\n=== Test Complete ==='); 