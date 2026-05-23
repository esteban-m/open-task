import 'reflect-metadata';

import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';

import { AppModule } from '../app.module';
import { JwtStrategy } from '../auth/jwt.strategy';
import { PrismaService } from '../prisma/prisma.service';
import { buildOpenApiDocument } from './openapi-document';

const prismaStub = {
  onModuleInit: async () => {},
  onModuleDestroy: async () => {},
  $connect: async () => {},
  $disconnect: async () => {},
};

describe('buildOpenApiDocument', () => {
  it('builds OpenAPI 3 document with schemas and request bodies', async () => {
    process.env.JWT_SECRET ??= 'test_jwt_secret_32chars_minimum_ok';
    process.env.JWT_REFRESH_SECRET ??= 'test_refresh_secret_32chars_ok';

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaStub)
      .overrideProvider(ConfigService)
      .useValue({ get: (key: string) => process.env[key] })
      .overrideProvider(JwtStrategy)
      .useValue({})
      .compile();

    const app = moduleRef.createNestApplication();
    await app.init();

    const document = buildOpenApiDocument(app);

    expect(document.info).toMatchObject({
      title: 'Open-Task API',
      description: 'API de gestion de tâches Open-Task',
      version: '1.0',
    });
    expect(document.openapi).toMatch(/^3\./);
    expect(document.components?.securitySchemes?.bearer).toBeDefined();
    expect(Object.keys(document.components?.schemas ?? {}).length).toBeGreaterThanOrEqual(8);
    expect(document.paths['/auth/register']?.post?.requestBody).toBeDefined();
    expect(document.paths['/lists/{listId}/tasks']?.post?.parameters?.length).toBeGreaterThan(0);

    await app.close();
  });
});
