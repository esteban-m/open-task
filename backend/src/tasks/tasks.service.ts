import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto, UpdateTaskDto } from './dto/task.dto';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  private async checkListOwnership(listId: string, userId: string) {
    const list = await this.prisma.taskList.findUnique({ where: { id: listId } });

    if (!list) {
      throw new NotFoundException('Liste introuvable');
    }

    if (list.userId !== userId) {
      throw new ForbiddenException('Accès interdit');
    }

    return list;
  }

  private async getTaskAndVerify(taskId: string, userId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: { list: true },
    });

    if (!task) {
      throw new NotFoundException('Tâche introuvable');
    }

    if (task.list.userId !== userId) {
      throw new ForbiddenException('Accès interdit');
    }

    return task;
  }

  async findAllByList(listId: string, userId: string) {
    await this.checkListOwnership(listId, userId);

    return this.prisma.task.findMany({
      where: { listId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(id: string, userId: string) {
    return this.getTaskAndVerify(id, userId);
  }

  async create(listId: string, dto: CreateTaskDto, userId: string) {
    await this.checkListOwnership(listId, userId);

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
    await this.getTaskAndVerify(id, userId);

    return this.prisma.task.update({
      where: { id },
      data: {
        ...(dto.shortDescription && { shortDescription: dto.shortDescription }),
        ...(dto.longDescription !== undefined && { longDescription: dto.longDescription }),
        ...(dto.dueDate && { dueDate: new Date(dto.dueDate) }),
      },
    });
  }

  async toggleComplete(id: string, userId: string) {
    const task = await this.getTaskAndVerify(id, userId);

    return this.prisma.task.update({
      where: { id },
      data: {
        completed: !task.completed,
        completedAt: !task.completed ? new Date() : null,
      },
    });
  }

  async remove(id: string, userId: string) {
    await this.getTaskAndVerify(id, userId);
    await this.prisma.task.delete({ where: { id } });
    return { message: 'Tâche supprimée' };
  }
}
