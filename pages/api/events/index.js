// pages/api/events/index.js
import { getAllEvents, createEvent } from '../../../lib/events';

export default function handler(req, res) {
  if (req.method === 'GET') {
    const events = getAllEvents();
    return res.status(200).json(events);
  }
  
  if (req.method === 'POST') {
    const { name, date, description } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Event name is required' });
    }
    
    const newEvent = createEvent({ name, date, description });
    return res.status(201).json(newEvent);
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
}
