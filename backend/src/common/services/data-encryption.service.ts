import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

export interface EncryptionResult {
  encrypted: string;
  iv?: string;
}

export interface FieldEncryptionConfig {
  algorithm: string;
  keyLength: number;
  ivLength: number;
}

@Injectable()
export class DataEncryptionService {
  private readonly logger = new Logger(DataEncryptionService.name);
  
  // Encryption configuration
  private readonly config: FieldEncryptionConfig = {
    algorithm: 'aes-256-gcm',
    keyLength: 32,
    ivLength: 16,
  };

  // Master key for field-level encryption (in production, use proper key management)
  private readonly masterKey: Buffer;

  constructor() {
    // In production, this should come from a secure key management service
    this.masterKey = this.deriveMasterKey(
      process.env.ENCRYPTION_KEY || 'default-encryption-key-change-in-production'
    );
  }

  /**
   * Encrypt sensitive field data
   */
  encryptField(data: string, context?: string): EncryptionResult {
    try {
      if (!data || data.trim().length === 0) {
        return { encrypted: '' };
      }

      const iv = crypto.randomBytes(this.config.ivLength);
      const cipher = crypto.createCipheriv('aes-256-cbc', this.masterKey, iv);
      
      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      // Combine IV + Encrypted data for AES-CBC
      const result = iv.toString('hex') + ':' + encrypted;

      this.logger.debug(`Field encrypted successfully ${context ? `for ${context}` : ''}`);
      
      return {
        encrypted: result,
        iv: iv.toString('hex'),
      };

    } catch (error) {
      this.logger.error('Field encryption failed:', error);
      throw new Error('Encryption failed');
    }
  }

  /**
   * Decrypt sensitive field data
   */
  decryptField(encryptedData: string, context?: string): string {
    try {
      if (!encryptedData || encryptedData.trim().length === 0) {
        return '';
      }

      const parts = encryptedData.split(':');
      if (parts.length !== 2) {
        throw new Error('Invalid encrypted data format');
      }

      const iv = Buffer.from(parts[0], 'hex');
      const encrypted = parts[1];

      const decipher = crypto.createDecipheriv('aes-256-cbc', this.masterKey, iv);

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      this.logger.debug(`Field decrypted successfully ${context ? `for ${context}` : ''}`);
      
      return decrypted;

    } catch (error) {
      this.logger.error('Field decryption failed:', error);
      throw new Error('Decryption failed');
    }
  }

  /**
   * Encrypt phone number with format preservation
   */
  encryptPhone(phoneNumber: string): EncryptionResult {
    if (!phoneNumber) return { encrypted: '' };

    // Extract and preserve format
    const digitsOnly = phoneNumber.replace(/\D/g, '');
    const format = phoneNumber.replace(/\d/g, 'X');

    const encryptedDigits = this.encryptField(digitsOnly, 'phone');
    
    return {
      encrypted: JSON.stringify({
        digits: encryptedDigits.encrypted,
        format: format,
      }),
    };
  }

  /**
   * Decrypt phone number and restore format
   */
  decryptPhone(encryptedPhone: string): string {
    if (!encryptedPhone) return '';

    try {
      const data = JSON.parse(encryptedPhone);
      const decryptedDigits = this.decryptField(data.digits, 'phone');
      
      // Restore original format
      let result = data.format;
      let digitIndex = 0;
      
      for (let i = 0; i < result.length && digitIndex < decryptedDigits.length; i++) {
        if (result[i] === 'X') {
          result = result.substring(0, i) + decryptedDigits[digitIndex] + result.substring(i + 1);
          digitIndex++;
        }
      }
      
      return result;
      
    } catch (error) {
      this.logger.error('Phone decryption failed:', error);
      return '';
    }
  }

  /**
   * Encrypt email with domain preservation for search
   */
  encryptEmail(email: string): EncryptionResult {
    if (!email || !email.includes('@')) {
      return this.encryptField(email, 'email');
    }

    const [localPart, domain] = email.split('@');
    const encryptedLocal = this.encryptField(localPart, 'email_local');

    return {
      encrypted: JSON.stringify({
        local: encryptedLocal.encrypted,
        domain: domain, // Keep domain unencrypted for organizational queries
      }),
    };
  }

  /**
   * Decrypt email
   */
  decryptEmail(encryptedEmail: string): string {
    if (!encryptedEmail) return '';

    try {
      const data = JSON.parse(encryptedEmail);
      const decryptedLocal = this.decryptField(data.local, 'email_local');
      
      return `${decryptedLocal}@${data.domain}`;
      
    } catch (error) {
      // Fallback to simple decryption for backward compatibility
      return this.decryptField(encryptedEmail, 'email');
    }
  }

  /**
   * Hash data for searchable encryption (one-way)
   */
  hashForSearch(data: string, salt?: string): string {
    const saltToUse = salt || crypto.randomBytes(16).toString('hex');
    const hash = crypto.createHash('sha256');
    hash.update(data + saltToUse);
    
    return saltToUse + ':' + hash.digest('hex');
  }

  /**
   * Verify hashed data
   */
  verifyHash(data: string, hash: string): boolean {
    try {
      const [salt, expectedHash] = hash.split(':');
      const computedHash = this.hashForSearch(data, salt);
      
      return computedHash === hash;
      
    } catch (error) {
      this.logger.error('Hash verification failed:', error);
      return false;
    }
  }

  /**
   * Generate encryption key from master password
   */
  private deriveMasterKey(password: string): Buffer {
    // Use PBKDF2 for key derivation
    const salt = crypto.createHash('sha256').update('dial-craft-crm-salt').digest();
    
    return crypto.pbkdf2Sync(password, salt, 100000, this.config.keyLength, 'sha256');
  }

  /**
   * Rotate encryption keys (for periodic key rotation)
   */
  async rotateKeys(oldKey: string, newKey: string): Promise<void> {
    this.logger.warn('Key rotation initiated - this requires careful implementation');
    
    // In production, this would:
    // 1. Decrypt all encrypted fields with old key
    // 2. Re-encrypt with new key
    // 3. Update key references
    // 4. Verify integrity
    
    throw new Error('Key rotation not implemented - requires careful deployment strategy');
  }

  /**
   * Mask sensitive data for logging/display
   */
  maskData(data: string, type: 'phone' | 'email' | 'ssn' | 'card'): string {
    if (!data) return '';

    switch (type) {
      case 'phone':
        return data.replace(/(\d{3})(\d{3})(\d{4})/, '***-***-$3');
      
      case 'email':
        return data.replace(/(.{2})(.*)(@.*)/, '$1***$3');
      
      case 'ssn':
        return data.replace(/(\d{3})(\d{2})(\d{4})/, '***-**-$3');
      
      case 'card':
        return data.replace(/(\d{4})(\d{8})(\d{4})/, '$1-****-****-$3');
      
      default:
        return '***';
    }
  }

  /**
   * Check if data appears to be encrypted
   */
  isEncrypted(data: string): boolean {
    if (!data) return false;
    
    // Check for our encryption format (hex:hex)
    const encryptionPattern = /^[a-f0-9]+:[a-f0-9]+$/i;
    
    // Check for JSON encryption format
    try {
      const parsed = JSON.parse(data);
      return parsed.digits || parsed.local || false;
    } catch {
      return encryptionPattern.test(data);
    }
  }
}