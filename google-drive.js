/**
 * @file Google Drive API integration for Xrefhub
 * Handles fetching rules, configuration, and user profile from Google Drive
 */

import { getAuthToken } from './google-auth.js';

/**
 * Fetches the content of a specific rule file from Google Drive.
 * @param {string} fileId The Google Drive file ID.
 * @returns {Promise<string>} The file content as a string.
 */
async function getRuleFileContent(fileId) {
  try {
    const token = await getAuthToken();
    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) {
      console.warn(`Failed to fetch file content for ${fileId}. Status: ${response.status}`);
      return null;
    }

    return await response.text();
  } catch (error) {
    console.error('Error fetching rule file content:', error);
    return null;
  }
}

/**
 * Fetches images from Google Drive for analysis.
 * @param {string} folderId Optional folder ID, defaults to configured folder
 * @returns {Promise<Array>} Array of image objects with metadata
 */
export async function fetchImagesFromDrive(folderId = null) {
  try {
    const settings = await chrome.storage.local.get(['settings']);
    const targetFolderId = folderId || settings?.settings?.googleFolderId;
    
    if (!targetFolderId) {
      console.log('No Google Drive folder ID configured for image fetch.');
      return [];
    }

    console.log(`[GoogleDrive] Fetching images from folder: ${targetFolderId}`);

    const token = await getAuthToken();
    
    // Fetch image files from the folder
    const response = await fetch(`https://www.googleapis.com/drive/v3/files?q='${targetFolderId}' in parents and (mimeType contains 'image/') and trashed=false&fields=files(id,name,mimeType,size,createdTime,webContentLink)`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) {
      throw new Error(`Google Drive API request failed with status ${response.status}`);
    }

    const data = await response.json();
    if (!data.files || data.files.length === 0) {
      console.log(`No image files found in folder: ${targetFolderId}`);
      return [];
    }

    console.log(`[GoogleDrive] Found ${data.files.length} image files`);

    const images = [];
    for (const file of data.files) {
      try {
        // Get image metadata
        const imageInfo = {
          id: file.id,
          name: file.name,
          mimeType: file.mimeType,
          size: file.size,
          createdTime: file.createdTime,
          webContentLink: file.webContentLink,
          // Add direct download link for analysis
          downloadUrl: `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`
        };
        
        images.push(imageInfo);
        console.log(`[GoogleDrive] Added image: ${file.name} (${file.mimeType})`);
      } catch (error) {
        console.error(`Error processing image ${file.name}:`, error);
      }
    }
    
    console.log(`[GoogleDrive] Successfully fetched ${images.length} images`);
    return images;
  } catch (error) {
    console.error('Error fetching images from Google Drive:', error);
    return [];
  }
}

/**
 * Fetches all rule documents from the configured Google Drive folder.
 * @returns {Promise<string>} Combined content of all rule documents.
 */
export async function fetchAllRules() {
  try {
    // Get settings to find the folder ID
    const settings = await chrome.storage.local.get(['settings']);
    const folderId = settings?.settings?.googleFolderId;
    
    if (!folderId) {
      console.log('No Google Drive folder ID configured. Skipping Drive rules fetch.');
      return '';
    }

    console.log(`[GoogleDrive] Fetching rules from folder: ${folderId}`);

    const token = await getAuthToken();
    
    // First, verify the folder exists and is accessible
    const folderResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${folderId}?fields=id,name,permissions`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!folderResponse.ok) {
      if (folderResponse.status === 404) {
        console.warn(`Google Drive folder not found: ${folderId}. Please check the folder ID in settings.`);
        return '';
      } else if (folderResponse.status === 403) {
        console.warn(`Access denied to Google Drive folder: ${folderId}. Please check permissions.`);
        return '';
      } else {
        throw new Error(`Google Drive API request failed with status ${folderResponse.status}`);
      }
    }

    // Now fetch the documents in the folder
    const response = await fetch(`https://www.googleapis.com/drive/v3/files?q='${folderId}' in parents and mimeType='application/vnd.google-apps.document' and trashed=false&fields=files(id,name)`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) {
      throw new Error(`Google Drive API request failed with status ${response.status}`);
    }

    const data = await response.json();
    if (!data.files || data.files.length === 0) {
      console.log(`No rule documents found in folder: ${folderId}`);
      return '';
    }

    console.log(`[GoogleDrive] Found ${data.files.length} rule documents`);

    let allRulesContent = "";
    for (const file of data.files) {
      console.log(`[GoogleDrive] Fetching content from: ${file.name}`);
      const content = await getRuleFileContent(file.id);
      if (content) {
        allRulesContent += `<policy_document name="${file.name}">\n${content}\n</policy_document>\n\n`;
      }
    }
    
    console.log(`[GoogleDrive] Successfully fetched rules content (${allRulesContent.length} characters)`);
    return allRulesContent;
  } catch (error) {
    console.error('Error fetching rules from Google Drive:', error);
    // Don't throw the error, just return empty string to allow fallback
    return '';
  }
}

/**
 * Fetches the centralized configuration file (xrefhub_config.json) from Google Drive.
 * @returns {Promise<object>} The parsed JSON configuration object.
 */
export async function fetchConfiguration() {
  const CONFIG_FILE_NAME = 'xrefhub_config.json';
  
  try {
    const token = await getAuthToken();

    // Find the configuration file
    const findResponse = await fetch(`https://www.googleapis.com/drive/v3/files?q=name='${CONFIG_FILE_NAME}' and trashed=false&spaces=drive&fields=files(id,name)`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!findResponse.ok) {
      throw new Error(`Failed to search for config file. Status: ${findResponse.status}`);
    }

    const findData = await findResponse.json();
    if (!findData.files || findData.files.length === 0) {
      console.log(`Configuration file "${CONFIG_FILE_NAME}" not found. Creating default config...`);
      return await createDefaultConfiguration();
    }

    // Download the file content
    const fileId = findData.files[0].id;
    const downloadResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!downloadResponse.ok) {
      throw new Error(`Failed to download config file. Status: ${downloadResponse.status}`);
    }

    // Get text content and parse as JSON
    const textContent = await downloadResponse.text();
    if (!textContent.trim()) {
      throw new Error(`Configuration file "${CONFIG_FILE_NAME}" is empty.`);
    }

    return JSON.parse(textContent);
  } catch (error) {
    console.error('Error fetching configuration from Drive:', error);
    throw error;
  }
}

/**
 * Creates a default configuration file in Google Drive.
 * @returns {Promise<object>} The default configuration object.
 */
async function createDefaultConfiguration() {
  const CONFIG_FILE_NAME = 'xrefhub_config.json';
  
  try {
    const token = await getAuthToken();
    const userProfile = await fetchGoogleUserProfile();
    
    // Create default configuration
    const defaultConfig = {
      username: userProfile.name || '',
      chatgptApiKey: '',
      groqApiKey: '',
      googleSheetId: '',
      googleFolderId: '',
      ai_providers: {
        gemini: {
          enabled: true,
          apiKey: ''
        },
        openai: {
          enabled: false,
          apiKey: ''
        }
      },
      created_at: new Date().toISOString(),
      version: '2.0.0'
    };

    // Create the file in Google Drive
    const createResponse = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: CONFIG_FILE_NAME,
        mimeType: 'application/json'
      })
    });

    if (!createResponse.ok) {
      throw new Error(`Failed to create config file. Status: ${createResponse.status}`);
    }

    const fileData = await createResponse.json();
    
    // Upload the content
    const uploadResponse = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileData.id}?uploadType=media`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(defaultConfig)
    });

    if (!uploadResponse.ok) {
      throw new Error(`Failed to upload config content. Status: ${uploadResponse.status}`);
    }

    console.log(`Created default configuration file: ${fileData.id}`);
    return defaultConfig;
  } catch (error) {
    console.error('Error creating default configuration:', error);
    throw error;
  }
}

/**
 * Fetches the Google user profile information.
 * @returns {Promise<object>} The user profile object.
 */
export async function fetchGoogleUserProfile() {
  try {
    const token = await getAuthToken();
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user profile. Status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching Google user profile:', error);
    throw error;
  }
}

/**
 * Discovers and returns the Xrefhub folder in Google Drive.
 * @returns {Promise<object|null>} The folder object or null if not found.
 */
export async function discoverXRefHubFolder() {
  try {
    const token = await getAuthToken();
    const response = await fetch(`https://www.googleapis.com/drive/v3/files?q=name='Xrefhub' and mimeType='application/vnd.google-apps.folder' and trashed=false&fields=files(id,name)`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) {
      throw new Error(`Failed to search for Xrefhub folder. Status: ${response.status}`);
    }

    const data = await response.json();
    if (data.files && data.files.length > 0) {
      console.log(`Found Xrefhub folder: ${data.files[0].name} (${data.files[0].id})`);
      return data.files[0];
    }

    console.log('Xrefhub folder not found in Google Drive');
    return null;
  } catch (error) {
    console.error('Error discovering Xrefhub folder:', error);
    return null;
  }
} 

/**
 * Fetches structured knowledge graphs and policy documents with proper categorization.
 * @param {string} category Optional category filter ('adReview', 'paidPartnership', 'knowledgeGraphs', 'all')
 * @returns {Promise<object>} Object with categorized documents and knowledge graphs.
 */
export async function fetchStructuredDocuments(category = 'all') {
  try {
    const settings = await chrome.storage.local.get(['settings']);
    const folderId = settings?.settings?.googleFolderId;
    
    if (!folderId) {
      console.log('No Google Drive folder ID configured. Skipping structured documents fetch.');
      return { policies: {}, knowledgeGraphs: {}, metadata: {} };
    }

    console.log(`[GoogleDrive] Fetching structured documents from folder: ${folderId} (category: ${category})`);

    const token = await getAuthToken();
    
    // Fetch all documents in the folder
    const response = await fetch(`https://www.googleapis.com/drive/v3/files?q='${folderId}' in parents and trashed=false&fields=files(id,name,mimeType,createdTime,modifiedTime)`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) {
      throw new Error(`Google Drive API request failed with status ${response.status}`);
    }

    const data = await response.json();
    if (!data.files || data.files.length === 0) {
      console.log(`No documents found in folder: ${folderId}`);
      return { policies: {}, knowledgeGraphs: {}, metadata: {} };
    }

    console.log(`[GoogleDrive] Found ${data.files.length} documents`);

    const structuredDocs = {
      policies: {},
      knowledgeGraphs: {},
      metadata: {
        adReview: [],
        paidPartnership: [],
        knowledgeGraphs: [],
        general: []
      }
    };

    // Process each document
    for (const file of data.files) {
      try {
        const content = await getRuleFileContent(file.id);
        if (!content) continue;

        // Categorize based on filename and content
        const category = categorizeDocument(file.name, content);
        
        if (category === 'knowledgeGraph') {
          try {
            // Try to parse as JSON knowledge graph
            const graphData = JSON.parse(content);
            structuredDocs.knowledgeGraphs[file.name] = {
              content: graphData,
              metadata: {
                id: file.id,
                name: file.name,
                createdTime: file.createdTime,
                modifiedTime: file.modifiedTime,
                type: 'knowledgeGraph'
              }
            };
            structuredDocs.metadata.knowledgeGraphs.push(file.name);
          } catch (parseError) {
            console.warn(`Failed to parse ${file.name} as JSON knowledge graph:`, parseError);
            // Fall back to text content
            structuredDocs.knowledgeGraphs[file.name] = {
              content: content,
              metadata: {
                id: file.id,
                name: file.name,
                createdTime: file.createdTime,
                modifiedTime: file.modifiedTime,
                type: 'text'
              }
            };
            structuredDocs.metadata.knowledgeGraphs.push(file.name);
          }
        } else {
          // Policy document
          structuredDocs.policies[file.name] = {
            content: content,
            category: category,
            metadata: {
              id: file.id,
              name: file.name,
              createdTime: file.createdTime,
              modifiedTime: file.modifiedTime,
              type: 'policy'
            }
          };
          
          // Add to appropriate category metadata
          if (category === 'adReview') {
            structuredDocs.metadata.adReview.push(file.name);
          } else if (category === 'paidPartnership') {
            structuredDocs.metadata.paidPartnership.push(file.name);
          } else {
            structuredDocs.metadata.general.push(file.name);
          }
        }
        
        console.log(`[GoogleDrive] Categorized ${file.name} as ${category}`);
      } catch (error) {
        console.error(`Error processing document ${file.name}:`, error);
      }
    }
    
    console.log(`[GoogleDrive] Successfully structured ${Object.keys(structuredDocs.policies).length} policies and ${Object.keys(structuredDocs.knowledgeGraphs).length} knowledge graphs`);
    return structuredDocs;
  } catch (error) {
    console.error('Error fetching structured documents:', error);
    return { policies: {}, knowledgeGraphs: {}, metadata: {} };
  }
}

/**
 * Categorizes a document based on its filename and content.
 * @param {string} filename The document filename.
 * @param {string} content The document content.
 * @returns {string} The category ('adReview', 'paidPartnership', 'knowledgeGraph', 'general').
 */
function categorizeDocument(filename, content) {
  const name = filename.toLowerCase();
  const contentLower = content.toLowerCase();
  
  // Knowledge Graph indicators
  if (name.includes('.json') || 
      name.includes('knowledge') || 
      name.includes('graph') || 
      name.includes('kg_') ||
      contentLower.includes('"nodes"') ||
      contentLower.includes('"edges"') ||
      contentLower.includes('"entities"') ||
      contentLower.includes('"relationships"')) {
    return 'knowledgeGraph';
  }
  
  // Paid Partnership indicators
  if (name.includes('paid') || 
      name.includes('partnership') || 
      name.includes('commercial') || 
      name.includes('sponsored') ||
      name.includes('advertising') ||
      name.includes('promotion') ||
      contentLower.includes('paid partnership') ||
      contentLower.includes('commercial content') ||
      contentLower.includes('sponsored post')) {
    return 'paidPartnership';
  }
  
  // Ad Review indicators
  if (name.includes('ad_') || 
      name.includes('review') || 
      name.includes('content') || 
      name.includes('policy') ||
      name.includes('guidelines') ||
      contentLower.includes('content policy') ||
      contentLower.includes('community guidelines')) {
    return 'adReview';
  }
  
  // Default to general
  return 'general';
}

/**
 * Creates recommended folder structure in Google Drive.
 * @returns {Promise<object>} Object with created folder IDs.
 */
export async function createRecommendedStructure() {
  try {
    const token = await getAuthToken();
    const settings = await chrome.storage.local.get(['settings']);
    const parentFolderId = settings?.settings?.googleFolderId;
    
    if (!parentFolderId) {
      throw new Error('No parent folder ID configured');
    }

    const folders = {
      policies: {
        adReview: null,
        paidPartnership: null,
        general: null
      },
      knowledgeGraphs: {
        entities: null,
        relationships: null,
        rules: null
      },
      templates: null,
      examples: null
    };

    // Create policy subfolders
    for (const [category, folderName] of Object.entries({
      adReview: '01-Ad_Review_Policies',
      paidPartnership: '02-Paid_Partnership_Policies', 
      general: '03-General_Policies'
    })) {
      const response = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: folderName,
          mimeType: 'application/vnd.google-apps.folder',
          parents: [parentFolderId]
        })
      });

      if (response.ok) {
        const folderData = await response.json();
        folders.policies[category] = folderData.id;
        console.log(`Created ${folderName}: ${folderData.id}`);
      }
    }

    // Create knowledge graph subfolders
    for (const [category, folderName] of Object.entries({
      entities: '04-Entity_Knowledge_Graphs',
      relationships: '05-Relationship_Knowledge_Graphs',
      rules: '06-Rule_Knowledge_Graphs'
    })) {
      const response = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: folderName,
          mimeType: 'application/vnd.google-apps.folder',
          parents: [parentFolderId]
        })
      });

      if (response.ok) {
        const folderData = await response.json();
        folders.knowledgeGraphs[category] = folderData.id;
        console.log(`Created ${folderName}: ${folderData.id}`);
      }
    }

    // Create additional folders
    for (const folderName of ['07-Templates', '08-Examples']) {
      const response = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: folderName,
          mimeType: 'application/vnd.google-apps.folder',
          parents: [parentFolderId]
        })
      });

      if (response.ok) {
        const folderData = await response.json();
        folders[folderName.split('-')[1].toLowerCase()] = folderData.id;
        console.log(`Created ${folderName}: ${folderData.id}`);
      }
    }

    console.log('[GoogleDrive] Created recommended folder structure');
    return folders;
  } catch (error) {
    console.error('Error creating recommended structure:', error);
    throw error;
  }
} 