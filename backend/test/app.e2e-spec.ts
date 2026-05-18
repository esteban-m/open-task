import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';

/**
 * Test E2E : flux complet
 * Inscription → connexion → création liste → création tâche → suppression
 */
describe('Flux complet (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let listId: string;
  let taskId: string;

  const testUser = {
    email: `test-e2e-${Date.now()}@example.com`,
    password: 'password123',
    firstName: 'Test',
    lastName: 'E2E',
  };

  beforeAll(async () => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'e2e_test_secret';
    process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'e2e_test_refresh';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it('1. Devrait créer un compte utilisateur', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send(testUser)
      .expect(201);

    expect(response.body).toHaveProperty('accessToken');
    accessToken = response.body.accessToken;
  });

  it('2. Devrait se connecter et obtenir un access token', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: testUser.email, password: testUser.password })
      .expect(200);

    expect(response.body).toHaveProperty('accessToken');
    accessToken = response.body.accessToken;
  });

  it('3. Devrait créer une liste de tâches', async () => {
    const response = await request(app.getHttpServer())
      .post('/lists')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Liste E2E Test' })
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body.name).toBe('Liste E2E Test');
    listId = response.body.id;
  });

  it('4. Devrait créer une tâche dans la liste', async () => {
    const response = await request(app.getHttpServer())
      .post(`/lists/${listId}/tasks`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        shortDescription: 'Tâche E2E',
        dueDate: '2024-12-31',
      })
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body.shortDescription).toBe('Tâche E2E');
    taskId = response.body.id;
  });

  it('5. Devrait marquer la tâche comme terminée', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/tasks/${taskId}/toggle`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.completed).toBe(true);
  });

  it('6. Devrait supprimer la tâche', async () => {
    await request(app.getHttpServer())
      .delete(`/tasks/${taskId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
  });

  it('7. Devrait supprimer la liste', async () => {
    await request(app.getHttpServer())
      .delete(`/lists/${listId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
  });

  it('8. Devrait refuser l\'accès sans token', async () => {
    await request(app.getHttpServer()).get('/lists').expect(401);
  });
});
