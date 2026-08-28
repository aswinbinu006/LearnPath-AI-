import { validateEnv } from '../src/server/config/envValidator.js';

try {
  const config = validateEnv();
  console.log('✅ Production configuration valid:');
  console.log(`  - Environment: ${config.NODE_ENV}`);
  console.log(`  - Port: ${config.PORT}`);
  console.log(`  - Database URL: ${config.DATABASE_URL ? 'Configured (PostgreSQL)' : 'Missing'}`);
  console.log(`  - Admin Code: ${config.ADMIN_SECURITY_CODE ? 'Configured' : 'Missing'}`);
  process.exit(0);
} catch (err) {
  console.error('❌ Environment validation failed:', err);
  process.exit(1);
}
