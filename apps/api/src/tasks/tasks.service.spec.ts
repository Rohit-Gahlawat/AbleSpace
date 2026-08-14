import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { PrismaService } from '../prisma/prisma.service';
import { TasksService } from './tasks.service';
import { Priority, TaskStatus } from '../generated/prisma/enums';

const WORKSPACE_ID = 'workspace-1';

function taskRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: 'task-1',
    workspaceId: WORKSPACE_ID,
    projectId: null,
    parentId: null,
    title: 'Write API Documentation',
    description: null,
    status: TaskStatus.TODO,
    priority: Priority.HIGH,
    dueDate: null,
    startDate: null,
    reporterId: null,
    position: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    project: null,
    reporter: null,
    assignees: [],
    labels: [],
    _count: { subtasks: 0 },
    ...overrides,
  };
}

describe('TasksService', () => {
  let service: TasksService;
  let prisma: {
    task: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
      update: jest.Mock;
      deleteMany: jest.Mock;
    };
    activity: { createMany: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      task: {
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn().mockResolvedValue(taskRecord()),
        update: jest.fn().mockResolvedValue(taskRecord()),
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      activity: { createMany: jest.fn().mockResolvedValue({ count: 0 }) },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [TasksService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = moduleRef.get(TasksService);
  });

  describe('findAll', () => {
    it('only returns top level tasks for the workspace', async () => {
      await service.findAll(WORKSPACE_ID, {});

      const where = prisma.task.findMany.mock.calls[0][0].where;
      expect(where.workspaceId).toBe(WORKSPACE_ID);
      expect(where.parentId).toBeNull();
    });

    it('leaves filters out of the query when none are given', async () => {
      await service.findAll(WORKSPACE_ID, {});

      const where = prisma.task.findMany.mock.calls[0][0].where;
      expect(where.status).toBeUndefined();
      expect(where.priority).toBeUndefined();
      expect(where.title).toBeUndefined();
    });

    it('applies status, priority and search filters', async () => {
      await service.findAll(WORKSPACE_ID, {
        status: [TaskStatus.TODO, TaskStatus.DOING],
        priority: [Priority.HIGH],
        search: 'api',
      });

      const where = prisma.task.findMany.mock.calls[0][0].where;
      expect(where.status).toEqual({ in: [TaskStatus.TODO, TaskStatus.DOING] });
      expect(where.priority).toEqual({ in: [Priority.HIGH] });
      expect(where.title).toEqual({ contains: 'api', mode: 'insensitive' });
    });

    it('flattens assignees and labels onto the returned task', async () => {
      prisma.task.findMany.mockResolvedValue([
        taskRecord({
          assignees: [{ user: { id: 'user-1', name: 'Admin' } }],
          labels: [{ label: { id: 'label-1', name: 'Deployment' } }],
        }),
      ]);

      const [task] = await service.findAll(WORKSPACE_ID, {});

      expect(task.assignees).toEqual([{ id: 'user-1', name: 'Admin' }]);
      expect(task.labels).toEqual([{ id: 'label-1', name: 'Deployment' }]);
    });
  });

  describe('move', () => {
    it('drops the card at the end of the column when no position is given', async () => {
      prisma.task.findFirst.mockImplementation((args: { orderBy?: unknown }) =>
        args.orderBy ? { position: 4 } : taskRecord(),
      );

      await service.move(WORKSPACE_ID, 'actor-1', 'task-1', {
        status: TaskStatus.DOING,
      });

      expect(prisma.task.update.mock.calls[0][0].data.position).toBe(5);
    });

    it('keeps an explicit position', async () => {
      await service.move(WORKSPACE_ID, 'actor-1', 'task-1', {
        status: TaskStatus.DOING,
        position: 2,
      });

      expect(prisma.task.update.mock.calls[0][0].data.position).toBe(2);
    });
  });

  describe('remove', () => {
    it('throws when the task is not in the workspace', async () => {
      prisma.task.deleteMany.mockResolvedValue({ count: 0 });

      await expect(service.remove(WORKSPACE_ID, 'missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
