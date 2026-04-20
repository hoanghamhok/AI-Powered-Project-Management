import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const COLUMN_1 = 'cmnslacaw00323ugj2h0bah2q';
const COLUMN_2 = 'cmnslagmi00343ugjyeh0f9fb';
const PROJECT_ID = 'your-project-id';
const USER_ID = 'cmnwyx90j00007b27p5uy3n4k';

const titles = [
  'Implement JWT auth flow',
  'Fix race condition in task update',
  'Optimize Prisma query performance',
  'Add debounce to search input',
  'Refactor task service layer',
  'Build drag-and-drop Kanban UI',
  'Implement WebSocket realtime sync',
  'Fix UI flicker issue',
  'Add RBAC permission system',
  'Create task activity timeline',
  'Improve error handling middleware',
  'Add caching with Redis',
  'Fix memory leak in service',
  'Write unit tests for task module',
  'Integrate file upload feature',
  'Implement pagination API',
  'Fix API timeout issue',
  'Refactor database schema',
  'Improve logging system',
  'Add rate limiting middleware'
];

function getRandomItem(arr: any[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function main() {
  const tasks: any[] = [];

  for (let i = 0; i < 100; i++) {
    const columnId = i < 50 ? COLUMN_1 : COLUMN_2;

    tasks.push({
      title: `${getRandomItem(titles)} #${i + 1}`,
      description: 'Auto-generated task for seeding database',
      projectId: PROJECT_ID,
      columnId: columnId,
      dueDate: new Date(Date.now() + (i + 1) * 86400000), // + i ngày
      estimateHours: Math.floor(Math.random() * 6) + 1,
      difficulty: Math.floor(Math.random() * 5) + 1,
    });
  }

  console.log('Seeding 100 tasks...');

  await prisma.task.createMany({
    data: tasks,
  });

  // Nếu bạn có bảng TaskAssignee (many-to-many)
  const createdTasks = await prisma.task.findMany({
    take: 100,
    orderBy: { created_at: 'desc' },
  });

  const assignees = createdTasks.map(task => ({
    taskId: task.id,
    userId: USER_ID,
  }));

  await prisma.taskAssignee.createMany({
    data: assignees,
  });

  console.log('✅ Done seeding!');
}

main()
  .catch(e => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });