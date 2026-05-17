import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateListDto, UpdateListDto } from './dto/list.dto';
import { ListAccessService, normalizeListRole } from '../common/list-access/list-access.service';

@Injectable()
export class ListsService {
  constructor(
    private prisma: PrismaService,
    private listAccess: ListAccessService,
  ) {}

  async findAll(userId: string) {
    const owned = await this.prisma.taskList.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      include: {
        _count: { select: { tasks: true } },
      },
    });

    const memberships = await this.prisma.userList.findMany({
      where: { userId, status: 'accepted' },
      include: {
        list: {
          include: { _count: { select: { tasks: true } } },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const ownedIds = new Set(owned.map((l) => l.id));

    const shared = memberships
      .filter((m) => !ownedIds.has(m.listId))
      .map((m) => ({
        ...m.list,
        myRole: normalizeListRole(m.role),
        isShared: true,
      }));

    return [
      ...owned.map((l) => ({ ...l, myRole: 'owner' as const, isShared: false })),
      ...shared,
    ];
  }

  async findOne(id: string, userId: string) {
    const access = await this.listAccess.requireAccess(id, userId, 'viewer');
    return access.list;
  }

  async create(dto: CreateListDto, userId: string) {
    const existing = await this.prisma.taskList.findFirst({
      where: { name: dto.name, userId },
    });

    if (existing) {
      throw new ConflictException('Une liste avec ce nom existe déjà');
    }

    return this.prisma.taskList.create({
      data: { name: dto.name, color: dto.color || '#3B82F6', userId },
    });
  }

  async update(id: string, dto: UpdateListDto, userId: string) {
    await this.listAccess.requireAccess(id, userId, 'admin');

    if (dto.name !== undefined) {
      const list = await this.prisma.taskList.findUnique({ where: { id } });
      if (list) {
        const duplicate = await this.prisma.taskList.findFirst({
          where: { name: dto.name, userId: list.userId, NOT: { id } },
        });
        if (duplicate) {
          throw new ConflictException('Une liste avec ce nom existe déjà');
        }
      }
    }

    const data: Record<string, unknown> = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.color !== undefined) data.color = dto.color;

    return this.prisma.taskList.update({
      where: { id },
      data,
      include: { _count: { select: { tasks: true } } },
    });
  }

  async remove(id: string, userId: string) {
    const access = await this.listAccess.getAccess(id, userId);
    if (!access || access.role !== 'owner') {
      throw new ForbiddenException('Seul le propriétaire peut supprimer la liste');
    }
    await this.prisma.taskList.delete({ where: { id } });
    return { message: 'Liste supprimée' };
  }

  async shareList(listId: string, dto: { invitedEmail: string; role: string }, userId: string) {
    const list = await this.prisma.taskList.findUnique({
      where: { id: listId },
      include: { _count: { select: { tasks: true } } },
    });

    if (!list) {
      throw new NotFoundException('Liste introuvable');
    }

    if (list.userId !== userId) {
      throw new ForbiddenException('Vous n\'avez pas les droits pour partager cette liste');
    }

    const invitedUser = await this.prisma.user.findUnique({
      where: { email: dto.invitedEmail },
    });

    if (!invitedUser) {
      throw new NotFoundException('Utilisateur introuvable — il doit d\'abord créer un compte');
    }

    if (invitedUser.id === userId) {
      throw new ConflictException('Vous ne pouvez pas partager une liste avec vous-même');
    }

    const existingShare = await this.prisma.userList.findFirst({
      where: { listId, userId: invitedUser.id },
    });

    if (existingShare) {
      throw new ConflictException('Cet utilisateur a déjà accès à cette liste');
    }

    const role = normalizeListRole(dto.role);

    await this.prisma.userList.create({
      data: {
        listId,
        userId: invitedUser.id,
        role,
        status: 'accepted',
      },
    });

    return {
      membership: { userId: invitedUser.id, role },
      list: {
        ...list,
        myRole: role,
        isShared: true,
      },
    };
  }

  async acceptShare(invitationId: string, userId: string) {
    const invitation = await this.prisma.userList.findUnique({
      where: { id: invitationId },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation introuvable');
    }

    if (invitation.userId !== userId) {
      throw new ForbiddenException('Cette invitation ne vous concerne pas');
    }

    return this.prisma.userList.update({
      where: { id: invitationId },
      data: { status: 'accepted' },
    });
  }

  async revokeAccess(listId: string, userIdToRevoke: string, requestingUserId: string) {
    const list = await this.prisma.taskList.findUnique({ where: { id: listId } });

    if (!list) {
      throw new NotFoundException('Liste introuvable');
    }

    if (list.userId !== requestingUserId) {
      throw new ForbiddenException('Vous n\'avez pas les droits pour gérer les accès de cette liste');
    }

    const existingAccess = await this.prisma.userList.findFirst({
      where: { listId, userId: userIdToRevoke },
    });

    if (!existingAccess) {
      throw new NotFoundException('L\'utilisateur n\'a pas accès à cette liste');
    }

    await this.prisma.userList.delete({ where: { id: existingAccess.id } });

    return { message: 'Accès révoqué avec succès', userId: userIdToRevoke, listId };
  }

  async getSharedUsers(listId: string, userId: string) {
    await this.listAccess.requireAccess(listId, userId, 'admin');

    const sharedUsers = await this.prisma.userList.findMany({
      where: { listId },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });

    return sharedUsers.map((row) => ({
      id: row.user.id,
      email: row.user.email,
      firstName: row.user.firstName,
      lastName: row.user.lastName,
      role: row.role,
    }));
  }
}
