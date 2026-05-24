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

export function writeDemoIndexRedirect(demoOutDir, pagesBase) {
  mkdirSync(demoOutDir, { recursive: true });
  const usageUrl = `${pagesBase}USAGE.html`;
  writeFileSync(
    join(demoOutDir, 'index.html'),
    `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta http-equiv="refresh" content="0; url=${usageUrl}" />
  <title>Open-Task — Démos</title>
  <link rel="canonical" href="${usageUrl}" />
</head>
<body>
  <p>Redirection vers le <a href="${usageUrl}">guide d'utilisation (GIF)</a>…</p>
</body>
</html>`,
  );
}

export function writeUsageHtmlPage(outDir, repoRoot) {
  const usageMd = resolve(repoRoot, 'USAGE.md');
  if (!existsSync(usageMd)) return;

  const markdown = readFileSync(usageMd, 'utf8');
  writeFileSync(join(outDir, 'USAGE.md'), markdown);

  let bodyHtml;
  try {
    const req = createRequire(join(repoRoot, 'frontend/package.json'));
    const { marked } = req('marked');
    bodyHtml = marked.parse(markdown);
  } catch {
    bodyHtml = `<pre>${markdown.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</pre>`;
  }

  writeFileSync(
    join(outDir, 'USAGE.html'),
    `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="theme-color" content="#2563eb" />
  <title>Open-Task — Guide d'utilisation (GIF)</title>
  <link rel="icon" type="image/svg+xml" href="./hero.svg" />
  <style>
    :root { color-scheme: dark; --bg: #0b1220; --text: #f8fafc; --muted: #94a3b8; --link: #93c5fd; --border: #1f2937; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: ui-sans-serif, system-ui, sans-serif; background: var(--bg); color: var(--text); line-height: 1.6; }
    .wrap { max-width: 960px; margin: 0 auto; padding: 2rem 1.25rem 4rem; }
    a { color: var(--link); }
    h1, h2 { letter-spacing: -0.02em; }
    h2 { margin-top: 2.5rem; padding-top: 1rem; border-top: 1px solid var(--border); }
    table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
    th, td { border: 1px solid var(--border); padding: 0.5rem; vertical-align: top; }
    img { max-width: 100%; height: auto; border-radius: 8px; border: 1px solid var(--border); }
    blockquote { margin: 1rem 0; padding: 0.75rem 1rem; border-left: 3px solid #3b82f6; background: rgba(59,130,246,0.08); color: var(--muted); }
    .top { margin-bottom: 1.5rem; font-size: 0.95rem; }
  </style>
</head>
<body>
  <div class="wrap">
    <p class="top"><a href="./">← Portail</a> · <a href="./docs/">Documentation</a> · <a href="./histoire/">Composants UI</a></p>
    ${bodyHtml}
  </div>
</body>
</html>`,
  );
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
  const histoireDist = resolve(options.histoireDist ?? options.storybookDist ?? join(repoRoot, 'frontend/histoire-static'));
  const openapiJson = resolve(options.openapiJson ?? join(repoRoot, 'backend/openapi.json'));
  const hubDir = resolve(options.hubDir ?? join(repoRoot, 'docs/hub'));
  const hubHero = resolve(options.hubHero ?? join(repoRoot, 'docs/public/hero.svg'));
  const demoDir = resolve(options.demoDir ?? join(repoRoot, 'docs/public/demo'));
  const swaggerUiRoot = options.swaggerUiRoot;

  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });

  copyDir(hubDir, outDir);
  if (existsSync(hubHero)) {
    cpSync(hubHero, join(outDir, 'hero.svg'));
  }
  writeUsageHtmlPage(outDir, repoRoot);
  copyDir(docsDist, join(outDir, 'docs'));
  copyDir(histoireDist, join(outDir, 'histoire'));
  writeSwaggerStatic(
    join(outDir, 'swagger'),
    openapiJson,
    repoRoot,
    swaggerUiRoot ?? resolveSwaggerUiRoot(repoRoot),
  );

  if (existsSync(demoDir)) {
    copyDir(demoDir, join(outDir, 'demo'));
    writeDemoIndexRedirect(join(outDir, 'demo'), pagesBase);
  }

  const hubIndex = join(outDir, 'index.html');
  writeFileSync(hubIndex, readFileSync(hubIndex, 'utf8').replaceAll('__PAGES_BASE__', pagesBase));

  console.log(`[pages] Site assemblé → ${outDir} (base ${pagesBase})`);
}
