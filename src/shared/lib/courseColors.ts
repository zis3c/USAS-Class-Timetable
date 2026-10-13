import type { TimetableItem } from '../types/usas';

// One colour slot per course so a course keeps its colour across card view, grid and
// wallpaper. Slots reuse each view's day-colour palette keys.
export const COURSE_COLOR_SLOTS = ['ISNIN', 'SELASA', 'RABU', 'KHAMIS', 'JUMAAT', 'SABTU', 'AHAD'] as const;
export type CourseColorSlot = typeof COURSE_COLOR_SLOTS[number];

export function buildCourseColorMap(courses: TimetableItem[] | undefined): Map<string, CourseColorSlot> {
  const map = new Map<string, CourseColorSlot>();
  let index = 0;

  (courses || []).forEach((course) => {
    const id = String(course.course_id || course.kod_kursus || '').toUpperCase();
    if (id && !map.has(id)) {
      map.set(id, COURSE_COLOR_SLOTS[index % COURSE_COLOR_SLOTS.length]);
      index += 1;
    }
  });

  return map;
}

export function getCourseColorSlot(map: Map<string, CourseColorSlot>, courseId?: string): CourseColorSlot {
  return map.get(String(courseId || '').toUpperCase()) ?? COURSE_COLOR_SLOTS[0];
}
