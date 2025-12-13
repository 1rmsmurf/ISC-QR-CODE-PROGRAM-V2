// pages/admin/index.js
import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function AdminDashboard() {
  const [events, setEvents] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(null);
  const [newEvent, setNewEvent] = useState({ name: '', date: '', description: '' });
  const [loading, setLoading] = useState(true);
  const [qrCode, setQrCode] = useState('');

  // Fetch events
  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await fetch('/api/events');
      const data = await res.json();
      setEvents(data);
    } catch (error) {
      console.error('Failed to fetch events:', error);
    } finally {
      setLoading(false);
    }
  };

  // Create new event
  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEvent),
      });
      
      if (res.ok) {
        setShowCreateModal(false);
        setNewEvent({ name: '', date: '', description: '' });
        fetchEvents();
      }
    } catch (error) {
      console.error('Failed to create event:', error);
    }
  };

  // Generate QR code
  const handleShowQR = async (event) => {
    try {
      const res = await fetch(`/api/qr/${event.id}`);
      const data = await res.json();
      setQrCode(data.qrCode);
      setShowQRModal(event);
    } catch (error) {
      console.error('Failed to generate QR code:', error);
    }
  };

  // Delete event
  const handleDeleteEvent = async (eventId) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    
    try {
      await fetch(`/api/events/${eventId}`, { method: 'DELETE' });
      fetchEvents();
    } catch (error) {
      console.error('Failed to delete event:', error);
    }
  };

  return (
    <>
      <Head>
        <title>Admin Dashboard | ISC Media</title>
      </Head>

      <main className="min-h-screen p-4 md:p-8">
        {/* Background */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-64 h-64 bg-isc-gold/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-isc-orange/10 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
            <div>
              <Link href="/" className="text-isc-gold hover:text-isc-orange transition-colors text-sm mb-2 inline-block">
                ← Back to Home
              </Link>
              <h1 className="font-display text-3xl md:text-4xl font-bold text-white">
                Admin Dashboard
              </h1>
              <p className="text-gray-400 mt-1">Manage events and generate QR codes</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-isc-gold to-isc-orange text-isc-navy font-display font-bold rounded-xl hover:shadow-lg hover:shadow-isc-gold/30 transition-all transform hover:scale-105"
            >
              + Create Event
            </button>
          </div>

          {/* Events Grid */}
          {loading ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 border-4 border-isc-gold border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
          ) : events.length === 0 ? (
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-12 text-center border border-white/20">
              <svg className="w-16 h-16 text-gray-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h3 className="text-xl font-semibold text-white mb-2">No Events Yet</h3>
              <p className="text-gray-400 mb-6">Create your first event to get started</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-3 bg-isc-gold text-isc-navy font-semibold rounded-xl hover:bg-isc-orange transition-colors"
              >
                Create Event
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:border-isc-gold/50 transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-display text-xl font-bold text-white">{event.name}</h3>
                      <p className="text-gray-400 text-sm">
                        {event.date && new Date(event.date).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-isc-gold/20 text-isc-gold rounded-full text-sm font-semibold">
                      {event.uploadCount || 0} uploads
                    </span>
                  </div>
                  
                  {event.description && (
                    <p className="text-gray-300 text-sm mb-4 line-clamp-2">{event.description}</p>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleShowQR(event)}
                      className="flex-1 py-2 px-4 bg-isc-gold/20 text-isc-gold rounded-lg font-semibold hover:bg-isc-gold/30 transition-colors flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M3 11h8V3H3v8zm2-6h4v4H5V5zM3 21h8v-8H3v8zm2-6h4v4H5v-4zM13 3v8h8V3h-8zm6 6h-4V5h4v4zM13 13h2v2h-2zM15 15h2v2h-2zM13 17h2v2h-2zM17 13h2v2h-2zM19 15h2v2h-2zM17 17h2v2h-2zM15 19h2v2h-2zM19 19h2v2h-2z"/>
                      </svg>
                      QR Code
                    </button>
                    <Link
                      href={`/upload/${event.id}`}
                      className="py-2 px-4 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
                    >
                      Preview
                    </Link>
                    <button
                      onClick={() => handleDeleteEvent(event.id)}
                      className="py-2 px-3 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Create Event Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-isc-navy border border-white/20 rounded-2xl p-6 w-full max-w-md animate-slide-up">
              <h2 className="font-display text-2xl font-bold text-white mb-6">Create New Event</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-300 text-sm mb-2">Event Name</label>
                  <input
                    type="text"
                    value={newEvent.name}
                    onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-isc-gold"
                    placeholder="e.g., FSGP 2024"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm mb-2">Date</label>
                  <input
                    type="date"
                    value={newEvent.date}
                    onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-isc-gold"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm mb-2">Description (optional)</label>
                  <textarea
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-isc-gold resize-none"
                    rows={3}
                    placeholder="Brief description of the event..."
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-3 bg-white/10 text-white rounded-xl font-semibold hover:bg-white/20 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateEvent}
                  disabled={!newEvent.name}
                  className="flex-1 py-3 bg-gradient-to-r from-isc-gold to-isc-orange text-isc-navy rounded-xl font-bold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Create Event
                </button>
              </div>
            </div>
          </div>
        )}

        {/* QR Code Modal */}
        {showQRModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-isc-navy border border-white/20 rounded-2xl p-6 w-full max-w-md animate-slide-up text-center">
              <h2 className="font-display text-2xl font-bold text-white mb-2">{showQRModal.name}</h2>
              <p className="text-gray-400 mb-6">Scan to upload media</p>
              
              <div className="bg-white rounded-xl p-4 inline-block mb-6">
                {qrCode ? (
                  <img src={qrCode} alt="QR Code" className="w-64 h-64" />
                ) : (
                  <div className="w-64 h-64 flex items-center justify-center">
                    <div className="w-8 h-8 border-4 border-isc-navy border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>

              <p className="text-gray-400 text-sm mb-6">
                Upload URL: <br />
                <code className="text-isc-gold break-all">
                  {typeof window !== 'undefined' ? `${window.location.origin}/upload/${showQRModal.id}` : ''}
                </code>
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowQRModal(null)}
                  className="flex-1 py-3 bg-white/10 text-white rounded-xl font-semibold hover:bg-white/20 transition-colors"
                >
                  Close
                </button>
                <a
                  href={qrCode}
                  download={`${showQRModal.name}-qr.png`}
                  className="flex-1 py-3 bg-gradient-to-r from-isc-gold to-isc-orange text-isc-navy rounded-xl font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                  </svg>
                  Download
                </a>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
