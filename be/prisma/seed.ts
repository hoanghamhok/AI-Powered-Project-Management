import { PrismaClient } from '@prisma/client';
import { seedEnterpriseData } from './seed/enterprise-generator';

const prisma = new PrismaClient();

async function main() {
  await seedEnterpriseData(prisma);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
