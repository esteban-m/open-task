import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateListDto, UpdateListDto } from './dto/list.dto';

@Injectable()
export class ListsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.taskList.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      include: {
        _count: { select: { tasks: true } },
      },
    });
  }

  async findOne(id: string, userId: string) {
    const list = await this.prisma.taskList.findUnique({ where: { id } });

    if (!list) {
      throw new NotFoundException('Liste introuvable');
    }

    if (list.userId !== userId) {
      throw new ForbiddenException('Accès interdit');
    }

    return list;
  }

  async create(dto: CreateListDto, userId: string) {
    const existing = await this.prisma.taskList.findFirst({
      where: { name: dto.name, userId },
    });

    if (existing) {
      throw new ConflictException('Une liste avec ce nom existe déjà');
    }

    return this.prisma.taskList.create({
      data: { name: dto.name, userId },
    });
  }

  async update(id: string, dto: UpdateListDto, userId: string) {
    await this.findOne(id, userId);

    const duplicate = await this.prisma.taskList.findFirst({
      where: { name: dto.name, userId, NOT: { id } },
    });

    if (duplicate) {
      throw new ConflictException('Une liste avec ce nom existe déjà');
    }

    return this.prisma.taskList.update({
      where: { id },
      data: { name: dto.name },
    });
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);
    // Les tâches sont supprimées en cascade via Prisma
    await this.prisma.taskList.delete({ where: { id } });
    return { message: 'Liste supprimée' };
  }
}
