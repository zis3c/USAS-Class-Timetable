import { describe, expect, it } from 'vitest';
import { parseFallbackJadual, selectProfileText } from '../src/services/usas/usasApi';

describe('usas api fallback timetable parsing', () => {
  it('coerces numeric jadual values safely', () => {
    expect(parseFallbackJadual(12345)).toEqual({ day: 'ISNIN', time: '12345' });
  });

  it('splits day and time for valid fallback values', () => {
    expect(parseFallbackJadual('MON 08:00 AM')).toEqual({ day: 'ISNIN', time: '08:00 AM' });
  });

  it('rejects malformed profile content objects', () => {
    expect(selectProfileText({ bad: 'x' }, 160)).toBeNull();
    expect(selectProfileText(123, 160)).toBe('123');
  });
});
