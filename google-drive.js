/**
 * @file Manages all interactions with the Google Drive API.
 */

const FOLDER_NAME = 'Policy and Labels Enforcement';

/**
 * Gets an OAuth 2.0 token by performing a manual auth flow.
 * This is necessary because we are storing the client secret in chrome.storage
 * instead of a file, which prevents the standard chrome.identity.getAuthToken from working.
 * @returns {Promise<string>} The OAuth token.
 */
async function getAuthToken() {
    // 1. Get client credentials from storage
    const storedSettings = await new Promise(resolve => chrome.storage.local.get('settings', resolve));
    const clientId = storedSettings?.settings?.googleClientId;
    const clientSecret = storedSettings?.settings?.googleClientSecret;

    if (!clientId || !clientSecret) {
        throw new Error("Google Client ID or Secret not found. Please go to the settings page and enter your credentials.");
    }

    const redirectUri = chrome.identity.getRedirectURL();
    const scopes = [
        "https://www.googleapis.com/auth/drive.readonly",
        "https://www.googleapis.com/auth/spreadsheets"
    ].join(' ');

    // 2. Launch web auth flow to get an authorization code
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${clientId}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&response_type=code` +
        `&scope=${encodeURIComponent(scopes)}` +
        `&access_type=offline`;

    const responseUrl = await new Promise((resolve, reject) => {
        chrome.identity.launchWebAuthFlow({
            url: authUrl,
            interactive: true
        }, (responseUrl) => {
            if (chrome.runtime.lastError || !responseUrl) {
                reject(new Error(chrome.runtime.lastError?.message || "Authentication flow failed."));
            } else {
                resolve(responseUrl);
            }
        });
    });

    const url = new URL(responseUrl);
    const authCode = url.searchParams.get('code');

    if (!authCode) {
        throw new Error("Could not extract authorization code from response.");
    }

    // 3. Exchange authorization code for an access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
            code: authCode,
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: redirectUri,
            grant_type: 'authorization_code'
        })
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
        throw new Error(`Failed to exchange auth code for token: ${tokenData.error_description || 'Unknown error'}`);
    }

    // The access_token can now be used for API calls.
    // Note: This flow doesn't handle token refreshing. It re-authenticates each time.
    // For a production extension, you would store and refresh the refresh_token.
    return tokenData.access_token;
}

/**
 * Finds the ID of a folder by its name in Google Drive.
 * @param {string} folderName The name of the folder to find.
 * @returns {Promise<string>} The folder ID.
 * @throws {Error} Throws specific errors for different failure modes.
 */
async function findFolderId(folderName) {
  try {
    const token = await getAuthToken();
    const response = await fetch(`https://www.googleapis.com/drive/v3/files?q=mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.status === 403) {
      // API permission denied.
      throw new Error('DRIVE_API_FORBIDDEN');
    }
    if (!response.ok) {
      throw new Error(`Google Drive API request failed with status ${response.status}`);
    }

    const data = await response.json();
    if (data.files && data.files.length > 0) {
      console.log(`Found folder '${folderName}' with ID: ${data.files[0].id}`);
      return data.files[0].id;
    } else {
      // Folder doesn't exist.
      throw new Error('DRIVE_FOLDER_NOT_FOUND');
    }
  } catch (error) {
    // Re-throw specific errors, otherwise throw a generic one.
    if (error.message.startsWith('DRIVE_')) {
      throw error;
    }
    console.error(`Error finding folder '${folderName}':`, error);
    throw new Error('DRIVE_UNKNOWN_ERROR');
  }
}

/**
 * Fetches the content of a Google Doc file by its ID.
 * @param {string} fileId The ID of the Google Doc.
 * @returns {Promise<string|null>} The text content of the file with images and descriptions.
 */
async function getRuleFileContent(fileId) {
  try {
    const token = await getAuthToken();
    
    // First try to export as HTML to capture images and rich content
    let response = await fetch(`https://www.googleapis.com/drive/v3s/${fileId}/export?mimeType=text/html`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.ok) {
      const htmlContent = await response.text();
      
      // Extract text content from HTML while preserving image descriptions
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlContent, 'text/html');
      
      // Extract text content
      let textContent = doc.body.textContent || doc.body.innerText || ''; 
      // Extract image descriptions and alt text
      const images = doc.querySelectorAll('img');
      let imageDescriptions = '';
      images.forEach((img, index) => {
        const alt = img.alt || img.title || `Image ${index + 1}`;
        const src = img.src || '';
        imageDescriptions += `\nImage ${index + 1}: ${alt}`;
        if (src) {
          imageDescriptions += ` (URL: ${src})`;
        }
      });
      
      // Combine text content with image descriptions
      const fullContent = textContent + imageDescriptions;
      // Clean up whitespace and normalize the text for better AI processing
      const cleanedContent = fullContent.replace(/\s+/g, ' ').trim();
      console.log(`Successfully extracted and cleaned HTML content with ${images.length} images for file ID ${fileId}`);
      return cleanedContent;
    }
    
    // Fallback to plain text if HTML export fails
    console.log(`HTML export failed for file ID ${fileId}, falling back to plain text`);
    response = await fetch(`https://www.googleapis.com/drive/v3s/${fileId}/export?mimeType=text/plain`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) throw new Error(`API request failed with status ${response.status}`);
    const textContent = await response.text();
    const cleanedText = textContent.replace(/\s+/g, ' ').trim();
    console.log(`Successfully extracted and cleaned plain text content for file ID ${fileId}`);
    return cleanedText;
    
  } catch (error) {
    console.error(`Error fetching content for file ID ${fileId}:`, error);
    return null; // Return null to indicate failure for a single file
  }
}

/**
 * Fetches all policy rules from the designated folder in Google Drive.
 * @returns {Promise<string>} A single string containing all concatenated rule document contents.
 * @throws {Error} Throws specific errors for different failure modes.
 */
export async function fetchAllRules() {
  // findFolderId will throw an error if it fails, which will be caught by the caller.
  const folderId = await findFolderId(FOLDER_NAME);

  try {
    const token = await getAuthToken();
    const response = await fetch(`https://www.googleapis.com/drive/v3/files?q='${folderId}' in parents and mimeType='application/vnd.google-apps.document' and trashed=false`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.status === 403) {
      // This could happen if the folder is found but files inside are not accessible.
      throw new Error('DRIVE_API_FORBIDDEN');
    }
    if (!response.ok) {
      throw new Error(`Google Drive API request failed with status ${response.status}`);
    }

    const data = await response.json();
    if (!data.files || data.files.length === 0) {
      console.warn(`No rule documents found in folder '${FOLDER_NAME}'.`);
      // Folder exists but is empty.
      throw new Error('DRIVE_NO_RULES_FOUND');
    }

    let allRulesContent = "";
    for (const file of data.files) {
      const content = await getRuleFileContent(file.id);
      if (content) {
        allRulesContent += `<policy_document name="${file.name}">\n${content}\n</policy_document>\n\n`;
      }
    }
    console.log('Successfully fetched and concatenated all rule files.');
    console.log('Final rules content length:', allRulesContent.length);
    console.log('Rules content preview:', allRulesContent.substring(0, 500));
    return allRulesContent;

  } catch (error) {
    // Re-throw specific errors, otherwise throw a generic one.
    if (error.message.startsWith('DRIVE_')) {
      throw error;
    }
    console.error('Error fetching rule files from folder:', error);
    throw new Error('DRIVE_UNKNOWN_ERROR');
  }
} 