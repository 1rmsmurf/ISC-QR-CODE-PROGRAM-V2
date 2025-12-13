// pages/api/events/[eventId].js
import { getEventById, updateEvent, deleteEvent } from '../../../lib/events';

export default function handler(req, res) {
  const { eventId } = req.query;
  
  if (req.method === 'GET') {
    const event = getEventById(eventId);
    
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    return res.status(200).json(event);
  }
  
  if (req.method === 'PUT') {
    const updated = updateEvent(eventId, req.body);
    
    if (!updated) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    return res.status(200).json(updated);
  }
  
  if (req.method === 'DELETE') {
    const deleted = deleteEvent(eventId);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    return res.status(200).json({ success: true });
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
}
