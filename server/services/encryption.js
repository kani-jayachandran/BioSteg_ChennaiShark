const crypto = require('crypto');

const ALGORITHM = 'aes-256-cbc';
const KEY_LENGTH = 32; // 256 bits / 8 = 32 bytes
const IV_LENGTH = 16;  // 128 bits / 8 = 16 bytes

class EncryptionService {
  /**
   * Encrypt data using AES-256-CBC
   * @param {Buffer} data - Data to encrypt
   * @returns {Object} - { encryptedData: Buffer, key: string, iv: string }
   */
  static encrypt(data) {
    try {
      // Validate input
      if (!data || !Buffer.isBuffer(data)) {
        throw new Error('Invalid input: data must be a Buffer');
      }

      if (data.length === 0) {
        throw new Error('Invalid input: data buffer is empty');
      }

      // Generate random key and IV with exact lengths
      const key = crypto.randomBytes(KEY_LENGTH);
      const iv = crypto.randomBytes(IV_LENGTH);

      // Validate key and IV lengths
      if (key.length !== KEY_LENGTH) {
        throw new Error(`Invalid key length: expected ${KEY_LENGTH}, got ${key.length}`);
      }
      if (iv.length !== IV_LENGTH) {
        throw new Error(`Invalid IV length: expected ${IV_LENGTH}, got ${iv.length}`);
      }

      // Create cipher
      const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
      
      // Encrypt data
      const encrypted = Buffer.concat([
        cipher.update(data),
        cipher.final()
      ]);

      // Return with consistent hex encoding
      return {
        encryptedData: encrypted,
        key: key.toString('hex'),
        iv: iv.toString('hex')
      };
    } catch (error) {
      console.error('Encryption error:', error.message);
      throw new Error(`Failed to encrypt data: ${error.message}`);
    }
  }

  /**
   * Decrypt data using AES-256-CBC
   * @param {Buffer} encryptedData - Encrypted data
   * @param {string} keyHex - Encryption key in hex
   * @param {string} ivHex - IV in hex
   * @returns {Buffer} - Decrypted data
   */
  static decrypt(encryptedData, keyHex, ivHex) {
    try {
      // Validate inputs
      if (!encryptedData || !Buffer.isBuffer(encryptedData)) {
        throw new Error('Invalid encrypted data: must be a Buffer');
      }

      if (encryptedData.length === 0) {
        throw new Error('Invalid encrypted data: buffer is empty');
      }

      if (!keyHex || typeof keyHex !== 'string') {
        throw new Error('Invalid key: must be a hex string');
      }

      if (!ivHex || typeof ivHex !== 'string') {
        throw new Error('Invalid IV: must be a hex string');
      }

      // Convert hex strings to buffers
      let key, iv;
      try {
        key = Buffer.from(keyHex, 'hex');
        iv = Buffer.from(ivHex, 'hex');
      } catch (conversionError) {
        throw new Error('Failed to convert key/IV from hex format');
      }

      // Validate key and IV lengths
      if (key.length !== KEY_LENGTH) {
        throw new Error(`Invalid key length: expected ${KEY_LENGTH} bytes, got ${key.length} bytes`);
      }

      if (iv.length !== IV_LENGTH) {
        throw new Error(`Invalid IV length: expected ${IV_LENGTH} bytes, got ${iv.length} bytes`);
      }

      // Create decipher
      const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
      
      // Decrypt data
      let decrypted;
      try {
        decrypted = Buffer.concat([
          decipher.update(encryptedData),
          decipher.final()
        ]);
      } catch (decryptError) {
        if (decryptError.code === 'ERR_OSSL_BAD_DECRYPT') {
          throw new Error('Decryption failed: Invalid key, IV, or corrupted data');
        }
        throw decryptError;
      }

      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error.message);
      throw new Error(`Failed to decrypt data: ${error.message}`);
    }
  }

  /**
   * Validate encryption parameters
   * @param {string} keyHex - Key in hex
   * @param {string} ivHex - IV in hex
   * @returns {boolean} - True if valid
   */
  static validateParams(keyHex, ivHex) {
    try {
      if (!keyHex || !ivHex) return false;
      
      const key = Buffer.from(keyHex, 'hex');
      const iv = Buffer.from(ivHex, 'hex');
      
      return key.length === KEY_LENGTH && iv.length === IV_LENGTH;
    } catch {
      return false;
    }
  }
}

module.exports = EncryptionService;
