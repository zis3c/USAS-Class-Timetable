import { describe, expect, it } from 'vitest';
import {
  compressTimetable,
  decompressTimetable,
  calculateOverlappingFreeTime,
} from '../src/features/timetable/lib/scheduleMatcher';
import type { TimetableItem } from '../src/shared/types/usas';

// Demo mode stores plain Malay day keys and clean course ids.
const demoCourse = (id: string, day: string, start: string, end: string): TimetableItem => ({
  id,
  day,
  course_id: id,
  course_name: `Demo ${id}`,
  start_time: start,
  end_time: end,
});

// Real accounts store the formatted "DD-MM-YYYY (DAY)" label from the USAS API.
const realCourse = (id: string, dayLabel: string, start: string, end: string): TimetableItem => ({
  id,
  day: dayLabel,
  course_id: id,
  course_name: `Real ${id}`,
  start_time: start,
  end_time: end,
});

describe('compare schedule interop (demo vs real accounts)', () => {
  it('parses free time between a demo and a real timetable', () => {
    const demo: TimetableItem[] = [
      demoCourse('RKS6093', 'ISNIN', '08:00 AM', '10:00 AM'),
      demoCourse('KOM6373', 'SELASA', '02:00 PM', '05:00 PM'),
    ];
    const real: TimetableItem[] = [
      realCourse('CSC2103', '05-10-2026 (ISNIN)', '10:00 AM', '12:00 PM'),
      realCourse('SEC3303', '06-10-2026 (SELASA)', '09:00 AM', '11:00 AM'),
    ];

    const slots = calculateOverlappingFreeTime(demo, real);

    // Monday: busy 08:00-10:00 (demo) and 10:00-12:00 (real) → free 12:00-midnight.
    const monday = slots.filter((s) => s.dayStr === 'ISNIN');
    expect(monday).toEqual([{ dayStr: 'ISNIN', startMins: 720, endMins: 1440 }]);

    // Tuesday: busy 09:00-11:00 (real) and 14:00-17:00 (demo) → free 08:00-09:00, 11:00-14:00 and 17:00-midnight.
    const tuesday = slots.filter((s) => s.dayStr === 'SELASA');
    expect(tuesday).toEqual([
      { dayStr: 'SELASA', startMins: 480, endMins: 540 },
      { dayStr: 'SELASA', startMins: 660, endMins: 840 },
      { dayStr: 'SELASA', startMins: 1020, endMins: 1440 },
    ]);
  });

  it('round-trips a demo timetable through the share payload and stays comparable', () => {
    const demo: TimetableItem[] = [
      demoCourse('RKS6093', 'ISNIN', '08:00 AM', '10:00 AM'),
      demoCourse('CSE6013', 'SABTU', '09:00 AM', '12:00 PM'), // weekend class
    ];

    const payload = compressTimetable(demo, 'DEMO STUDENT', 'AI210042');
    const restored = decompressTimetable(payload);

    expect(restored).not.toBeNull();
    expect(restored!.studentId).toBe('AI210042');
    expect(restored!.studentName).toBe('DEMO STUDENT');
    expect(restored!.timetable.map((c) => c.course_id)).toEqual(['RKS6093', 'CSE6013']);
    expect(restored!.timetable.map((c) => c.day)).toEqual(['ISNIN', 'SABTU']);

    // Free time is computed for weekdays only, so the Saturday demo class is ignored.
    const slots = calculateOverlappingFreeTime(restored!.timetable, []);
    expect(slots.some((s) => s.dayStr === 'SABTU')).toBe(false);
    expect(slots.some((s) => s.dayStr === 'ISNIN')).toBe(true);
  });

  it('distinguishes a demo sender from a real receiver by student id', () => {
    const demoPayload = compressTimetable(
      [demoCourse('RKS6093', 'ISNIN', '08:00 AM', '10:00 AM')],
      'DEMO STUDENT',
      'AI210042',
    );
    const decoded = decompressTimetable(demoPayload)!;

    // A real account (different matric) is not the sender → comparison allowed.
    const realUserId = 'AI209999';
    expect(decoded.studentId === realUserId).toBe(false);

    // The sender scanning their own demo QR → rejected.
    expect(decoded.studentId === 'AI210042').toBe(true);
  });
});
