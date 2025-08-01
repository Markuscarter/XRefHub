/**
 * Comprehensive Gambling Detection with Spreadsheet Integration
 * Properly identifies gambling content and integrates with documents for label selection
 */

// Simulated Google Sheets data (in real implementation, this would be fetched from Google Sheets)
const SPREADSHEET_DATA = {
    gamblingLabels: [
        "Gambling - No Disclosure",
        "Casino Promotion - Policy Violation", 
        "Sports Betting - Missing #Ad",
        "Online Gaming - Commercial Content",
        "Lottery Promotion - Unlabeled",
        "Betting Services - No Disclaimer",
        "Gaming Platform - Paid Partnership",
        "Gambling Content - Policy Violation",
        "Casino Services - Unlabeled",
        "Sports Betting - Policy Violation"
    ],
    financialLabels: [
        "Financial Services - No Disclosure",
        "Investment Platform - Missing #Ad",
        "Crypto Trading - Policy Violation",
        "Money Making - Commercial Content",
        "Financial Products - Unlabeled",
        "Investment Services - No Disclaimer",
        "Trading Platform - Paid Partnership",
        "Financial Content - Policy Violation"
    ],
    generalLabels: [
        "Paid Partnership - No Disclosure",
        "Commercial Content - Missing #Ad",
        "Sponsored Post - Policy Violation",
        "Brand Promotion - Unlabeled",
        "Affiliate Marketing - No Disclaimer",
        "Product Promotion - Paid Partnership",
        "Business Content - Policy Violation"
    ]
};

// Enhanced gambling detection with proper logic
function analyzeGamblingContentComprehensive(content) {
    console.log("🔍 COMPREHENSIVE GAMBLING CONTENT ANALYSIS");
    console.log("=" .repeat(70));
    
    // Enhanced gambling keywords with proper categorization
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
        suggestedLabels: [],
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
    
    // FIXED LOGIC: Determine severity, confidence, and industry
    if (analysis.gamblingIndicators.length > 0) {
        analysis.severity = "HIGH";
        analysis.confidence = 0.95;
        analysis.industry = "Gambling";
        analysis.suggestedLabels = SPREADSHEET_DATA.gamblingLabels;
        console.log("🚨 HIGH CONFIDENCE: Gambling content detected");
    } else if (analysis.financialIndicators.length > 0 && analysis.contextIndicators.length > 0) {
        analysis.severity = "MEDIUM";
        analysis.confidence = 0.75;
        analysis.industry = "Financial";
        analysis.suggestedLabels = SPREADSHEET_DATA.financialLabels;
        console.log("⚠️ MEDIUM CONFIDENCE: Financial/gambling-like content detected");
    } else if (analysis.contextIndicators.length > 0) {
        analysis.severity = "LOW";
        analysis.confidence = 0.5;
        analysis.industry = "General";
        analysis.suggestedLabels = SPREADSHEET_DATA.generalLabels;
        console.log("📝 LOW CONFIDENCE: Potential gambling-related content");
    } else {
        analysis.severity = "NONE";
        analysis.confidence = 0.0;
        analysis.industry = "NONE";
        console.log("✅ NO GAMBLING CONTENT DETECTED");
    }
    
    return analysis;
}

// Comprehensive enforcement workflow with gambling detection
function runComprehensiveEnforcementWorkflow(post) {
    console.log("🚨 COMPREHENSIVE X/TWITTER ENFORCEMENT WORKFLOW");
    console.log("URL:", post.url);
    console.log("Author:", post.author);
    console.log("=" .repeat(80));
    
    // Step 1: Check commission
    console.log("🔍 STEP 1: Check if products/services generate commission");
    console.log("=" .repeat(50));
    
    const commissionIndicators = [
        "referral code", "referral link", "affiliate link", "discount code", 
        "promo code", "bonus code", "commission", "earn money", "get paid", 
        "referral bonus", "use code", "special offer", "bonus", "reward"
    ];
    
    const hasCommission = commissionIndicators.some(indicator => 
        post.content.toLowerCase().includes(indicator.toLowerCase())
    );
    
    console.log(`📊 Commission indicators found: ${hasCommission ? 'YES' : 'NO'}`);
    if (hasCommission) {
        console.log("✅ Step 1 RESOLVED: TRUE - Commission detected");
        console.log("➡️ Continue to Step 2");
    } else {
        console.log("❌ Step 1 RESOLVED: FALSE - No commission detected");
        console.log("➡️ No violation - stop here");
        return {
            violation: false,
            reason: "No commission detected",
            action: "No action needed",
            step1: false,
            step2: false,
            step3: [],
            step4: false,
            labels: [],
            industry: "NONE"
        };
    }
    
    // Step 2: Check promotion
    console.log("\n🔍 STEP 2: Check if post promotes products/services");
    console.log("=" .repeat(50));
    
    const promotionIndicators = [
        "download", "visit", "shop", "buy", "purchase", "get", "join", 
        "sign up", "register", "try", "use code", "limited time", 
        "offer", "deal", "special offer", "visit our website", "play"
    ];
    
    const hasPromotion = promotionIndicators.some(indicator => 
        post.content.toLowerCase().includes(indicator.toLowerCase())
    );
    
    console.log(`📊 Promotion indicators found: ${hasPromotion ? 'YES' : 'NO'}`);
    if (hasPromotion) {
        console.log("✅ Step 2 RESOLVED: TRUE - Promotion detected");
        console.log("➡️ Continue to Step 3");
    } else {
        console.log("❌ Step 2 RESOLVED: FALSE - No promotion detected");
        console.log("➡️ No violation - stop here");
        return {
            violation: false,
            reason: "No promotion detected",
            action: "No action needed",
            step1: true,
            step2: false,
            step3: [],
            step4: false,
            labels: [],
            industry: "NONE"
        };
    }
    
    // Step 3: Comprehensive gambling detection
    console.log("\n🔍 STEP 3: Comprehensive gambling detection");
    console.log("=" .repeat(50));
    
    const gamblingAnalysis = analyzeGamblingContentComprehensive(post.content);
    
    let detectedIndustries = [];
    if (gamblingAnalysis.industry !== "NONE") {
        detectedIndustries.push(gamblingAnalysis.industry);
    }
    
    console.log(`📊 Prohibited industries detected: ${detectedIndustries.length > 0 ? detectedIndustries.join(', ') : 'NONE'}`);
    
    if (detectedIndustries.length > 0) {
        console.log("⚠️ Step 3 RESOLVED: TRUE - Prohibited industry detected");
        console.log("➡️ Continue to Step 4");
    } else {
        console.log("✅ Step 3 RESOLVED: FALSE - No prohibited industries");
        console.log("➡️ Continue to Step 4 (check disclaimer)");
    }
    
    // Step 4: Check disclaimer
    console.log("\n🔍 STEP 4: Check for disclaimer");
    console.log("=" .repeat(50));
    
    const disclaimerIndicators = [
        "#ad", "#sponsored", "#sponsoredpost", "#paid", "#partnership",
        "advertisement", "sponsored", "paid partnership", "ad"
    ];
    
    const hasDisclaimer = disclaimerIndicators.some(indicator => 
        post.content.toLowerCase().includes(indicator.toLowerCase())
    );
    
    console.log(`📊 Disclaimer found: ${hasDisclaimer ? 'YES' : 'NO'}`);
    if (hasDisclaimer) {
        console.log("✅ Step 4 RESOLVED: TRUE - Disclaimer present");
    } else {
        console.log("❌ Step 4 RESOLVED: FALSE - No disclaimer");
    }
    
    // Determine final action
    let violation = false;
    let reason = "";
    let action = "";
    let labels = [];
    
    if (detectedIndustries.length > 0) {
        violation = true;
        reason = `Prohibited industry detected: ${detectedIndustries.join(', ')}`;
        action = "BOUNCE POST - Account locked due to paid partnership policy violation";
        labels = gamblingAnalysis.suggestedLabels;
    } else if (!hasDisclaimer) {
        violation = true;
        reason = "No disclaimer (#ad, #sponsored) found";
        action = "BOUNCE POST - Account locked due to paid partnership policy violation";
        labels = ["Paid Partnership - No Disclosure", "Commercial Content - Missing #Ad"];
    } else {
        violation = false;
        reason = "Post has disclaimer and no prohibited industries";
        action = "No action needed - post complies with policy";
        labels = [];
    }
    
    return {
        violation,
        reason,
        action,
        step1: hasCommission,
        step2: hasPromotion,
        step3: detectedIndustries,
        step4: hasDisclaimer,
        labels,
        industry: gamblingAnalysis.industry,
        gamblingAnalysis
    };
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

// Test with the original Fekah content (should be gambling)
const fekahPostContent = {
    url: "https://x.com/fekahdesbois/status/1939624227306381822",
    author: "fekahdesbois",
    content: `🌟 Discover amazing beauty products at unbeatable prices!

✨ Shop our curated collection:
• Luxury fragrances from top brands
• Professional skincare solutions  
• High-end makeup and cosmetics
• Exclusive limited editions

🎁 Special offer: Use code BEAUTY20 for 20% off your next purchase!

💄 Perfect for:
- Beauty enthusiasts
- Gift shoppers
- Self-care lovers
- Luxury seekers

🛍️ Visit our website now: [beauty platform link]
📱 Follow us for daily beauty tips and exclusive deals!

#Beauty #Fragrance #Skincare #Makeup #Luxury #BeautyTips`,
    timestamp: "2024-01-10T12:15:00Z"
};

// Run the comprehensive gambling test
console.log("🤖 COMPREHENSIVE GAMBLING DETECTION TEST");
console.log("=" .repeat(80));

console.log("\n🎰 TEST 1: GAMBLING CONTENT");
console.log("URL: https://x.com/gambling_user/status/123456789");
const gamblingResult = runComprehensiveEnforcementWorkflow(gamblingPostContent);

console.log("\n🎯 GAMBLING FINAL VERDICT:");
console.log("=" .repeat(40));
console.log(`🚨 VIOLATION: ${gamblingResult.violation ? 'YES' : 'NO'}`);
console.log(`📝 REASON: ${gamblingResult.reason}`);
console.log(`⚡ ACTION: ${gamblingResult.action}`);
console.log(`🏭 INDUSTRY: ${gamblingResult.industry}`);

console.log("\n📊 GAMBLING WORKFLOW SUMMARY:");
console.log("=" .repeat(40));
console.log(`Step 1 (Commission): ${gamblingResult.step1 ? 'TRUE' : 'FALSE'}`);
console.log(`Step 2 (Promotion): ${gamblingResult.step2 ? 'TRUE' : 'FALSE'}`);
console.log(`Step 3 (Prohibited): ${gamblingResult.step3.length > 0 ? gamblingResult.step3.join(', ') : 'NONE'}`);
console.log(`Step 4 (Disclaimer): ${gamblingResult.step4 ? 'TRUE' : 'FALSE'}`);

console.log("\n🏷️ SPREADSHEET LABELS:");
console.log("=" .repeat(30));
if (gamblingResult.labels.length > 0) {
    gamblingResult.labels.forEach(label => console.log(`• ${label}`));
} else {
    console.log("• No labels needed");
}

console.log("\n🎰 GAMBLING ANALYSIS:");
console.log("=" .repeat(30));
console.log(`Severity: ${gamblingResult.gamblingAnalysis.severity}`);
console.log(`Confidence: ${Math.round(gamblingResult.gamblingAnalysis.confidence * 100)}%`);
console.log(`Industry: ${gamblingResult.gamblingAnalysis.industry}`);
console.log(`Gambling Indicators: ${gamblingResult.gamblingAnalysis.gamblingIndicators.join(', ') || 'None'}`);
console.log(`Financial Indicators: ${gamblingResult.gamblingAnalysis.financialIndicators.join(', ') || 'None'}`);
console.log(`Context Indicators: ${gamblingResult.gamblingAnalysis.contextIndicators.join(', ') || 'None'}`);

console.log("\n" + "=" .repeat(80));
console.log("✅ COMPREHENSIVE GAMBLING ANALYSIS COMPLETE");
console.log("=" .repeat(80)); 