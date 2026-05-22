import { describe, expect, it } from 'vitest'

import { prismaSchemaToMermaid } from '../src/services/prisma-erd.mjs'

describe('prismaSchemaToMermaid', () => {
  it('builds erDiagram from schema models', () => {
    const schema = `
model User {
  id String @id
  email String
  lists TaskList[]
}

model TaskList {
  id String @id
  name String
  userId String
  user User @relation(fields: [userId], references: [id])
}
`;
    const mermaid = prismaSchemaToMermaid(schema);
    expect(mermaid).toContain('erDiagram');
    expect(mermaid).toContain('User');
    expect(mermaid).toContain('TaskList');
  });
});
