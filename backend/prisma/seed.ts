import {
  PrismaClient,
  ProjectType,
  ProjectRole,
  IssueType,
  IssuePriority,
  SprintStatus,
  EpicStatus,
  GlobalRole,
} from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const STATUSES = ['To Do', 'In Progress', 'In Review', 'Done'];
const PRIORITIES: IssuePriority[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'NONE'];
const TYPES: IssueType[] = ['STORY', 'TASK', 'BUG', 'IMPROVEMENT'];
const LABELS = ['frontend', 'backend', 'design', 'tech-debt', 'api', 'ux'];

function pick<T>(arr: T[], i: number): T {
  return arr[i % arr.length];
}

function rank(i: number): string {
  return (i + 1).toString(36).padStart(6, '0');
}

async function main(): Promise<void> {
  console.log('🌱 Seeding database...');

  // Clean slate (order matters for FK constraints; cascades handle children).
  await prisma.$transaction([
    prisma.notification.deleteMany(),
    prisma.activity.deleteMany(),
    prisma.reaction.deleteMany(),
    prisma.comment.deleteMany(),
    prisma.worklog.deleteMany(),
    prisma.attachment.deleteMany(),
    prisma.issueLink.deleteMany(),
    prisma.issueWatcher.deleteMany(),
    prisma.issue.deleteMany(),
    prisma.sprint.deleteMany(),
    prisma.epic.deleteMany(),
    prisma.column.deleteMany(),
    prisma.label.deleteMany(),
    prisma.customField.deleteMany(),
    prisma.projectMember.deleteMany(),
    prisma.project.deleteMany(),
    prisma.refreshToken.deleteMany(),
    prisma.user.deleteMany(),
    prisma.organization.deleteMany(),
  ]);

    // Allow overrides via environment variables for different environments.
  const orgName = process.env.SEED_ORG_NAME ?? 'Acme Inc';
  const orgSlug = process.env.SEED_ORG_SLUG ?? 'acme';
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@acme.dev';
  const seedPassword = process.env.SEED_PASSWORD ?? 'Password123!';

  const org = await prisma.organization.create({
    data: { name: orgName, slug: orgSlug, plan: 'PRO' },
  });

  const passwordHash = await bcrypt.hash(seedPassword, 10);
  const userData = [
    { email: adminEmail, username: 'admin', displayName: 'Alex Admin', role: GlobalRole.ADMIN },
    { email: process.env.SEED_MEMBER1_EMAIL ?? 'sara@acme.dev', username: 'sara', displayName: 'Sara Dev', role: GlobalRole.MEMBER },
    { email: process.env.SEED_MEMBER2_EMAIL ?? 'mike@acme.dev', username: 'mike', displayName: 'Mike Ops', role: GlobalRole.MEMBER },
    { email: process.env.SEED_MEMBER3_EMAIL ?? 'lena@acme.dev', username: 'lena', displayName: 'Lena Design', role: GlobalRole.MEMBER },
    { email: process.env.SEED_VIEWER_EMAIL ?? 'tom@acme.dev', username: 'tom', displayName: 'Tom Viewer', role: GlobalRole.VIEWER },
  ];
  const users = await Promise.all(
    userData.map((u) =>
      prisma.user.create({ data: { ...u, passwordHash, organizationId: org.id } })
    )
  );
  console.log(`  ✓ ${users.length} users (login with any email / ${seedPassword})`);

  const projectsConfig = [
    { key: 'APP', name: 'Web Application', type: ProjectType.SCRUM, desc: 'Customer-facing web app' },
    { key: 'BUG', name: 'Bug Tracker', type: ProjectType.KANBAN, desc: 'Defect triage board' },
  ];

  for (const cfg of projectsConfig) {
    const project = await prisma.project.create({
      data: {
        key: cfg.key,
        name: cfg.name,
        description: cfg.desc,
        type: cfg.type,
        organizationId: org.id,
        members: {
          create: [
            { userId: users[0].id, role: ProjectRole.OWNER },
            { userId: users[1].id, role: ProjectRole.ADMIN },
            { userId: users[2].id, role: ProjectRole.MEMBER },
            { userId: users[3].id, role: ProjectRole.MEMBER },
            { userId: users[4].id, role: ProjectRole.VIEWER },
          ],
        },
        columns: {
          create: STATUSES.map((status, order) => ({
            name: status,
            status,
            order,
            color: ['#42526E', '#0052CC', '#FF991F', '#36B37E'][order],
          })),
        },
        labels: { create: LABELS.map((name, i) => ({ name, color: pick(['#0052CC', '#6554C0', '#FF991F', '#DE350B'], i) })) },
        customFields: {
          create: [
            { name: 'Acceptance Criteria', type: 'TEXT', options: [] },
            { name: 'Severity', type: 'SELECT', options: ['Blocker', 'Major', 'Minor'] },
          ],
        },
      },
    });

    // Epics
    const epics = await Promise.all(
      ['Onboarding', 'Payments', 'Performance'].map((name, i) =>
        prisma.epic.create({
          data: {
            projectId: project.id,
            name,
            color: pick(['#6554C0', '#00875A', '#DE350B'], i),
            status: pick([EpicStatus.IN_PROGRESS, EpicStatus.TODO, EpicStatus.DONE], i),
            startDate: new Date(Date.now() - 20 * 86400000),
            endDate: new Date(Date.now() + (i + 1) * 30 * 86400000),
          },
        })
      )
    );

    // Sprints: 1 completed, 1 active, 1 planned
    const completedSprint = await prisma.sprint.create({
      data: {
        projectId: project.id,
        name: `${cfg.key} Sprint 1`,
        goal: 'Establish project foundations',
        status: SprintStatus.COMPLETED,
        startDate: new Date(Date.now() - 28 * 86400000),
        endDate: new Date(Date.now() - 14 * 86400000),
        completedAt: new Date(Date.now() - 14 * 86400000),
        velocity: 21,
      },
    });
    const activeSprint = await prisma.sprint.create({
      data: {
        projectId: project.id,
        name: `${cfg.key} Sprint 2`,
        goal: 'Ship core features',
        status: SprintStatus.ACTIVE,
        startDate: new Date(Date.now() - 5 * 86400000),
        endDate: new Date(Date.now() + 9 * 86400000),
      },
    });
    const plannedSprint = await prisma.sprint.create({
      data: { projectId: project.id, name: `${cfg.key} Sprint 3`, goal: 'Polish & hardening', status: SprintStatus.PLANNED },
    });

    const sprintBuckets = [completedSprint, activeSprint, plannedSprint, null]; // null = backlog

    // 28 issues per project (>50 across two projects)
    const issueCount = 28;
    for (let i = 0; i < issueCount; i++) {
      const status = i % 4 === 3 ? 'Done' : pick(STATUSES, i);
      const bucket = sprintBuckets[i % sprintBuckets.length];
      const isDone = status === 'Done';
      await prisma.issue.create({
        data: {
          key: `${cfg.key}-${i + 1}`,
          title: `${pick(TYPES, i)} task #${i + 1}: ${pick(['Implement', 'Fix', 'Refactor', 'Design', 'Test'], i)} feature`,
          description: `Detailed description for ${cfg.key}-${i + 1}. Replace with real requirements.`,
          type: pick(TYPES, i),
          status,
          priority: pick(PRIORITIES, i),
          projectId: project.id,
          reporterId: users[i % users.length].id,
          assigneeId: i % 5 === 4 ? null : users[i % 4].id,
          epicId: epics[i % epics.length].id,
          sprintId: bucket?.id ?? null,
          storyPoints: pick([1, 2, 3, 5, 8], i),
          estimatedHours: pick([2, 4, 8, 16], i),
          loggedHours: isDone ? pick([2, 4, 8], i) : 0,
          labels: [pick(LABELS, i), pick(LABELS, i + 2)],
          rank: rank(i),
          resolvedAt: isDone ? new Date(Date.now() - (i % 10) * 86400000) : null,
          dueDate: i % 3 === 0 ? new Date(Date.now() + (i % 7) * 86400000) : null,
        },
      });
    }

    // A few comments + watchers on the first issue
    const firstIssue = await prisma.issue.findUnique({ where: { key: `${cfg.key}-1` } });
    if (firstIssue) {
      await prisma.comment.create({
        data: { issueId: firstIssue.id, authorId: users[1].id, body: 'I can pick this up. @mike thoughts?' },
      });
      await prisma.comment.create({
        data: { issueId: firstIssue.id, authorId: users[2].id, body: 'Looks good, ship it 🚀' },
      });
      await prisma.issueWatcher.createMany({
        data: [
          { issueId: firstIssue.id, userId: users[0].id },
          { issueId: firstIssue.id, userId: users[1].id },
        ],
        skipDuplicates: true,
      });
    }

    console.log(`  ✓ Project ${cfg.key}: ${issueCount} issues, 3 sprints, 3 epics`);
  }

  console.log('✅ Seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());
