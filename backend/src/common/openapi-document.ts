import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { INestApplication } from '@nestjs/common';

import { normalizeOpenApiDocument } from './openapi-helpers';

export function buildOpenApiDocument(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('Open-Task API')
    .setDescription('API de gestion de tâches Open-Task')
    .setVersion('1.0')
    .addBearerAuth()
    .addServer('http://localhost:4000', 'Développement local')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  return normalizeOpenApiDocument(document);
}
