// lib/events.js
// Simple in-memory event store for MVP
// In production, replace with database (MongoDB, PostgreSQL, etc.)

const { v4: uuidv4 } = require('uuid');

// In-memory store (resets on server restart)
// For persistence, this would connect to a database
let events = [
  {
    id: 'demo-event',
    name: 'Demo Event',
    date: '2024-01-15',
    description: 'Test event for development',
    categories: ['team-photos', 'car-shots', 'behind-the-scenes'],
    boxFolders: {
      'team-photos': '0',
      'car-shots': '0',
      'behind-the-scenes': '0',
    },
    createdAt: new Date().toISOString(),
    uploadCount: 0,
  },
];

function getAllEvents() {
  return events;
}

function getEventById(id) {
  return events.find(e => e.id === id);
}

function createEvent(eventData) {
  const newEvent = {
    id: uuidv4(),
    ...eventData,
    categories: ['team-photos', 'car-shots', 'behind-the-scenes'],
    boxFolders: eventData.boxFolders || {},
    createdAt: new Date().toISOString(),
    uploadCount: 0,
  };
  events.push(newEvent);
  return newEvent;
}

function updateEvent(id, updates) {
  const index = events.findIndex(e => e.id === id);
  if (index !== -1) {
    events[index] = { ...events[index], ...updates };
    return events[index];
  }
  return null;
}

function incrementUploadCount(id) {
  const event = getEventById(id);
  if (event) {
    event.uploadCount += 1;
    return event.uploadCount;
  }
  return 0;
}

function deleteEvent(id) {
  const index = events.findIndex(e => e.id === id);
  if (index !== -1) {
    events.splice(index, 1);
    return true;
  }
  return false;
}

module.exports = {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  incrementUploadCount,
  deleteEvent,
};
