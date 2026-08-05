import { describe, expect, it } from 'vitest';
import { lookupTranslationValue } from '../src/shared/lib/translation';

describe('translation lookup', () => {
  const sample = {
    nested: {
      title: 'Hello',
    },
  };

  it('reads valid nested values', () => {
    expect(lookupTranslationValue(sample, 'nested.title')).toBe('Hello');
  });

  it('rejects prototype and inherited keys', () => {
    expect(lookupTranslationValue(sample, '__proto__.title')).toBeUndefined();
    expect(lookupTranslationValue(sample, 'nested.__proto__')).toBeUndefined();
  });
});
