import type { TimetableItem } from '../types/usas';

function parseTimeToMinutes(timeStr: string | undefined): number {
  if (!timeStr) return 0;
  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!match) return 0;
  let h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const ampm = match[3]?.toUpperCase();
  if (ampm === 'PM' && h < 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;
  return h * 60 + m;
}

function normalizeGroup(groupStr: string | undefined): string {
  if (!groupStr) return 'G1';
  return groupStr.replace(/^GRP/i, 'G');
}

function buildDayGroups(timetable: TimetableItem[] = []): Record<string, TimetableItem[]> {
  const dayGroups: Record<string, TimetableItem[]> = {};

  timetable.forEach((item: TimetableItem) => {
    const day = item.day?.toUpperCase() || 'LAIN';
    if (!dayGroups[day]) dayGroups[day] = [];
    dayGroups[day].push(item);
  });

  Object.values(dayGroups).forEach((classes) => {
    classes.sort((a, b) => parseTimeToMinutes(a.start_time) - parseTimeToMinutes(b.start_time));
  });

  return dayGroups;
}

function formatTimeRange(startTime: string | undefined, endTime: string | undefined): string {
  if (!startTime) return 'TBA';
  return endTime ? `${startTime}-${endTime}` : startTime;
}

function buildFullShareText(timetable: TimetableItem[] = [], studentName = '', matricNo = '') {
  if (!timetable || timetable.length === 0) return '';

  const dayOrder = ['ISNIN', 'SELASA', 'RABU', 'KHAMIS', 'JUMAAT', 'SABTU', 'AHAD'];
  const dayGroups = buildDayGroups(timetable);
  let text = '📋 *JADUAL KULIAH SAYA*\n';
  text += `👤 ${studentName || 'Pelajar USAS'}\n`;
  text += `🎓 No. Matrik: ${matricNo}\n`;
  text += '━━━━━━━━━━━━━━━━━━━━\n\n';

  dayOrder.forEach(day => {
    if (!dayGroups[day]) return;
    const emoji = {
      ISNIN: '🟢',
      SELASA: '🔵',
      RABU: '🟡',
      KHAMIS: '🟣',
      JUMAAT: '🔴',
      SABTU: '🟠',
      AHAD: '⚪',
    }[day] || '⬜';

    text += `${emoji} *${day}*\n`;
    dayGroups[day].forEach(c => {
      const time = c.start_time ? `${c.start_time}${c.end_time ? ' - ' + c.end_time : ''}` : 'TBA';
      const code = c.course_id || c.kod_kursus || '';
      const name = c.course_name || c.kursus || '';
      const group = normalizeGroup(c.group || c.kumpulan || 'A');
      const loc = c.location || '';
      text += `  📘 ${code} (${group}): ${name}\n`;
      text += `  ⏰ ${time}\n`;
      if (loc) text += `  📍 ${loc}\n`;
      text += '\n';
    });
  });

  text += '━━━━━━━━━━━━━━━━━━━━\n';
  text += '📲 Dijana oleh Portal Jadual USAS';
  return text;
}

function buildCompactShareText(timetable: TimetableItem[] = [], matricNo = '') {
  if (!timetable || timetable.length === 0) return '';

  const dayOrder = ['ISNIN', 'SELASA', 'RABU', 'KHAMIS', 'JUMAAT', 'SABTU', 'AHAD'];
  const dayGroups = buildDayGroups(timetable);

  const parts = [];
  dayOrder.forEach(day => {
    if (!dayGroups[day]) return;
    const items = dayGroups[day].map(c => {
      const time = formatTimeRange(c.start_time, c.end_time);
      const code = c.course_id || '';
      const group = normalizeGroup(c.group || c.kumpulan || 'A');
      return `${code}-${group} ${time}`;
    }).join(', ');
    parts.push(`${day}: ${items}`);
  });

  return `Jadual Kuliah ${matricNo}\n\n${parts.join('\n\n')}`;
}

export { buildCompactShareText, buildFullShareText };
