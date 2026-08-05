import { describe, expect, it } from 'vitest';
import { getLocalDateStamp } from '../src/shared/lib/notificationKeys';

describe('prayer notifier date stamps', () => {
  it('uses local calendar date not utc date', () => {
    const date = new Date(2026, 7, 5, 0, 30, 0);
    expect(getLocalDateStamp(date)).toBe('2026-08-05');
  });
});
