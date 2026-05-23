import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { INestApplication } from '@nestjs/common';

export function buildOpenApiDocument(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('Open-Task API')
    .setDescription('API de gestion de tâches Open-Task')
    .setVersion('1.0')
    .addBearerAuth()
    .addServer('http://localhost:4000', 'Développement local')
    .addServer('/open-task/swagger', 'GitHub Pages (chemin relatif)')
    .build();

  return SwaggerModule.createDocument(app, config);
}
