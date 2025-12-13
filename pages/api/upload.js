// pages/api/upload.js
import { IncomingForm } from 'formidable';
import fs from 'fs';
import path from 'path';
import { getEventById, incrementUploadCount } from '../../lib/events';

// Disable body parser for file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

// Parse form data
const parseForm = (req) => {
  return new Promise((resolve, reject) => {
    const form = new IncomingForm({
      maxFileSize: 50 * 1024 * 1024, // 50MB
      keepExtensions: true,
    });

    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      resolve({ fields, files });
    });
  });
};

// Upload to BOX
const uploadToBox = async (filePath, fileName, folderId) => {
  const BoxSDK = require('box-node-sdk');
  
  const sdk = new BoxSDK({
    clientID: 'dummy',
    clientSecret: 'dummy',
  });
  
  const client = sdk.getBasicClient(process.env.BOX_DEVELOPER_TOKEN);
  
  const stream = fs.createReadStream(filePath);
  
  try {
    const file = await client.files.uploadFile(folderId, fileName, stream);
    return file.entries[0];
  } catch (error) {
    // If file exists, upload new version
    if (error.statusCode === 409) {
      const existingFileId = error.context_info?.conflicts?.id;
      if (existingFileId) {
        const newVersion = await client.files.uploadNewFileVersion(existingFileId, stream);
        return newVersion.entries[0];
      }
    }
    throw error;
  }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { fields, files } = await parseForm(req);
    
    // Handle both array and single value formats from formidable
    const category = Array.isArray(fields.category) ? fields.category[0] : fields.category;
    const eventId = Array.isArray(fields.eventId) ? fields.eventId[0] : fields.eventId;
    const file = Array.isArray(files.file) ? files.file[0] : files.file;

    if (!file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    if (!category) {
      return res.status(400).json({ error: 'No category provided' });
    }

    if (!eventId) {
      return res.status(400).json({ error: 'No event ID provided' });
    }

    const event = getEventById(eventId);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Get the folder ID for this category
    // Default to root folder (0) if not configured
    const folderId = event.boxFolders?.[category] || '0';

    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const originalName = file.originalFilename || 'upload';
    const ext = path.extname(originalName);
    const baseName = path.basename(originalName, ext);
    const fileName = `${event.name}_${category}_${baseName}_${timestamp}${ext}`;

    // Upload to BOX
    let boxFile;
    try {
      boxFile = await uploadToBox(file.filepath, fileName, folderId);
      
      // Clean up temp file
      fs.unlinkSync(file.filepath);
      
      // Increment upload count
      incrementUploadCount(eventId);

      return res.status(200).json({
        success: true,
        file: {
          id: boxFile.id,
          name: boxFile.name,
          size: boxFile.size,
        },
      });
    } catch (boxError) {
      console.error('BOX upload error:', boxError);
      
      // Clean up temp file
      if (fs.existsSync(file.filepath)) {
        fs.unlinkSync(file.filepath);
      }

      // Check for common BOX errors
      if (boxError.statusCode === 401) {
        return res.status(500).json({ 
          error: 'BOX authentication failed. Developer token may have expired.',
          details: 'Please refresh the developer token in BOX and update .env.local'
        });
      }

      return res.status(500).json({ 
        error: 'Failed to upload to BOX',
        details: boxError.message
      });
    }
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ error: 'Upload failed', details: error.message });
  }
}
