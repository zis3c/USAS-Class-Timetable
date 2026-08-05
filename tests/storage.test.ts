import { describe, expect, it } from 'vitest';
import { normalizeThemeName, restoreStringRecord } from '../src/shared/lib/storage';

describe('storage helpers', () => {
  it('restores only safe string notes', () => {
    expect(restoreStringRecord('{"CSC2103":"revise","SEC3303":"lab"}')).toEqual({
      CSC2103: 'revise',
      SEC3303: 'lab',
    });
  });

  it('rejects poison notes payloads', () => {
    expect(restoreStringRecord('{"CSC2103":"revise","__proto__":{"polluted":true}}')).toEqual({});
  });

  it('normalizes theme values defensively', () => {
    expect(normalizeThemeName('light')).toBe('light');
    expect(normalizeThemeName('OLED')).toBe('oled');
    expect(normalizeThemeName('bad-theme')).toBe('light');
    expect(normalizeThemeName('__proto__')).toBe('light');
  });
});
