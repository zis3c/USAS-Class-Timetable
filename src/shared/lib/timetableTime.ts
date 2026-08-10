import type { TimetableItem } from '../types/usas';

export type ActiveClassHighlights = {
  ongoingKey: string | null;
  upcomingKey: string | null;
};

export const parseTo24hHour = (timeStr?: string) => {
  if (!timeStr) return null;
  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) {
    const numMatch = timeStr.match(/(\d+)/);
    return numMatch ? parseInt(numMatch[1], 10) : null;
  }
  let hour = parseInt(match[1], 10);
  const ampm = match[3].toUpperCase();
  if (ampm === 'PM' && hour !== 12) {
    hour += 12;
  } else if (ampm === 'AM' && hour === 12) {
    hour = 0;
  }
  return hour;
};

export const parseTimeToMinutes = (timeStr?: string) => {
  if (!timeStr) return null;
  const raw = String(timeStr).trim();
  const ampmMatch = raw.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  const twentyFourMatch = raw.match(/^(\d{1,2}):(\d{2})$/);
  const match = ampmMatch || twentyFourMatch;
  if (!match) return null;

  let hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);
  const suffix = ampmMatch ? ampmMatch[3].toUpperCase() : null;
  const normalizedHour = suffix === 'PM' && hour < 12 ? hour + 12 : suffix === 'AM' && hour === 12 ? 0 : hour;
  return normalizedHour * 60 + minute;
};

export const getShortTimeRange = (startTime?: string, endTime?: string) => {
  const startHour = parseTo24hHour(startTime);
  const endHour = parseTo24hHour(endTime);
  if (startHour === null) return startTime || '';
  if (endHour === null) return `${startHour}`;
  return `${startHour}-${endHour}`;
};

export const getDayKeyFromDate = (date: Date) => {
  const dayMap = ['AHAD', 'ISNIN', 'SELASA', 'RABU', 'KHAMIS', 'JUMAAT', 'SABTU'];
  return dayMap[date.getDay()] || 'ISNIN';
};

export const getCourseHighlightKey = (course: TimetableItem) => {
  return [
    course.course_id || course.kod_kursus || '',
    course.day || '',
    course.start_time || course.jadual || '',
    course.end_time || '',
  ].join('|');
};

export const getActiveCourseHighlights = (courses: TimetableItem[], now: Date): ActiveClassHighlights => {
  const todayKey = getDayKeyFromDate(now);
  const currentMin = now.getHours() * 60 + now.getMinutes();
  let ongoingKey: string | null = null;
  let upcomingKey: string | null = null;
  let nextUpcomingStart: number | null = null;

  courses.forEach((course) => {
    const courseDay = course.day?.toUpperCase();
    if (!courseDay || courseDay !== todayKey) return;

    const startMin = parseTimeToMinutes(course.start_time || course.jadual || '');
    if (startMin === null) return;

    const rawEndMin = parseTimeToMinutes(course.end_time || '');
    const endMin = rawEndMin !== null && rawEndMin > startMin ? rawEndMin : startMin + 60;

    const courseKey = getCourseHighlightKey(course);
    if (currentMin >= startMin && currentMin < endMin) {
      ongoingKey = courseKey;
      return;
    }

    if (startMin > currentMin && (nextUpcomingStart === null || startMin < nextUpcomingStart)) {
      nextUpcomingStart = startMin;
      upcomingKey = courseKey;
    }
  });

  return { ongoingKey, upcomingKey };
};
