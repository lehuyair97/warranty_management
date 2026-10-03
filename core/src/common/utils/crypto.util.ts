import * as bcrypt from 'bcryptjs';

/**
 * Hashes a plaintext password using bcrypt with salt rounds 10.
 * @param password Plain text password
 * @returns Promise with hashed string
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Compares a plaintext password against a bcrypt hash.
 * @param password Plain text password
 * @param hash Stored bcrypt hash
 * @returns Promise boolean true if matching
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
