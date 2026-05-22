import { INestApplication } from '@nestjs/common';
import { io, Socket } from 'socket.io-client';
import * as request from 'supertest';
import { closeE2eApp, createE2eApp } from './e2e-app';

function connectSocket(port: number, token: string): Promise<Socket> {
  return new Promise((resolve, reject) => {
    const socket = io(`http://127.0.0.1:${port}`, {
      auth: { token },
      transports: ['websocket'],
      forceNew: true,
    });
    const timer = setTimeout(() => {
      socket.close();
      reject(new Error('WebSocket connection timeout'));
    }, 10_000);
    socket.on('connect', () => {
      clearTimeout(timer);
      resolve(socket);
    });
    socket.on('connect_error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

function waitForEvent<T>(socket: Socket, event: string, timeoutMs = 10_000): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timeout waiting for ${event}`)), timeoutMs);
    socket.once(event, (payload: T) => {
      clearTimeout(timer);
      resolve(payload);
    });
  });
}

describe('WebSocket TasksGateway (e2e)', () => {
  jest.setTimeout(30_000);

  let app: INestApplication;
  let port: number;
  let token: string;
  let listId: string;

  const user = {
    email: `ws-${Date.now()}@example.com`,
    password: 'password123',
    firstName: 'WS',
    lastName: 'Test',
  };

  beforeAll(async () => {
    ({ app } = await createE2eApp());
    await app.listen(0);
    const addr = app.getHttpServer().address();
    port = typeof addr === 'object' && addr ? addr.port : 0;

    const reg = await request(app.getHttpServer()).post('/auth/register').send(user).expect(201);
    token = reg.body.accessToken;

    const list = await request(app.getHttpServer())
      .post('/lists')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'WS List', color: '#3B82F6' })
      .expect(201);
    listId = list.body.id;
  });

  afterAll(async () => {
    await closeE2eApp(app);
  });

  it('refuse la connexion sans token', async () => {
    const socket = io(`http://127.0.0.1:${port}`, {
      auth: { token: '' },
      transports: ['websocket'],
      forceNew: true,
    });
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => {
        socket.close();
        if (socket.connected) {
          reject(new Error('socket still connected without token'));
        } else {
          resolve();
        }
      }, 3000);
      socket.on('connect_error', () => {
        clearTimeout(timer);
        socket.close();
        resolve();
      });
      socket.on('disconnect', () => {
        clearTimeout(timer);
        socket.close();
        resolve();
      });
    });
  });

  it('connecte avec JWT et reçoit task:created', async () => {
    const socket = await connectSocket(port, token);
    const eventPromise = waitForEvent<{ id: string; shortDescription: string }>(
      socket,
      'task:created',
    );

    await request(app.getHttpServer())
      .post(`/lists/${listId}/tasks`)
      .set('Authorization', `Bearer ${token}`)
      .send({ shortDescription: 'Tâche temps réel', dueDate: '2026-12-01' })
      .expect(201);

    const payload = await eventPromise;
    expect(payload.shortDescription).toBe('Tâche temps réel');
    socket.close();
  });

  it('join:list et leave:list', async () => {
    const socket = await connectSocket(port, token);
    await new Promise<void>((resolve, reject) => {
      socket.emit('join:list', listId);
      socket.emit('leave:list', listId);
      setTimeout(resolve, 300);
      socket.once('connect_error', reject);
    });
    socket.close();
  });

  it('reçoit task:moved après changement de liste', async () => {
    const list2 = await request(app.getHttpServer())
      .post('/lists')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'WS List 2', color: '#10B981' })
      .expect(201);

    const task = await request(app.getHttpServer())
      .post(`/lists/${listId}/tasks`)
      .set('Authorization', `Bearer ${token}`)
      .send({ shortDescription: 'À déplacer', dueDate: '2026-12-04' })
      .expect(201);

    const socket = await connectSocket(port, token);
    socket.emit('join:list', listId);
    socket.emit('join:list', list2.body.id);
    const eventPromise = waitForEvent<{ task: { id: string }; fromListId: string; toListId: string }>(
      socket,
      'task:moved',
    );

    await request(app.getHttpServer())
      .put(`/tasks/${task.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ listId: list2.body.id })
      .expect(200);

    const payload = await eventPromise;
    expect(payload.task.id).toBe(task.body.id);
    expect(payload.fromListId).toBe(listId);
    expect(payload.toListId).toBe(list2.body.id);
    socket.close();
  });

  it('join:list refusé pour une liste sans accès', async () => {
    const stranger = {
      email: `ws-stranger-${Date.now()}@example.com`,
      password: 'password123',
      firstName: 'Str',
      lastName: 'Anger',
    };
    const reg = await request(app.getHttpServer()).post('/auth/register').send(stranger).expect(201);
    const socket = await connectSocket(port, reg.body.accessToken);
    await new Promise<void>((resolve, reject) => {
      socket.emit('join:list', listId);
      setTimeout(resolve, 300);
      socket.once('connect_error', reject);
    });
    socket.close();
  });

  it('reçoit task:updated après PUT', async () => {
    const task = await request(app.getHttpServer())
      .post(`/lists/${listId}/tasks`)
      .set('Authorization', `Bearer ${token}`)
      .send({ shortDescription: 'À modifier', dueDate: '2026-12-03' })
      .expect(201);

    const socket = await connectSocket(port, token);
    socket.emit('join:list', listId);
    const eventPromise = waitForEvent<{ id: string; shortDescription: string }>(
      socket,
      'task:updated',
    );

    await request(app.getHttpServer())
      .put(`/tasks/${task.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ shortDescription: 'Modifiée' })
      .expect(200);

    const payload = await eventPromise;
    expect(payload.shortDescription).toBe('Modifiée');
    socket.close();
  });

  it('reçoit task:completed après PATCH toggle', async () => {
    const task = await request(app.getHttpServer())
      .post(`/lists/${listId}/tasks`)
      .set('Authorization', `Bearer ${token}`)
      .send({ shortDescription: 'À terminer', dueDate: '2026-12-02' })
      .expect(201);

    const socket = await connectSocket(port, token);
    const eventPromise = waitForEvent<{ id: string; completed: boolean }>(
      socket,
      'task:completed',
    );

    await request(app.getHttpServer())
      .patch(`/tasks/${task.body.id}/toggle`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const payload = await eventPromise;
    expect(payload.id).toBe(task.body.id);
    expect(payload.completed).toBe(true);
    socket.close();
  });

  it('notifie list:deleted et list:revoked aux membres', async () => {
    const guest = {
      email: `ws-guest-${Date.now()}@example.com`,
      password: 'password123',
      firstName: 'Guest',
      lastName: 'WS',
    };
    const guestReg = await request(app.getHttpServer()).post('/auth/register').send(guest).expect(201);
    const guestToken = guestReg.body.accessToken;

    const disposable = await request(app.getHttpServer())
      .post('/lists')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'WS Disposable', color: '#EF4444' })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/lists/${disposable.body.id}/share`)
      .set('Authorization', `Bearer ${token}`)
      .send({ invitedEmail: guest.email, role: 'viewer' })
      .expect(201);

    const guestSocket = await connectSocket(port, guestToken);
    guestSocket.emit('join:list', disposable.body.id);
    const revokedPromise = waitForEvent<{ listId: string }>(guestSocket, 'list:revoked');

    const ownerSocket = await connectSocket(port, token);
    ownerSocket.emit('join:list', disposable.body.id);
    const deletedPromise = waitForEvent<{ listId: string }>(ownerSocket, 'list:deleted');

    await request(app.getHttpServer())
      .delete(`/lists/${disposable.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const deleted = await deletedPromise;
    expect(deleted.listId).toBe(disposable.body.id);
    const revoked = await revokedPromise;
    expect(revoked.listId).toBe(disposable.body.id);

    guestSocket.close();
    ownerSocket.close();
  });
});
