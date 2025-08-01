/**
 * X/Twitter Paid Partnership Enforcement Workflow
 * Following the exact step-by-step process
 */

// X/Twitter Prohibited Industries
const PROHIBITED_INDUSTRIES = [
    "Adult merchandise (including sexual products and services, or content that is adult in nature)",
    "Alcoholic beverages and related accessories",
    "Contraceptives",
    "Dating & Marriage Services",
    "Drugs and drug-related products or services",
    "Financial and financial-related products, services or opportunities",
    "Gambling products and services, including lotteries",
    "Geo-political and political or social issues or crises for commercial purposes",
    "Health and wellness supplements (including health, dietary, food, nutrition, muscle enhancement substances and supplements",
    "Tobacco and tobacco-related products or services",
    "Weapons and weapons-related products or services (including ammunition and weapons training/certification)",
    "Weight loss products and services and content focused on weight loss"
];

// Sample post content for testing
const samplePost = {
    url: "https://x.com/example/status/123456789",
    author: "example_user",
    content: `🚀 Get rich quick with our amazing crypto investment platform!

💰 Earn up to 500% returns on your investments
💎 Join thousands of successful traders
🎁 Use my referral code: CRYPTO123 for 10% bonus

🔥 Limited time offer - don't miss out!
📱 Download our app now: [crypto platform link]

#Crypto #Investment #Trading #GetRichQuick`,
    timestamp: "2024-01-16T15:30:00Z"
};

// Step 1: Check if products/services generate commission
function step1_CheckCommission(content) {
    console.log("🔍 STEP 1: Check if products/services generate commission");
    console.log("=" .repeat(50));
    
    const commissionIndicators = [
        "referral code",
        "referral link",
        "affiliate link",
        "discount code",
        "promo code",
        "bonus code",
        "commission",
        "earn money",
        "get paid",
        "referral bonus"
    ];
    
    const hasCommission = commissionIndicators.some(indicator => 
        content.toLowerCase().includes(indicator.toLowerCase())
    );
    
    console.log(`📊 Commission indicators found: ${hasCommission ? 'YES' : 'NO'}`);
    if (hasCommission) {
        console.log("✅ Step 1 RESOLVED: TRUE - Commission detected");
        console.log("➡️ Continue to Step 2");
    } else {
        console.log("❌ Step 1 RESOLVED: FALSE - No commission detected");
        console.log("➡️ No violation - stop here");
    }
    
    return hasCommission;
}

// Step 2: Check if post promotes products/services
function step2_CheckPromotion(content) {
    console.log("\n🔍 STEP 2: Check if post promotes products/services");
    console.log("=" .repeat(50));
    
    const promotionIndicators = [
        "download",
        "visit",
        "shop",
        "buy",
        "purchase",
        "get",
        "join",
        "sign up",
        "register",
        "try",
        "use code",
        "limited time",
        "offer",
        "deal"
    ];
    
    const hasPromotion = promotionIndicators.some(indicator => 
        content.toLowerCase().includes(indicator.toLowerCase())
    );
    
    console.log(`📊 Promotion indicators found: ${hasPromotion ? 'YES' : 'NO'}`);
    if (hasPromotion) {
        console.log("✅ Step 2 RESOLVED: TRUE - Promotion detected");
        console.log("➡️ Continue to Step 3");
    } else {
        console.log("❌ Step 2 RESOLVED: FALSE - No promotion detected");
        console.log("➡️ No violation - stop here");
    }
    
    return hasPromotion;
}

// Step 3: Check for prohibited industries
function step3_CheckProhibitedIndustries(content) {
    console.log("\n🔍 STEP 3: Check for prohibited industries");
    console.log("=" .repeat(50));
    
    const prohibitedKeywords = {
        "Financial": ["crypto", "cryptocurrency", "bitcoin", "investment", "trading", "finance", "money", "earn", "profit", "returns", "financial"],
        "Adult": ["adult", "sexual", "porn", "xxx", "adult content"],
        "Alcohol": ["alcohol", "beer", "wine", "liquor", "drink", "beverage"],
        "Dating": ["dating", "marriage", "relationship", "match", "love"],
        "Drugs": ["drug", "marijuana", "cannabis", "weed", "substance"],
        "Gambling": ["gambling", "casino", "lottery", "bet", "wager"],
        "Health": ["supplement", "vitamin", "diet", "weight loss", "fitness", "health"],
        "Tobacco": ["tobacco", "cigarette", "vape", "smoking"],
        "Weapons": ["weapon", "gun", "ammunition", "firearm", "shooting"]
    };
    
    let detectedIndustries = [];
    
    for (const [industry, keywords] of Object.entries(prohibitedKeywords)) {
        const hasKeywords = keywords.some(keyword => 
            content.toLowerCase().includes(keyword.toLowerCase())
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
    
    return detectedIndustries;
}

// Step 4: Check for disclaimer
function step4_CheckDisclaimer(content) {
    console.log("\n🔍 STEP 4: Check for disclaimer");
    console.log("=" .repeat(50));
    
    const disclaimerIndicators = [
        "#ad",
        "#sponsored",
        "#sponsoredpost",
        "#paid",
        "#partnership",
        "advertisement",
        "sponsored",
        "paid partnership",
        "ad"
    ];
    
    const hasDisclaimer = disclaimerIndicators.some(indicator => 
        content.toLowerCase().includes(indicator.toLowerCase())
    );
    
    console.log(`📊 Disclaimer found: ${hasDisclaimer ? 'YES' : 'NO'}`);
    if (hasDisclaimer) {
        console.log("✅ Step 4 RESOLVED: TRUE - Disclaimer present");
    } else {
        console.log("❌ Step 4 RESOLVED: FALSE - No disclaimer");
    }
    
    return hasDisclaimer;
}

// Main enforcement workflow
function runEnforcementWorkflow(post) {
    console.log("🚨 X/TWITTER PAID PARTNERSHIP ENFORCEMENT WORKFLOW");
    console.log("URL:", post.url);
    console.log("Author:", post.author);
    console.log("=" .repeat(80));
    
    // Step 1: Check commission
    const hasCommission = step1_CheckCommission(post.content);
    if (!hasCommission) {
        return {
            violation: false,
            reason: "No commission detected",
            action: "No action needed"
        };
    }
    
    // Step 2: Check promotion
    const hasPromotion = step2_CheckPromotion(post.content);
    if (!hasPromotion) {
        return {
            violation: false,
            reason: "No promotion detected",
            action: "No action needed"
        };
    }
    
    // Step 3: Check prohibited industries
    const prohibitedIndustries = step3_CheckProhibitedIndustries(post.content);
    
    // Step 4: Check disclaimer
    const hasDisclaimer = step4_CheckDisclaimer(post.content);
    
    // Determine action based on workflow
    let violation = false;
    let reason = "";
    let action = "";
    
    if (prohibitedIndustries.length > 0) {
        // Prohibited industry detected
        violation = true;
        reason = `Prohibited industry detected: ${prohibitedIndustries.join(', ')}`;
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
        hasCommission,
        hasPromotion,
        prohibitedIndustries,
        hasDisclaimer
    };
}

// Run the workflow
console.log("🤖 RUNNING X/TWITTER ENFORCEMENT WORKFLOW");
console.log("=" .repeat(80));

const result = runEnforcementWorkflow(samplePost);

console.log("\n🎯 FINAL VERDICT:");
console.log("=" .repeat(30));
console.log(`🚨 VIOLATION: ${result.violation ? 'YES' : 'NO'}`);
console.log(`📝 REASON: ${result.reason}`);
console.log(`⚡ ACTION: ${result.action}`);

console.log("\n📊 WORKFLOW SUMMARY:");
console.log("=" .repeat(30));
console.log(`Step 1 (Commission): ${result.hasCommission ? 'TRUE' : 'FALSE'}`);
console.log(`Step 2 (Promotion): ${result.hasPromotion ? 'TRUE' : 'FALSE'}`);
console.log(`Step 3 (Prohibited): ${result.prohibitedIndustries.length > 0 ? result.prohibitedIndustries.join(', ') : 'NONE'}`);
console.log(`Step 4 (Disclaimer): ${result.hasDisclaimer ? 'TRUE' : 'FALSE'}`);

console.log("\n" + "=" .repeat(80));
console.log("✅ ENFORCEMENT WORKFLOW COMPLETE");
console.log("=" .repeat(80)); 