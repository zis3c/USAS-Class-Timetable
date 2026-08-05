import { describe, expect, it } from 'vitest';
import { normalizeThemeName, restoreStringRecord } from '../src/shared/lib/storage';
import { restoreTimetableFromCache } from '../src/shared/lib/cache';

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

  it('drops malformed timetable cache entries', () => {
    const restored = restoreTimetableFromCache(JSON.stringify({
      studentName: 'Aiman',
      program: 'CS',
      semester: 'Sem 1',
      days: ['ISNIN'],
      timetable: [
        'bad',
        123,
        null,
        {
          id: '1',
          day: 'isnin',
          course_id: 'CSC2103',
          course_name: 'Data Structures',
          start_time: '08:00 AM',
        },
      ],
    }));

    expect(restored?.timetable).toHaveLength(1);
    expect(restored?.timetable[0].course_id).toBe('CSC2103');
  });
});
