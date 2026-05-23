import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { closeE2eApp, createE2eApp } from './e2e-app';
import { TEST_USER_PASSWORD, testEmail } from './helpers/stack';

describe('Auth & santé (e2e)', () => {
  let app: INestApplication;
  const user = {
    email: testEmail('auth-e2e'),
    password: TEST_USER_PASSWORD,
    firstName: 'Auth',
    lastName: 'E2E',
  };

  beforeAll(async () => {
    ({ app } = await createE2eApp());
  });

  afterAll(async () => {
    await closeE2eApp(app);
  });

  it('GET /health répond ok sans authentification', async () => {
    const res = await request(app.getHttpServer()).get('/health').expect(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('register pose un cookie refresh_token et retourne accessToken', async () => {
    const res = await request(app.getHttpServer()).post('/auth/register').send(user).expect(201);

    expect(res.body.accessToken).toBeDefined();
    const raw = res.headers['set-cookie'];
    const cookies = Array.isArray(raw) ? raw : raw ? [String(raw)] : [];
    expect(cookies.some((c) => c.startsWith('refresh_token='))).toBe(true);
  });

  it('GET /auth/me avec Bearer retourne le profil', async () => {
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: user.email, password: user.password })
      .expect(200);

    const me = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${login.body.accessToken}`)
      .expect(200);

    expect(me.body.email).toBe(user.email);
    expect(me.body.firstName).toBe(user.firstName);
  });

  it('POST /auth/refresh avec cookie émet un nouveau accessToken', async () => {
    const agent = request.agent(app.getHttpServer());
    await agent.post('/auth/login').send({ email: user.email, password: user.password }).expect(200);

    const refreshed = await agent.post('/auth/refresh').expect(200);
    expect(refreshed.body.accessToken).toBeDefined();

    const me = await agent
      .get('/auth/me')
      .set('Authorization', `Bearer ${refreshed.body.accessToken}`)
      .expect(200);
    expect(me.body.email).toBe(user.email);
  });

  it('POST /auth/logout invalide le refresh (cookie)', async () => {
    const agent = request.agent(app.getHttpServer());
    await agent.post('/auth/login').send({ email: user.email, password: user.password }).expect(200);
    await agent.post('/auth/logout').expect(200);
    await agent.post('/auth/refresh').expect(401);
  });

  it('login avec mauvais mot de passe → 401', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: user.email, password: 'wrong-password' })
      .expect(401);
  });
});
