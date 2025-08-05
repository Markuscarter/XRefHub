// Test script to check and create the XrefHub_Policy_Analysis folder structure
// Run this in the extension console to create the folders

async function testFolderCreation() {
  try {
    console.log('🔍 Checking current Google Drive setup...');
    
    // Import the function (this would need to be done in the extension context)
    if (typeof createRecommendedStructure === 'undefined') {
      console.error('❌ createRecommendedStructure function not available');
      console.log('💡 Make sure you\'re running this in the extension context');
      return;
    }
    
    console.log('📁 Creating XrefHub_Policy_Analysis folder structure...');
    const result = await createRecommendedStructure();
    
    console.log('✅ Folder structure created successfully!');
    console.log('📋 Created folders:', result);
    
    // Test fetching structured documents
    console.log('🔍 Testing document fetching...');
    const documents = await fetchStructuredDocuments('all');
    
    console.log('📊 Document summary:', {
      policies: Object.keys(documents.policies).length,
      knowledgeGraphs: Object.keys(documents.knowledgeGraphs).length,
      vectorChunks: Object.keys(documents.vectorChunks).length,
      enforcementWorkflows: Object.keys(documents.enforcementWorkflows).length,
      masterConsolidated: Object.keys(documents.masterConsolidated).length
    });
    
    console.log('🎯 Ready for file uploads!');
    console.log('📝 Next steps:');
    console.log('1. Upload policy documents to 01_Policy_Documents/');
    console.log('2. Create JSON extracts in 02_JSON_Extracts/');
    console.log('3. Generate vector chunks in 03_Vector_Chunks/');
    console.log('4. Upload knowledge graphs to 04_Knowledge_Graphs/');
    console.log('5. Create workflows in 05_Enforcement_Workflows/');
    console.log('6. Build master files in 06_Master_Consolidated/');
    console.log('7. Set up templates in 07_Update_Templates/');
    
  } catch (error) {
    console.error('❌ Error creating folder structure:', error);
    console.log('💡 Make sure you have:');
    console.log('- Google Drive API access configured');
    console.log('- Valid folder ID in settings');
    console.log('- Proper authentication');
  }
}

// Function to check current folder state
async function checkCurrentState() {
  try {
    console.log('🔍 Checking current Google Drive state...');
    
    const settings = await chrome.storage.local.get(['settings']);
    const folderId = settings?.settings?.googleFolderId;
    
    if (!folderId) {
      console.log('❌ No Google Drive folder ID configured');
      console.log('💡 Please configure your Google Drive folder ID in settings');
      return;
    }
    
    console.log('✅ Google Drive folder ID found:', folderId);
    
    // Test if we can access the folder
    const token = await getAuthToken();
    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${folderId}?fields=id,name`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.ok) {
      const folderData = await response.json();
      console.log('✅ Can access Google Drive folder:', folderData.name);
      
      // Check for existing XrefHub_Policy_Analysis folder
      const searchResponse = await fetch(`https://www.googleapis.com/drive/v3/files?q=name='XrefHub_Policy_Analysis' and '${folderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false&fields=files(id,name)`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        if (searchData.files && searchData.files.length > 0) {
          console.log('✅ XrefHub_Policy_Analysis folder already exists:', searchData.files[0].id);
          
          // Check subfolders
          const subfoldersResponse = await fetch(`https://www.googleapis.com/drive/v3/files?q='${searchData.files[0].id}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false&fields=files(id,name)&orderBy=name`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (subfoldersResponse.ok) {
            const subfoldersData = await subfoldersResponse.json();
            console.log('📁 Existing subfolders:', subfoldersData.files.map(f => f.name));
          }
        } else {
          console.log('❌ XrefHub_Policy_Analysis folder not found');
          console.log('💡 Run testFolderCreation() to create it');
        }
      }
    } else {
      console.log('❌ Cannot access Google Drive folder');
      console.log('💡 Check your authentication and permissions');
    }
    
  } catch (error) {
    console.error('❌ Error checking current state:', error);
  }
}

// Export functions for use in extension console
window.testFolderCreation = testFolderCreation;
window.checkCurrentState = checkCurrentState;

console.log('🔧 Folder creation test script loaded');
console.log('📝 Available functions:');
console.log('- checkCurrentState() - Check current Google Drive setup');
console.log('- testFolderCreation() - Create the folder structure'); 