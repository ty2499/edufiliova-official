import crypto from 'crypto';

/**
 * Utility for WhatsApp Flows encryption/decryption
 */
export class WhatsAppFlowsEncryption {
  private privateKey: string;

  constructor(privateKey: string) {
    this.privateKey = privateKey;
  }

  /**
   * Decrypts the incoming WhatsApp Flow request
   */
  decrypt(encrypted_flow_data: string, encrypted_aes_key: string, initial_vector: string) {
    // 1. Decrypt the AES key using the business private key (RSA)
    const aesKey = crypto.privateDecrypt(
      {
        key: this.privateKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
      },
      Buffer.from(encrypted_aes_key, 'base64')
    );

    // 2. Decrypt the flow data using the AES key
    const decipher = crypto.createDecipheriv(
      'aes-128-gcm',
      aesKey,
      Buffer.from(initial_vector, 'base64')
    );

    // Note: The auth tag is usually at the end of the encrypted_flow_data in some implementations
    // but Meta's standard payload often includes it differently. 
    // This is a simplified version based on standard Node.js crypto.
    const encryptedBuffer = Buffer.from(encrypted_flow_data, 'base64');
    const authTag = encryptedBuffer.slice(-16);
    const data = encryptedBuffer.slice(0, -16);

    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(data, undefined, 'utf8');
    decrypted += decipher.final('utf8');

    return JSON.parse(decrypted);
  }

  /**
   * Encrypts the response back to WhatsApp
   */
  encrypt(responsePayload: any, aesKeyBase64: string, ivBase64: string) {
    const aesKey = Buffer.from(aesKeyBase64, 'base64');
    const iv = Buffer.from(ivBase64, 'base64');

    const cipher = crypto.createCipheriv('aes-128-gcm', aesKey, iv);
    let encrypted = cipher.update(JSON.stringify(responsePayload), 'utf8', 'base64');
    encrypted += cipher.final('base64');
    
    const authTag = cipher.getAuthTag().toString('base64');
    return encrypted + authTag;
  }
}
