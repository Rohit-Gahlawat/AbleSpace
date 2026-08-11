import { Controller, Get, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SessionGuard } from '../common/guards/session.guard';
import type { RequestUser } from '../common/types/request-user';
import { PrismaService } from '../prisma/prisma.service';

@Controller('members')
@UseGuards(SessionGuard)
export class MembersController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async findAll(@CurrentUser() user: RequestUser) {
    const memberships = await this.prisma.workspaceMember.findMany({
      where: { workspaceId: user.workspaceId },
      include: { user: true },
      orderBy: { createdAt: 'asc' },
    });

    return memberships.map((membership) => membership.user);
  }
}
