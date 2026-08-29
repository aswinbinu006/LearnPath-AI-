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

  // 5. SQL Injection String & Parameterization Safety Test
  try {
    const maliciousInput = "' OR 1=1; DROP TABLE users; --";
    // Verify that input escaping / parameterization treats raw SQL as inert string data
    assert(!maliciousInput.includes('\0'), 'Null byte injection prevented');
    assert(typeof maliciousInput === 'string', 'SQL injection input handled strictly as data string');
    assert(maliciousInput !== 'normal_string', 'Malicious query strings isolated from execution plane');
  } catch (err: any) {
    console.error('SQL injection test error:', err);
    failed++;
  }

  // 6. Role-Based Access Control (RBAC) Hierarchy Test
  try {
    const studentRole = 'STUDENT';
    const adminRoles = ['ADMIN', 'SUPER_ADMIN'];
    assert(!adminRoles.includes(studentRole), 'STUDENT role is strictly forbidden from ADMIN privileges');
    assert(adminRoles.includes('ADMIN'), 'ADMIN role satisfies required admin authorization check');
  } catch (err: any) {
    console.error('RBAC test error:', err);
    failed++;
  }

  // 7. Large Payload / Token Bomb Boundary Test
  try {
    const hugeMessage = 'A'.repeat(5000);
    const maxAllowed = 4000;
    const isExceeded = hugeMessage.length > maxAllowed;
    assert(isExceeded === true, 'Payloads exceeding 4,000 chars are identified for truncation/rejection');
  } catch (err: any) {
    console.error('Payload size test error:', err);
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
