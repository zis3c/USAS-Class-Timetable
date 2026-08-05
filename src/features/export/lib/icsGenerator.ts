import type { TimetableItem } from '@/shared/types/usas';

/**
 * Generates an iCalendar (.ics) file for Google Calendar, Apple iCal, and Outlook.
 * Creates recurring weekly events for all enrolled student courses.
 */

type IcsTimeInput = string | undefined;

function formatICSDatetime(dayName: string | undefined, timeStr: IcsTimeInput): string {
  // Map day names to day offset (Monday = 1, Friday = 5)
  const dayOffsets = {
    'ISNIN': 1, 'MONDAY': 1, 'MON': 1,
    'SELASA': 2, 'TUESDAY': 2, 'TUE': 2,
    'RABU': 3, 'WEDNESDAY': 3, 'WED': 3,
    'KHAMIS': 4, 'THURSDAY': 4, 'THU': 4,
    'JUMAAT': 5, 'FRIDAY': 5, 'FRI': 5,
    'SABTU': 6, 'SATURDAY': 6, 'SAT': 6,
    'AHAD': 0, 'SUNDAY': 0, 'SUN': 0
  };

  const dayIndex = dayOffsets[dayName?.toUpperCase()] ?? 1;

  // Calculate next occurrence of this day
  const now = new Date();
  const currentDayIndex = now.getDay();
  let daysUntil = (dayIndex - currentDayIndex + 7) % 7;
  if (daysUntil === 0) daysUntil = 0; // Today or next week

  const targetDate = new Date(now);
  targetDate.setDate(now.getDate() + daysUntil);

  // Parse time (e.g. "08:30 AM" or "14:00")
  let hours = 9;
  let minutes = 0;

  if (timeStr) {
    const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (match) {
      hours = parseInt(match[1], 10);
      minutes = parseInt(match[2], 10);
      const ampm = match[3]?.toUpperCase();
      if (ampm === 'PM' && hours < 12) hours += 12;
      if (ampm === 'AM' && hours === 12) hours = 0;
    }
  }

  targetDate.setHours(hours, minutes, 0, 0);

  // Format as YYYYMMDDTHHMMSSZ
  const year = targetDate.getUTCFullYear();
  const month = String(targetDate.getUTCMonth() + 1).padStart(2, '0');
  const date = String(targetDate.getUTCDate()).padStart(2, '0');
  const hh = String(targetDate.getUTCHours()).padStart(2, '0');
  const mm = String(targetDate.getUTCMinutes()).padStart(2, '0');

  return `${year}${month}${date}T${hh}${mm}00Z`;
}

export function exportTimetableICS(timetable: TimetableItem[] = [], studentName = 'Pelajar USAS'): void {
  if (!timetable || timetable.length === 0) {
    alert('Tiada kursus untuk dieksport ke kalendar.');
    return;
  }

  let icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Universiti Sultan Azlan Shah//USAS Student Timetable//MS',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:Jadual USAS - ${studentName}`,
    'X-WR-TIMEZONE:Asia/Kuala_Lumpur'
  ];

  timetable.forEach((course, idx) => {
    const startIso = formatICSDatetime(course.day, course.start_time || '09:00 AM');
    const endIso = formatICSDatetime(course.day, course.end_time || '11:00 AM');

    const summary = `${course.course_id || course.kod_kursus}: ${course.course_name || course.kursus}`;
    const location = course.location || 'Dewan Kuliah USAS';
    const description = `Pensyarah: ${course.lecturer || 'Pensyarah USAS'}\\nKumpulan: ${course.group || 'GRP01'}\\nLokasi: ${location}`;

    icsContent.push(
      'BEGIN:VEVENT',
      `UID:usas-course-${idx}-${Date.now()}@usas.edu.my`,
      `DTSTAMP:${startIso}`,
      `DTSTART:${startIso}`,
      `DTEND:${endIso}`,
      'RRULE:FREQ=WEEKLY;COUNT=14', // 14 weeks semester
      `SUMMARY:${summary}`,
      `LOCATION:${location}`,
      `DESCRIPTION:${description}`,
      'STATUS:CONFIRMED',
      'END:VEVENT'
    );
  });

  icsContent.push('END:VCALENDAR');

  const blob = new Blob([icsContent.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.setAttribute('download', `Jadual_USAS_${studentName.replace(/\s+/g, '_')}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}



