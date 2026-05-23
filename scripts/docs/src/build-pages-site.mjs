import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { createRequire } from 'node:module';

export function pagesBaseFromRepo(repoRoot) {
  const name = process.env.GITHUB_REPOSITORY?.split('/')[1]
    ?? JSON.parse(readFileSync(join(repoRoot, 'config/open-task.docs.json'), 'utf8')).project.repository.split('/')[1];
  return `/${name}/`;
}

function copyDir(src, dest) {
  cpSync(src, dest, { recursive: true });
}

export function resolveSwaggerUiRoot(repoRoot) {
  const req = createRequire(join(repoRoot, 'backend/package.json'));
  return dirname(req.resolve('swagger-ui-dist/swagger-ui.css'));
}

export function writeSwaggerStatic(destDir, openapiJson, repoRoot, swaggerUiRoot = resolveSwaggerUiRoot(repoRoot)) {
  mkdirSync(destDir, { recursive: true });
  copyDir(swaggerUiRoot, destDir);
  writeFileSync(join(destDir, 'openapi.json'), readFileSync(openapiJson, 'utf8'));

  writeFileSync(
    join(destDir, 'index.html'),
    `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Open-Task — Swagger</title>
  <link rel="stylesheet" href="./swagger-ui.css" />
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="./swagger-ui-bundle.js"></script>
  <script src="./swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function () {
      window.ui = SwaggerUIBundle({
        url: './openapi.json',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
        layout: 'StandaloneLayout',
      });
    };
  </script>
</body>
</html>`,
  );
}

export function runBuildPagesSite(repoRoot, options = {}) {
  const outDir = resolve(options.outDir ?? join(repoRoot, 'docs-site'));
  const pagesBase = options.pagesBase ?? pagesBaseFromRepo(repoRoot);
  const docsDist = resolve(options.docsDist ?? join(repoRoot, 'docs/.vitepress/dist'));
  const storybookDist = resolve(options.storybookDist ?? join(repoRoot, 'frontend/storybook-static'));
  const openapiJson = resolve(options.openapiJson ?? join(repoRoot, 'backend/openapi.json'));
  const hubDir = resolve(options.hubDir ?? join(repoRoot, 'site'));
  const demoDir = resolve(options.demoDir ?? join(repoRoot, 'docs/public/demo'));
  const swaggerUiRoot = options.swaggerUiRoot;

  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });

  copyDir(hubDir, outDir);
  copyDir(docsDist, join(outDir, 'docs'));
  copyDir(storybookDist, join(outDir, 'storybook'));
  writeSwaggerStatic(join(outDir, 'swagger'), openapiJson, repoRoot, swaggerUiRoot);

  if (existsSync(demoDir)) {
    copyDir(demoDir, join(outDir, 'demo'));
  }

  const hubIndex = join(outDir, 'index.html');
  writeFileSync(hubIndex, readFileSync(hubIndex, 'utf8').replaceAll('__PAGES_BASE__', pagesBase));

  console.log(`[pages] Site assemblé → ${outDir} (base ${pagesBase})`);
}
