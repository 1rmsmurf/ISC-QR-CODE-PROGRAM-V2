// pages/api/upload.js
import { put } from '@vercel/blob';
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

    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const originalName = file.originalFilename || 'upload';
    const ext = path.extname(originalName);
    const baseName = path.basename(originalName, ext);
    const fileName = `${event.name.replace(/\s+/g, '-')}/${category}/${baseName}_${timestamp}${ext}`;

    // Read file and upload to Vercel Blob
    const fileBuffer = fs.readFileSync(file.filepath);
    
    const blob = await put(fileName, fileBuffer, {
      access: 'public',
      contentType: file.mimetype,
    });

    // Clean up temp file
    if (fs.existsSync(file.filepath)) {
      fs.unlinkSync(file.filepath);
    }

    // Increment upload count
    incrementUploadCount(eventId);

    return res.status(200).json({
      success: true,
      file: {
        url: blob.url,
        name: fileName,
        size: file.size,
      },
    });

  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ error: 'Upload failed', details: error.message });
  }
}
