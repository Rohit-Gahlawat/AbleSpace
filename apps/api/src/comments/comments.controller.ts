import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';

import { CreateCommentDto } from './dto/create-comment.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SessionGuard } from '../common/guards/session.guard';
import type { RequestUser } from '../common/types/request-user';
import { PrismaService } from '../prisma/prisma.service';

@Controller('tasks/:taskId/comments')
@UseGuards(SessionGuard)
export class CommentsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async findAll(@CurrentUser() user: RequestUser, @Param('taskId') taskId: string) {
    await this.assertTaskInWorkspace(user.workspaceId, taskId);

    return this.prisma.comment.findMany({
      where: { taskId, parentId: null },
      orderBy: { createdAt: 'asc' },
      include: {
        author: true,
        replies: { include: { author: true }, orderBy: { createdAt: 'asc' } },
      },
    });
  }

  @Post()
  async create(
    @CurrentUser() user: RequestUser,
    @Param('taskId') taskId: string,
    @Body() dto: CreateCommentDto,
  ) {
    await this.assertTaskInWorkspace(user.workspaceId, taskId);

    return this.prisma.comment.create({
      data: {
        taskId,
        authorId: user.userId,
        body: dto.body,
        parentId: dto.parentId ?? null,
      },
      include: { author: true, replies: { include: { author: true } } },
    });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentUser() user: RequestUser,
    @Param('taskId') taskId: string,
    @Param('id') id: string,
  ) {
    await this.assertTaskInWorkspace(user.workspaceId, taskId);

    const { count } = await this.prisma.comment.deleteMany({
      where: { id, taskId, authorId: user.userId },
    });

    if (count === 0) {
      throw new NotFoundException('Comment not found');
    }
  }

  private async assertTaskInWorkspace(workspaceId: string, taskId: string) {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, workspaceId },
      select: { id: true },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }
  }
}
