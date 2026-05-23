import 'reflect-metadata';

import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';

import { AppModule } from '../src/app.module';
import { JwtStrategy } from '../src/auth/jwt.strategy';
import { buildOpenApiDocument } from '../src/common/openapi-document';
import { PrismaService } from '../src/prisma/prisma.service';

const prismaStub = {
  onModuleInit: async () => {},
  onModuleDestroy: async () => {},
  $connect: async () => {},
  $disconnect: async () => {},
};

async function exportOpenApi(outPath: string) {
  process.env.NODE_ENV ??= 'development';
  process.env.JWT_SECRET ??= 'export_openapi_jwt_secret_32chars_ok';
  process.env.JWT_REFRESH_SECRET ??= 'export_openapi_refresh_secret_32chars';

  const configStub = {
    get: (key: string) => process.env[key],
  };

  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(PrismaService)
    .useValue(prismaStub)
    .overrideProvider(ConfigService)
    .useValue(configStub)
    .overrideProvider(JwtStrategy)
    .useValue({})
    .compile();

  const app = moduleRef.createNestApplication();
  await app.init();

  const document = buildOpenApiDocument(app);
  const schemaCount = Object.keys(document.components?.schemas ?? {}).length;
  if (schemaCount === 0) {
    throw new Error('OpenAPI export: aucun schéma DTO — vérifier @ApiBody sur les contrôleurs');
  }
  writeFileSync(outPath, JSON.stringify(document, null, 2));
  await app.close();
}

const out = resolve(process.argv[2] ?? 'openapi.json');
exportOpenApi(out)
  .then(() => {
    console.log(`[openapi] ${out}`);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
