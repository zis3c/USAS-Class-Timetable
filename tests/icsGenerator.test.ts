import { afterEach, describe, expect, it, vi } from 'vitest';
import { escapeIcsText, formatICSDatetime, sanitizeFileNameSegment } from '../src/features/export/lib/icsGenerator';

describe('ics generator helpers', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('escapes calendar text fields', () => {
    expect(escapeIcsText('Room 1, Block A; Lab\\North\nLine 2')).toBe('Room 1\\, Block A\\; Lab\\\\North\\nLine 2');
  });

  it('sanitizes download names', () => {
    expect(sanitizeFileNameSegment('Aiman / 2026:Timetable*')).toBe('Aiman_2026_Timetable');
    expect(sanitizeFileNameSegment('__proto__')).toBe('proto');
  });

  it('rolls same-day past slots to next week', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 7, 5, 4, 0, 0));

    const today = new Date();
    const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const currentDayName = dayNames[today.getDay()];

    const pastSlot = formatICSDatetime(currentDayName, '03:00 AM');
    const futureSlot = formatICSDatetime(currentDayName, '06:00 AM');

    expect(pastSlot > futureSlot).toBe(true);
  });
});
