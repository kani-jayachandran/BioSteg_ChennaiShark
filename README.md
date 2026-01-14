# Bio_Steg– Secure DigiLocker with Steganography + Multimodal Authentication

A production-ready full-stack web application for secure document storage using AES-256 encryption, LSB steganography, and multimodal authentication.

## Features

- 🔐 JWT-based authentication with bcrypt password hashing
- 📁 Document encryption using AES-256
- 🖼️ LSB steganography to hide encrypted data in PNG images
- 👤 Face verification using webcam capture
- 🔑 Fingerprint authentication (PIN-based simulation)
- ⏰ Time-based access control with document expiry
- 📊 Access logs tracking
- 🎨 Modern UI with React + Tailwind CSS

## Tech Stack

**Frontend:**
- React 18
- Tailwind CSS
- Axios
- React Router
- Webcam capture

**Backend:**
- Node.js + Express
- MongoDB
- JWT authentication
- Multer for file uploads
- Crypto for encryption
- Canvas for steganography

## Project Structure

```
Bio_Seg/
├── client/          # React frontend
├── server/          # Express backend
├── README.md
└── package.json     # Root scripts
```

## Setup Instructions

### Prerequisites

- Node.js 16+ and npm
- MongoDB installed and running locally

### Installation

1. **Clone and install dependencies:**

```bash
npm install
cd client && npm install
cd ../server && npm install
cd ..
```

2. **Configure environment variables:**

Create `server/.env` file:

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/vaultx
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NODE_ENV=development
```

3. **Start MongoDB:**

```bash
mongod
```

4. **Run the application:**

```bash
# From root directory
npm run dev
```

This will start:
- Backend on http://localhost:5000
- Frontend on http://localhost:3000

## Usage

### 1. Register Account
- Navigate to http://localhost:3000
- Click "Register" and create an account
- Upload a face image during registration

### 2. Upload Document
- Login to dashboard
- Click "Upload Document"
- Select file, set expiry time
- Document is encrypted and hidden in PNG image

### 3. Extract Document
- Go to "Secure Vault"
- Click "Extract" on any document
- Complete face verification via webcam
- Enter fingerprint PIN (default: 1234)
- Download decrypted document if validations pass

## Test Users

After registration, you can create test users or use:

```
Email: test@vaultx.com
Password: Test@123
PIN: 1234
```

## API Endpoints

### Authentication
- POST `/api/auth/register` - Register new user
- POST `/api/auth/login` - Login user

### Documents
- POST `/api/documents/upload` - Upload and encrypt document
- GET `/api/documents` - Get user's documents
- POST `/api/documents/extract/:id` - Extract and decrypt document
- GET `/api/documents/logs` - Get access logs

## Security Features

- Password hashing with bcrypt (10 rounds)
- JWT token authentication
- AES-256-CBC encryption
- LSB steganography
- File size limits (10MB)
- Input validation
- CORS protection
- Time-based access control
- Multimodal authentication

## Development

```bash
# Run backend only
cd server && npm run dev

# Run frontend only
cd client && npm start

# Run both (from root)
npm run dev
```

## License

MIT
