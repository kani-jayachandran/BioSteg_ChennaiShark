# VaultX Kiro - Installation Guide

## Prerequisites

Before you begin, ensure you have the following installed:

1. **Node.js** (v16 or higher)
   - Download from: https://nodejs.org/
   - Verify: `node --version`

2. **MongoDB** (v4.4 or higher)
   - Download from: https://www.mongodb.com/try/download/community
   - Verify: `mongod --version`

3. **npm** (comes with Node.js)
   - Verify: `npm --version`

## Installation Steps

### Step 1: Install Dependencies

Run the setup script:

```bash
setup.bat
```

Or manually:

```bash
# Install root dependencies
npm install

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
cd ..
```

### Step 2: Configure Environment

The `.env` file has been created in the `server` directory with default values. You can modify it if needed:

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/vaultx
JWT_SECRET=vaultx-super-secret-jwt-key-change-in-production-2024
NODE_ENV=development
MAX_FILE_SIZE=10485760
```

### Step 3: Start MongoDB

Open a new terminal and start MongoDB:

```bash
mongod
```

Or if MongoDB is installed as a service, it should start automatically.

### Step 4: Start the Application

Run the start script:

```bash
start.bat
```

Or manually:

```bash
npm run dev
```

This will start:
- Backend server on http://localhost:5000
- Frontend application on http://localhost:3000

## First Time Usage

1. **Open your browser** and navigate to http://localhost:3000

2. **Register a new account:**
   - Click "Register"
   - Fill in your details
   - Capture your face using webcam
   - Set a 4-digit fingerprint PIN (default: 1234)
   - Click "Register"

3. **Upload a document:**
   - Go to "Upload Document"
   - Select a file (max 10MB)
   - Set an expiry time
   - Click "Upload & Secure Document"

4. **Extract a document:**
   - Go to "Secure Vault"
   - Click "Extract" on any document
   - Complete face verification
   - Enter your fingerprint PIN
   - Download the decrypted file

## Troubleshooting

### MongoDB Connection Error

If you see "MongoDB connection error":
- Ensure MongoDB is running: `mongod`
- Check if port 27017 is available
- Verify MONGODB_URI in server/.env

### Port Already in Use

If port 5000 or 3000 is already in use:
- Change PORT in server/.env
- Update proxy in client/package.json

### Webcam Not Working

- Grant camera permissions in your browser
- Check if another application is using the webcam
- Try a different browser (Chrome recommended)

### Canvas/Image Processing Errors

If you encounter canvas-related errors:
```bash
cd server
npm rebuild canvas
```

## Development Mode

To run backend and frontend separately:

```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd client
npm start
```

## Production Build

To create a production build:

```bash
cd client
npm run build
```

The build files will be in `client/build/` directory.

## Testing the Application

### Test User Credentials

After registration, you can use:
- Email: Your registered email
- Password: Your registered password
- PIN: Your set PIN (default: 1234)

### Test Document Upload

1. Prepare a test file (PDF, DOC, TXT, or image)
2. Upload with expiry time set to tomorrow
3. Verify it appears in the vault
4. Test extraction with biometric authentication

## Security Notes

- Change JWT_SECRET in production
- Use HTTPS in production
- Implement proper key management for encryption keys
- Add rate limiting for API endpoints
- Use environment-specific configurations

## Support

For issues or questions:
- Check the main README.md
- Review error logs in the terminal
- Ensure all dependencies are installed correctly
