import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Logger, UnauthorizedException } from '@nestjs/common';
import { ListAccessService } from '../common/list-access/list-access.service';
import { PrismaService } from '../prisma/prisma.service';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/',
})
export class TasksGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(TasksGateway.name);

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private listAccess: ListAccessService,
    private prisma: PrismaService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        throw new UnauthorizedException('Token manquant');
      }

      const payload = this.jwtService.verify(token, {
        secret: this.configService.get('JWT_SECRET'),
      });

      const userId = payload.sub as string;
      client.data.userId = userId;
      client.join(`user:${userId}`);

      const [ownedLists, sharedLists] = await Promise.all([
        this.prisma.taskList.findMany({ where: { userId }, select: { id: true } }),
        this.prisma.userList.findMany({
          where: { userId, status: 'accepted' },
          select: { listId: true },
        }),
      ]);

      const listIds = new Set<string>([
        ...ownedLists.map((l) => l.id),
        ...sharedLists.map((s) => s.listId),
      ]);

      for (const listId of listIds) {
        client.join(`list:${listId}`);
      }

      this.logger.log(
        `Client connecté: ${client.id} (userId: ${userId}, ${listIds.size} listes)`,
      );
    } catch {
      this.logger.warn(`Connexion refusée pour ${client.id}: token invalide`);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client déconnecté: ${client.id}`);
  }

  @SubscribeMessage('join:list')
  async handleJoinList(@ConnectedSocket() client: Socket, @MessageBody() listId: string) {
    const userId = client.data.userId as string | undefined;
    if (!userId || !listId) return;

    const access = await this.listAccess.getAccess(listId, userId);
    if (!access) {
      this.logger.warn(`join:list refusé pour ${client.id} sur ${listId}`);
      return;
    }

    client.join(`list:${listId}`);
    this.logger.log(`Client ${client.id} a rejoint list:${listId}`);
  }

  @SubscribeMessage('leave:list')
  handleLeaveList(@ConnectedSocket() client: Socket, @MessageBody() listId: string) {
    client.leave(`list:${listId}`);
    this.logger.log(`Client ${client.id} a quitté list:${listId}`);
  }

  emitTaskCreated(listId: string, task: any) {
    this.server.to(`list:${listId}`).emit('task:created', task);
  }

  emitTaskUpdated(listId: string, task: any) {
    this.server.to(`list:${listId}`).emit('task:updated', task);
  }

  emitTaskMoved(fromListId: string, toListId: string, task: any) {
    const payload = { task, fromListId, toListId };
    this.server.to(`list:${fromListId}`).emit('task:moved', payload);
    this.server.to(`list:${toListId}`).emit('task:moved', payload);
  }

  emitTaskDeleted(listId: string, taskId: string) {
    this.server.to(`list:${listId}`).emit('task:deleted', { id: taskId, listId });
  }

  emitTaskCompleted(listId: string, task: any) {
    this.server.to(`list:${listId}`).emit('task:completed', task);
  }

  emitListShared(userId: string, list: any) {
    this.server.to(`user:${userId}`).emit('list:shared', list);
    this.server.to(`list:${list.id}`).emit('list:updated', list);
    // Faire rejoindre la room aux sockets déjà connectés de cet utilisateur
    this.server.in(`user:${userId}`).socketsJoin(`list:${list.id}`);
  }

  emitListRevoked(userId: string, listId: string) {
    this.server.to(`user:${userId}`).emit('list:revoked', { listId });
  }

  emitListUpdated(listId: string, list: any) {
    this.server.to(`list:${listId}`).emit('list:updated', list);
  }

  emitListDeleted(listId: string, memberUserIds: string[]) {
    this.server.to(`list:${listId}`).emit('list:deleted', { listId });
    for (const uid of memberUserIds) {
      this.server.to(`user:${uid}`).emit('list:revoked', { listId });
    }
  }
}
