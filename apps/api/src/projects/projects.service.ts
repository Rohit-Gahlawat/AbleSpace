import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(workspaceId: string) {
    return this.prisma.project.findMany({
      where: { workspaceId },
      include: { lead: true, _count: { select: { tasks: true } } },
      orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async findOne(workspaceId: string, id: string) {
    const project = await this.prisma.project.findFirst({
      where: { id, workspaceId },
      include: { lead: true, _count: { select: { tasks: true } } },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  async create(workspaceId: string, dto: CreateProjectDto) {
    const last = await this.prisma.project.findFirst({
      where: { workspaceId },
      orderBy: { position: 'desc' },
      select: { position: true },
    });

    return this.prisma.project.create({
      data: {
        workspaceId,
        name: dto.name,
        description: dto.description,
        priority: dto.priority ?? 'NO_PRIORITY',
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        leadId: dto.leadId ?? null,
        position: (last?.position ?? -1) + 1,
      },
      include: { lead: true, _count: { select: { tasks: true } } },
    });
  }

  async update(workspaceId: string, id: string, dto: UpdateProjectDto) {
    await this.findOne(workspaceId, id);

    return this.prisma.project.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        priority: dto.priority,
        dueDate:
          dto.dueDate === undefined ? undefined : dto.dueDate ? new Date(dto.dueDate) : null,
        leadId: dto.leadId,
      },
      include: { lead: true, _count: { select: { tasks: true } } },
    });
  }

  async remove(workspaceId: string, id: string) {
    const { count } = await this.prisma.project.deleteMany({ where: { id, workspaceId } });

    if (count === 0) {
      throw new NotFoundException('Project not found');
    }
  }
}
