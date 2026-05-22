import path from 'node:path';
import { describe, expect, it } from 'vitest'

import { parseController } from '../src/generators/api-reference.mjs'

describe('parseController', () => {
  it('extracts routes from Nest controller source', () => {
    const content = `
@Controller('lists')
export class ListsController {
  @Get()
  async findAll() {}

  @Post(':id/share')
  async shareList() {}
}
`;
    const { routes } = parseController(content, '/repo/backend/src/lists/lists.controller.ts', '/repo');

    expect(routes).toEqual(
      expect.arrayContaining([
        { method: 'GET', path: '/lists', handler: 'findAll' },
        { method: 'POST', path: '/lists/:id/share', handler: 'shareList' },
      ]),
    );
  });
});
