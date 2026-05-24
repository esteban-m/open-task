import { describe, expect, it } from 'vitest';
import { ref } from 'vue';

import { useState } from '../histoire/mocks/nuxt-app';

describe('Histoire Nuxt mocks', () => {
  it('useState partage la même ref par clé', () => {
    const a = useState('test-key', () => 'a');
    const b = useState('test-key');
    expect(a.value).toBe('a');
    b.value = 'b';
    expect(a.value).toBe('b');
    expect(ref).toBeDefined();
  });
});
