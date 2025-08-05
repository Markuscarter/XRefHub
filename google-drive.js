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
 * Fetches structured documents from the XrefHub_Policy_Analysis folder structure.
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

    console.log(`[GoogleDrive] Fetching structured documents from XrefHub_Policy_Analysis (category: ${category})`);

    const token = await getAuthToken();
    
    // First, find the XrefHub_Policy_Analysis folder
    const mainFolderResponse = await fetch(`https://www.googleapis.com/drive/v3/files?q=name='XrefHub_Policy_Analysis' and '${folderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false&fields=files(id,name)`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!mainFolderResponse.ok) {
      throw new Error(`Failed to find XrefHub_Policy_Analysis folder. Status: ${mainFolderResponse.status}`);
    }

    const mainFolderData = await mainFolderResponse.json();
    if (!mainFolderData.files || mainFolderData.files.length === 0) {
      console.log('XrefHub_Policy_Analysis folder not found. Creating structure...');
      const structure = await createRecommendedStructure();
      return await fetchStructuredDocuments(category); // Retry after creating structure
    }

    const mainFolderId = mainFolderData.files[0].id;
    console.log(`Found XrefHub_Policy_Analysis folder: ${mainFolderId}`);

    // Fetch all subfolders
    const subfoldersResponse = await fetch(`https://www.googleapis.com/drive/v3/files?q='${mainFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false&fields=files(id,name)&orderBy=name`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!subfoldersResponse.ok) {
      throw new Error(`Failed to fetch subfolders. Status: ${subfoldersResponse.status}`);
    }

    const subfoldersData = await subfoldersResponse.json();
    const subfolders = {};
    
    if (subfoldersData.files) {
      for (const folder of subfoldersData.files) {
        subfolders[folder.name] = folder.id;
        console.log(`Found subfolder: ${folder.name} (${folder.id})`);
      }
    }

    const structuredDocs = {
      policies: {},
      knowledgeGraphs: {},
      vectorChunks: {},
      enforcementWorkflows: {},
      masterConsolidated: {},
      metadata: {
        adReview: [],
        paidPartnership: [],
        knowledgeGraphs: [],
        vectorChunks: [],
        enforcementWorkflows: [],
        general: []
      }
    };

    // Process documents from each subfolder
    for (const [folderName, folderId] of Object.entries(subfolders)) {
      console.log(`Processing folder: ${folderName}`);
      
      const filesResponse = await fetch(`https://www.googleapis.com/drive/v3/files?q='${folderId}' in parents and trashed=false&fields=files(id,name,mimeType,createdTime,modifiedTime)`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!filesResponse.ok) continue;

      const filesData = await filesResponse.json();
      if (!filesData.files) continue;

      for (const file of filesData.files) {
        try {
          const content = await getRuleFileContent(file.id);
          if (!content) continue;

          const fileMetadata = {
            id: file.id,
            name: file.name,
            folder: folderName,
            createdTime: file.createdTime,
            modifiedTime: file.modifiedTime
          };

          // Categorize based on folder and content
          if (folderName === '01_Policy_Documents') {
            const category = categorizeDocument(file.name, content);
            structuredDocs.policies[file.name] = {
              content: content,
              category: category,
              metadata: { ...fileMetadata, type: 'policy' }
            };
            
            if (category === 'adReview') {
              structuredDocs.metadata.adReview.push(file.name);
            } else if (category === 'paidPartnership') {
              structuredDocs.metadata.paidPartnership.push(file.name);
            } else {
              structuredDocs.metadata.general.push(file.name);
            }
          } else if (folderName === '02_JSON_Extracts') {
            try {
              const jsonData = JSON.parse(content);
              structuredDocs.policies[file.name] = {
                content: jsonData,
                category: 'jsonExtract',
                metadata: { ...fileMetadata, type: 'jsonExtract' }
              };
            } catch (parseError) {
              console.warn(`Failed to parse ${file.name} as JSON:`, parseError);
            }
          } else if (folderName === '03_Vector_Chunks') {
            structuredDocs.vectorChunks[file.name] = {
              content: content,
              metadata: { ...fileMetadata, type: 'vectorChunk' }
            };
            structuredDocs.metadata.vectorChunks.push(file.name);
          } else if (folderName === '04_Knowledge_Graphs') {
            try {
              const graphData = JSON.parse(content);
              structuredDocs.knowledgeGraphs[file.name] = {
                content: graphData,
                metadata: { ...fileMetadata, type: 'knowledgeGraph' }
              };
              structuredDocs.metadata.knowledgeGraphs.push(file.name);
            } catch (parseError) {
              console.warn(`Failed to parse ${file.name} as knowledge graph:`, parseError);
            }
          } else if (folderName === '05_Enforcement_Workflows') {
            structuredDocs.enforcementWorkflows[file.name] = {
              content: content,
              metadata: { ...fileMetadata, type: 'enforcementWorkflow' }
            };
            structuredDocs.metadata.enforcementWorkflows.push(file.name);
          } else if (folderName === '06_Master_Consolidated') {
            try {
              const consolidatedData = JSON.parse(content);
              structuredDocs.masterConsolidated[file.name] = {
                content: consolidatedData,
                metadata: { ...fileMetadata, type: 'masterConsolidated' }
              };
            } catch (parseError) {
              structuredDocs.masterConsolidated[file.name] = {
                content: content,
                metadata: { ...fileMetadata, type: 'masterConsolidated' }
              };
            }
          }
          
          console.log(`[GoogleDrive] Processed ${file.name} from ${folderName}`);
        } catch (error) {
          console.error(`Error processing document ${file.name}:`, error);
        }
      }
    }
    
    console.log(`[GoogleDrive] Successfully structured documents:`, {
      policies: Object.keys(structuredDocs.policies).length,
      knowledgeGraphs: Object.keys(structuredDocs.knowledgeGraphs).length,
      vectorChunks: Object.keys(structuredDocs.vectorChunks).length,
      enforcementWorkflows: Object.keys(structuredDocs.enforcementWorkflows).length,
      masterConsolidated: Object.keys(structuredDocs.masterConsolidated).length
    });
    
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
 * Creates the XrefHub_Policy_Analysis folder structure in Google Drive.
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

    // First, create the main XrefHub_Policy_Analysis folder
    const mainFolderResponse = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'XrefHub_Policy_Analysis',
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentFolderId]
      })
    });

    if (!mainFolderResponse.ok) {
      throw new Error(`Failed to create main folder. Status: ${mainFolderResponse.status}`);
    }

    const mainFolderData = await mainFolderResponse.json();
    const mainFolderId = mainFolderData.id;
    console.log(`Created main folder: XrefHub_Policy_Analysis (${mainFolderId})`);

    const folders = {
      policyDocuments: null,
      jsonExtracts: null,
      vectorChunks: null,
      knowledgeGraphs: null,
      enforcementWorkflows: null,
      masterConsolidated: null,
      updateTemplates: null
    };

    // Create the numbered subfolders
    const subfolders = [
      { name: '01_Policy_Documents', key: 'policyDocuments' },
      { name: '02_JSON_Extracts', key: 'jsonExtracts' },
      { name: '03_Vector_Chunks', key: 'vectorChunks' },
      { name: '04_Knowledge_Graphs', key: 'knowledgeGraphs' },
      { name: '05_Enforcement_Workflows', key: 'enforcementWorkflows' },
      { name: '06_Master_Consolidated', key: 'masterConsolidated' },
      { name: '07_Update_Templates', key: 'updateTemplates' }
    ];

    for (const folder of subfolders) {
      const response = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: folder.name,
          mimeType: 'application/vnd.google-apps.folder',
          parents: [mainFolderId]
        })
      });

      if (response.ok) {
        const folderData = await response.json();
        folders[folder.key] = folderData.id;
        console.log(`Created ${folder.name}: ${folderData.id}`);
      } else {
        console.error(`Failed to create ${folder.name}: ${response.status}`);
      }
    }

    console.log('[GoogleDrive] Created XrefHub_Policy_Analysis folder structure');
    return {
      mainFolder: mainFolderId,
      subfolders: folders
    };
  } catch (error) {
    console.error('Error creating XrefHub_Policy_Analysis structure:', error);
    throw error;
  }
} 