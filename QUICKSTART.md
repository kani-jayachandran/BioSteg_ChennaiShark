# VaultX Kiro - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### 1. Install Dependencies (First Time Only)

```bash
setup.bat
```

### 2. Start MongoDB

```bash
mongod
```

### 3. Start the Application

```bash
start.bat
```

Or:

```bash
npm run dev
```

### 4. Open Browser

Navigate to: **http://localhost:3000**

### 5. Register & Upload

1. Click "Register" and create your account
2. Capture your face via webcam
3. Set a 4-digit PIN (e.g., 1234)
4. Login and upload your first document
5. Set expiry time and click upload

### 6. Extract Document

1. Go to "Secure Vault"
2. Click "Extract" on your document
3. Complete face verification
4. Enter your PIN
5. Download decrypted file

## 🎯 Key Features Demo

### Upload Flow
```
Select File → Set Expiry → Upload
     ↓
AES-256 Encryption
     ↓
LSB Steganography (Hide in PNG)
     ↓
Store on Server
```

### Extract Flow
```
Select Document → Face Verification → PIN Entry
     ↓
Extract from PNG
     ↓
Decrypt with AES-256
     ↓
Download Original File
```

## 📝 Default Credentials

- **Fingerprint PIN**: 1234 (customizable during registration)
- **Face Image**: Captured via webcam during registration

## 🔧 Common Commands

```bash
# Install all dependencies
npm run install-all

# Start both frontend and backend
npm run dev

# Start backend only
npm run server

# Start frontend only
npm run client

# Build for production
cd client && npm run build
```

## ⚡ Quick Tips

- **File Size Limit**: 10MB
- **Supported Formats**: PDF, DOC, DOCX, TXT, JPG, PNG
- **Expiry Time**: Must be in the future
- **Face Verification**: Similarity threshold is 60%
- **PIN**: 4 digits (default: 1234)

## 🐛 Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| MongoDB error | Run `mongod` in a separate terminal |
| Port in use | Change PORT in server/.env |
| Webcam not working | Grant camera permissions in browser |
| Canvas errors | Run `cd server && npm rebuild canvas` |

## 📚 Next Steps

- Read full [README.md](README.md) for detailed documentation
- Check [INSTALLATION.md](INSTALLATION.md) for troubleshooting
- Explore the access logs feature
- Try uploading different file types
- Test document expiry functionality

## 🎨 UI Pages

- **/login** - User authentication
- **/register** - New user registration with biometrics
- **/dashboard** - Overview and statistics
- **/upload** - Upload and encrypt documents
- **/vault** - View and extract documents
- **/logs** - Access activity logs

Enjoy using VaultX Kiro! 🔐
