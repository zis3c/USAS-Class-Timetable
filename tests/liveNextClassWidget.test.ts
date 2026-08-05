import { describe, expect, it } from 'vitest';
import { buildNextClassNotificationKey } from '../src/features/timetable/components/LiveNextClassWidget';

describe('live next class notification key', () => {
  it('includes the local date so weekly reminders can trigger again later', () => {
    const course = {
      course_id: 'CSC2103',
      day: 'ISNIN',
      start_time: '08:30 AM',
    };

    const monday = new Date(2026, 7, 3, 8, 0, 0);
    const nextMonday = new Date(2026, 7, 10, 8, 0, 0);

    expect(buildNextClassNotificationKey(course as never, monday)).toBe('2026-08-03-CSC2103-ISNIN-08:30 AM');
    expect(buildNextClassNotificationKey(course as never, nextMonday)).toBe('2026-08-10-CSC2103-ISNIN-08:30 AM');
  });
});
