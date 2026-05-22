import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as cookieParser from 'cookie-parser';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';

/** Bootstrap Nest identique aux specs e2e existantes (AppModule + Postgres). */
export async function createE2eApp(): Promise<{ app: INestApplication; module: TestingModule }> {
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'e2e_test_secret';
  process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'e2e_test_refresh_secret';

  const moduleFixture = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
  await app.init();

  return { app, module: moduleFixture };
}

export async function closeE2eApp(app: INestApplication | undefined): Promise<void> {
  if (app) await app.close();
}
