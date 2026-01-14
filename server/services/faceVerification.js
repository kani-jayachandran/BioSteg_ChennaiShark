const { createCanvas, loadImage } = require('@napi-rs/canvas');

class FaceVerificationService {
  /**
   * Compare two face images (basic similarity check)
   * In production, use a proper face recognition library like face-api.js
   * @param {string} registeredFaceBase64 - Base64 encoded registered face
   * @param {string} capturedFaceBase64 - Base64 encoded captured face
   * @returns {Promise<Object>} - { match: boolean, similarity: number }
   */
  static async verifyFace(registeredFaceBase64, capturedFaceBase64) {
    try {
      // Validate inputs exist
      if (!registeredFaceBase64 || !capturedFaceBase64) {
        console.error('Face verification: Missing face image data');
        return {
          match: false,
          similarity: 0,
          threshold: 60,
          error: 'Missing face image data'
        };
      }

      // Validate inputs are strings
      if (typeof registeredFaceBase64 !== 'string' || typeof capturedFaceBase64 !== 'string') {
        console.error('Face verification: Invalid face image format');
        return {
          match: false,
          similarity: 0,
          threshold: 60,
          error: 'Invalid face image format'
        };
      }

      // Remove data URL prefix if present (safe with null check)
      const cleanRegistered = registeredFaceBase64.replace(/^data:image\/\w+;base64,/, '');
      const cleanCaptured = capturedFaceBase64.replace(/^data:image\/\w+;base64,/, '');

      // Validate base64 strings are not empty
      if (!cleanRegistered || !cleanCaptured) {
        console.error('Face verification: Empty face image data after cleaning');
        return {
          match: false,
          similarity: 0,
          threshold: 60,
          error: 'Empty face image data'
        };
      }

      // Convert base64 to buffers with validation
      let registeredBuffer, capturedBuffer;
      try {
        registeredBuffer = Buffer.from(cleanRegistered, 'base64');
        capturedBuffer = Buffer.from(cleanCaptured, 'base64');
      } catch (bufferError) {
        console.error('Face verification: Invalid base64 encoding', bufferError.message);
        return {
          match: false,
          similarity: 0,
          threshold: 60,
          error: 'Invalid base64 encoding'
        };
      }

      // Validate buffers have data
      if (registeredBuffer.length === 0 || capturedBuffer.length === 0) {
        console.error('Face verification: Empty image buffers');
        return {
          match: false,
          similarity: 0,
          threshold: 60,
          error: 'Empty image buffers'
        };
      }

      // Load images
      const registeredImg = await loadImage(registeredBuffer);
      const capturedImg = await loadImage(capturedBuffer);

      // Create canvases
      const size = 100; // Normalize size
      const canvas1 = createCanvas(size, size);
      const ctx1 = canvas1.getContext('2d');
      const canvas2 = createCanvas(size, size);
      const ctx2 = canvas2.getContext('2d');

      // Draw and resize images
      ctx1.drawImage(registeredImg, 0, 0, size, size);
      ctx2.drawImage(capturedImg, 0, 0, size, size);

      // Get image data
      const data1 = ctx1.getImageData(0, 0, size, size).data;
      const data2 = ctx2.getImageData(0, 0, size, size).data;

      // Calculate similarity using simple pixel comparison
      let totalDiff = 0;
      let pixelCount = 0;

      for (let i = 0; i < data1.length; i += 4) {
        const r1 = data1[i];
        const g1 = data1[i + 1];
        const b1 = data1[i + 2];
        
        const r2 = data2[i];
        const g2 = data2[i + 1];
        const b2 = data2[i + 2];

        // Calculate Euclidean distance
        const diff = Math.sqrt(
          Math.pow(r1 - r2, 2) +
          Math.pow(g1 - g2, 2) +
          Math.pow(b1 - b2, 2)
        );

        totalDiff += diff;
        pixelCount++;
      }

      // Calculate similarity percentage (0-100)
      const avgDiff = totalDiff / pixelCount;
      const maxDiff = Math.sqrt(3 * Math.pow(255, 2)); // Max possible difference
      const similarity = Math.max(0, 100 - (avgDiff / maxDiff * 100));

      // Consider match if similarity > 60% (adjust threshold as needed)
      const match = similarity > 60;

      return {
        match,
        similarity: Math.round(similarity * 100) / 100,
        threshold: 60
      };
    } catch (error) {
      console.error('Face verification error:', error.message);
      // Return failure instead of mock success
      return {
        match: false,
        similarity: 0,
        threshold: 60,
        error: 'Face verification processing failed'
      };
    }
  }

  /**
   * Verify fingerprint PIN
   * @param {string} storedPin - Stored PIN
   * @param {string} enteredPin - Entered PIN
   * @returns {boolean} - Match result
   */
  static verifyFingerprint(storedPin, enteredPin) {
    // Validate inputs
    if (!storedPin || !enteredPin) {
      console.error('Fingerprint verification: Missing PIN data');
      return false;
    }

    // Convert to strings and compare
    return String(storedPin).trim() === String(enteredPin).trim();
  }
}

module.exports = FaceVerificationService;
