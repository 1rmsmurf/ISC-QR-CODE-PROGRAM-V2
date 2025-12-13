// pages/index.js
import Head from 'next/head';
import Link from 'next/link';

export default function Home() {
  return (
    <>
      <Head>
        <title>ISC Media Upload System</title>
        <meta name="description" content="Upload and categorize event media for Illinois Solar Car" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="min-h-screen flex flex-col items-center justify-center p-4">
        {/* Decorative background elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-64 h-64 bg-isc-gold/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-isc-orange/10 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 text-center max-w-2xl mx-auto animate-slide-up">
          {/* Logo/Header */}
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-gradient-to-br from-isc-gold to-isc-orange mb-6 shadow-2xl">
              <svg className="w-14 h-14 text-isc-navy" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
            <h1 className="font-display text-5xl md:text-6xl font-extrabold text-white mb-4">
              ISC <span className="text-isc-gold">Media</span>
            </h1>
            <p className="text-xl text-gray-300 font-body">
              Upload & Categorize Event Photos and Videos
            </p>
          </div>

          {/* Info Card */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 mb-8 border border-white/20">
            <h2 className="font-display text-2xl font-bold text-white mb-4">
              How It Works
            </h2>
            <div className="grid md:grid-cols-3 gap-6 text-left">
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-isc-gold/20 flex items-center justify-center mb-3">
                  <span className="text-isc-gold font-bold text-xl">1</span>
                </div>
                <h3 className="text-white font-semibold mb-1">Scan QR Code</h3>
                <p className="text-gray-400 text-sm">Find the event QR code at your location</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-isc-gold/20 flex items-center justify-center mb-3">
                  <span className="text-isc-gold font-bold text-xl">2</span>
                </div>
                <h3 className="text-white font-semibold mb-1">Upload Media</h3>
                <p className="text-gray-400 text-sm">Select photos or videos from your device</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-isc-gold/20 flex items-center justify-center mb-3">
                  <span className="text-isc-gold font-bold text-xl">3</span>
                </div>
                <h3 className="text-white font-semibold mb-1">Categorize</h3>
                <p className="text-gray-400 text-sm">Tag your uploads for easy organization</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/admin"
              className="px-8 py-4 bg-gradient-to-r from-isc-gold to-isc-orange text-isc-navy font-display font-bold rounded-xl hover:shadow-lg hover:shadow-isc-gold/30 transition-all duration-300 transform hover:scale-105"
            >
              Admin Dashboard
            </Link>
            <Link 
              href="/upload/demo-event"
              className="px-8 py-4 bg-white/10 text-white font-display font-semibold rounded-xl border border-white/30 hover:bg-white/20 transition-all duration-300"
            >
              Try Demo Upload
            </Link>
          </div>

          {/* Footer */}
          <p className="mt-12 text-gray-500 text-sm">
            Built for Illinois Solar Car Marketing Team
          </p>
        </div>
      </main>
    </>
  );
}
