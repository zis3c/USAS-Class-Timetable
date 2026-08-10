import { describe, expect, it } from 'vitest';
import { buildDayScopedNotificationKey } from '../src/shared/lib/notificationKeys';

describe('live next class notification key', () => {
  it('includes the local date so weekly reminders can trigger again later', () => {
    const course = {
      course_id: 'CSC2103',
      day: 'ISNIN',
      start_time: '08:30 AM',
    };

    const monday = new Date(2026, 7, 3, 8, 0, 0);
    const nextMonday = new Date(2026, 7, 10, 8, 0, 0);

    expect(buildDayScopedNotificationKey(monday, course.course_id, course.day, course.start_time)).toBe('2026-08-03-CSC2103-ISNIN-08:30 AM');
    expect(buildDayScopedNotificationKey(nextMonday, course.course_id, course.day, course.start_time)).toBe('2026-08-10-CSC2103-ISNIN-08:30 AM');
  });
});
