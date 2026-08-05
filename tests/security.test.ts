import { describe, expect, it } from 'vitest';
import {
  evaluateLoginThrottle,
  getEmptyThrottleState,
  isValidLoginUserId,
  recordLoginFailure,
  recordLoginSuccess,
  sanitizeLoginUserId,
  sanitizeSingleLine,
  sanitizeTimetableItem,
} from '../src/shared/lib/security';

describe('security helpers', () => {
  it('sanitizes single line text', () => {
    expect(sanitizeSingleLine('  Hello\nWorld\t<script>  ', 20)).toBe('Hello World <script>');
  });

  it('validates matric ids defensively', () => {
    expect(isValidLoginUserId('AI210042')).toBe(true);
    expect(isValidLoginUserId('ai210042')).toBe(true);
    expect(isValidLoginUserId('AI 210042')).toBe(false);
    expect(isValidLoginUserId('__proto__')).toBe(false);
    expect(isValidLoginUserId('constructor')).toBe(false);
    expect(sanitizeLoginUserId('__proto__')).toBe('');
  });

  it('throttles repeated login failures', () => {
    let state = getEmptyThrottleState();
    const now = 1_700_000_000_000;

    for (let i = 0; i < 5; i += 1) {
      state = recordLoginFailure(state, now + i);
    }

    const blocked = evaluateLoginThrottle(state, now + 10);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAt).toBeGreaterThan(now);

    state = recordLoginSuccess(state, now + 11);
    const allowed = evaluateLoginThrottle(state, now + 12);
    expect(allowed.allowed).toBe(true);
    expect(allowed.remainingAttempts).toBe(5);
  });

  it('sanitizes timetable items before rendering', () => {
    const item = sanitizeTimetableItem({
      id: '1<script>',
      day: 'isnin',
      course_id: 'CSC2103\n',
      course_name: 'Data Structures <b>and</b> Algorithms',
      group: 'grp01',
      location: 'Lab 3<script>',
      lecturer: 'Dr. Example\nName',
      kehadiran: '100%',
      catatan: 'Line one\nLine two<script>',
    });

    expect(item.id).toBe('1<script>');
    expect(item.day).toBe('ISNIN');
    expect(item.course_name).toBe('Data Structures <b>and</b> Algorithms');
    expect(item.location).toBe('Lab 3<script>');
    expect(item.lecturer).toBe('Dr. Example Name');
    expect(item.catatan).toBe('Line one Line two<script>');
  });
});
