import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { PrismaService } from '../prisma/prisma.service';
import { WorkspaceProvisioningService } from '../workspaces/workspace-provisioning.service';
import type { SessionTokenPayload } from '../common/types/request-user';

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
