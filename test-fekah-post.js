/**
 * Test URL Analysis for Fekah X/Twitter Post
 * Using Updated X/Twitter Enforcement Workflow
 */

// Simulated content from the Fekah X/Twitter post
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
    timestamp: "2024-01-10T12:15:00Z",
    engagement: {
        likes: 89,
        retweets: 23,
        replies: 8
    }
};

// X/Twitter Enforcement Workflow Implementation
function runEnforcementWorkflow(post) {
    console.log("🚨 X/TWITTER PAID PARTNERSHIP ENFORCEMENT WORKFLOW");
    console.log("URL:", post.url);
    console.log("Author:", post.author);
    console.log("=" .repeat(80));
    
    // Step 1: Check if products/services generate commission
    console.log("🔍 STEP 1: Check if products/services generate commission");
    console.log("=" .repeat(50));
    
    const commissionIndicators = [
        "referral code", "referral link", "affiliate link", "discount code", 
        "promo code", "bonus code", "commission", "earn money", "get paid", 
        "referral bonus", "use code", "special offer"
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
            step4: false
        };
    }
    
    // Step 2: Check if post promotes products/services
    console.log("\n🔍 STEP 2: Check if post promotes products/services");
    console.log("=" .repeat(50));
    
    const promotionIndicators = [
        "download", "visit", "shop", "buy", "purchase", "get", "join", 
        "sign up", "register", "try", "use code", "limited time", 
        "offer", "deal", "special offer", "visit our website"
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
            step4: false
        };
    }
    
    // Step 3: Check for prohibited industries
    console.log("\n🔍 STEP 3: Check for prohibited industries");
    console.log("=" .repeat(50));
    
    const prohibitedKeywords = {
        "Adult": ["adult", "sexual", "porn", "xxx", "adult content"],
        "Alcohol": ["alcohol", "beer", "wine", "liquor", "drink", "beverage"],
        "Contraceptives": ["contraceptive", "birth control", "condom"],
        "Dating": ["dating", "marriage", "relationship", "match", "love"],
        "Drugs": ["drug", "marijuana", "cannabis", "weed", "substance"],
        "Financial": ["crypto", "cryptocurrency", "bitcoin", "investment", "trading", "finance", "money", "earn", "profit", "returns", "financial"],
        "Gambling": ["gambling", "casino", "lottery", "bet", "wager"],
        "Health": ["supplement", "vitamin", "diet", "weight loss", "fitness", "health", "wellness"],
        "Tobacco": ["tobacco", "cigarette", "vape", "smoking"],
        "Weapons": ["weapon", "gun", "ammunition", "firearm", "shooting"]
    };
    
    let detectedIndustries = [];
    
    for (const [industry, keywords] of Object.entries(prohibitedKeywords)) {
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
    
    // Step 4: Check for disclaimer
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
    
    if (detectedIndustries.length > 0) {
        // Prohibited industry detected
        violation = true;
        reason = `Prohibited industry detected: ${detectedIndustries.join(', ')}`;
        action = "BOUNCE POST - Account locked due to paid partnership policy violation";
    } else if (!hasDisclaimer) {
        // No disclaimer but no prohibited industries
        violation = true;
        reason = "No disclaimer (#ad, #sponsored) found";
        action = "BOUNCE POST - Account locked due to paid partnership policy violation";
    } else {
        // Has disclaimer and no prohibited industries
        violation = false;
        reason = "Post has disclaimer and no prohibited industries";
        action = "No action needed - post complies with policy";
    }
    
    return {
        violation,
        reason,
        action,
        step1: hasCommission,
        step2: hasPromotion,
        step3: detectedIndustries,
        step4: hasDisclaimer
    };
}

// Display results
function displayResults(result) {
    console.log("\n🎯 FINAL VERDICT:");
    console.log("=" .repeat(30));
    console.log(`🚨 VIOLATION: ${result.violation ? 'YES' : 'NO'}`);
    console.log(`📝 REASON: ${result.reason}`);
    console.log(`⚡ ACTION: ${result.action}`);
    
    console.log("\n📊 WORKFLOW SUMMARY:");
    console.log("=" .repeat(30));
    console.log(`Step 1 (Commission): ${result.step1 ? 'TRUE' : 'FALSE'}`);
    console.log(`Step 2 (Promotion): ${result.step2 ? 'TRUE' : 'FALSE'}`);
    console.log(`Step 3 (Prohibited): ${result.step3.length > 0 ? result.step3.join(', ') : 'NONE'}`);
    console.log(`Step 4 (Disclaimer): ${result.step4 ? 'TRUE' : 'FALSE'}`);
}

// Run the analysis
console.log("🤖 XREFHUB AI ANALYSIS - FEKAH POST");
console.log("URL: https://x.com/fekahdesbois/status/1939624227306381822");
console.log("Review Mode: Paid Partnership Review (Updated Enforcement Workflow)");
console.log("=" .repeat(80));

const result = runEnforcementWorkflow(fekahPostContent);
displayResults(result);

console.log("\n" + "=" .repeat(80));
console.log("✅ ENFORCEMENT WORKFLOW COMPLETE");
console.log("=" .repeat(80)); 