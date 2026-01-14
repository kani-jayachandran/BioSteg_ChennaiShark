const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const auth = require('../middleware/auth');
const Document = require('../models/Document');
const User = require('../models/User');
const AccessLog = require('../models/AccessLog');
const EncryptionService = require('../services/encryption');
const SteganographyService = require('../services/steganography');
const FaceVerificationService = require('../services/faceVerification');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB
  }
});

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
fs.mkdir(uploadsDir, { recursive: true }).catch(console.error);

// Upload document
router.post('/upload', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No file uploaded' 
      });
    }

    const { expiryTime } = req.body;
    
    if (!expiryTime) {
      return res.status(400).json({ 
        success: false, 
        message: 'Expiry time is required' 
      });
    }

    // Validate expiry time
    const expiry = new Date(expiryTime);
    if (expiry <= new Date()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Expiry time must be in the future' 
      });
    }

    // Step 1: Encrypt the file with error handling
    const fileBuffer = req.file.buffer;
    let encryptionResult;
    
    try {
      encryptionResult = EncryptionService.encrypt(fileBuffer);
    } catch (encryptError) {
      console.error('Encryption error during upload:', encryptError.message);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to encrypt document' 
      });
    }

    const { encryptedData, key, iv } = encryptionResult;

    // Step 2: Hide encrypted data in image using steganography
    const filename = `${Date.now()}_${req.userId}.png`;
    const stegoImagePath = path.join(uploadsDir, filename);
    
    try {
      await SteganographyService.hideData(encryptedData, stegoImagePath);
    } catch (stegoError) {
      console.error('Steganography error during upload:', stegoError.message);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to secure document in storage' 
      });
    }

    // Step 3: Store metadata with encryption keys
    const document = new Document({
      userId: req.userId,
      originalFilename: req.file.originalname,
      stegoImagePath: filename,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      expiryTime: expiry,
      // Store encryption keys in metadata (in production, use secure key management)
      encryptionKey: key,
      encryptionIv: iv
    });

    try {
      await document.save();
    } catch (saveError) {
      console.error('Database save error during upload:', saveError.message);
      // Try to cleanup the stego image
      await fs.unlink(stegoImagePath).catch(err => 
        console.error('Failed to cleanup stego image:', err.message)
      );
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to save document metadata' 
      });
    }

    // Log upload action
    await new AccessLog({
      userId: req.userId,
      documentId: document._id,
      action: 'upload',
      status: 'success',
      ipAddress: req.ip
    }).save().catch(err => console.error('Failed to save upload log:', err.message));

    res.status(201).json({
      success: true,
      message: 'Document uploaded and secured successfully',
      document: {
        id: document._id,
        filename: document.originalFilename,
        uploadTime: document.uploadTime,
        expiryTime: document.expiryTime
      }
    });
  } catch (error) {
    console.error('Upload error:', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to upload document' 
    });
  }
});

// Get user's documents
router.get('/', auth, async (req, res) => {
  try {
    const documents = await Document.find({ userId: req.userId })
      .select('-encryptionKey -encryptionIv')
      .sort({ uploadTime: -1 });

    // Check and update expired status
    const updatedDocs = documents.map(doc => {
      const isExpired = new Date() > doc.expiryTime;
      return {
        ...doc.toObject(),
        isExpired
      };
    });

    res.json({
      success: true,
      documents: updatedDocs
    });
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch documents' 
    });
  }
});

// Extract document with multimodal authentication
router.post('/extract/:id', auth, async (req, res) => {
  let logSaved = false;
  
  try {
    // Support both field names for backward compatibility
    const faceImage = req.body.faceImage || req.body.capturedFace;
    const fingerprintPin = req.body.fingerprintPin;

    // Debug logging
    console.log('Extract request received:', {
      documentId: req.params.id,
      userId: req.userId,
      hasFaceImage: !!faceImage,
      faceImageSource: req.body.faceImage ? 'faceImage' : (req.body.capturedFace ? 'capturedFace' : 'none'),
      faceImageType: typeof faceImage,
      faceImageLength: faceImage?.length,
      faceImagePrefix: faceImage?.substring(0, 30) + '...',
      hasPin: !!fingerprintPin,
      pinLength: fingerprintPin?.length
    });

    if (!faceImage || !fingerprintPin) {
      return res.status(400).json({ 
        success: false, 
        message: 'Face image and fingerprint PIN are required' 
      });
    }

    // Validate face image format
    if (typeof faceImage !== 'string') {
      return res.status(400).json({ 
        success: false, 
        message: 'Face image must be a base64 string' 
      });
    }

    if (faceImage.length < 100) {
      return res.status(400).json({ 
        success: false, 
        message: 'Face image data is too short' 
      });
    }

    // Find document
    const document = await Document.findOne({ 
      _id: req.params.id, 
      userId: req.userId 
    });

    if (!document) {
      return res.status(404).json({ 
        success: false, 
        message: 'Document not found' 
      });
    }

    // Check if document is expired
    if (new Date() > document.expiryTime) {
      if (!logSaved) {
        await new AccessLog({
          userId: req.userId,
          documentId: document._id,
          action: 'failed_extract',
          status: 'failed',
          reason: 'Document expired',
          ipAddress: req.ip
        }).save().catch(err => console.error('Failed to save access log:', err.message));
        logSaved = true;
      }

      return res.status(403).json({ 
        success: false, 
        message: 'Document has expired and cannot be accessed' 
      });
    }

    // Get user for biometric verification
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Step 1: Face verification with error handling
    let faceResult;
    try {
      faceResult = await FaceVerificationService.verifyFace(
        user.faceImage,
        faceImage
      );
    } catch (faceError) {
      console.error('Face verification service error:', faceError.message);
      if (!logSaved) {
        await new AccessLog({
          userId: req.userId,
          documentId: document._id,
          action: 'failed_extract',
          status: 'failed',
          reason: 'Face verification error',
          ipAddress: req.ip
        }).save().catch(err => console.error('Failed to save access log:', err.message));
        logSaved = true;
      }

      return res.status(500).json({ 
        success: false, 
        message: 'Face verification service unavailable' 
      });
    }

    if (!faceResult || !faceResult.match) {
      if (!logSaved) {
        await new AccessLog({
          userId: req.userId,
          documentId: document._id,
          action: 'failed_extract',
          status: 'failed',
          reason: 'Face verification failed',
          ipAddress: req.ip
        }).save().catch(err => console.error('Failed to save access log:', err.message));
        logSaved = true;
      }

      return res.status(403).json({ 
        success: false, 
        message: 'Face verification failed',
        similarity: faceResult?.similarity || 0
      });
    }

    // Step 2: Fingerprint verification with error handling
    let fingerprintMatch;
    try {
      fingerprintMatch = FaceVerificationService.verifyFingerprint(
        user.fingerprintPin,
        fingerprintPin
      );
    } catch (fingerprintError) {
      console.error('Fingerprint verification error:', fingerprintError.message);
      if (!logSaved) {
        await new AccessLog({
          userId: req.userId,
          documentId: document._id,
          action: 'failed_extract',
          status: 'failed',
          reason: 'Fingerprint verification error',
          ipAddress: req.ip
        }).save().catch(err => console.error('Failed to save access log:', err.message));
        logSaved = true;
      }

      return res.status(500).json({ 
        success: false, 
        message: 'Fingerprint verification service unavailable' 
      });
    }

    if (!fingerprintMatch) {
      if (!logSaved) {
        await new AccessLog({
          userId: req.userId,
          documentId: document._id,
          action: 'failed_extract',
          status: 'failed',
          reason: 'Fingerprint verification failed',
          ipAddress: req.ip
        }).save().catch(err => console.error('Failed to save access log:', err.message));
        logSaved = true;
      }

      return res.status(403).json({ 
        success: false, 
        message: 'Fingerprint verification failed' 
      });
    }

    // Step 3: Extract data from stego image with error handling
    const stegoImagePath = path.join(uploadsDir, document.stegoImagePath);
    let encryptedData;
    
    try {
      encryptedData = await SteganographyService.extractData(stegoImagePath);
    } catch (stegoError) {
      console.error('Steganography extraction error:', stegoError.message);
      if (!logSaved) {
        await new AccessLog({
          userId: req.userId,
          documentId: document._id,
          action: 'failed_extract',
          status: 'failed',
          reason: 'Steganography extraction failed',
          ipAddress: req.ip
        }).save().catch(err => console.error('Failed to save access log:', err.message));
        logSaved = true;
      }

      return res.status(500).json({ 
        success: false, 
        message: 'Failed to extract data from secure storage' 
      });
    }

    // Step 4: Decrypt data with error handling
    let decryptedData;
    try {
      // Validate encryption parameters before attempting decryption
      if (!EncryptionService.validateParams(document.encryptionKey, document.encryptionIv)) {
        throw new Error('Invalid encryption parameters stored in database');
      }

      decryptedData = EncryptionService.decrypt(
        encryptedData,
        document.encryptionKey,
        document.encryptionIv
      );
    } catch (decryptError) {
      console.error('Decryption error:', decryptError.message);
      if (!logSaved) {
        await new AccessLog({
          userId: req.userId,
          documentId: document._id,
          action: 'failed_extract',
          status: 'failed',
          reason: 'Decryption failed',
          ipAddress: req.ip
        }).save().catch(err => console.error('Failed to save access log:', err.message));
        logSaved = true;
      }

      return res.status(500).json({ 
        success: false, 
        message: 'Failed to decrypt document. Data may be corrupted.' 
      });
    }

    // Update access count
    try {
      document.accessCount += 1;
      await document.save();
    } catch (saveError) {
      console.error('Failed to update access count:', saveError.message);
      // Non-critical error, continue with download
    }

    // Log successful extraction
    if (!logSaved) {
      await new AccessLog({
        userId: req.userId,
        documentId: document._id,
        action: 'extract',
        status: 'success',
        ipAddress: req.ip
      }).save().catch(err => console.error('Failed to save access log:', err.message));
    }

    // Send decrypted file
    res.set({
      'Content-Type': document.mimeType,
      'Content-Disposition': `attachment; filename="${document.originalFilename}"`,
      'Content-Length': decryptedData.length
    });

    res.send(decryptedData);
  } catch (error) {
    console.error('Extract error:', error.message);
    
    // Avoid duplicate logging
    if (!logSaved) {
      try {
        await new AccessLog({
          userId: req.userId,
          documentId: req.params.id,
          action: 'failed_extract',
          status: 'failed',
          reason: 'Unexpected error',
          ipAddress: req.ip
        }).save();
      } catch (logError) {
        console.error('Failed to save error log:', logError.message);
      }
    }

    res.status(500).json({ 
      success: false, 
      message: 'Failed to extract document' 
    });
  }
});

// Get access logs
router.get('/logs', auth, async (req, res) => {
  try {
    const logs = await AccessLog.find({ userId: req.userId })
      .populate('documentId', 'originalFilename')
      .sort({ timestamp: -1 })
      .limit(50);

    res.json({
      success: true,
      logs
    });
  } catch (error) {
    console.error('Get logs error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch logs' 
    });
  }
});

// Delete document
router.delete('/:id', auth, async (req, res) => {
  try {
    const document = await Document.findOne({ 
      _id: req.params.id, 
      userId: req.userId 
    });

    if (!document) {
      return res.status(404).json({ 
        success: false, 
        message: 'Document not found' 
      });
    }

    // Delete stego image file
    const stegoImagePath = path.join(uploadsDir, document.stegoImagePath);
    await fs.unlink(stegoImagePath).catch(console.error);

    // Delete document record
    await Document.deleteOne({ _id: document._id });

    res.json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete document' 
    });
  }
});

module.exports = router;
