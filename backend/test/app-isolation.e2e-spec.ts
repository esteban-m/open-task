import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { closeE2eApp, createE2eApp } from './e2e-app';
import { TEST_USER_PASSWORD, testEmail, todayIsoDate } from './helpers/stack';

/** Vérifie qu'un utilisateur ne peut pas accéder aux données d'un autre. */
describe('Isolation des données (e2e)', () => {
  let app: INestApplication;
  let tokenA: string;
  let tokenB: string;
  let tokenC: string;
  let listIdA: string;
  let taskIdA: string;

  const userA = {
    email: testEmail('user-a'),
    password: TEST_USER_PASSWORD,
    firstName: 'Alice',
    lastName: 'Test',
  };

  const userB = {
    email: testEmail('user-b'),
    password: TEST_USER_PASSWORD,
    firstName: 'Bob',
    lastName: 'Test',
  };

  const userC = {
    email: testEmail('user-c'),
    password: TEST_USER_PASSWORD,
    firstName: 'Carol',
    lastName: 'Test',
  };

  beforeAll(async () => {
    ({ app } = await createE2eApp());

    const regA = await request(app.getHttpServer()).post('/auth/register').send(userA);
    tokenA = regA.body.accessToken;

    const regB = await request(app.getHttpServer()).post('/auth/register').send(userB);
    tokenB = regB.body.accessToken;

    const regC = await request(app.getHttpServer()).post('/auth/register').send(userC);
    tokenC = regC.body.accessToken;

    const list = await request(app.getHttpServer())
      .post('/lists')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ name: 'Liste privée A' });
    listIdA = list.body.id;

    const task = await request(app.getHttpServer())
      .post(`/lists/${listIdA}/tasks`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ shortDescription: 'Tâche secrète', dueDate: todayIsoDate() });
    taskIdA = task.body.id;

    await request(app.getHttpServer())
      .post(`/lists/${listIdA}/share`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ invitedEmail: userC.email, role: 'viewer' });
  });

  afterAll(async () => {
    await closeE2eApp(app);
  });

  it('B ne doit pas lire la liste de A', async () => {
    await request(app.getHttpServer())
      .get(`/lists/${listIdA}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(403);
  });

  it('B ne doit pas voir la liste de A dans ses propres listes', async () => {
    const res = await request(app.getHttpServer())
      .get('/lists')
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(200);

    const ids = (res.body as { id: string }[]).map((l) => l.id);
    expect(ids).not.toContain(listIdA);
  });

  it('B ne doit pas créer de tâche dans la liste de A', async () => {
    await request(app.getHttpServer())
      .post(`/lists/${listIdA}/tasks`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ shortDescription: 'Intrusion', dueDate: todayIsoDate() })
      .expect(403);
  });

  it('B ne doit pas lire une tâche de A par ID', async () => {
    await request(app.getHttpServer())
      .get(`/tasks/${taskIdA}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(403);
  });

  it('B ne doit pas modifier une tâche de A', async () => {
    await request(app.getHttpServer())
      .put(`/tasks/${taskIdA}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ shortDescription: 'Piratée' })
      .expect(403);
  });

  it('B ne doit pas supprimer une tâche de A', async () => {
    await request(app.getHttpServer())
      .delete(`/tasks/${taskIdA}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(403);
  });

  it('B ne doit pas lister les tâches de la liste de A', async () => {
    await request(app.getHttpServer())
      .get(`/lists/${listIdA}/tasks`)
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(403);
  });

  it('C (viewer) ne doit pas modifier une tâche de A', async () => {
    await request(app.getHttpServer())
      .put(`/tasks/${taskIdA}`)
      .set('Authorization', `Bearer ${tokenC}`)
      .send({ shortDescription: 'Tentative viewer' })
      .expect(403);
  });

  it('C (viewer) peut lire la tâche partagée', async () => {
    const res = await request(app.getHttpServer())
      .get(`/tasks/${taskIdA}`)
      .set('Authorization', `Bearer ${tokenC}`)
      .expect(200);

    expect(res.body.id).toBe(taskIdA);
  });

  it('register avec email existant renvoie 400 générique (pas 409)', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send(userA)
      .expect(400);

    expect(res.body.message).toMatch(/Impossible de créer le compte/);
    expect(res.body.message).not.toMatch(/existe déjà/i);
  });

  it('share avec email inconnu renvoie 400 générique (pas 404 utilisateur)', async () => {
    const res = await request(app.getHttpServer())
      .post(`/lists/${listIdA}/share`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ invitedEmail: `ghost-${Date.now()}@example.com`, role: 'viewer' })
      .expect(400);

    expect(res.body.message).toMatch(/Impossible d'ajouter cet utilisateur/);
    expect(res.body.message).not.toMatch(/introuvable/i);
  });
});
