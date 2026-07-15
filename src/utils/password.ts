import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;
const BCRYPT_HASH_PATTERN = /^\$2[aby]?\$\d{2}\$/;

export function isBcryptHash(value: string): boolean {
  return BCRYPT_HASH_PATTERN.test(value);
}

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

// Accepts legacy plaintext passwords still sitting in the database so existing
// accounts keep working; verifyPassword callers should re-hash on successful
// legacy match so the row gets upgraded to a bcrypt hash going forward.
export function verifyPassword(plain: string, stored: string): Promise<boolean> {
  if (isBcryptHash(stored)) {
    return bcrypt.compare(plain, stored);
  }
  return Promise.resolve(plain === stored);
}
