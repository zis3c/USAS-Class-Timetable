import type { StudentSession, TimetableData } from '../types/usas';
import { sanitizeSession, sanitizeTimetableItem, sanitizeTextForShare } from './security';

export function parseJsonObject(value: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(value) as unknown;
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return null;
    }
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function restoreSessionFromCache(value: string): StudentSession | null {
  const parsed = parseJsonObject(value);
  if (!parsed) return null;
  return sanitizeSession(parsed as unknown as StudentSession);
}

export function restoreTimetableFromCache(value: string): TimetableData | null {
  const parsed = parseJsonObject(value);
  if (!parsed) return null;

  const timetable = Array.isArray(parsed.timetable) ? parsed.timetable.map((item) => sanitizeTimetableItem(item as never)) : [];
  const days = Array.isArray(parsed.days) ? parsed.days.map((day) => String(day).toUpperCase()) : [];

  return {
    success: true,
    days,
    timetable,
    studentName: sanitizeTextForShare(parsed.studentName, 160),
    program: sanitizeTextForShare(parsed.program, 160),
    semester: sanitizeTextForShare(parsed.semester, 64),
  };
}

export function restoreThrottleState(value: string): { failedAttempts: number; lockedUntil: number; lastAttemptAt: number } | null {
  const parsed = parseJsonObject(value);
  if (!parsed) return null;

  return {
    failedAttempts: Number(parsed.failedAttempts) || 0,
    lockedUntil: Number(parsed.lockedUntil) || 0,
    lastAttemptAt: Number(parsed.lastAttemptAt) || 0,
  };
}
