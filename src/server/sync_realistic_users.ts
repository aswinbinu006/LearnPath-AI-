import { prisma } from './services/prismaClient.js';

async function updateUsers() {
  // Update all users with realistic learning streaks and hours
  await prisma.user.updateMany({
    where: { email: 'tom@gmail.com' },
    data: { learningStreak: 0, totalHoursInvested: 0.0 }
  });

  await prisma.user.updateMany({
    where: { email: 'devashish@learnpath.ai' },
    data: { learningStreak: 1, totalHoursInvested: 1.0 }
  });

  await prisma.user.updateMany({
    where: { email: 'alex@learnpath.ai' },
    data: { learningStreak: 1, totalHoursInvested: 0.5 }
  });

  await prisma.user.updateMany({
    where: { email: 'admin@learnpath.ai' },
    data: { learningStreak: 1, totalHoursInvested: 1.5 }
  });

  console.log('✅ Realistic learner metrics synchronized in PostgreSQL');
}

updateUsers()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
