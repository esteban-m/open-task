import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto, UpdateTaskDto } from './dto/task.dto';
import { ListAccessService } from '../common/list-access/list-access.service';

@Injectable()
export class TasksService {
  constructor(
    private prisma: PrismaService,
    private listAccess: ListAccessService,
  ) {}

  async findAllByList(listId: string, userId: string) {
    await this.listAccess.requireAccess(listId, userId, 'viewer');

    return this.prisma.task.findMany({
      where: { listId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findAllForUser(userId: string) {
    return this.prisma.task.findMany({
      where: {
        OR: [
          { list: { userId } },
          {
            list: {
              members: {
                some: { userId, status: 'accepted' },
              },
            },
          },
        ],
      },
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'asc' }],
      include: {
        list: { select: { id: true, name: true, color: true } },
      },
    });
  }

  async findOne(id: string, userId: string) {
    return this.listAccess.requireTaskAccess(id, userId, 'viewer');
  }

  async create(listId: string, dto: CreateTaskDto, userId: string) {
    await this.listAccess.requireAccess(listId, userId, 'editor');

    return this.prisma.task.create({
      data: {
        shortDescription: dto.shortDescription,
        longDescription: dto.longDescription,
        dueDate: new Date(dto.dueDate),
        listId,
      },
    });
  }

  async update(id: string, dto: UpdateTaskDto, userId: string) {
    const existing = await this.listAccess.requireTaskAccess(id, userId, 'editor');

    if (dto.listId && dto.listId !== existing.listId) {
      await this.listAccess.requireAccess(dto.listId, userId, 'editor');
    }

    const task = await this.prisma.task.update({
      where: { id },
      data: {
        ...(dto.shortDescription && { shortDescription: dto.shortDescription }),
        ...(dto.longDescription !== undefined && { longDescription: dto.longDescription }),
        ...(dto.dueDate && { dueDate: new Date(dto.dueDate) }),
        ...(dto.listId && { listId: dto.listId }),
      },
    });

    return { task, previousListId: existing.listId };
  }

  async toggleComplete(id: string, userId: string) {
    const task = await this.listAccess.requireTaskAccess(id, userId, 'editor');

    return this.prisma.task.update({
      where: { id },
      data: {
        completed: !task.completed,
        completedAt: !task.completed ? new Date() : null,
      },
    });
  }

  async remove(id: string, userId: string) {
    await this.listAccess.requireTaskAccess(id, userId, 'editor');
    await this.prisma.task.delete({ where: { id } });
    return { message: 'Tâche supprimée' };
  }
}
