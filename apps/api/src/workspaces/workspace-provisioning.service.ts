import { randomBytes } from 'node:crypto';

import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { Priority, TaskStatus } from '../generated/prisma/enums';

const TEAMMATES = [
  { name: 'Admin', username: 'admin', title: 'Workspace admin' },
  { name: 'QA Team', username: 'qa-team', title: 'Quality assurance' },
  { name: 'Designer', username: 'designer', title: 'Product designer' },
  { name: 'Security', username: 'security', title: 'Security engineer' },
  { name: 'Ankit Dutta', username: 'ankit', title: 'Engineer' },
  { name: 'Chris Nolan', username: 'chris', title: 'Engineer' },
] as const;

const LABELS = [
  'Research',
  'Design',
  'Development',
  'Testing',
  'Deployment',
  'Passed',
  'Updated',
  'Audit',
  'Scheduled',
  'Review',
] as const;

const PROJECTS = [
  { name: 'Design Homepage', priority: Priority.HIGH, dueDate: '2026-09-12', lead: 'Designer' },
  { name: 'Develop Login Feature', priority: Priority.LOW, dueDate: '2026-09-15', lead: 'Chris Nolan' },
  { name: 'Test Payment Gateway', priority: Priority.MEDIUM, dueDate: '2026-09-18', lead: 'QA Team' },
] as const;

type SeedTask = {
  title: string;
  status: TaskStatus;
  priority: Priority;
  dueDate: string;
  assignee: string;
  labels: string[];
  project?: string;
  description?: string;
};

const TASKS: SeedTask[] = [
  {
    title: 'Write API Documentation',
    status: TaskStatus.TODO,
    priority: Priority.HIGH,
    dueDate: '2026-07-29',
    assignee: 'Admin',
    labels: ['Research', 'Design', 'Development', 'Testing', 'Deployment'],
    project: 'Design Homepage',
    description:
      'Create clear and detailed documentation to guide developers in using the inventory and sales metrics features effectively.',
  },
  {
    title: 'Implement Search Function',
    status: TaskStatus.TODO,
    priority: Priority.MEDIUM,
    dueDate: '2026-07-29',
    assignee: 'Admin',
    labels: ['Development', 'Deployment'],
    project: 'Design Homepage',
  },
  {
    title: 'Deploy to Production',
    status: TaskStatus.TODO,
    priority: Priority.URGENT,
    dueDate: '2026-07-29',
    assignee: 'Admin',
    labels: ['Deployment'],
    project: 'Test Payment Gateway',
  },
  {
    title: 'Code Review Completed',
    status: TaskStatus.DOING,
    priority: Priority.HIGH,
    dueDate: '2026-07-29',
    assignee: 'Admin',
    labels: ['Development', 'Deployment'],
    project: 'Develop Login Feature',
  },
  {
    title: 'Design Mockups Finalized',
    status: TaskStatus.DOING,
    priority: Priority.MEDIUM,
    dueDate: '2026-07-29',
    assignee: 'Admin',
    labels: ['Design', 'Deployment'],
    project: 'Design Homepage',
  },
  {
    title: 'Feature Testing Passed',
    status: TaskStatus.COMPLETED,
    priority: Priority.MEDIUM,
    dueDate: '2026-07-30',
    assignee: 'QA Team',
    labels: ['Testing', 'Passed'],
    project: 'Test Payment Gateway',
  },
  {
    title: 'UI Design Updated',
    status: TaskStatus.COMPLETED,
    priority: Priority.LOW,
    dueDate: '2026-07-31',
    assignee: 'Designer',
    labels: ['Design', 'Updated'],
    project: 'Design Homepage',
  },
  {
    title: 'Security Audit Scheduled',
    status: TaskStatus.COMPLETED,
    priority: Priority.HIGH,
    dueDate: '2026-08-01',
    assignee: 'Security',
    labels: ['Audit', 'Scheduled'],
    project: 'Develop Login Feature',
  },
  {
    title: 'UI Review Pending',
    status: TaskStatus.ON_HOLD,
    priority: Priority.MEDIUM,
    dueDate: '2026-08-04',
    assignee: 'Designer',
    labels: ['Design', 'Review'],
    project: 'Design Homepage',
  },
  {
    title: 'Backend Integration',
    status: TaskStatus.ON_HOLD,
    priority: Priority.HIGH,
    dueDate: '2026-08-05',
    assignee: 'Chris Nolan',
    labels: ['Development'],
    project: 'Develop Login Feature',
  },
  {
    title: 'User Feedback Review',
    status: TaskStatus.ON_HOLD,
    priority: Priority.LOW,
    dueDate: '2026-08-06',
    assignee: 'QA Team',
    labels: ['Research'],
    project: 'Test Payment Gateway',
  },
  {
    title: 'Performance Optimization',
    status: TaskStatus.ON_HOLD,
    priority: Priority.MEDIUM,
    dueDate: '2026-08-07',
    assignee: 'Chris Nolan',
    labels: ['Development', 'Testing'],
    project: 'Design Homepage',
  },
];

const SUBTASKS = [
  { title: 'Subtask 1', priority: Priority.HIGH, dueDate: '2026-09-12', assignee: 'Designer' },
  { title: 'Subtask 2', priority: Priority.LOW, dueDate: '2026-09-15', assignee: 'Chris Nolan' },
  { title: 'Subtask 3', priority: Priority.MEDIUM, dueDate: '2026-09-18', assignee: 'Admin' },
] as const;

@Injectable()
export class WorkspaceProvisioningService {
  constructor(private readonly prisma: PrismaService) {}

  async provisionGuestWorkspace() {
    const suffix = randomBytes(4).toString('hex');

    return this.prisma.$transaction(async (tx) => {
      const workspace = await tx.workspace.create({
        data: { name: 'Workspace', slug: `workspace-${suffix}` },
      });

      const owner = await tx.user.create({
        data: {
          email: `dexter.${suffix}@pyramid.app`,
          name: 'Dexter',
          username: `dexuser-${suffix}`,
          title: 'Designer',
          isGuest: true,
          memberships: { create: { workspaceId: workspace.id } },
        },
      });

      const teammates = new Map<string, string>();
      for (const teammate of TEAMMATES) {
        const user = await tx.user.create({
          data: {
            email: `${teammate.username}.${suffix}@pyramid.app`,
            name: teammate.name,
            username: `${teammate.username}-${suffix}`,
            title: teammate.title,
            memberships: { create: { workspaceId: workspace.id } },
          },
        });
        teammates.set(teammate.name, user.id);
      }

      const labels = new Map<string, string>();
      for (const name of LABELS) {
        const label = await tx.label.create({
          data: { workspaceId: workspace.id, name },
        });
        labels.set(name, label.id);
      }

      const projects = new Map<string, string>();
      for (const [index, project] of PROJECTS.entries()) {
        const created = await tx.project.create({
          data: {
            workspaceId: workspace.id,
            name: project.name,
            priority: project.priority,
            dueDate: new Date(project.dueDate),
            leadId: teammates.get(project.lead),
            position: index,
          },
        });
        projects.set(project.name, created.id);
      }

      const positions = new Map<TaskStatus, number>();
      let documentationTaskId: string | null = null;

      for (const task of TASKS) {
        const position = positions.get(task.status) ?? 0;
        positions.set(task.status, position + 1);

        const created = await tx.task.create({
          data: {
            workspaceId: workspace.id,
            projectId: task.project ? projects.get(task.project) : null,
            title: task.title,
            description: task.description,
            status: task.status,
            priority: task.priority,
            dueDate: new Date(task.dueDate),
            reporterId: owner.id,
            position,
            assignees: { create: { userId: teammates.get(task.assignee)! } },
            labels: {
              create: task.labels.map((name) => ({ labelId: labels.get(name)! })),
            },
          },
        });

        if (task.title === 'Write API Documentation') {
          documentationTaskId = created.id;
        }
      }

      if (documentationTaskId) {
        for (const [index, subtask] of SUBTASKS.entries()) {
          await tx.task.create({
            data: {
              workspaceId: workspace.id,
              parentId: documentationTaskId,
              title: subtask.title,
              status: TaskStatus.TODO,
              priority: subtask.priority,
              dueDate: new Date(subtask.dueDate),
              reporterId: owner.id,
              position: index,
              assignees: { create: { userId: teammates.get(subtask.assignee)! } },
            },
          });
        }

        await tx.comment.create({
          data: {
            taskId: documentationTaskId,
            authorId: teammates.get('Ankit Dutta')!,
            body: 'Starting on the endpoint reference today, will share a draft shortly.',
          },
        });

        await tx.activity.create({
          data: {
            taskId: documentationTaskId,
            actorId: owner.id,
            field: 'priority',
            fromValue: Priority.NO_PRIORITY,
            toValue: Priority.HIGH,
          },
        });
      }

      return { workspace, owner };
    });
  }
}
