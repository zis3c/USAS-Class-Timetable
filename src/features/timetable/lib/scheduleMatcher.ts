import LZString from 'lz-string';
import type { TimetableItem } from '@/shared/types/usas';
import { extractDayName } from '@/shared/lib/dayFormat';
import { getOwnRecordValue, sanitizeSingleLine } from '@/shared/lib/security';

export type FreeSlot = {
  dayStr: string;
  startMins: number;
  endMins: number;
};

// Day ints align with Date.getDay() (AHAD = 0).
const dayMap: Record<string, number> = {
  'ISNIN': 1, 'SELASA': 2, 'RABU': 3, 'KHAMIS': 4, 'JUMAAT': 5, 'SABTU': 6, 'AHAD': 0
};
export const reverseDayMap = ['AHAD', 'ISNIN', 'SELASA', 'RABU', 'KHAMIS', 'JUMAAT', 'SABTU'];

export function parseTimeStr(timeStr: string | undefined): [number, number] | null {
  if (!timeStr) return null;
  const parts = timeStr.split(' - ');
  if (parts.length !== 2) return null;

  const toMins = (t: string) => {
    const match = t.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return 0;
    let [_, h, m, period] = match;
    let hours = parseInt(h);
    const mins = parseInt(m);
    if (period.toUpperCase() === 'PM' && hours < 12) hours += 12;
    if (period.toUpperCase() === 'AM' && hours === 12) hours = 0;
    return hours * 60 + mins;
  };

  return [toMins(parts[0]), toMins(parts[1])];
}

/** Compresses a timetable to a URI-safe string, minifying keys to keep the payload small. */
export function compressTimetable(timetable: TimetableItem[], studentName: string, studentId?: string): string {
  const minified = timetable.map(item => {
    const dayInt = getOwnRecordValue<number>(dayMap, extractDayName(item.day)) ?? 1;
    const times = parseTimeStr(`${item.start_time || ''} - ${item.end_time || ''}`);
    const code = item.course_id || item.kod_kursus || 'Class';
    return [dayInt, times?.[0] || 0, times?.[1] || 0, code];
  });
  const payload: { n: string; i?: string; t: (string | number)[][] } = {
    n: sanitizeSingleLine(studentName, 80) || 'Student',
    t: minified,
  };
  const safeId = sanitizeSingleLine(studentId || '', 32);
  if (safeId) payload.i = safeId;
  return LZString.compressToEncodedURIComponent(JSON.stringify(payload));
}

/** Reverses compressTimetable; returns null on invalid input. */
export function decompressTimetable(compressed: string): { studentName: string; studentId: string; timetable: TimetableItem[] } | null {
  try {
    const jsonStr = LZString.decompressFromEncodedURIComponent(compressed);
    if (!jsonStr) return null;
    const payload = JSON.parse(jsonStr);
    if (!payload || !Array.isArray(payload.t)) return null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items: TimetableItem[] = payload.t.map((arr: any) => {
      const [dayInt, startMins, endMins, code] = arr;
      
      const formatTime = (mins: number) => {
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        const period = h >= 12 ? 'PM' : 'AM';
        const displayH = h % 12 === 0 ? 12 : h % 12;
        return `${displayH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${period}`;
      };

      const safeDayIndex = Number.isInteger(dayInt) && dayInt >= 0 && dayInt < reverseDayMap.length ? dayInt : 1;
      return {
        id: `gen-${Math.random().toString(36).substring(2, 9)}`,
        day: reverseDayMap.at(safeDayIndex) ?? 'ISNIN',
        course_id: code,
        course_name: code,
        start_time: formatTime(startMins),
        end_time: formatTime(endMins)
      } as TimetableItem;
    });

    return {
      studentName: sanitizeSingleLine(payload.n, 80) || 'Student',
      studentId: sanitizeSingleLine(payload.i, 32),
      timetable: items,
    };
  } catch {
    return null;
  }
}

/** Free slots common to every timetable, 8:00 AM to midnight, Monday to Friday. */
export function calculateCommonFreeTime(timetables: TimetableItem[][]): FreeSlot[] {
  const WORK_START = 8 * 60;
  const WORK_END = 24 * 60;

  const allClasses = timetables.flat();
  const freeSlots: FreeSlot[] = [];

  for (let dayInt = 1; dayInt <= 5; dayInt++) {
    const dayStr = reverseDayMap.at(dayInt);
    if (!dayStr) continue;

    const busyBlocks = allClasses
      .filter(c => extractDayName(c.day) === dayStr)
      .map(c => {
        const times = parseTimeStr(`${c.start_time || ''} - ${c.end_time || ''}`);
        return { start: times?.[0] || 0, end: times?.[1] || 0 };
      })
      .filter(b => b.start < b.end)
      .sort((a, b) => a.start - b.start);

    const mergedBusy: {start: number, end: number}[] = [];
    for (const block of busyBlocks) {
      if (mergedBusy.length === 0) {
        mergedBusy.push(block);
      } else {
        const last = mergedBusy[mergedBusy.length - 1];
        if (block.start <= last.end) {
          last.end = Math.max(last.end, block.end);
        } else {
          mergedBusy.push(block);
        }
      }
    }

    let currentTime = WORK_START;
    for (const busy of mergedBusy) {
      if (currentTime < busy.start) {
        freeSlots.push({ dayStr, startMins: currentTime, endMins: busy.start });
      }
      currentTime = Math.max(currentTime, busy.end);
    }

    if (currentTime < WORK_END) {
      freeSlots.push({ dayStr, startMins: currentTime, endMins: WORK_END });
    }
  }

  return freeSlots;
}

/** Free slots when both schedules are free. */
export function calculateOverlappingFreeTime(myTimetable: TimetableItem[], friendTimetable: TimetableItem[]): FreeSlot[] {
  return calculateCommonFreeTime([myTimetable, friendTimetable]);
}
