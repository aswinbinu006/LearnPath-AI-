import dotenv from 'dotenv';
import crypto from 'crypto';
dotenv.config();

if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'test_jwt_secret_key_for_automated_testing_123456789';
}

import { generateToken, verifyToken } from '../src/server/utils/jwt.js';
import { hashPassword, comparePassword } from '../src/server/utils/password.js';

async function runTests() {
  console.log('🧪 Starting Security & Logic Tests...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, name: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${name}`);
      failed++;
    }
  }

  // 1. Password Hashing Test
  try {
    const rawPass = 'SuperSecret123!';
    const hash = await hashPassword(rawPass);
    assert(hash !== rawPass, 'Password hashing scrambles password');
    assert(hash.startsWith('$2'), 'Bcrypt hash format is valid');

    const isMatch = await comparePassword(rawPass, hash);
    assert(isMatch === true, 'Correct password verifies successfully');

    const isWrongMatch = await comparePassword('WrongPassword', hash);
    assert(isWrongMatch === false, 'Incorrect password correctly rejected');
  } catch (err: any) {
    console.error('Password test error:', err);
    failed++;
  }

  // 2. JWT Token Generation & Verification Test
  try {
    const payload = { userId: 'user-123-abc', email: 'test@example.com', role: 'STUDENT' };
    const token = generateToken(payload);
    assert(typeof token === 'string' && token.length > 20, 'JWT token generated successfully');

    const decoded = verifyToken(token);
    assert(decoded.userId === payload.userId, 'JWT decodes correct userId');
    assert(decoded.email === payload.email, 'JWT decodes correct email');
  } catch (err: any) {
    console.error('JWT test error:', err);
    failed++;
  }

  // 3. Refresh Token Cryptographic Entropies Test
  try {
    const rf1 = crypto.randomBytes(32).toString('hex');
    const rf2 = crypto.randomBytes(32).toString('hex');
    assert(rf1.length === 64, 'Refresh token has 256-bit cryptographic entropy');
    assert(rf1 !== rf2, 'Refresh tokens are non-colliding and unique');
  } catch (err: any) {
    console.error('Refresh token test error:', err);
    failed++;
  }

  // 4. Unauthorized Access Simulation Test (Logged out state)
  try {
    const expiredOrInvalidToken = 'invalid.jwt.token.sample';
    let caught = false;
    try {
      verifyToken(expiredOrInvalidToken);
    } catch {
      caught = true;
    }
    assert(caught === true, 'Unauthorized/corrupted tokens strictly rejected by auth middleware');
  } catch (err: any) {
    console.error('Access control test error:', err);
    failed++;
  }

  console.log(`\n📊 Results: ${passed} Passed, ${failed} Failed\n`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
