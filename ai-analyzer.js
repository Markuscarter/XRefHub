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
      Analyze the following social media post based on the provided rules.
      You should also act as if you have knowledge of X/Twitter's advertising and promotion policies.

      **Rules from Google Sheet:**
      ${rules}

      **Post Content:**
      "${postContent}"

      ${mediaUrl ? `**Associated Media URL (for context):**\n${mediaUrl}` : ''}

      **Your Task:**
      1.  **Context and Intent Summary:** Briefly summarize the post's content and its associated media (if any). Describe its likely intent (e.g., marketing, personal opinion) and the context.
      2.  **AI Resolution:** Based on the rules and the post content, provide a concise, one-sentence explanation for why the suggested labels apply. This reason should be based on weighted reasoning of the rules. If no rules apply, state "No violation found." The entire resolution must not exceed 160 characters.
      3.  **Suggested Labels:** Return a list of labels from the Google Sheet that apply to the post. If none apply, return an empty list.

      **Important:** The post content may contain sensitive information or API keys. Do NOT include any API keys, personal data, or sensitive strings in your response.

      **Return a single, valid JSON object** with the following keys: "summary", "resolution", "suggestedLabels".
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
      You are an expert policy analyst. A user has requested a deeper analysis of a social media post.
      Your task is to provide a detailed breakdown of the post's context, intent, and potential policy violations.

      **Rules from Google Sheet:**
      ${rules}

      **Post Content:**
      "${postContent}"

      ${mediaUrl ? `**Associated Media URL (for context):**\n${mediaUrl}` : ''}

      **Your Response:**
      Provide a detailed, multi-paragraph explanation covering:
      1.  **Nuanced Intent:** Go beyond the surface level. What is the likely underlying goal of this post? (e.g., rage-bait, astroturfing, genuine opinion, satire).
      2.  **Potential Audience:** Who is this content likely targeting?
      3.  **Policy Considerations:** Name specific platform policies (e.g., "Facebook's Hate Speech Policy", "X's Civic Integrity Policy") that might be relevant. Do NOT invent URLs. Explain *why* these policies may or may not apply.
      
      Structure your response as a single block of text.
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