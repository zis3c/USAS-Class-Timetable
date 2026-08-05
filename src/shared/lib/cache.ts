import type { StudentSession, TimetableData } from '../types/usas';
import { isValidLoginUserId, sanitizeSession, sanitizeTimetableItem, sanitizeTextForShare } from './security';

const POISON_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

function isSafeParsedValue(value: unknown): boolean {
  if (Array.isArray(value)) {
    return value.every(isSafeParsedValue);
  }

  if (typeof value !== 'object' || value === null) {
    return true;
  }

  for (const key of Object.keys(value as Record<string, unknown>)) {
    if (POISON_KEYS.has(key)) return false;
    if (!isSafeParsedValue((value as Record<string, unknown>)[key])) return false;
  }

  return true;
}

export function parseJsonObject(value: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(value) as unknown;
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return null;
    }
    if (!isSafeParsedValue(parsed)) {
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

  const session = sanitizeSession(parsed as unknown as StudentSession);
  if (!isValidLoginUserId(session.user_id)) return null;
  if (!session.sid_1 || !session.sid_2 || !session.sid_3) return null;

  return session;
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
