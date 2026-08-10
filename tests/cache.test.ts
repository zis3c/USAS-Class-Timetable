import { describe, expect, it } from 'vitest';
import { restoreSessionFromCache, restoreTimetableFromCache, restoreThrottleState } from '../src/shared/lib/cache';

describe('cache restore helpers', () => {
  it('ignores invalid session and timetable blobs', () => {
    expect(restoreSessionFromCache('"oops"')).toBeNull();
    expect(restoreSessionFromCache('[]')).toBeNull();
    expect(restoreTimetableFromCache('"oops"')).toBeNull();
    expect(restoreTimetableFromCache('[]')).toBeNull();
  });

  it('rejects shaped but empty cached sessions', () => {
    expect(restoreSessionFromCache(JSON.stringify({
      user_id: 'AI210042',
      sid_1: '',
      sid_2: '',
      sid_3: '',
      isDemo: false,
    }))).toBeNull();
  });

  it('rejects poison keys in cached blobs', () => {
    expect(restoreSessionFromCache('{"user_id":"AI210042","sid_1":"a","sid_2":"b","sid_3":"c","isDemo":false,"__proto__":{"polluted":true}}')).toBeNull();
    expect(restoreTimetableFromCache('{"success":true,"days":["isnin"],"timetable":[],"constructor":{"prototype":{"polluted":true}}}')).toBeNull();
  });

  it('restores valid cached throttle state safely', () => {
    const state = restoreThrottleState('{"failedAttempts":2,"lockedUntil":123,"lastAttemptAt":456}');
    expect(state).toEqual({ failedAttempts: 2, lockedUntil: 123, lastAttemptAt: 456 });
  });

  it('clamps poisoned throttle values to safe non-negative integers', () => {
    const state = restoreThrottleState('{"failedAttempts":-3,"lockedUntil":"-99","lastAttemptAt":"NaN"}');
    expect(state).toEqual({ failedAttempts: 0, lockedUntil: 0, lastAttemptAt: 0 });
  });

  it('sanitizes valid cached timetable records', () => {
    const timetable = restoreTimetableFromCache(JSON.stringify({
      success: true,
      days: ['isnin', 'selasa'],
      timetable: [{ id: '1<script>', day: 'isnin', course_id: 'CSC2103', start_time: '08:00 AM' }],
      studentName: '  Aiman  ',
      program: '  CS  ',
      semester: '  Sem 1  ',
    }));

    expect(timetable?.days).toEqual(['ISNIN', 'SELASA']);
    expect(timetable?.timetable[0].day).toBe('ISNIN');
    expect(timetable?.studentName).toBe('Aiman');
  });
});
