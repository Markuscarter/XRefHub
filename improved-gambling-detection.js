/**
 * Improved Gambling Detection and Label Selection
 * Using X/Twitter Paid Partnership Enforcement Guide Labels
 */

// Enhanced gambling detection keywords
const GAMBLING_KEYWORDS = {
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

// X/Twitter Paid Partnership Enforcement Labels (from guide)
const ENFORCEMENT_LABELS = {
    gambling: [
        "Gambling - No Disclosure",
        "Casino Promotion - Policy Violation", 
        "Sports Betting - Missing #Ad",
        "Online Gaming - Commercial Content",
        "Lottery Promotion - Unlabeled",
        "Betting Services - No Disclaimer",
        "Gaming Platform - Paid Partnership",
        "Gambling Content - Policy Violation"
    ],
    financial: [
        "Financial Services - No Disclosure",
        "Investment Platform - Missing #Ad",
        "Crypto Trading - Policy Violation",
        "Money Making - Commercial Content",
        "Financial Products - Unlabeled",
        "Investment Services - No Disclaimer",
        "Trading Platform - Paid Partnership",
        "Financial Content - Policy Violation"
    ],
    general: [
        "Paid Partnership - No Disclosure",
        "Commercial Content - Missing #Ad",
        "Sponsored Post - Policy Violation",
        "Brand Promotion - Unlabeled",
        "Affiliate Marketing - No Disclaimer",
        "Product Promotion - Paid Partnership",
        "Business Content - Policy Violation"
    ]
};

// Enhanced content analysis for gambling detection
function analyzeGamblingContent(content) {
    console.log("🔍 ENHANCED GAMBLING CONTENT ANALYSIS");
    console.log("=" .repeat(60));
    
    const analysis = {
        gamblingIndicators: [],
        financialIndicators: [],
        contextIndicators: [],
        severity: "LOW",
        confidence: 0.0,
        suggestedLabels: []
    };
    
    // Check for gambling keywords
    for (const category of Object.keys(GAMBLING_KEYWORDS)) {
        const keywords = GAMBLING_KEYWORDS[category];
        const foundKeywords = keywords.filter(keyword => 
            content.toLowerCase().includes(keyword.toLowerCase())
        );
        
        if (foundKeywords.length > 0) {
            analysis[`${category}Indicators`] = foundKeywords;
            console.log(`📊 ${category.toUpperCase()} indicators found: ${foundKeywords.join(', ')}`);
        }
    }
    
    // Determine severity and confidence
    if (analysis.gamblingIndicators.length > 0) {
        analysis.severity = "HIGH";
        analysis.confidence = 0.9;
        analysis.suggestedLabels = ENFORCEMENT_LABELS.gambling;
        console.log("🚨 HIGH CONFIDENCE: Gambling content detected");
    } else if (analysis.financialIndicators.length > 0 && analysis.contextIndicators.length > 0) {
        analysis.severity = "MEDIUM";
        analysis.confidence = 0.7;
        analysis.suggestedLabels = ENFORCEMENT_LABELS.financial;
        console.log("⚠️ MEDIUM CONFIDENCE: Financial/gambling-like content detected");
    } else if (analysis.contextIndicators.length > 0) {
        analysis.severity = "LOW";
        analysis.confidence = 0.5;
        analysis.suggestedLabels = ENFORCEMENT_LABELS.general;
        console.log("📝 LOW CONFIDENCE: Potential gambling-related content");
    } else {
        analysis.severity = "NONE";
        analysis.confidence = 0.0;
        console.log("✅ NO GAMBLING CONTENT DETECTED");
    }
    
    return analysis;
}

// Enhanced enforcement workflow with better gambling detection
function runEnhancedEnforcementWorkflow(post) {
    console.log("🚨 ENHANCED X/TWITTER ENFORCEMENT WORKFLOW");
    console.log("URL:", post.url);
    console.log("Author:", post.author);
    console.log("=" .repeat(80));
    
    // Step 1: Check commission (unchanged)
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
            labels: []
        };
    }
    
    // Step 2: Check promotion (unchanged)
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
            labels: []
        };
    }
    
    // Step 3: Enhanced prohibited industries check
    console.log("\n🔍 STEP 3: Enhanced prohibited industries check");
    console.log("=" .repeat(50));
    
    // Run gambling analysis
    const gamblingAnalysis = analyzeGamblingContent(post.content);
    
    // Check other prohibited industries
    const otherProhibitedKeywords = {
        "Adult": ["adult", "sexual", "porn", "xxx", "adult content"],
        "Alcohol": ["alcohol", "beer", "wine", "liquor", "drink", "beverage"],
        "Contraceptives": ["contraceptive", "birth control", "condom"],
        "Dating": ["dating", "marriage", "relationship", "match", "love"],
        "Drugs": ["drug", "marijuana", "cannabis", "weed", "substance"],
        "Financial": ["crypto", "cryptocurrency", "bitcoin", "investment", "trading", "finance", "money", "earn", "profit", "returns", "financial"],
        "Health": ["supplement", "vitamin", "diet", "weight loss", "fitness", "health", "wellness"],
        "Tobacco": ["tobacco", "cigarette", "vape", "smoking"],
        "Weapons": ["weapon", "gun", "ammunition", "firearm", "shooting"]
    };
    
    let detectedIndustries = [];
    
    // Add gambling if detected
    if (gamblingAnalysis.severity === "HIGH") {
        detectedIndustries.push("Gambling");
    }
    
    // Check other industries
    for (const [industry, keywords] of Object.entries(otherProhibitedKeywords)) {
        const hasKeywords = keywords.some(keyword => 
            post.content.toLowerCase().includes(keyword.toLowerCase())
        );
        if (hasKeywords) {
            detectedIndustries.push(industry);
        }
    }
    
    console.log(`📊 Prohibited industries detected: ${detectedIndustries.length > 0 ? detectedIndustries.join(', ') : 'NONE'}`);
    
    if (detectedIndustries.length > 0) {
        console.log("⚠️ Step 3 RESOLVED: TRUE - Prohibited industry detected");
        console.log("➡️ Continue to Step 4");
    } else {
        console.log("✅ Step 3 RESOLVED: FALSE - No prohibited industries");
        console.log("➡️ Continue to Step 4 (check disclaimer)");
    }
    
    // Step 4: Check disclaimer (unchanged)
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
    
    // Determine final action and labels
    let violation = false;
    let reason = "";
    let action = "";
    let labels = [];
    
    if (detectedIndustries.length > 0) {
        violation = true;
        reason = `Prohibited industry detected: ${detectedIndustries.join(', ')}`;
        action = "BOUNCE POST - Account locked due to paid partnership policy violation";
        
        // Select appropriate labels based on detected industries
        if (detectedIndustries.includes("Gambling")) {
            labels = gamblingAnalysis.suggestedLabels;
        } else if (detectedIndustries.includes("Financial")) {
            labels = ENFORCEMENT_LABELS.financial;
        } else {
            labels = ENFORCEMENT_LABELS.general;
        }
    } else if (!hasDisclaimer) {
        violation = true;
        reason = "No disclaimer (#ad, #sponsored) found";
        action = "BOUNCE POST - Account locked due to paid partnership policy violation";
        labels = ENFORCEMENT_LABELS.general;
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
        gamblingAnalysis
    };
}

// Test with the Fekah post content
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

// Run enhanced analysis
console.log("🤖 ENHANCED GAMBLING DETECTION ANALYSIS");
console.log("URL: https://x.com/fekahdesbois/status/1939624227306381822");
console.log("Review Mode: Paid Partnership Review (Enhanced Gambling Detection)");
console.log("=" .repeat(80));

const enhancedResult = runEnhancedEnforcementWorkflow(fekahPostContent);

console.log("\n🎯 ENHANCED FINAL VERDICT:");
console.log("=" .repeat(40));
console.log(`🚨 VIOLATION: ${enhancedResult.violation ? 'YES' : 'NO'}`);
console.log(`📝 REASON: ${enhancedResult.reason}`);
console.log(`⚡ ACTION: ${enhancedResult.action}`);

console.log("\n📊 ENHANCED WORKFLOW SUMMARY:");
console.log("=" .repeat(40));
console.log(`Step 1 (Commission): ${enhancedResult.step1 ? 'TRUE' : 'FALSE'}`);
console.log(`Step 2 (Promotion): ${enhancedResult.step2 ? 'TRUE' : 'FALSE'}`);
console.log(`Step 3 (Prohibited): ${enhancedResult.step3.length > 0 ? enhancedResult.step3.join(', ') : 'NONE'}`);
console.log(`Step 4 (Disclaimer): ${enhancedResult.step4 ? 'TRUE' : 'FALSE'}`);

console.log("\n🏷️ SUGGESTED LABELS:");
console.log("=" .repeat(30));
if (enhancedResult.labels.length > 0) {
    enhancedResult.labels.forEach(label => console.log(`• ${label}`));
} else {
    console.log("• No labels needed");
}

console.log("\n🎰 GAMBLING ANALYSIS:");
console.log("=" .repeat(30));
console.log(`Severity: ${enhancedResult.gamblingAnalysis.severity}`);
console.log(`Confidence: ${Math.round(enhancedResult.gamblingAnalysis.confidence * 100)}%`);
console.log(`Gambling Indicators: ${enhancedResult.gamblingAnalysis.gamblingIndicators.join(', ') || 'None'}`);
console.log(`Financial Indicators: ${enhancedResult.gamblingAnalysis.financialIndicators.join(', ') || 'None'}`);
console.log(`Context Indicators: ${enhancedResult.gamblingAnalysis.contextIndicators.join(', ') || 'None'}`);

console.log("\n" + "=" .repeat(80));
console.log("✅ ENHANCED ANALYSIS COMPLETE");
console.log("=" .repeat(80)); 