/**
 * Debug Gambling Detection
 * Identify and fix the logic issue
 */

// Debug gambling detection
function debugGamblingDetection(content) {
    console.log("🔍 DEBUG GAMBLING DETECTION");
    console.log("=" .repeat(60));
    console.log("Content:", content.substring(0, 100) + "...");
    console.log("=" .repeat(60));
    
    // Enhanced gambling keywords
    const gamblingKeywords = {
        primary: [
            "gambling", "casino", "lottery", "bet", "wager", "poker", "blackjack",
            "roulette", "slot", "sports betting", "online casino", "gaming",
            "jackpot", "win", "winning", "odds", "betting", "payout", "bonus",
            "free spins", "deposit", "withdrawal", "real money", "cash out"
        ],
        secondary: [
            "game", "play", "chance", "luck", "fortune", "prize", "reward",
            "bonus", "promotion", "offer", "deal", "limited time", "exclusive",
            "vip", "premium", "elite", "gold", "platinum", "diamond"
        ],
        context: [
            "earn money", "make money", "get rich", "quick money", "easy money",
            "financial freedom", "passive income", "investment", "returns",
            "profit", "revenue", "income", "cash", "money", "wealth"
        ]
    };
    
    const analysis = {
        gamblingIndicators: [],
        financialIndicators: [],
        contextIndicators: [],
        severity: "NONE",
        confidence: 0.0,
        industry: "NONE"
    };
    
    // Check for gambling keywords
    for (const category of Object.keys(gamblingKeywords)) {
        const keywords = gamblingKeywords[category];
        const foundKeywords = keywords.filter(keyword => 
            content.toLowerCase().includes(keyword.toLowerCase())
        );
        
        if (foundKeywords.length > 0) {
            analysis[`${category}Indicators`] = foundKeywords;
            console.log(`📊 ${category.toUpperCase()} indicators found: ${foundKeywords.join(', ')}`);
        }
    }
    
    console.log("\n🔍 DEBUG ANALYSIS:");
    console.log("=" .repeat(30));
    console.log(`Gambling indicators length: ${analysis.gamblingIndicators.length}`);
    console.log(`Financial indicators length: ${analysis.financialIndicators.length}`);
    console.log(`Context indicators length: ${analysis.contextIndicators.length}`);
    
    // FIXED LOGIC: Determine severity, confidence, and industry
    if (analysis.gamblingIndicators.length > 0) {
        analysis.severity = "HIGH";
        analysis.confidence = 0.95;
        analysis.industry = "Gambling";
        console.log("🚨 HIGH CONFIDENCE: Gambling content detected");
        console.log(`Industry set to: ${analysis.industry}`);
    } else if (analysis.financialIndicators.length > 0 && analysis.contextIndicators.length > 0) {
        analysis.severity = "MEDIUM";
        analysis.confidence = 0.75;
        analysis.industry = "Financial";
        console.log("⚠️ MEDIUM CONFIDENCE: Financial/gambling-like content detected");
        console.log(`Industry set to: ${analysis.industry}`);
    } else if (analysis.contextIndicators.length > 0) {
        analysis.severity = "LOW";
        analysis.confidence = 0.5;
        analysis.industry = "General";
        console.log("📝 LOW CONFIDENCE: Potential gambling-related content");
        console.log(`Industry set to: ${analysis.industry}`);
    } else {
        analysis.severity = "NONE";
        analysis.confidence = 0.0;
        analysis.industry = "NONE";
        console.log("✅ NO GAMBLING CONTENT DETECTED");
        console.log(`Industry set to: ${analysis.industry}`);
    }
    
    console.log("\n🎯 FINAL ANALYSIS:");
    console.log("=" .repeat(30));
    console.log(`Severity: ${analysis.severity}`);
    console.log(`Confidence: ${Math.round(analysis.confidence * 100)}%`);
    console.log(`Industry: ${analysis.industry}`);
    
    return analysis;
}

// Test with gambling content
const gamblingPostContent = {
    url: "https://x.com/gambling_user/status/123456789",
    author: "gambling_user",
    content: `🎰 WIN BIG with our exclusive online casino!

💰 Join thousands of winners and start earning today!
🎁 Use my referral code: WINNER123 for 100% bonus!

🔥 Limited time offer - don't miss out!
📱 Download our app now: [casino platform link]

🎯 Perfect for:
- Casino enthusiasts
- Sports betting fans
- Poker players
- Slot machine lovers

🛍️ Visit our website now: [casino website link]
📱 Follow us for daily betting tips and exclusive deals!

#Casino #Gambling #Betting #Poker #Slots #WinBig #OnlineCasino`,
    timestamp: "2024-01-16T18:30:00Z"
};

// Run debug test
console.log("🤖 DEBUG GAMBLING DETECTION TEST");
console.log("=" .repeat(80));

const debugResult = debugGamblingDetection(gamblingPostContent.content);

console.log("\n" + "=" .repeat(80));
console.log("✅ DEBUG ANALYSIS COMPLETE");
console.log("=" .repeat(80)); 