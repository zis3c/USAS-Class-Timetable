import { describe, expect, it } from 'vitest';
import { lookupTranslationValue } from '../src/shared/lib/translation';
import { translations } from '../src/shared/i18n/translations';

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

  it('supports en, ms, zh, and ta translations without Navy suffix', () => {
    expect(translations.en.themeDark).toBe('Dark Theme');
    expect(translations.ms.themeDark).toBe('Tema Gelap');
    expect(translations.zh.themeDark).toBe('深色主题');
    expect(translations.ta.themeDark).toBe('இருண்ட தீம் (Dark)');
  });
});
