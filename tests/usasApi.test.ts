import { describe, expect, it } from 'vitest';
import { parseFallbackJadual } from '../src/services/usas/usasApi';

describe('usas api fallback timetable parsing', () => {
  it('coerces numeric jadual values safely', () => {
    expect(parseFallbackJadual(12345)).toEqual({ day: 'ISNIN', time: '12345' });
  });

  it('splits day and time for valid fallback values', () => {
    expect(parseFallbackJadual('MON 08:00 AM')).toEqual({ day: 'ISNIN', time: '08:00 AM' });
  });
});
