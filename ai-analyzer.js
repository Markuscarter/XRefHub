async function getAiProvider() {
    return new Promise((resolve) => {
        chrome.storage.local.get(['settings'], (result) => {
            resolve(result.settings?.provider || 'gemini');
        });
    });
}

async function getApiKey(provider) {
    return new Promise((resolve) => {
        chrome.storage.local.get(['settings'], (result) => {
            if (provider === 'chatgpt') {
                resolve(result.settings?.chatgptApiKey);
            } else if (provider === 'groq') {
                resolve(result.settings?.groqApiKey);
            } else {
                resolve(null);
            }
        });
    });
}

export async function analyzePost(postContent, mediaUrl, rules) {
    const provider = await getAiProvider();
    const apiKey = await getApiKey(provider);
    
    const prompt = `
      You are an Expert Content Policy Analyst. Your primary goal is to conduct a nuanced analysis of a social media post, prioritizing deep policy understanding over simple label matching.

      **Source of Truth: Policy Documents**
      The following content contains official policy documents. These are your primary source of truth.
      ${rules}

      **Post to Analyze:**
      - **Content:** "${postContent}"
      ${mediaUrl ? `- **Media URL:** ${mediaUrl}` : ''}

      **Your Reasoning Process (Follow these steps):**
      1.  **Identify Core Issue:** First, identify the central theme or potential violation in the post (e.g., "The post appears to be promoting a financial product," "The post contains potentially hateful imagery").
      2.  **Find Relevant Policy:** Scour the provided <policy_document> files. Find the policy that most directly addresses the core issue. Cite the document by its "name" attribute.
      3.  **Explain Application:** Briefly explain *why* that specific policy applies to the post. Quote or paraphrase the key phrase from the policy document that justifies your reasoning.
      4.  **Suggest Labels:** Based on your policy analysis, suggest a list of appropriate labels. If the Sheets provides a list of labels, you can use it as a reference, but your primary justification must come from the policy documents.
      5.  **Summarize Intent:** Briefly summarize the post's likely intent.

      **Return a single, valid JSON object** with the following keys: "summary", "resolution", "suggestedLabels", "policyDocument", "policyReasoning".
      - "summary": The intent summary.
      - "resolution": Your explanation of why the policy applies. This is the most important field.
      - "suggestedLabels": The list of suggested labels.
      - "policyDocument": The name of the most relevant policy document.
      - "policyReasoning": The specific quote or reason from the policy document.

      Do not include any other text or formatting before or after the JSON object.
    `;

    try {
        if (provider === 'gemini') {
            // Gemini uses Google's authentication, no separate API key needed here
            return await callGoogleGenerativeAI(prompt);
        } else if (provider === 'chatgpt') {
            if (!apiKey) throw new Error('ChatGPT API key not set.');
            return await callOpenAI(prompt, apiKey);
        } else if (provider === 'groq') {
            if (!apiKey) throw new Error('Groq API key not set.');
            return await callGroq(prompt, apiKey);
        }
    } catch (error) {
        console.error(`Error analyzing post with ${provider}:`, error);
        return { error: error.message };
    }
}

export async function getDeeperAnalysis(postContent, mediaUrl, rules) {
    const provider = await getAiProvider();
    const apiKey = await getApiKey(provider);
    
    const prompt = `
      You are an Expert Content Policy Analyst. A user has requested a deeper analysis of a social media post. Your task is to provide a detailed breakdown, referencing the official policy documents as your primary source of truth.

      **Source of Truth: Policy Documents**
      ${rules}

      **Post to Analyze:**
      - **Content:** "${postContent}"
      ${mediaUrl ? `- **Media URL:** ${mediaUrl}` : ''}

      **Your In-Depth Analysis (Provide a detailed, multi-paragraph explanation):**
      1.  **Core Issue Identification:** What is the fundamental policy question at stake with this post? Go beyond surface-level descriptions.
      2.  **Policy Deep Dive:** Identify the most relevant <policy_document>. Discuss the nuances of this policy. Are there any ambiguities or exceptions? Explain the spirit and intent behind the rule.
      3.  **Contextual Factors:** Analyze the post's context. Who is the speaker? Who is the likely audience? What is the broader conversation it's part of? How does this context influence the policy interpretation?
      4.  **Potential Counterarguments:** Briefly discuss any arguments for why the post might *not* violate the policy. This demonstrates a balanced and thorough analysis.
      5.  **Final Recommendation:** Conclude with a clear recommendation and justification.

      Structure your response as a single block of well-formatted text. Do not invent URLs or policy names not present in the provided documents.
    `;

    try {
        if (provider === 'gemini') {
            const result = await callGoogleGenerativeAI(prompt, false);
            return result.resolution;
        } else if (provider === 'chatgpt') {
            if (!apiKey) throw new Error('ChatGPT API key not set.');
            return await callOpenAIWithMessages([{ role: "user", content: prompt }], apiKey, false);
        } else if (provider === 'groq') {
            if (!apiKey) throw new Error('Groq API key not set.');
            return await callGroqWithMessages([{ role: "user", content: prompt }], apiKey, false);
        }
    } catch (error) {
        console.error(`Error in getDeeperAnalysis with ${provider}:`, error);
        return `Error generating deeper analysis: ${error.message}`;
    }
}

export async function getChatReply(message, history) {
    const provider = await getAiProvider();
    const apiKey = await getApiKey(provider);
    
    const systemPrompt = `
      You are a helpful AI assistant for the Xrefhub browser extension. 
      Your role is to answer follow-up questions about a content analysis that was just performed.
      Be concise and helpful. Refer to the conversation history for context.
      Do not return JSON, only a plain text response.
    `;

    // We'll structure the messages for the API call
    const messages = [
        { role: "system", content: systemPrompt },
        ...history, // Add the previous conversation
        { role: "user", content: message }
    ];

    try {
        if (provider === 'gemini') {
            // Re-using analyzePost prompt structure for Gemini chat for now
            const geminiPrompt = `System: ${systemPrompt}\n\nHistory: ${JSON.stringify(history)}\n\nUser: ${message}`;
            const result = await callGoogleGenerativeAI(geminiPrompt, false);
            return result.resolution; // Extract the text part
        } else if (provider === 'chatgpt') {
            if (!apiKey) throw new Error('ChatGPT API key not set.');
            return await callOpenAIWithMessages(messages, apiKey, false);
        } else if (provider === 'groq') {
            if (!apiKey) throw new Error('Groq API key not set.');
            return await callGroqWithMessages(messages, apiKey, false);
        }
    } catch (error) {
        console.error(`Error getting chat reply with ${provider}:`, error);
        return { error: error.message };
    }
}

export async function getNBMResponse(postContent, mediaUrl, rules, reviewPageContext = null) {
    const provider = await getAiProvider();
    const apiKey = await getApiKey(provider);
    
    // Parse review page context if it's a string (JSON)
    let parsedReviewContext = null;
    if (reviewPageContext && typeof reviewPageContext === 'string') {
        try {
            parsedReviewContext = JSON.parse(reviewPageContext);
        } catch (e) {
            console.warn('Could not parse review page context JSON');
        }
    } else if (reviewPageContext) {
        parsedReviewContext = reviewPageContext;
    }
    
    // Build review context summary
    let reviewContextSummary = '';
    if (parsedReviewContext) {
        const indicators = parsedReviewContext.statusIndicators ? Object.values(parsedReviewContext.statusIndicators).map(s => s.text).join(', ') : '';
        const formData = parsedReviewContext.formData ? Object.keys(parsedReviewContext.formData).join(', ') : '';
        const uiElements = parsedReviewContext.uiElements ? Object.values(parsedReviewContext.uiElements).map(u => u.text).join(', ') : '';
        const reviewContext = parsedReviewContext.reviewContext ? Object.values(parsedReviewContext.reviewContext).map(r => r.text).join(', ') : '';
        const tableCount = parsedReviewContext.tableData ? Object.keys(parsedReviewContext.tableData).length : 0;
        
        reviewContextSummary = `
**Review Page Context Analysis:**
${JSON.stringify(parsedReviewContext, null, 2)}

**Key Review Page Elements Found:**
${indicators ? `- Status Indicators: ${indicators}` : ''}
${formData ? `- Form Data: ${formData}` : ''}
${uiElements ? `- UI Elements: ${uiElements}` : ''}
${reviewContext ? `- Review Context: ${reviewContext}` : ''}
${tableCount > 0 ? `- Table Data Available: ${tableCount} tables` : ''}`;
    }
    
    const prompt = `
You are an Expert Content Policy Analyst and a trusted advisor for an agent's next best action. Your task is to analyze a post and the surrounding review context to recommend a clear, policy-driven next step.

**Source of Truth: Policy Documents**
${rules}

**Post to Analyze:**
- **Content:** "${postContent}"
${mediaUrl ? `- **Media URL:** ${mediaUrl}` : ''}

${reviewContextSummary}

**Your Reasoning Process:**
1.  **Synthesize All Information:** Review the post content, the rich context from the review page, and the official policy documents.
2.  **Identify the Crux:** What is the single most important issue or conflict between the post and the policies?
3.  **Determine Current State:** Based on the review context, what is the current status of this ad? (e.g., "pending initial review," "escalated for hate speech," "previously approved").
4.  **Consult Policy for Next Steps:** Find the relevant <policy_document>. Does it contain a specific "enforcement tree" or "next step protocol"?
5.  **Formulate Recommendation:** Based on the policy, recommend the single next best action for the human agent. Be explicit. (e.g., "Action: Escalate to the 'High-Risk Content' queue," "Action: Apply 'Financial Services' label and approve.").

**Return a single, valid JSON object** with the following keys: "summary", "resolution", "suggestedLabels", "policyDocument", "policyReasoning", "nextSteps", "escalationRequired", "riskLevel", "reviewWorkflowStage", "recommendedActions".
- "resolution": A concise summary of your reasoning for the recommended action.
- "nextSteps": The explicit, single next action for the agent to take.
- "reviewWorkflowStage": Your assessment of the ad's current status.
- "recommendedActions": A list of any other possible actions.

Do not include any other text or formatting before or after the JSON object.
`;

    try {
        if (provider === 'gemini') {
            return await callGoogleGenerativeAI(prompt);
        } else if (provider === 'chatgpt') {
            if (!apiKey) throw new Error('ChatGPT API key not set.');
            return await callOpenAI(prompt, apiKey);
        } else if (provider === 'groq') {
            if (!apiKey) throw new Error('Groq API key not set.');
            return await callGroq(prompt, apiKey);
        }
    } catch (error) {
        console.error(`Error in NBM analysis with ${provider}:`, error);
        return { error: error.message };
    }
}

// --- AI API Call Implementations ---

async function callGoogleGenerativeAI(prompt, expectJson = true) {
    // This function would use chrome.identity to get a token and then call the Gemini API
    // Placeholder for actual implementation
    console.log(`Calling Gemini (expectJson=${expectJson})...`);
    if (expectJson) {
        return { 
          summary: "This is a placeholder summary from the Gemini model.",
          resolution: 'Placeholder violation reason.', 
          suggestedLabels: ['Default Label 1'] 
        };
    }
    return { resolution: "This is a placeholder chat reply from the Gemini model." };
}

async function callOpenAI(prompt, apiKey) {
    return callOpenAIWithMessages([{ role: "user", content: prompt }], apiKey);
}

async function callOpenAIWithMessages(messages, apiKey, expectJson = true) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: messages,
            max_tokens: 150,
        }),
    });
    if (!response.ok) throw new Error(`OpenAI API error: ${response.statusText}`);
    const data = await response.json();
    const content = data.choices[0].message.content;
    console.log('Raw OpenAI Response content:', content);
    return expectJson ? extractAndParseJson(content) : content;
}

async function callGroq(prompt, apiKey) {
    return callGroqWithMessages([{ role: "user", content: prompt }], apiKey);
}

async function callGroqWithMessages(messages, apiKey, expectJson = true) {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: "llama3-8b-8192", 
            messages: messages,
            max_tokens: 150,
        }),
    });
    if (!response.ok) throw new Error(`Groq API error: ${response.statusText}`);
    const data = await response.json();
    const content = data.choices[0].message.content;
    console.log('Raw Groq Response content:', content);
    return expectJson ? extractAndParseJson(content) : content;
}

function extractAndParseJson(text) {
    // First, remove markdown fences if they exist
    let cleanedText = text.trim();
    if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.slice(7, -3);
    } else if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.slice(3, -3);
    }

    // Find the first '{' and the last '}' to extract the JSON object
    const startIndex = cleanedText.indexOf('{');
    const endIndex = cleanedText.lastIndexOf('}');

    if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
        console.error("Could not find a valid JSON object in the AI's response:", cleanedText);
        throw new Error("Could not find a valid JSON object in the AI's response.");
    }

    const jsonString = cleanedText.substring(startIndex, endIndex + 1);

    try {
        return JSON.parse(jsonString);
    } catch (e) {
        console.error("Failed to parse extracted JSON:", jsonString, "Original error:", e);
        throw new Error("The AI's response was not formatted correctly.");
    }
} 