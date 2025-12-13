// pages/upload/[eventId].js
import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

const CATEGORIES = [
  { id: 'team-photos', label: 'Team Photos', icon: '👥', description: 'Group shots, individual portraits' },
  { id: 'car-shots', label: 'Car Shots', icon: '🚗', description: 'Solar car photos, technical details' },
  { id: 'behind-the-scenes', label: 'Behind the Scenes', icon: '🎬', description: 'Candid moments, work in progress' },
];

export default function UploadPage() {
  const router = useRouter();
  const { eventId } = router.query;
  
  const [event, setEvent] = useState(null);
  const [files, setFiles] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploadComplete, setUploadComplete] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');

  // Fetch event details
  useEffect(() => {
    if (eventId) {
      fetch(`/api/events/${eventId}`)
        .then(res => res.json())
        .then(data => {
          if (data.error) {
            setError('Event not found');
          } else {
            setEvent(data);
          }
        })
        .catch(() => setError('Failed to load event'));
    }
  }, [eventId]);

  // Handle drag events
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  // Handle drop
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      file => file.type.startsWith('image/') || file.type.startsWith('video/')
    );
    
    if (droppedFiles.length > 0) {
      setFiles(prev => [...prev, ...droppedFiles]);
    }
  }, []);

  // Handle file input change
  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(prev => [...prev, ...selectedFiles]);
  };

  // Remove file from list
  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Handle upload
  const handleUpload = async () => {
    if (files.length === 0 || !selectedCategory) {
      setError('Please select files and a category');
      return;
    }

    setUploading(true);
    setError('');
    
    const results = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', selectedCategory);
      formData.append('eventId', eventId);

      try {
        setUploadProgress(prev => ({ ...prev, [i]: 'uploading' }));
        
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        const result = await response.json();
        
        if (response.ok) {
          setUploadProgress(prev => ({ ...prev, [i]: 'complete' }));
          results.push({ success: true, file: file.name });
        } else {
          setUploadProgress(prev => ({ ...prev, [i]: 'error' }));
          results.push({ success: false, file: file.name, error: result.error });
        }
      } catch (err) {
        setUploadProgress(prev => ({ ...prev, [i]: 'error' }));
        results.push({ success: false, file: file.name, error: 'Upload failed' });
      }
    }

    setUploading(false);
    
    const successCount = results.filter(r => r.success).length;
    if (successCount === files.length) {
      setUploadComplete(true);
    } else if (successCount > 0) {
      setError(`${successCount} of ${files.length} files uploaded successfully`);
    } else {
      setError('Upload failed. Please try again.');
    }
  };

  // Reset for new upload
  const resetUpload = () => {
    setFiles([]);
    setSelectedCategory('');
    setUploadProgress({});
    setUploadComplete(false);
    setError('');
  };

  // Format file size
  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (error === 'Event not found') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Event Not Found</h1>
          <p className="text-gray-400">This upload link may be invalid or expired.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{event?.name || 'Upload'} | ISC Media</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>

      <main className="min-h-screen p-4 md:p-8">
        {/* Background */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-isc-gold/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-isc-orange/10 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8 animate-slide-up">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br from-isc-gold to-isc-orange mb-4">
              <svg className="w-8 h-8 text-isc-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-white mb-2">
              {event?.name || 'Loading...'}
            </h1>
            <p className="text-gray-400">
              {event?.date && new Date(event.date).toLocaleDateString('en-US', { 
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
              })}
            </p>
          </div>

          {uploadComplete ? (
            /* Success State */
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center animate-slide-up border border-white/20">
              <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="font-display text-2xl font-bold text-white mb-2">Upload Complete!</h2>
              <p className="text-gray-400 mb-6">
                {files.length} file{files.length !== 1 ? 's' : ''} uploaded successfully
              </p>
              <button
                onClick={resetUpload}
                className="px-6 py-3 bg-gradient-to-r from-isc-gold to-isc-orange text-isc-navy font-display font-bold rounded-xl hover:shadow-lg transition-all"
              >
                Upload More
              </button>
            </div>
          ) : (
            /* Upload Form */
            <div className="space-y-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              {/* Category Selection */}
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <h2 className="font-display text-lg font-semibold text-white mb-4">
                  1. Select Category
                </h2>
                <div className="grid gap-3">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`flex items-center p-4 rounded-xl border-2 transition-all duration-200 ${
                        selectedCategory === cat.id
                          ? 'border-isc-gold bg-isc-gold/20 text-white'
                          : 'border-white/20 bg-white/5 text-gray-300 hover:border-white/40'
                      }`}
                    >
                      <span className="text-2xl mr-3">{cat.icon}</span>
                      <div className="text-left">
                        <div className="font-semibold">{cat.label}</div>
                        <div className="text-sm opacity-70">{cat.description}</div>
                      </div>
                      {selectedCategory === cat.id && (
                        <svg className="w-6 h-6 ml-auto text-isc-gold" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* File Upload */}
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <h2 className="font-display text-lg font-semibold text-white mb-4">
                  2. Upload Files
                </h2>
                
                {/* Drop Zone */}
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={`dropzone relative border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                    dragActive
                      ? 'active border-isc-gold bg-isc-gold/10'
                      : 'border-white/30 hover:border-white/50'
                  }`}
                >
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="pointer-events-none">
                    <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-white font-semibold mb-1">
                      Drop files here or tap to browse
                    </p>
                    <p className="text-gray-400 text-sm">
                      Photos and videos up to 50MB each
                    </p>
                  </div>
                </div>

                {/* File List */}
                {files.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {files.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center p-3 bg-white/5 rounded-lg"
                      >
                        <div className="w-10 h-10 rounded bg-white/10 flex items-center justify-center mr-3">
                          {file.type.startsWith('video/') ? (
                            <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"/>
                            </svg>
                          ) : (
                            <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                            </svg>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm truncate">{file.name}</p>
                          <p className="text-gray-500 text-xs">{formatSize(file.size)}</p>
                        </div>
                        {uploadProgress[index] === 'uploading' ? (
                          <div className="w-6 h-6 border-2 border-isc-gold border-t-transparent rounded-full animate-spin"></div>
                        ) : uploadProgress[index] === 'complete' ? (
                          <svg className="w-6 h-6 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                          </svg>
                        ) : uploadProgress[index] === 'error' ? (
                          <svg className="w-6 h-6 text-red-400" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                          </svg>
                        ) : (
                          <button
                            onClick={() => removeFile(index)}
                            className="p-1 hover:bg-white/10 rounded"
                          >
                            <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 text-red-200 text-center">
                  {error}
                </div>
              )}

              {/* Upload Button */}
              <button
                onClick={handleUpload}
                disabled={uploading || files.length === 0 || !selectedCategory}
                className={`w-full py-4 rounded-xl font-display font-bold text-lg transition-all ${
                  uploading || files.length === 0 || !selectedCategory
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-isc-gold to-isc-orange text-isc-navy hover:shadow-lg hover:shadow-isc-gold/30 transform hover:scale-[1.02]'
                }`}
              >
                {uploading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Uploading...
                  </span>
                ) : (
                  `Upload ${files.length} File${files.length !== 1 ? 's' : ''}`
                )}
              </button>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
