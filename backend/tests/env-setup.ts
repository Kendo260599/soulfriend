// Load test environment variables before any other imports
// env-setup.ts runs BEFORE test files load, making these available globally
import dotenv from 'dotenv';
import path from 'path';

// Load .env.test with override to ensure test values take precedence
dotenv.config({ path: path.resolve(__dirname, '../.env.test'), override: true });

// Set NODE_ENV to test
process.env.NODE_ENV = 'test';

// Fallback: ensure all required env vars are set (in case .env.test wasn't found)
if (!process.env.DEFAULT_ADMIN_PASSWORD) {
  process.env.DEFAULT_ADMIN_PASSWORD = 'TestPassword123!@#XYZ';
}
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'test_jwt_secret_key_2024_learning_system_secure_32_chars';
}
if (!process.env.ENCRYPTION_KEY) {
  process.env.ENCRYPTION_KEY = 'test_encryption_key_2024_learning_system_secure_32_chars_hex_64';
}
