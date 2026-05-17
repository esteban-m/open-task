import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TaskList } from '@prisma/client';

export type ListRole = 'owner' | 'admin' | 'editor' | 'viewer';

export interface ListAccess {
  list: TaskList;
  role: ListRole;
}

const ROLE_RANK: Record<ListRole, number> = {
  viewer: 0,
  editor: 1,
  admin: 2,
  owner: 3,
};

export function normalizeListRole(role: string): ListRole {
  const r = role.toLowerCase();
  if (r === 'owner') return 'owner';
  if (r === 'admin') return 'admin';
  if (r === 'editor' || r === 'user') return 'editor';
  return 'viewer';
}

@Injectable()
export class ListAccessService {
  constructor(private prisma: PrismaService) {}

  async getAccess(listId: string, userId: string): Promise<ListAccess | null> {
    const list = await this.prisma.taskList.findUnique({ where: { id: listId } });
    if (!list) return null;

    if (list.userId === userId) {
      return { list, role: 'owner' };
    }

    const membership = await this.prisma.userList.findFirst({
      where: { listId, userId, status: 'accepted' },
    });

    if (!membership) return null;

    return { list, role: normalizeListRole(membership.role) };
  }

  async requireAccess(
    listId: string,
    userId: string,
    minRole: ListRole = 'viewer',
  ): Promise<ListAccess> {
    const access = await this.getAccess(listId, userId);
    if (!access) {
      throw new ForbiddenException('Accès interdit');
    }
    if (ROLE_RANK[access.role] < ROLE_RANK[minRole]) {
      throw new ForbiddenException('Droits insuffisants pour cette action');
    }
    return access;
  }

  async requireTaskAccess(taskId: string, userId: string, minRole: ListRole = 'viewer') {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: { list: true },
    });

    if (!task) {
      throw new NotFoundException('Tâche introuvable');
    }

    await this.requireAccess(task.listId, userId, minRole);
    return task;
  }
}
