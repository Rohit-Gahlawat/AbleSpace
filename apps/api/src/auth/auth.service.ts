import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { PrismaService } from '../prisma/prisma.service';
import { WorkspaceProvisioningService } from '../workspaces/workspace-provisioning.service';
import type { SessionTokenPayload } from '../common/types/request-user';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly provisioning: WorkspaceProvisioningService,
  ) {}

  async signInAsGuest() {
    const { owner, workspace } = await this.provisioning.provisionGuestWorkspace();

    const payload: SessionTokenPayload = { sub: owner.id, workspaceId: workspace.id };
    const token = await this.jwt.signAsync(payload);

    return { token, user: this.toProfile(owner), workspace };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { memberships: { include: { workspace: true } } },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      ...this.toProfile(user),
      workspace: user.memberships[0]?.workspace ?? null,
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    if (dto.username) {
      const taken = await this.prisma.user.findFirst({
        where: { username: dto.username, NOT: { id: userId } },
        select: { id: true },
      });

      if (taken) {
        throw new ConflictException('That username is already taken');
      }
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: dto,
    });

    return this.toProfile(user);
  }

  async leaveWorkspace(userId: string, workspaceId: string) {
    const { count } = await this.prisma.workspaceMember.deleteMany({
      where: { userId, workspaceId },
    });

    if (count === 0) {
      throw new NotFoundException('You are not a member of this workspace');
    }
  }

  private toProfile(user: {
    id: string;
    email: string;
    name: string;
    username: string;
    title: string | null;
    avatarUrl: string | null;
    isGuest: boolean;
  }) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      username: user.username,
      title: user.title,
      avatarUrl: user.avatarUrl,
      isGuest: user.isGuest,
    };
  }
}
