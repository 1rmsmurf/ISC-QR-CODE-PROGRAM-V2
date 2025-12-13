# ISC Media Upload System

A QR-code based media upload and categorization system for Illinois Solar Car.

## Features

- 📱 **QR Code Access**: Each event gets a unique QR code for easy mobile uploads
- 📤 **Simple Upload Portal**: Drag-and-drop interface for photos and videos
- 🏷️ **Category Tagging**: Organize uploads into Team Photos, Car Shots, and Behind the Scenes
- 📦 **BOX Integration**: Files automatically upload to your BOX storage
- 👥 **No Login Required**: Anyone with the QR code can upload

## Quick Start

### 1. Install Dependencies

```bash
cd isc-media-upload
npm install
```

### 2. Configure Environment

Edit `.env.local` with your settings:

```env
# BOX Developer Token (expires every 60 minutes)
BOX_DEVELOPER_TOKEN=your_token_here

# Base URL (update when deployed)
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 3. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to see the app.

## Deployment to Vercel (Free)

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/isc-media-upload.git
git push -u origin main
```

### 2. Deploy on Vercel

1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click "Import Project"
4. Select your repository
5. Add environment variables:
   - `BOX_DEVELOPER_TOKEN`
   - `NEXT_PUBLIC_BASE_URL` (will be your Vercel URL)
6. Click "Deploy"

### 3. Update Base URL

After deployment, update `NEXT_PUBLIC_BASE_URL` in Vercel's environment variables to your actual domain (e.g., `https://isc-media.vercel.app`).

## BOX Setup

### Developer Token (Testing Only)

1. Go to [BOX Developer Console](https://app.box.com/developers/console)
2. Create a new app or select existing
3. Go to Configuration > Developer Token
4. Generate and copy the token
5. Add to `.env.local`

**Note**: Developer tokens expire after 60 minutes. For production, implement OAuth 2.0.

### Folder Structure (Optional)

For automatic folder organization:

1. Create folders in BOX for each category
2. Get folder IDs from the BOX URL
3. Add to `.env.local`:

```env
BOX_FOLDER_TEAM_PHOTOS=123456789
BOX_FOLDER_CAR_SHOTS=123456790
BOX_FOLDER_BTS=123456791
```

## Usage

### Creating Events

1. Go to Admin Dashboard (`/admin`)
2. Click "Create Event"
3. Enter event name and date
4. Click "Create Event"

### Generating QR Codes

1. Find your event in the Admin Dashboard
2. Click "QR Code" button
3. Download or print the QR code
4. Display at your event location

### Uploading Media

1. Scan the QR code (or visit the upload URL)
2. Select a category
3. Choose files or drag-and-drop
4. Click "Upload"

## Tech Stack

- **Framework**: Next.js 14
- **Styling**: Tailwind CSS
- **Storage**: BOX API
- **QR Codes**: qrcode library
- **Hosting**: Vercel (recommended)

## Project Structure

```
isc-media-upload/
├── pages/
│   ├── api/
│   │   ├── events/          # Event CRUD endpoints
│   │   ├── qr/              # QR code generation
│   │   └── upload.js        # File upload handler
│   ├── admin/               # Admin dashboard
│   ├── upload/              # Upload portal
│   └── index.js             # Home page
├── lib/
│   ├── box.js               # BOX API helpers
│   └── events.js            # Event data store
├── styles/
│   └── globals.css          # Global styles
└── public/                  # Static assets
```

## Customization

### Categories

Edit the `CATEGORIES` array in `pages/upload/[eventId].js`:

```javascript
const CATEGORIES = [
  { id: 'team-photos', label: 'Team Photos', icon: '👥' },
  { id: 'car-shots', label: 'Car Shots', icon: '🚗' },
  { id: 'behind-the-scenes', label: 'Behind the Scenes', icon: '🎬' },
  // Add more categories here
];
```

### Colors

Edit `tailwind.config.js` to change the color scheme:

```javascript
colors: {
  'isc-gold': '#F2A900',
  'isc-navy': '#13294B',
  'isc-orange': '#E84A27',
}
```

## Troubleshooting

### "BOX authentication failed"

- Developer token has expired (60 minute limit)
- Generate a new token from BOX Developer Console
- Update `BOX_DEVELOPER_TOKEN` in environment variables

### Files not appearing in BOX

- Check folder permissions in BOX
- Verify folder IDs are correct
- Check Vercel function logs for errors

### QR code not working

- Ensure `NEXT_PUBLIC_BASE_URL` is set correctly
- Check that the event exists
- Try the upload URL directly in a browser

## Future Improvements

- [ ] Implement BOX OAuth 2.0 for production
- [ ] Add database persistence (MongoDB/PostgreSQL)
- [ ] Add user authentication for admin
- [ ] Implement image compression
- [ ] Add bulk upload progress
- [ ] Create media gallery view

## Support

For issues or questions, contact the ISC Marketing team.
