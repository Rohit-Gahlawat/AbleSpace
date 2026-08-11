import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import type { Prisma } from '../generated/prisma/client';
import { CreateTaskDto } from './dto/create-task.dto';
import { MoveTaskDto } from './dto/move-task.dto';
import { QueryTasksDto } from './dto/query-tasks.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

const taskInclude = {
  project: { select: { id: true, name: true } },
  reporter: true,
  assignees: { include: { user: true } },
  labels: { include: { label: true } },
  _count: { select: { subtasks: true } },
} satisfies Prisma.TaskInclude;

type TaskRecord = Prisma.TaskGetPayload<{ include: typeof taskInclude }>;

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(workspaceId: string, query: QueryTasksDto) {
    const tasks = await this.prisma.task.findMany({
      where: {
        workspaceId,
        parentId: null,
        ...(query.projectId ? { projectId: query.projectId } : {}),
        ...(query.status?.length ? { status: { in: query.status } } : {}),
        ...(query.priority?.length ? { priority: { in: query.priority } } : {}),
        ...(query.search
          ? { title: { contains: query.search, mode: 'insensitive' } }
          : {}),
        ...(query.assigneeIds?.length
          ? { assignees: { some: { userId: { in: query.assigneeIds } } } }
          : {}),
        ...(query.labelIds?.length
          ? { labels: { some: { labelId: { in: query.labelIds } } } }
          : {}),
      },
      include: taskInclude,
      orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
    });

    return tasks.map((task) => this.toDto(task));
  }

  async findOne(workspaceId: string, id: string) {
    const task = await this.prisma.task.findFirst({
      where: { id, workspaceId },
      include: {
        ...taskInclude,
        subtasks: { include: taskInclude, orderBy: { position: 'asc' } },
        comments: {
          where: { parentId: null },
          orderBy: { createdAt: 'asc' },
          include: {
            author: true,
            replies: { include: { author: true }, orderBy: { createdAt: 'asc' } },
          },
        },
        activity: {
          orderBy: { createdAt: 'desc' },
          include: { actor: true },
        },
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return {
      ...this.toDto(task),
      subtasks: task.subtasks.map((subtask) => this.toDto(subtask)),
      comments: task.comments,
      activity: task.activity,
    };
  }

  async create(workspaceId: string, reporterId: string, dto: CreateTaskDto) {
    const status = dto.status ?? 'BACKLOG';
    const position = dto.position ?? (await this.nextPosition(workspaceId, status));

    const task = await this.prisma.task.create({
      data: {
        workspaceId,
        reporterId,
        title: dto.title,
        description: dto.description,
        status,
        priority: dto.priority ?? 'NO_PRIORITY',
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        projectId: dto.projectId ?? null,
        parentId: dto.parentId ?? null,
        position,
        assignees: dto.assigneeIds?.length
          ? { create: dto.assigneeIds.map((userId) => ({ userId })) }
          : undefined,
        labels: dto.labelIds?.length
          ? { create: dto.labelIds.map((labelId) => ({ labelId })) }
          : undefined,
      },
      include: taskInclude,
    });

    return this.toDto(task);
  }

  async update(workspaceId: string, actorId: string, id: string, dto: UpdateTaskDto) {
    const existing = await this.prisma.task.findFirst({ where: { id, workspaceId } });

    if (!existing) {
      throw new NotFoundException('Task not found');
    }

    const task = await this.prisma.task.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        status: dto.status,
        priority: dto.priority,
        dueDate: dto.dueDate === undefined ? undefined : dto.dueDate ? new Date(dto.dueDate) : null,
        startDate:
          dto.startDate === undefined ? undefined : dto.startDate ? new Date(dto.startDate) : null,
        projectId: dto.projectId,
        position: dto.position,
        ...(dto.assigneeIds
          ? {
              assignees: {
                deleteMany: {},
                create: dto.assigneeIds.map((userId) => ({ userId })),
              },
            }
          : {}),
        ...(dto.labelIds
          ? {
              labels: {
                deleteMany: {},
                create: dto.labelIds.map((labelId) => ({ labelId })),
              },
            }
          : {}),
      },
      include: taskInclude,
    });

    await this.recordChanges(id, actorId, existing, dto);

    return this.toDto(task);
  }

  async move(workspaceId: string, actorId: string, id: string, dto: MoveTaskDto) {
    const position = dto.position ?? (await this.nextPosition(workspaceId, dto.status));

    return this.update(workspaceId, actorId, id, {
      status: dto.status,
      position,
    });
  }

  async remove(workspaceId: string, id: string) {
    const { count } = await this.prisma.task.deleteMany({ where: { id, workspaceId } });

    if (count === 0) {
      throw new NotFoundException('Task not found');
    }
  }

  private async nextPosition(workspaceId: string, status: CreateTaskDto['status']) {
    const last = await this.prisma.task.findFirst({
      where: { workspaceId, status, parentId: null },
      orderBy: { position: 'desc' },
      select: { position: true },
    });

    return (last?.position ?? -1) + 1;
  }

  private async recordChanges(
    taskId: string,
    actorId: string,
    before: { status: string; priority: string },
    dto: UpdateTaskDto,
  ) {
    const changes: { field: string; fromValue: string; toValue: string }[] = [];

    if (dto.status && dto.status !== before.status) {
      changes.push({ field: 'status', fromValue: before.status, toValue: dto.status });
    }

    if (dto.priority && dto.priority !== before.priority) {
      changes.push({ field: 'priority', fromValue: before.priority, toValue: dto.priority });
    }

    if (changes.length > 0) {
      await this.prisma.activity.createMany({
        data: changes.map((change) => ({ ...change, taskId, actorId })),
      });
    }
  }

  private toDto(task: TaskRecord) {
    const { assignees, labels, _count, ...rest } = task;

    return {
      ...rest,
      assignees: assignees.map((entry) => entry.user),
      labels: labels.map((entry) => entry.label),
      subtaskCount: _count.subtasks,
    };
  }
}
