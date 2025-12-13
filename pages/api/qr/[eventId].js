// pages/api/qr/[eventId].js
import QRCode from 'qrcode';
import { getEventById } from '../../../lib/events';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { eventId } = req.query;
  const event = getEventById(eventId);

  if (!event) {
    return res.status(404).json({ error: 'Event not found' });
  }

  try {
    // Generate upload URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const uploadUrl = `${baseUrl}/upload/${eventId}`;

    // Generate QR code as data URL
    const qrCode = await QRCode.toDataURL(uploadUrl, {
      width: 512,
      margin: 2,
      color: {
        dark: '#13294B',  // ISC Navy
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'H',
    });

    return res.status(200).json({
      qrCode,
      uploadUrl,
      eventName: event.name,
    });
  } catch (error) {
    console.error('QR code generation error:', error);
    return res.status(500).json({ error: 'Failed to generate QR code' });
  }
}
