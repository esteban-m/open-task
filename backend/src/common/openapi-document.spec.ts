import { Test } from '@nestjs/testing';

import { HealthController } from '../health.controller';
import { buildOpenApiDocument } from './openapi-document';

describe('buildOpenApiDocument', () => {
  it('builds OpenAPI 3 document with bearer auth', async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile();

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

    await app.close();
  });
});
