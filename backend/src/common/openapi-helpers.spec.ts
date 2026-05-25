import { normalizeOpenApiDocument } from './openapi-helpers';

describe('normalizeOpenApiDocument', () => {
  it('remplit les schémas de paramètres path vides', () => {
    const doc = normalizeOpenApiDocument({
      paths: {
        '/lists/{id}': {
          get: {
            parameters: [{ name: 'id', in: 'path', required: true, schema: {} }],
          },
        },
      },
      servers: [{ url: 'http://localhost:4000' }, { url: '/open-task/swagger' }],
    });

    const param = (doc.paths as Record<string, { get: { parameters: { schema: unknown }[] } }>)['/lists/{id}']
      .get.parameters[0];
    expect(param.schema).toEqual({
      type: 'string',
      format: 'uuid',
    });
    expect(doc.servers).toEqual([{ url: 'http://localhost:4000' }]);
  });

  it('ignore les pathItem invalides et les opérations sans paramètres', () => {
    const doc = normalizeOpenApiDocument({
      paths: {
        '/skip': null as unknown as Record<string, unknown>,
        '/ok': {
          get: { parameters: [{ name: 'id', in: 'path', schema: { type: 'string' } }] },
          post: {},
        },
      },
    });

    expect(doc.paths).toEqual({
      '/skip': null,
      '/ok': {
        get: { parameters: [{ name: 'id', in: 'path', schema: { type: 'string' } }] },
        post: {},
      },
    });
  });
});
