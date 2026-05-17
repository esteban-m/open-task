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

      client.data.userId = payload.sub;
      this.logger.log(`Client connecté: ${client.id} (userId: ${payload.sub})`);
    } catch {
      this.logger.warn(`Connexion refusée pour ${client.id}: token invalide`);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client déconnecté: ${client.id}`);
  }

  @SubscribeMessage('join:list')
  handleJoinList(@ConnectedSocket() client: Socket, @MessageBody() listId: string) {
    client.join(`list:${listId}`);
    this.logger.log(`Client ${client.id} a rejoint la room list:${listId}`);
  }

  @SubscribeMessage('leave:list')
  handleLeaveList(@ConnectedSocket() client: Socket, @MessageBody() listId: string) {
    client.leave(`list:${listId}`);
    this.logger.log(`Client ${client.id} a quitté la room list:${listId}`);
  }

  emitTaskCreated(listId: string, task: any) {
    this.server.to(`list:${listId}`).emit('task:created', task);
  }

  emitTaskUpdated(listId: string, task: any) {
    this.server.to(`list:${listId}`).emit('task:updated', task);
  }

  emitTaskDeleted(listId: string, taskId: string) {
    this.server.to(`list:${listId}`).emit('task:deleted', { id: taskId, listId });
  }

  emitTaskCompleted(listId: string, task: any) {
    this.server.to(`list:${listId}`).emit('task:completed', task);
  }
}
