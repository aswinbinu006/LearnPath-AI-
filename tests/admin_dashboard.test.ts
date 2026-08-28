import dotenv from 'dotenv';
dotenv.config();

import { prisma } from '../src/server/services/prismaClient.js';
import { AuditService, AuditAction, AuditCategory } from '../src/server/services/auditService.js';
import { comparePassword, hashPassword } from '../src/server/utils/password.js';
import { generateToken, verifyToken } from '../src/server/utils/jwt.js';

async function runAdminDashboardTests() {
  console.log('🧪 Starting HCL Enterprise Admin Dashboard & RBAC Test Suite...\n');
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

  try {
    // 1. Verify Admin User Exists & Has ADMIN Role
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@learnpath.ai' },
    });
    assert(!!adminUser, 'Admin user (admin@learnpath.ai) exists in PostgreSQL database');
    assert(adminUser?.role === 'ADMIN', 'Admin user has role ADMIN');

    const isPasswordValid = await comparePassword('password123', adminUser!.passwordHash);
    assert(isPasswordValid === true, 'Admin credentials match password123');

    // 2. Master Security Code Verification
    const validSecurityCode = process.env.ADMIN_SECURITY_CODE || 'HCL-ADMIN-2026';
    assert(validSecurityCode === 'HCL-ADMIN-2026', 'Default master security code is HCL-ADMIN-2026');

    // 3. RBAC JWT Role Token Test
    const adminToken = generateToken({
      userId: adminUser!.id,
      email: adminUser!.email,
      role: adminUser!.role,
    });
    const decoded = verifyToken(adminToken);
    assert(decoded.role === 'ADMIN', 'JWT token encapsulates ADMIN role properly for RBAC middleware');

    // 4. PostgreSQL Audit Log Engine Test: Record Every Action
    const testUserId = adminUser!.id;
    const initialLogCount = await prisma.auditLog.count();

    // Log action 1: LOGIN
    await AuditService.log({
      userId: testUserId,
      action: AuditAction.LOGIN,
      category: AuditCategory.AUTH,
      details: { email: 'admin@learnpath.ai', method: 'automated_test' },
      status: 'SUCCESS',
    });

    // Log action 2: COURSE_STARTED
    await AuditService.log({
      userId: testUserId,
      action: AuditAction.COURSE_STARTED,
      category: AuditCategory.LEARNING,
      details: { courseTitle: 'System Architecture & Concurrency' },
      status: 'SUCCESS',
    });

    // Log action 3: LESSON_COMPLETED
    await AuditService.log({
      userId: testUserId,
      action: AuditAction.LESSON_COMPLETED,
      category: AuditCategory.LEARNING,
      details: { lessonTitle: 'Event Loop in Production' },
      status: 'SUCCESS',
    });

    // Log action 4: ASSESSMENT_SUBMITTED
    await AuditService.log({
      userId: testUserId,
      action: AuditAction.ASSESSMENT_SUBMITTED,
      category: AuditCategory.ASSESSMENT,
      details: { title: 'Enterprise Benchmark', score: 95 },
      status: 'SUCCESS',
    });

    // Log action 5: AI_CHAT_USED
    await AuditService.log({
      userId: testUserId,
      action: AuditAction.AI_CHAT_USED,
      category: AuditCategory.AI,
      details: { promptSnippet: 'Optimize PostgreSQL query index' },
      status: 'SUCCESS',
    });

    // Log action 6: SETTINGS_UPDATED
    await AuditService.log({
      userId: testUserId,
      action: AuditAction.SETTINGS_UPDATED,
      category: AuditCategory.SETTINGS,
      details: { theme: 'dark' },
      status: 'SUCCESS',
    });

    // Log action 7: LOGOUT
    await AuditService.log({
      userId: testUserId,
      action: AuditAction.LOGOUT,
      category: AuditCategory.AUTH,
      details: { method: 'session_end' },
      status: 'SUCCESS',
    });

    const finalLogCount = await prisma.auditLog.count();
    assert(finalLogCount >= initialLogCount + 7, 'All 7 specified audit actions successfully recorded in PostgreSQL');

    // 5. Searchable Audit Logs Verification
    const searchedLogs = await prisma.auditLog.findMany({
      where: {
        OR: [
          { action: { contains: 'COURSE_STARTED', mode: 'insensitive' } },
          { details: { contains: 'System Architecture', mode: 'insensitive' } },
        ],
      },
    });
    assert(searchedLogs.length > 0, 'PostgreSQL Audit query returns exact matching search events');

    // 6. User Management: Search & Role Update Verification
    const studentUser = await prisma.user.findUnique({
      where: { email: 'devashish@learnpath.ai' },
    });
    assert(!!studentUser, 'Student user (devashish@learnpath.ai) exists for management');

    // Test promoting student to ADMIN and back
    await prisma.user.update({
      where: { id: studentUser!.id },
      data: { role: 'ADMIN' },
    });
    const promotedUser = await prisma.user.findUnique({ where: { id: studentUser!.id } });
    assert(promotedUser?.role === 'ADMIN', 'Role promotion executed successfully in database');

    // Revert back to STUDENT
    await prisma.user.update({
      where: { id: studentUser!.id },
      data: { role: 'STUDENT' },
    });
    const revertedUser = await prisma.user.findUnique({ where: { id: studentUser!.id } });
    assert(revertedUser?.role === 'STUDENT', 'Role demotion/reversion executed successfully in database');

    // 7. Analytics Data Aggregation Verification
    const totalUsersCount = await prisma.user.count();
    const totalCoursesCount = await prisma.course.count();
    const totalProgressCount = await prisma.userProgress.count();
    const totalSkillGapsCount = await prisma.skillGap.count();

    assert(totalUsersCount >= 2, `Total users count aggregated (${totalUsersCount})`);
    assert(totalCoursesCount >= 1, `Total courses count aggregated (${totalCoursesCount})`);
    assert(totalProgressCount >= 1, `Total user progress records aggregated (${totalProgressCount})`);
    assert(totalSkillGapsCount >= 1, `Total skill gaps aggregated (${totalSkillGapsCount})`);

    console.log(`\n📊 Test Results: ${passed} Passed, ${failed} Failed\n`);
    if (failed > 0) {
      process.exit(1);
    }
  } catch (err: any) {
    console.error('Test execution error:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runAdminDashboardTests();
