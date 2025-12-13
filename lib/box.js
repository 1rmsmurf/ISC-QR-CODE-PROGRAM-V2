// lib/box.js
// BOX API integration for file uploads

const BoxSDK = require('box-node-sdk');

// Initialize BOX client with developer token
// Note: Developer tokens expire after 60 minutes
// For production, implement OAuth 2.0 flow
function getBoxClient() {
  const sdk = new BoxSDK({
    clientID: process.env.BOX_CLIENT_ID || 'dummy',
    clientSecret: process.env.BOX_CLIENT_SECRET || 'dummy',
  });
  
  return sdk.getBasicClient(process.env.BOX_DEVELOPER_TOKEN);
}

// Category to folder mapping
// You'll need to create these folders in BOX and update the IDs
const CATEGORY_FOLDERS = {
  'team-photos': process.env.BOX_FOLDER_TEAM_PHOTOS || '0',
  'car-shots': process.env.BOX_FOLDER_CAR_SHOTS || '0',
  'behind-the-scenes': process.env.BOX_FOLDER_BTS || '0',
};

// Create event folder structure in BOX
async function createEventFolders(eventName, parentFolderId = '0') {
  const client = getBoxClient();
  
  try {
    // Create main event folder
    const eventFolder = await client.folders.create(parentFolderId, eventName);
    
    // Create category subfolders
    const categoryFolders = {};
    for (const [category, _] of Object.entries(CATEGORY_FOLDERS)) {
      const folderName = category.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      const folder = await client.folders.create(eventFolder.id, folderName);
      categoryFolders[category] = folder.id;
    }
    
    return {
      eventFolderId: eventFolder.id,
      categoryFolders,
    };
  } catch (error) {
    console.error('Error creating BOX folders:', error);
    throw error;
  }
}

// Upload file to BOX
async function uploadToBox(fileBuffer, fileName, folderId) {
  const client = getBoxClient();
  
  try {
    const stream = require('stream');
    const bufferStream = new stream.PassThrough();
    bufferStream.end(fileBuffer);
    
    const file = await client.files.uploadFile(folderId, fileName, bufferStream);
    return file.entries[0];
  } catch (error) {
    console.error('Error uploading to BOX:', error);
    throw error;
  }
}

// Get folder contents
async function getFolderContents(folderId) {
  const client = getBoxClient();
  
  try {
    const items = await client.folders.getItems(folderId, { limit: 100 });
    return items.entries;
  } catch (error) {
    console.error('Error getting folder contents:', error);
    throw error;
  }
}

module.exports = {
  getBoxClient,
  createEventFolders,
  uploadToBox,
  getFolderContents,
  CATEGORY_FOLDERS,
};
