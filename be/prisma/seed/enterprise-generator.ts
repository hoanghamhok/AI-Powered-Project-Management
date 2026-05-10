import { Prisma, PrismaClient, ProjectRole, SystemRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { DomainConfig, domainConfigs } from './domain-config';
import { hashSeed, SeededRandom } from './rng';

const SEED_PREFIX = 'entseed';
const DEFAULT_TASKS_PER_PROJECT = 700;
const DEFAULT_MIN_TASKS_PER_PROJECT = 650;
const DEFAULT_MAX_TASKS_PER_PROJECT = 800;
const BATCH_SIZE = 500;

type ColumnKey = 'backlog' | 'ready' | 'progress' | 'review' | 'blocked' | 'done';
type GeneratedTask = Prisma.TaskCreateManyInput & {
  status: ColumnKey;
  epic: string;
  assigneeIds: string[];
};

interface RealUserSeedOptions {
  ownerId?: string;
  memberUserIds: string[];
}

const columnDefs: { key: ColumnKey; title: string; position: number; closed: boolean }[] = [
  { key: 'backlog', title: 'Backlog', position: 1000, closed: false },
  { key: 'ready', title: 'Ready for Sprint', position: 2000, closed: false },
  { key: 'progress', title: 'In Progress', position: 3000, closed: false },
  { key: 'review', title: 'In Review', position: 4000, closed: false },
  { key: 'blocked', title: 'Blocked', position: 5000, closed: false },
  { key: 'done', title: 'Done', position: 6000, closed: true },
];

const roleProfiles = [
  'frontend-engineer',
  'backend-engineer',
  'mobile-engineer',
  'qa-engineer',
  'devops-engineer',
  'data-engineer',
  'product-manager',
  'designer',
  'security-engineer',
  'engineering-manager',
  'support-engineer',
  'business-analyst',
] as const;

const firstNames = [
  'Avery',
  'Jordan',
  'Morgan',
  'Taylor',
  'Riley',
  'Casey',
  'Quinn',
  'Jamie',
  'Parker',
  'Reese',
  'Drew',
  'Rowan',
  'Alex',
  'Sam',
  'Mina',
  'Noah',
  'Linh',
  'An',
  'Minh',
  'Trang',
];

const lastNames = [
  'Nguyen',
  'Tran',
  'Patel',
  'Garcia',
  'Kim',
  'Chen',
  'Singh',
  'Williams',
  'Brown',
  'Davis',
  'Wilson',
  'Khan',
  'Pham',
  'Le',
  'Hoang',
  'Santos',
];

const taskKinds = [
  'story',
  'subtask',
  'bug',
  'technical-debt',
  'refactor',
  'infra',
  'qa',
  'devops',
  'release',
  'incident',
] as const;

const priorities = ['P0', 'P1', 'P2', 'P3'] as const;

const actionTemplates = {
  story: ['Implement', 'Add', 'Build', 'Wire up', 'Expose', 'Create'],
  subtask: ['Finalize', 'Map', 'Connect', 'Document', 'Split', 'Backfill'],
  bug: ['Fix', 'Investigate', 'Patch', 'Correct', 'Stabilize', 'Prevent'],
  'technical-debt': ['Reduce', 'Retire', 'Replace', 'Audit', 'Clean up', 'Untangle'],
  refactor: ['Refactor', 'Extract', 'Normalize', 'Rework', 'Modularize', 'Simplify'],
  infra: ['Provision', 'Tune', 'Harden', 'Automate', 'Scale', 'Instrument'],
  qa: ['Validate', 'Regression test', 'Add coverage for', 'Load test', 'Verify', 'Reproduce'],
  devops: ['Configure', 'Roll out', 'Pin', 'Monitor', 'Rotate', 'Gate'],
  release: ['Prepare', 'Cut', 'Validate', 'Coordinate', 'Publish', 'Freeze'],
  incident: ['Mitigate', 'Postmortem', 'Rollback', 'Triage', 'Recover', 'Contain'],
} as const;

const acceptanceTemplates = [
  'Given an authorized user, when the workflow is submitted, then the system persists the change and records an audit event.',
  'Given stale or duplicate upstream events, when the worker retries, then the operation remains idempotent.',
  'Given validation errors, when the user corrects the form, then inline errors clear without losing draft data.',
  'Given a partial outage, when the dependency times out, then the user receives a recoverable state and support telemetry is emitted.',
  'Given a feature flag is disabled, when the route is requested, then the legacy behavior remains unchanged.',
  'Given production-sized data, when the page loads, then the p95 response stays within the agreed service target.',
];

const technicalDetails = [
  'Add structured logging with correlation IDs and include project, task, and tenant context where available.',
  'Keep the API contract backward compatible and add migration-safe defaults for existing records.',
  'Use batched reads and avoid per-row lookups in the main request path.',
  'Add component-level tests for edge cases and one integration test for the happy path.',
  'Update dashboards and alert thresholds so on-call can distinguish retryable failures from data defects.',
  'Document rollout steps, rollback criteria, and manual verification commands in the release checklist.',
];

const blockReasons = [
  'Waiting for vendor sandbox credentials to be approved.',
  'Blocked by unresolved schema decision from architecture review.',
  'Dependent API contract changed during sprint planning.',
  'Needs security review before production rollout.',
  'QA environment data is missing required edge cases.',
  'Release branch is frozen for production hotfix validation.',
];

const commentTemplates = [
  'QA found one edge case around retries; attaching notes to the test run.',
  'The implementation is ready for review after the migration script lands.',
  'Product confirmed the acceptance criteria. No scope change for this sprint.',
  'Observed the same behavior in staging. Keeping this linked to the release checklist.',
  'Need backend confirmation before mobile can finish the empty state.',
  'Follow-up from incident review: add a dashboard panel before closing.',
];

function id(...parts: (string | number)[]) {
  return [SEED_PREFIX, ...parts].join('_').replace(/[^a-zA-Z0-9_:-]/g, '_').toLowerCase();
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function chunk<T>(items: T[], size = BATCH_SIZE) {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

async function createManyInChunks<T>(
  label: string,
  items: T[],
  createMany: (data: T[]) => Promise<unknown>,
) {
  for (const batch of chunk(items)) {
    await createMany(batch);
  }
  if (items.length > 0) {
    console.log(`  ${label}: ${items.length}`);
  }
}

function dateWithinProject(projectStart: Date, taskIndex: number, totalTasks: number, rng: SeededRandom) {
  const progress = taskIndex / totalTasks;
  const jitter = rng.int(-4, 6);
  return addDays(projectStart, Math.floor(170 * progress) + jitter);
}

function getReferenceDate() {
  const value = process.env.ENTERPRISE_REFERENCE_DATE?.trim();
  if (!value) return new Date();

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`ENTERPRISE_REFERENCE_DATE must be a valid date. Received: ${value}`);
  }
  return parsed;
}

function projectTaskCount(project: DomainConfig) {
  const override = process.env.ENTERPRISE_TASKS_PER_PROJECT;
  if (override) {
    const exactCount = Number(override);
    if (!Number.isInteger(exactCount) || exactCount < 100) {
      throw new Error('ENTERPRISE_TASKS_PER_PROJECT must be an integer >= 100');
    }
    return exactCount;
  }

  const rng = new SeededRandom(hashSeed(`task-count:${project.key}:${DEFAULT_TASKS_PER_PROJECT}`));
  return rng.int(DEFAULT_MIN_TASKS_PER_PROJECT, DEFAULT_MAX_TASKS_PER_PROJECT);
}

function projectStartDate(project: DomainConfig, referenceDate: Date) {
  const rng = new SeededRandom(hashSeed(`project-start:${project.key}`));
  return addDays(referenceDate, -rng.int(120, 180));
}

function projectUpdatedAt(referenceDate: Date, rng: SeededRandom) {
  return addDays(referenceDate, rng.int(-3, 1));
}

function dueDateForStatus(status: ColumnKey, referenceDate: Date, rng: SeededRandom) {
  switch (status) {
    case 'done':
      return addDays(referenceDate, -rng.int(7, 120));
    case 'review':
      return addDays(referenceDate, rng.int(-5, 7));
    case 'progress':
      return addDays(referenceDate, rng.int(-3, 21));
    case 'blocked':
      return addDays(referenceDate, rng.chance(0.5) ? -rng.int(3, 45) : rng.int(3, 45));
    case 'ready':
      return addDays(referenceDate, rng.chance(0.18) ? -rng.int(1, 18) : rng.int(7, 60));
    case 'backlog':
    default:
      return addDays(referenceDate, rng.chance(0.1) ? -rng.int(1, 21) : rng.int(14, 90));
  }
}

function updatedAtForStatus(status: ColumnKey, createdAt: Date, dueDate: Date, referenceDate: Date, rng: SeededRandom) {
  if (status === 'done') {
    return addDays(dueDate, rng.int(-5, 3));
  }
  if (status === 'review' || status === 'progress' || status === 'blocked') {
    return addDays(referenceDate, rng.int(-5, 1));
  }
  if (status === 'ready') {
    return addDays(referenceDate, rng.int(-12, 1));
  }

  const candidate = addDays(createdAt, rng.int(2, 45));
  return candidate > referenceDate ? addDays(referenceDate, -rng.int(1, 10)) : candidate;
}

function clampAfterCreated(date: Date, createdAt: Date) {
  return date < createdAt ? addDays(createdAt, 1) : date;
}

function eventBeforeUpdate(createdAt: Date, updatedAt: Date, rng: SeededRandom) {
  const start = createdAt.getTime();
  const end = Math.max(start, updatedAt.getTime() - 60 * 60 * 1000);
  if (end <= start) return createdAt;
  return new Date(start + Math.floor(rng.next() * (end - start)));
}

function taskStatus(index: number, total: number): ColumnKey {
  const doneLimit = Math.floor(total * 0.2);
  const reviewLimit = doneLimit + Math.floor(total * 0.15);
  const blockedLimit = reviewLimit + Math.floor(total * 0.1);
  const progressLimit = blockedLimit + Math.floor(total * 0.1);
  const readyLimit = progressLimit + Math.floor(total * 0.15);

  if (index < doneLimit) return 'done';
  if (index < reviewLimit) return 'review';
  if (index < blockedLimit) return 'blocked';
  if (index < progressLimit) return 'progress';
  if (index < readyLimit) return 'ready';
  return 'backlog';
}

function taskKind(index: number, rng: SeededRandom): (typeof taskKinds)[number] {
  if (index % 97 === 0) return 'incident';
  if (index % 41 === 0) return 'release';
  const weighted = [
    'story',
    'story',
    'story',
    'subtask',
    'subtask',
    'bug',
    'bug',
    'technical-debt',
    'refactor',
    'infra',
    'qa',
    'devops',
  ] as const;
  return rng.pick(weighted);
}

function priorityFor(kind: (typeof taskKinds)[number], status: ColumnKey, rng: SeededRandom) {
  if (kind === 'incident') return rng.chance(0.7) ? 'P0' : 'P1';
  if (kind === 'bug' && status === 'blocked') return rng.pick(['P0', 'P1', 'P1', 'P2'] as const);
  if (kind === 'release') return rng.pick(['P1', 'P1', 'P2'] as const);
  return rng.pick(priorities);
}

function buildTaskTitle(project: DomainConfig, index: number, kind: (typeof taskKinds)[number], rng: SeededRandom) {
  const epic = project.epics[index % project.epics.length];
  const component = project.components[(index + rng.int(0, project.components.length - 1)) % project.components.length];
  const action = rng.pick(actionTemplates[kind]);
  const workflow = project.workflows[(index + rng.int(0, project.workflows.length - 1)) % project.workflows.length];
  const ticket = `${project.key.toUpperCase().replace(/-/g, '')}-${String(index + 1).padStart(4, '0')}`;

  if (kind === 'bug') {
    return `${ticket} Fix ${workflow} defect in ${component}`;
  }
  if (kind === 'incident') {
    return `${ticket} ${action} production incident: ${rng.pick(project.incidentThemes)}`;
  }
  if (kind === 'release') {
    return `${ticket} ${action} release validation for ${epic}`;
  }
  return `${ticket} ${action} ${workflow} for ${epic} in ${component}`;
}

function buildTaskDescription(
  project: DomainConfig,
  title: string,
  kind: (typeof taskKinds)[number],
  priority: string,
  rng: SeededRandom,
) {
  const component = rng.pick(project.components);
  const integration = rng.pick(project.integrations);
  const persona = rng.pick(project.personas);
  const qaFocus = rng.pick(project.qaFocus);
  const labels = [
    project.key,
    kind,
    component,
    priority.toLowerCase(),
    rng.pick(['frontend', 'backend', 'mobile', 'qa', 'devops', 'data', 'security']),
  ];
  const criteria = rng.sample(acceptanceTemplates, 3);
  const details = rng.sample(technicalDetails, 2);

  return [
    `Priority: ${priority}`,
    `Labels: ${labels.join(', ')}`,
    `Component: ${component}`,
    `Primary user: ${persona}`,
    `Integration: ${integration}`,
    '',
    `Context: ${title} is part of the ${project.name} roadmap. The work should support ${persona} workflows without changing existing behavior for released users.`,
    '',
    'Technical description:',
    `- Cover the ${qaFocus} scenario and confirm behavior against production-like data.`,
    ...details.map((line) => `- ${line}`),
    '',
    'Acceptance criteria:',
    ...criteria.map((line) => `- ${line}`),
  ].join('\n');
}

function estimateHours(kind: (typeof taskKinds)[number], rng: SeededRandom) {
  const ranges: Record<typeof taskKinds[number], [number, number]> = {
    story: [8, 40],
    subtask: [2, 16],
    bug: [3, 24],
    'technical-debt': [8, 32],
    refactor: [8, 40],
    infra: [6, 30],
    qa: [3, 18],
    devops: [4, 24],
    release: [4, 18],
    incident: [2, 16],
  };
  const [min, max] = ranges[kind];
  return rng.int(min, max);
}

function difficulty(kind: (typeof taskKinds)[number], priority: string, rng: SeededRandom) {
  const base = kind === 'incident' || priority === 'P0' ? 4 : kind === 'subtask' || kind === 'qa' ? 2 : 3;
  return Math.max(1, Math.min(5, base + rng.int(-1, 1)));
}

function projectMemberIds(projectKey: string, count = 7) {
  return Array.from({ length: count }, (_, index) => id('user', projectKey, index + 1));
}

function parseCommaSeparatedIds(value?: string) {
  if (!value) return [];
  return [...new Set(value.split(',').map((item) => item.trim()).filter(Boolean))];
}

async function loadRealUserSeedOptions(prisma: PrismaClient): Promise<RealUserSeedOptions> {
  const ownerId = process.env.ENTERPRISE_OWNER_ID?.trim() || undefined;
  const memberUserIds = parseCommaSeparatedIds(process.env.ENTERPRISE_MEMBER_USER_IDS);
  const userIdsToValidate = [...new Set([ownerId, ...memberUserIds].filter(Boolean))] as string[];

  if (userIdsToValidate.length === 0) {
    return { ownerId, memberUserIds };
  }

  const existingUsers = await prisma.user.findMany({
    where: { id: { in: userIdsToValidate } },
    select: { id: true },
  });
  const existingUserIds = new Set(existingUsers.map((user) => user.id));
  const missingUserIds = userIdsToValidate.filter((userId) => !existingUserIds.has(userId));

  if (missingUserIds.length > 0) {
    throw new Error(
      `Enterprise seed user validation failed. These user IDs do not exist: ${missingUserIds.join(', ')}`,
    );
  }

  return { ownerId, memberUserIds };
}

export async function resetEnterpriseSeed(prisma: PrismaClient) {
  console.log('Resetting previous enterprise seed rows');
  await prisma.commentMention.deleteMany({ where: { commentId: { startsWith: SEED_PREFIX } } });
  await prisma.comment.deleteMany({ where: { id: { startsWith: SEED_PREFIX } } });
  await prisma.notification.deleteMany({ where: { id: { startsWith: SEED_PREFIX } } });
  await prisma.activityLog.deleteMany({ where: { id: { startsWith: SEED_PREFIX } } });
  await prisma.taskDependency.deleteMany({ where: { id: { startsWith: SEED_PREFIX } } });
  await prisma.taskBlock.deleteMany({ where: { id: { startsWith: SEED_PREFIX } } });
  await prisma.taskAssignee.deleteMany({ where: { taskId: { startsWith: SEED_PREFIX } } });
  await prisma.task.deleteMany({ where: { id: { startsWith: SEED_PREFIX } } });
  await prisma.column.deleteMany({ where: { id: { startsWith: SEED_PREFIX } } });
  await prisma.projectMember.deleteMany({ where: { id: { startsWith: SEED_PREFIX } } });
  await prisma.invitation.deleteMany({ where: { id: { startsWith: SEED_PREFIX } } });
  await prisma.project.deleteMany({ where: { id: { startsWith: SEED_PREFIX } } });
  await prisma.user.deleteMany({ where: { id: { startsWith: SEED_PREFIX } } });
}

async function seedUsers(prisma: PrismaClient) {
  const password = await bcrypt.hash('Password123!', 10);
  const users: Prisma.UserCreateManyInput[] = [
    {
      id: id('user', 'platform-admin'),
      email: 'platform.admin@enterprise-seed.local',
      username: 'platform.admin',
      fullName: 'Platform Admin',
      password,
      role: SystemRole.SUPER_ADMIN,
      isPremium: true,
      premiumExpiresAt: addDays(new Date(), 365),
      createdAt: addDays(new Date(), -420),
    },
  ];

  for (const project of domainConfigs) {
    const rng = new SeededRandom(hashSeed(project.key));
    projectMemberIds(project.key).forEach((userId, index) => {
      const role = roleProfiles[index % roleProfiles.length];
      const firstName = firstNames[(index + rng.int(0, firstNames.length - 1)) % firstNames.length];
      const lastName = lastNames[(index * 3 + rng.int(0, lastNames.length - 1)) % lastNames.length];
      const username = `${project.key}.${role}.${index + 1}`.replace(/-/g, '.');
      users.push({
        id: userId,
        email: `${username}@enterprise-seed.local`,
        username,
        fullName: `${firstName} ${lastName}`,
        password,
        role: SystemRole.USER,
        isPremium: index < 3,
        createdAt: addDays(new Date(), -project.startOffsetDays - rng.int(20, 90)),
      });
    });
  }

  await createManyInChunks('users', users, (data) => prisma.user.createMany({ data, skipDuplicates: true }));
}

async function seedProjectSkeleton(
  prisma: PrismaClient,
  project: DomainConfig,
  referenceDate: Date,
  realUsers: RealUserSeedOptions,
) {
  const mockOwnerId = projectMemberIds(project.key)[0];
  const ownerId = realUsers.ownerId ?? mockOwnerId;
  const projectId = id('project', project.key);
  const rng = new SeededRandom(hashSeed(`project-skeleton:${project.key}`));
  const createdAt = projectStartDate(project, referenceDate);
  const updatedAt = projectUpdatedAt(referenceDate, rng);

  await prisma.project.createMany({
    data: [
      {
        id: projectId,
        name: project.projectName,
        description: project.description,
        summary: project.summary,
        ownerId,
        created_at: createdAt,
        updated_at: updatedAt,
      },
    ],
    skipDuplicates: true,
  });

  await prisma.column.createMany({
    data: columnDefs.map((column) => ({
      id: id('column', project.key, column.key),
      title: column.title,
      position: column.position,
      closed: column.closed,
      projectId,
      createdAt,
      updatedAt,
    })),
    skipDuplicates: true,
  });

  const mockProjectMembers: Prisma.ProjectMemberCreateManyInput[] = projectMemberIds(project.key).map((userId, index) => ({
      id: id('member', project.key, index + 1),
      projectId,
      userId,
      role: realUsers.ownerId && userId === mockOwnerId ? ProjectRole.ADMIN : index === 0 ? ProjectRole.OWNER : index <= 2 ? ProjectRole.ADMIN : ProjectRole.MEMBER,
      joinedAt: addDays(createdAt, rngOffset(project.key, index)),
    }));

  const attachedRealUserIds = [...new Set([ownerId, ...realUsers.memberUserIds])];
  const realProjectMembers: Prisma.ProjectMemberCreateManyInput[] = attachedRealUserIds.map((userId, index) => ({
    id: id('member', project.key, 'real', index + 1),
    projectId,
    userId,
    role: userId === ownerId ? ProjectRole.OWNER : ProjectRole.MEMBER,
    joinedAt: createdAt,
  }));

  await prisma.projectMember.createMany({
    data: [...mockProjectMembers, ...realProjectMembers],
    skipDuplicates: true,
  });

  return projectId;
}

function rngOffset(projectKey: string, index: number) {
  return new SeededRandom(hashSeed(`${projectKey}:member:${index}`)).int(0, 18);
}

function generateProjectTasks(project: DomainConfig, projectId: string, tasksPerProject: number, referenceDate: Date) {
  const rng = new SeededRandom(hashSeed(`tasks:${project.key}`));
  const members = projectMemberIds(project.key);
  const startDate = projectStartDate(project, referenceDate);
  const tasks: GeneratedTask[] = [];
  const assignees: Prisma.TaskAssigneeCreateManyInput[] = [];
  const blocks: Prisma.TaskBlockCreateManyInput[] = [];
  const dependencies: Prisma.TaskDependencyCreateManyInput[] = [];
  const comments: Prisma.CommentCreateManyInput[] = [];
  const activities: Prisma.ActivityLogCreateManyInput[] = [];
  const tasksByEpic = new Map<string, GeneratedTask[]>();

  for (let index = 0; index < tasksPerProject; index += 1) {
    const status = taskStatus(index, tasksPerProject);
    const kind = taskKind(index, rng);
    const priority = priorityFor(kind, status, rng);
    const title = buildTaskTitle(project, index, kind, rng);
    const epic = project.epics[index % project.epics.length];
    const createdAt = dateWithinProject(startDate, index, tasksPerProject, rng);
    const dueDate = dueDateForStatus(status, referenceDate, rng);
    const updatedAt = clampAfterCreated(updatedAtForStatus(status, createdAt, dueDate, referenceDate, rng), createdAt);
    const taskId = id('task', project.key, index + 1);
    const taskAssignees = rng.sample(members, rng.chance(0.22) ? 2 : 1);
    const completedAt = status === 'done' ? updatedAt : null;

    const task: GeneratedTask = {
      id: taskId,
      title,
      description: buildTaskDescription(project, title, kind, priority, rng),
      position: (index + 1) * 1000,
      dueDate,
      projectId,
      columnId: id('column', project.key, status),
      created_at: createdAt,
      updated_at: updatedAt,
      completedAt,
      estimateHours: estimateHours(kind, rng),
      difficulty: difficulty(kind, priority, rng),
      blocked: status === 'blocked',
      status,
      epic,
      assigneeIds: taskAssignees,
    };

    tasks.push(task);
    taskAssignees.forEach((userId) => assignees.push({ taskId, userId }));

    activities.push({
      id: id('activity', project.key, index + 1, 'created'),
      userId: taskAssignees[0],
      projectId,
      entityId: taskId,
      entityType: 'TASK',
      action: 'TASK_CREATED',
      metadata: { title, priority, labels: [project.key, kind, epic], estimateHours: task.estimateHours },
      createdAt: eventBeforeUpdate(createdAt, updatedAt, rng),
    });

    if (status === 'done') {
      activities.push({
        id: id('activity', project.key, index + 1, 'completed'),
        userId: taskAssignees[0],
        projectId,
        entityId: taskId,
        entityType: 'TASK',
        action: 'TASK_COMPLETED',
        metadata: { title, completedAt, releaseCandidate: index % 41 === 0 },
        createdAt: eventBeforeUpdate(createdAt, updatedAt, rng),
      });
    }

    if (status === 'review') {
      activities.push({
        id: id('activity', project.key, index + 1, 'review'),
        userId: taskAssignees[0],
        projectId,
        entityId: taskId,
        entityType: 'TASK',
        action: 'TASK_MOVED',
        metadata: { title, toColumnTitle: 'In Review', reviewerNeeded: rng.pick(['frontend', 'backend', 'qa', 'security']) },
        createdAt: eventBeforeUpdate(createdAt, updatedAt, rng),
      });
    }

    if (status === 'blocked') {
      const blockedAt = eventBeforeUpdate(createdAt, updatedAt, rng);
      blocks.push({
        id: id('block', project.key, index + 1),
        taskId,
        reason: rng.pick(blockReasons),
        blockedAt,
        unblockedAt: null,
      });
      activities.push({
        id: id('activity', project.key, index + 1, 'blocked'),
        userId: taskAssignees[0],
        projectId,
        entityId: taskId,
        entityType: 'TASK',
        action: 'TASK_BLOCKED',
        metadata: { title, reason: rng.pick(blockReasons), priority },
        createdAt: blockedAt,
      });
    }

    if (rng.chance(0.22)) {
      const authorId = rng.pick(taskAssignees);
      const commentCreatedAt = eventBeforeUpdate(createdAt, updatedAt, rng);
      comments.push({
        id: id('comment', project.key, index + 1, 1),
        content: `${rng.pick(commentTemplates)} (${priority}, ${epic})`,
        taskId,
        authorId,
        parentId: null,
        createdAt: commentCreatedAt,
        updatedAt: commentCreatedAt,
        deletedAt: null,
      });
    }

    const epicTasks = tasksByEpic.get(epic) ?? [];
    if (epicTasks.length > 0 && (status === 'blocked' || rng.chance(0.28))) {
      const dependency = rng.pick(epicTasks.slice(Math.max(0, epicTasks.length - 24)));
      dependencies.push({
        id: id('dep', project.key, index + 1, dependency.id as string),
        taskId,
        dependsOnTaskId: dependency.id as string,
        createdAt: eventBeforeUpdate(createdAt, updatedAt, rng),
      });
    }

    epicTasks.push(task);
    tasksByEpic.set(epic, epicTasks);
  }

  return { tasks, assignees, blocks, dependencies, comments, activities };
}

async function seedProjectWork(prisma: PrismaClient, project: DomainConfig, projectId: string, tasksPerProject: number, referenceDate: Date) {
  const { tasks, assignees, blocks, dependencies, comments, activities } = generateProjectTasks(
    project,
    projectId,
    tasksPerProject,
    referenceDate,
  );

  const taskRows = tasks.map(({ status, epic, assigneeIds, ...task }) => task);
  await createManyInChunks('tasks', taskRows, (data) => prisma.task.createMany({ data, skipDuplicates: true }));
  await createManyInChunks('task assignees', assignees, (data) => prisma.taskAssignee.createMany({ data, skipDuplicates: true }));
  await createManyInChunks('task dependencies', dependencies, (data) => prisma.taskDependency.createMany({ data, skipDuplicates: true }));
  await createManyInChunks('task blocks', blocks, (data) => prisma.taskBlock.createMany({ data, skipDuplicates: true }));
  await createManyInChunks('comments', comments, (data) => prisma.comment.createMany({ data, skipDuplicates: true }));
  await createManyInChunks('activity logs', activities, (data) => prisma.activityLog.createMany({ data, skipDuplicates: true }));
}

export async function seedEnterpriseData(prisma: PrismaClient) {
  if (process.env.RESET_ENTERPRISE_SEED === 'true') {
    await resetEnterpriseSeed(prisma);
  }

  const referenceDate = getReferenceDate();
  console.log(`Seeding ${domainConfigs.length} enterprise projects`);
  console.log(`Reference date: ${referenceDate.toISOString()}`);
  await seedUsers(prisma);
  const realUsers = await loadRealUserSeedOptions(prisma);
  const taskCounts: { project: string; count: number }[] = [];

  for (const project of domainConfigs) {
    const tasksPerProject = projectTaskCount(project);
    taskCounts.push({ project: project.projectName, count: tasksPerProject });
    console.log(`\n${project.projectName}`);
    console.log(`  task count: ${tasksPerProject}`);
    const projectId = await seedProjectSkeleton(prisma, project, referenceDate, realUsers);
    await seedProjectWork(prisma, project, projectId, tasksPerProject, referenceDate);
  }

  console.log('\nEnterprise seed summary');
  console.log(`  reference date: ${referenceDate.toISOString()}`);
  console.log(`  projects created: ${domainConfigs.length}`);
  console.log(`  task counts: ${taskCounts.map((item) => `${item.project}=${item.count}`).join('; ')}`);
  console.log(`  owner user ID used: ${realUsers.ownerId ?? 'mock project owners'}`);
  console.log(`  real members attached per project: ${new Set([realUsers.ownerId, ...realUsers.memberUserIds].filter(Boolean)).size}`);
}
