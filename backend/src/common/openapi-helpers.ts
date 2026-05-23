export function normalizeOpenApiDocument<T extends { paths?: Record<string, unknown>; servers?: { url?: string }[] }>(
  document: T,
): T {
  for (const pathItem of Object.values(document.paths ?? {})) {
    if (!pathItem || typeof pathItem !== 'object') continue;
    for (const operation of Object.values(pathItem as Record<string, { parameters?: { in?: string; schema?: Record<string, unknown> }[] }>)) {
      if (!operation?.parameters) continue;
      for (const param of operation.parameters) {
        if (param.in === 'path' && (!param.schema?.type)) {
          param.schema = { type: 'string', format: 'uuid' };
        }
      }
    }
  }

  if (Array.isArray(document.servers)) {
    document.servers = document.servers.filter((s) => !String(s.url ?? '').includes('/swagger'));
  }

  return document;
}
