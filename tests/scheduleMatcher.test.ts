import { describe, expect, it } from 'vitest';
import LZString from 'lz-string';
import {
  compressTimetable,
  decompressTimetable,
  parseTimeStr,
  calculateOverlappingFreeTime,
  calculateCommonFreeTime,
} from '../src/features/timetable/lib/scheduleMatcher';
import type { TimetableItem } from '../src/shared/types/usas';

const makeCourse = (id: string, day: string, start: string, end: string): TimetableItem => ({
  id,
  day,
  course_id: id,
  course_name: `Course ${id}`,
  start_time: start,
  end_time: end,
});

describe('scheduleMatcher', () => {
  describe('parseTimeStr', () => {
    it('parses a valid time range', () => {
      expect(parseTimeStr('10:00 AM - 12:00 PM')).toEqual([600, 720]);
    });

    it('handles PM conversion', () => {
      expect(parseTimeStr('02:00 PM - 05:00 PM')).toEqual([840, 1020]);
    });

    it('returns null for invalid input', () => {
      expect(parseTimeStr('')).toBeNull();
      expect(parseTimeStr('10:00 AM')).toBeNull();
      expect(parseTimeStr('invalid')).toBeNull();
    });
  });

  describe('compressTimetable / decompressTimetable', () => {
    it('round-trips a timetable', () => {
      const timetable = [
        makeCourse('CSC2103', 'ISNIN', '08:30 AM', '10:30 AM'),
        makeCourse('SEC3303', 'SELASA', '11:00 AM', '01:00 PM'),
      ];

      const compressed = compressTimetable(timetable, 'Test Student');
      const result = decompressTimetable(compressed);

      expect(result).not.toBeNull();
      expect(result!.studentName).toBe('Test Student');
      expect(result!.timetable).toHaveLength(2);
      expect(result!.timetable[0].course_id).toBe('CSC2103');
      expect(result!.timetable[0].day).toBe('ISNIN');
    });

    it('round-trips the sender student id (for self-scan detection)', () => {
      const timetable = [makeCourse('CSC2103', 'ISNIN', '08:30 AM', '10:30 AM')];
      const compressed = compressTimetable(timetable, 'Test Student', 'AI210042');
      const result = decompressTimetable(compressed);

      expect(result).not.toBeNull();
      expect(result!.studentId).toBe('AI210042');
    });

    it('omits the student id when not provided', () => {
      const compressed = compressTimetable([makeCourse('A', 'ISNIN', '08:00 AM', '10:00 AM')], 'No Id');
      const result = decompressTimetable(compressed);
      expect(result!.studentId).toBe('');
    });

    it('decodes legacy payloads without a student id', () => {
      const legacy = LZString.compressToEncodedURIComponent(JSON.stringify({
        n: 'Legacy Friend',
        t: [[1, 510, 630, 'CSC2103']],
      }));

      const result = decompressTimetable(legacy);
      expect(result).not.toBeNull();
      expect(result!.studentName).toBe('Legacy Friend');
      expect(result!.studentId).toBe('');
      expect(result!.timetable).toHaveLength(1);
      expect(result!.timetable[0].day).toBe('ISNIN');
    });

    it('returns null for invalid compressed data', () => {
      expect(decompressTimetable('not-valid-data')).toBeNull();
      expect(decompressTimetable('')).toBeNull();
    });

    it('returns null when the payload has no timetable array', () => {
      const malformed = LZString.compressToEncodedURIComponent(JSON.stringify({ n: 'Nobody' }));
      expect(decompressTimetable(malformed)).toBeNull();
    });
  });

  describe('calculateOverlappingFreeTime', () => {
    it('finds free slots between classes', () => {
      const my = [makeCourse('A', 'ISNIN', '10:00 AM', '12:00 PM')];
      const friend = [makeCourse('B', 'ISNIN', '02:00 PM', '04:00 PM')];

      const slots = calculateOverlappingFreeTime(my, friend);

      const isninSlots = slots.filter(s => s.dayStr === 'ISNIN');
      expect(isninSlots.length).toBeGreaterThan(0);
      expect(isninSlots[0].startMins).toBe(480);
    });

    it('returns empty when no classes exist', () => {
      const slots = calculateOverlappingFreeTime([], []);
      expect(slots.length).toBeGreaterThan(0);
    });

    it('merges overlapping busy blocks', () => {
      const my = [
        makeCourse('A', 'ISNIN', '10:00 AM', '12:00 PM'),
        makeCourse('B', 'ISNIN', '11:00 AM', '01:00 PM'),
      ];
      const friend: TimetableItem[] = [];

      const slots = calculateOverlappingFreeTime(my, friend);
      const isninSlots = slots.filter(s => s.dayStr === 'ISNIN');

      expect(isninSlots[0].startMins).toBe(480);
      expect(isninSlots[0].endMins).toBe(600);
    });
  });

  describe('calculateCommonFreeTime (group)', () => {
    it('returns only slots when every timetable is free', () => {
      const a = [makeCourse('A', 'ISNIN', '08:00 AM', '10:00 AM')];
      const b = [makeCourse('B', 'ISNIN', '12:00 PM', '01:00 PM')];
      const c = [makeCourse('C', 'ISNIN', '03:00 PM', '05:00 PM')];

      const slots = calculateCommonFreeTime([a, b, c]).filter((s) => s.dayStr === 'ISNIN');

      expect(slots).toEqual([
        { dayStr: 'ISNIN', startMins: 600, endMins: 720 },
        { dayStr: 'ISNIN', startMins: 780, endMins: 900 },
        { dayStr: 'ISNIN', startMins: 1020, endMins: 1440 },
      ]);
    });

    it('matches calculateOverlappingFreeTime for two timetables', () => {
      const a = [makeCourse('A', 'SELASA', '09:00 AM', '11:00 AM')];
      const b = [makeCourse('B', 'SELASA', '02:00 PM', '04:00 PM')];
      expect(calculateCommonFreeTime([a, b])).toEqual(calculateOverlappingFreeTime(a, b));
    });
  });
});
