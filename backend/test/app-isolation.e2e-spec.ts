import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';

/** Vérifie qu'un utilisateur ne peut pas accéder aux listes d'un autre. */
describe('Isolation des données (e2e)', () => {
  let app: INestApplication;
  let tokenA: string;
  let tokenB: string;
  let listIdA: string;

  const userA = {
    email: `user-a-${Date.now()}@example.com`,
    password: 'password123',
    firstName: 'Alice',
    lastName: 'Test',
  };

  const userB = {
    email: `user-b-${Date.now()}@example.com`,
    password: 'password123',
    firstName: 'Bob',
    lastName: 'Test',
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

    const regA = await request(app.getHttpServer()).post('/auth/register').send(userA);
    tokenA = regA.body.accessToken;

    const regB = await request(app.getHttpServer()).post('/auth/register').send(userB);
    tokenB = regB.body.accessToken;

    const list = await request(app.getHttpServer())
      .post('/lists')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ name: 'Liste privée A' });
    listIdA = list.body.id;
  });

  afterAll(async () => {
    if (app) await app.close();
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
      .send({ shortDescription: 'Intrusion', dueDate: '2025-12-31' })
      .expect(403);
  });
});
