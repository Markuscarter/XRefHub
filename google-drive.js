/**
 * @file Manages all interactions with the Google Drive API using the standard Chrome Identity API.
 */

/**
 * Gets an OAuth 2.0 token from the Chrome Identity API.
 * This is the standard, recommended way to handle authentication.
 * Chrome will handle caching, refreshing, and user prompts.
 * @returns {Promise<string>} The OAuth token.
 */
export async function getAuthToken() {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive: true }, (token) => {
      if (chrome.runtime.lastError || !token) {
        console.error('getAuthToken failed:', chrome.runtime.lastError?.message);
        reject(new Error('Failed to get Google authentication token. Please try signing in again.'));
      } else {
        resolve(token);
      }
    });
  });
}

/**
 * Fetches the content of a Google Doc file by its ID.
 * @param {string} fileId The ID of the Google Doc.
 * @returns {Promise<string|null>} The text content of the file.
 */
async function getRuleFileContent(fileId) {
  try {
    const token = await getAuthToken();
    // Using export as plain text is the most reliable for AI processing.
    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/plain`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) throw new Error(`API request failed with status ${response.status}`);
    const textContent = await response.text();
    return textContent.replace(/\s+/g, ' ').trim();
  } catch (error) {
    console.error(`Error fetching content for file ID ${fileId}:`, error);
    return null; // Return null to indicate failure for a single file
  }
}

/**
 * Fetches all policy rule documents from a specified folder in Google Drive.
 * @returns {Promise<string>} A single string containing all concatenated rule document contents.
 */
export async function fetchAllRules() {
    const { settings } = await chrome.storage.local.get('settings');
    const folderId = settings?.googleFolderId;
    
    if (!folderId) {
        throw new Error('Google Drive Folder ID is not set in the settings.');
    }

    const token = await getAuthToken();
    const response = await fetch(`https://www.googleapis.com/drive/v3/files?q='${folderId}' in parents and mimeType='application/vnd.google-apps.document' and trashed=false`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) {
      throw new Error(`Google Drive API request failed with status ${response.status}`);
    }

    const data = await response.json();
    if (!data.files || data.files.length === 0) {
      console.warn(`No rule documents found in folder with ID: ${folderId}.`);
      return ''; // Return empty string if no files are found
    }

    let allRulesContent = "";
    for (const file of data.files) {
      const content = await getRuleFileContent(file.id);
      if (content) {
        allRulesContent += `<policy_document name="${file.name}">\n${content}\n</policy_document>\n\n`;
      }
    }
    return allRulesContent;
}

/**
 * Fetches the centralized configuration file (xrefhub_config.json) from Google Drive.
 * @returns {Promise<object>} The parsed JSON configuration object.
 */
export async function fetchConfiguration() {
  const CONFIG_FILE_NAME = 'xrefhub_config.json';
  const token = await getAuthToken();

  const findResponse = await fetch(`https://www.googleapis.com/drive/v3/files?q=name='${CONFIG_FILE_NAME}' and trashed=false&spaces=drive&fields=files(id,name)`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (!findResponse.ok) throw new Error('Failed to search for config file.');

  const findData = await findResponse.json();
  if (!findData.files || findData.files.length === 0) {
    throw new Error(`Configuration file "${CONFIG_FILE_NAME}" not found in your Google Drive.`);
  }

  const fileId = findData.files[0].id;
  const downloadResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (!downloadResponse.ok) throw new Error('Failed to download config file.');

  return await downloadResponse.json();
}

/**
 * Fetches the currently authenticated user's Google profile information.
 * @returns {Promise<object>} The user's profile object, containing name, email, etc.
 */
export async function fetchGoogleUserProfile() {
    const token = await getAuthToken();
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user profile. Status: ${response.status}`);
    }
    return await response.json();
} 