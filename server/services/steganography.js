const { createCanvas, loadImage } = require('@napi-rs/canvas');
const fs = require('fs').promises;
const path = require('path');

class SteganographyService {
  /**
   * Hide encrypted data inside a PNG image using LSB steganography
   * @param {Buffer} encryptedData - Encrypted data to hide
   * @param {string} outputPath - Path to save stego image
   * @returns {Promise<string>} - Path to stego image
   */
  static async hideData(encryptedData, outputPath) {
    try {
      // Create a canvas with sufficient size
      const dataLength = encryptedData.length;
      const pixelsNeeded = Math.ceil((dataLength * 8) / 3); // 3 color channels per pixel
      const imageSize = Math.ceil(Math.sqrt(pixelsNeeded));
      
      const canvas = createCanvas(imageSize, imageSize);
      const ctx = canvas.getContext('2d');

      // Fill with random noise for cover image
      const imageData = ctx.createImageData(imageSize, imageSize);
      for (let i = 0; i < imageData.data.length; i += 4) {
        imageData.data[i] = Math.floor(Math.random() * 256);     // R
        imageData.data[i + 1] = Math.floor(Math.random() * 256); // G
        imageData.data[i + 2] = Math.floor(Math.random() * 256); // B
        imageData.data[i + 3] = 255;                              // A
      }
      ctx.putImageData(imageData, 0, 0);

      // Get image data for modification
      const imgData = ctx.getImageData(0, 0, imageSize, imageSize);
      const pixels = imgData.data;

      // Store data length in first 32 bits
      for (let i = 0; i < 32; i++) {
        const bit = (dataLength >> (31 - i)) & 1;
        pixels[i] = (pixels[i] & 0xFE) | bit;
      }

      // Hide encrypted data in LSB
      let bitIndex = 32;
      for (let i = 0; i < encryptedData.length; i++) {
        const byte = encryptedData[i];
        for (let bit = 7; bit >= 0; bit--) {
          const bitValue = (byte >> bit) & 1;
          pixels[bitIndex] = (pixels[bitIndex] & 0xFE) | bitValue;
          bitIndex++;
        }
      }

      ctx.putImageData(imgData, 0, 0);

      // Save as PNG
      const buffer = canvas.toBuffer('image/png');
      await fs.writeFile(outputPath, buffer);

      return outputPath;
    } catch (error) {
      console.error('Steganography hide error:', error);
      throw new Error('Failed to hide data in image');
    }
  }

  /**
   * Extract encrypted data from stego image
   * @param {string} imagePath - Path to stego image
   * @returns {Promise<Buffer>} - Extracted encrypted data
   */
  static async extractData(imagePath) {
    try {
      const image = await loadImage(imagePath);
      const canvas = createCanvas(image.width, image.height);
      const ctx = canvas.getContext('2d');
      
      ctx.drawImage(image, 0, 0);
      const imgData = ctx.getImageData(0, 0, image.width, image.height);
      const pixels = imgData.data;

      // Extract data length from first 32 bits
      let dataLength = 0;
      for (let i = 0; i < 32; i++) {
        const bit = pixels[i] & 1;
        dataLength = (dataLength << 1) | bit;
      }

      // Extract encrypted data
      const extractedData = Buffer.alloc(dataLength);
      let bitIndex = 32;
      
      for (let i = 0; i < dataLength; i++) {
        let byte = 0;
        for (let bit = 7; bit >= 0; bit--) {
          const bitValue = pixels[bitIndex] & 1;
          byte = (byte << 1) | bitValue;
          bitIndex++;
        }
        extractedData[i] = byte;
      }

      return extractedData;
    } catch (error) {
      console.error('Steganography extract error:', error);
      throw new Error('Failed to extract data from image');
    }
  }
}

module.exports = SteganographyService;
