import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import { closeE2eApp, createE2eApp } from './e2e-app';

describe('API listes & tâches (e2e)', () => {
  let app: INestApplication;
  let token: string;
  let listId: string;
  let taskId: string;
  let guestToken: string;
  let guestId: string;

  const owner = {
    email: `api-owner-${Date.now()}@example.com`,
    password: 'password123',
    firstName: 'Owner',
    lastName: 'API',
  };

  const guest = {
    email: `api-guest-${Date.now()}@example.com`,
    password: 'password123',
    firstName: 'Guest',
    lastName: 'API',
  };

  beforeAll(async () => {
    ({ app } = await createE2eApp());

    const regOwner = await request(app.getHttpServer()).post('/auth/register').send(owner).expect(201);
    token = regOwner.body.accessToken;
    const regGuest = await request(app.getHttpServer()).post('/auth/register').send(guest).expect(201);
    guestToken = regGuest.body.accessToken;
    const meGuest = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${guestToken}`)
      .expect(200);
    guestId = meGuest.body.id;

    const list = await request(app.getHttpServer())
      .post('/lists')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'API E2E List', color: '#3B82F6' })
      .expect(201);
    listId = list.body.id;

    const task = await request(app.getHttpServer())
      .post(`/lists/${listId}/tasks`)
      .set('Authorization', `Bearer ${token}`)
      .send({ shortDescription: 'Tâche API', dueDate: '2026-12-31' })
      .expect(201);
    taskId = task.body.id;
  });

  afterAll(async () => {
    await closeE2eApp(app);
  });

  it('GET /lists retourne la liste du propriétaire', async () => {
    const res = await request(app.getHttpServer())
      .get('/lists')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.some((l: { id: string }) => l.id === listId)).toBe(true);
  });

  it('GET /lists/:id retourne le détail', async () => {
    const res = await request(app.getHttpServer())
      .get(`/lists/${listId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.name).toBe('API E2E List');
  });

  it('PUT /lists/:id met à jour nom et couleur', async () => {
    const res = await request(app.getHttpServer())
      .put(`/lists/${listId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'API E2E Updated', color: '#10B981' })
      .expect(200);

    expect(res.body.name).toBe('API E2E Updated');
    expect(res.body.color).toBe('#10B981');
  });

  it('POST /lists avec couleur invalide → 400', async () => {
    await request(app.getHttpServer())
      .post('/lists')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Bad color', color: 'red' })
      .expect(400);
  });

  it('GET /lists/:id/tasks liste les tâches', async () => {
    const res = await request(app.getHttpServer())
      .get(`/lists/${listId}/tasks`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.some((t: { id: string }) => t.id === taskId)).toBe(true);
  });

  it('GET /tasks retourne les tâches de l’utilisateur', async () => {
    const res = await request(app.getHttpServer())
      .get('/tasks')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.some((t: { id: string }) => t.id === taskId)).toBe(true);
  });

  it('PUT /tasks/:id met à jour la description', async () => {
    const res = await request(app.getHttpServer())
      .put(`/tasks/${taskId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ shortDescription: 'Tâche API modifiée' })
      .expect(200);

    expect(res.body.shortDescription).toBe('Tâche API modifiée');
  });

  it('GET /lists/:id/shared-users après partage', async () => {
    await request(app.getHttpServer())
      .post(`/lists/${listId}/share`)
      .set('Authorization', `Bearer ${token}`)
      .send({ invitedEmail: guest.email, role: 'viewer' })
      .expect(201);

    const res = await request(app.getHttpServer())
      .get(`/lists/${listId}/shared-users`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.some((u: { email: string }) => u.email === guest.email)).toBe(true);
  });

  it('POST /lists/shares/:id/accept accepte une invitation pending', async () => {
    const prisma = app.get(PrismaService);
    const otherList = await request(app.getHttpServer())
      .post('/lists')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Pending share list' })
      .expect(201);

    const pending = await prisma.userList.create({
      data: {
        userId: guestId,
        listId: otherList.body.id,
        role: 'viewer',
        status: 'pending',
      },
    });

    await request(app.getHttpServer())
      .post(`/lists/shares/${pending.id}/accept`)
      .set('Authorization', `Bearer ${guestToken}`)
      .expect(201);

    const lists = await request(app.getHttpServer())
      .get('/lists')
      .set('Authorization', `Bearer ${guestToken}`)
      .expect(200);

    expect(lists.body.some((l: { id: string }) => l.id === otherList.body.id)).toBe(true);
  });

  it('DELETE /lists/:id/share/:userId révoque l’accès', async () => {
    await request(app.getHttpServer())
      .delete(`/lists/${listId}/share/${guestId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    await request(app.getHttpServer())
      .get(`/lists/${listId}`)
      .set('Authorization', `Bearer ${guestToken}`)
      .expect(403);
  });
});
