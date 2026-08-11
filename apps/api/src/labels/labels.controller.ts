import { Controller, Get, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SessionGuard } from '../common/guards/session.guard';
import type { RequestUser } from '../common/types/request-user';
import { PrismaService } from '../prisma/prisma.service';

@Controller('labels')
@UseGuards(SessionGuard)
export class LabelsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  findAll(@CurrentUser() user: RequestUser) {
    return this.prisma.label.findMany({
      where: { workspaceId: user.workspaceId },
      orderBy: { name: 'asc' },
    });
  }
}
