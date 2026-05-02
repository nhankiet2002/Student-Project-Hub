import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const userCount = await prisma.user.count();
  const studentCount = await prisma.user.count({ where: { role: 'student' } });
  const portfolioCount = await prisma.portfolio.count();
  const studentWithPortfolioCount = await prisma.user.count({
    where: {
      role: 'student',
      Portfolio: { isNot: null }
    }
  });

  console.log({
    userCount,
    studentCount,
    portfolioCount,
    studentWithPortfolioCount
  });

  if (studentCount > 0) {
    const students = await prisma.user.findMany({
      where: { role: 'student' },
      include: { Portfolio: true },
      take: 5
    });
    console.log('Sample Students:', JSON.stringify(students, null, 2));
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
