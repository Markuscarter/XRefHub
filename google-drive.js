/**
 * @file Manages all interactions with the Google Drive API.
 */

const FOLDER_NAME = 'Policy and Labels Enforcement';

/**
 * Gets an OAuth 2.0 token from the Chrome Identity API.
 * @returns {Promise<string>} The OAuth token.
 */
async function getAuthToken() {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive: true }, (token) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(token);
      }
    });
  });
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
 * @returns {Promise<string|null>} The text content of the file.
 */
async function getRuleFileContent(fileId) {
  try {
    const token = await getAuthToken();
    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/plain`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error(`API request failed with status ${response.status}`);
    return await response.text();
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
        allRulesContent += `--- Policy: ${file.name} ---\n${content}\n\n`;
      }
    }
    console.log('Successfully fetched and concatenated all rule files.');
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