import React, { useMemo } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { MapPin } from 'lucide-react';

const getDayColors = (day, isLight) => {
  const darkColors = {
    'ISNIN':  { bg: 'bg-emerald-500/[0.18]', border: 'border-emerald-500/40', text: 'text-emerald-300 font-bold', dot: 'bg-emerald-400' },
    'SELASA': { bg: 'bg-blue-500/[0.18]',    border: 'border-blue-500/40',    text: 'text-blue-300 font-bold',    dot: 'bg-blue-400' },
    'RABU':   { bg: 'bg-amber-500/[0.18]',   border: 'border-amber-500/40',   text: 'text-amber-300 font-bold',   dot: 'bg-amber-400' },
    'KHAMIS': { bg: 'bg-purple-500/[0.18]',  border: 'border-purple-500/40',  text: 'text-purple-300 font-bold',  dot: 'bg-purple-400' },
    'JUMAAT': { bg: 'bg-rose-500/[0.18]',    border: 'border-rose-500/40',    text: 'text-rose-300 font-bold',    dot: 'bg-rose-400' },
    'SABTU':  { bg: 'bg-orange-500/[0.18]',  border: 'border-orange-500/40',  text: 'text-orange-300 font-bold',  dot: 'bg-orange-400' },
    'AHAD':   { bg: 'bg-slate-500/[0.18]',   border: 'border-slate-500/40',   text: 'text-slate-300 font-bold',   dot: 'bg-slate-400' },
  };

  const lightColors = {
    'ISNIN':  { bg: 'bg-emerald-100/70 border-emerald-300/80', border: 'border-emerald-300', text: 'text-emerald-800 font-bold', dot: 'bg-emerald-500' },
    'SELASA': { bg: 'bg-blue-100/70 border-blue-300/80',       border: 'border-blue-300',    text: 'text-blue-800 font-bold',    dot: 'bg-blue-500' },
    'RABU':   { bg: 'bg-amber-100/80 border-amber-305/85',     border: 'border-amber-300',   text: 'text-amber-850 font-bold',   dot: 'bg-amber-500' },
    'KHAMIS': { bg: 'bg-purple-100/70 border-purple-300/80',   border: 'border-purple-300',  text: 'text-purple-800 font-bold',  dot: 'bg-purple-500' },
    'JUMAAT': { bg: 'bg-rose-100/70 border-rose-300/80',       border: 'border-rose-300',    text: 'text-rose-800 font-bold',    dot: 'bg-rose-500' },
    'SABTU':  { bg: 'bg-orange-100/70 border-orange-300/80',   border: 'border-orange-300',  text: 'text-orange-800 font-bold',  dot: 'bg-orange-500' },
    'AHAD':   { bg: 'bg-slate-200/70 border-slate-350/80',     border: 'border-slate-350',   text: 'text-slate-800 font-bold',   dot: 'bg-slate-500' },
  };

  return (isLight ? lightColors[day] : darkColors[day]) || (isLight ? lightColors['ISNIN'] : darkColors['ISNIN']);
};

const ALL_TIME_SLOTS = [
  '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', 
  '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'
];

const parseTo24hHour = (timeStr) => {
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

const parseTimeToMinutes = (timeStr) => {
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

const getDurationLabel = (startTime, endTime, lang) => {
  const startMin = parseTimeToMinutes(startTime);
  const endMin = parseTimeToMinutes(endTime);
  if (startMin === null || endMin === null || endMin <= startMin) return '';
  
  const diff = endMin - startMin;
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  
  if (lang === 'en') {
    if (m === 0) {
      return `${h} hr${h > 1 ? 's' : ''}`;
    }
    if (h === 0) {
      return `${m} min${m > 1 ? 's' : ''}`;
    }
    return `${h} hr${h > 1 ? 's' : ''} ${m} min`;
  } else {
    if (m === 0) {
      return `${h} jam`;
    }
    if (h === 0) {
      return `${m} minit`;
    }
    return `${h} jam ${m} minit`;
  }
};

const getSlotLabel = (slot) => {
  const slotMap = {
    '08:00 AM': '8-9',
    '09:00 AM': '9-10',
    '10:00 AM': '10-11',
    '11:00 AM': '11-12',
    '12:00 PM': '12-13',
    '01:00 PM': '13-14',
    '02:00 PM': '14-15',
    '03:00 PM': '15-16',
    '04:00 PM': '16-17',
    '05:00 PM': '17-18'
  };
  return slotMap[slot] || slot;
};

export default function MatrixGridView({ timetable = [], days = ['ISNIN', 'SELASA', 'RABU', 'KHAMIS', 'JUMAAT'] }) {
  const { theme } = useTheme();
  const { t, lang } = useLanguage();
  const isLight = theme === 'light';
  
  const getCourseForSlot = (dayName, slotTime) => {
    return timetable.find(c => {
      const isDay = c.day?.toUpperCase() === dayName.toUpperCase();
      if (!isDay) return false;
      const startTime = c.start_time || c.jadual || '';
      return startTime.includes(slotTime.split(':')[0]);
    });
  };

  // Filter out trailing empty time slots dynamically checking class end times
  const activeTimeSlots = useMemo(() => {
    if (timetable.length === 0) return ALL_TIME_SLOTS.slice(0, 4);

    let maxHour = 8;
    timetable.forEach(c => {
      const startH = parseTo24hHour(c.start_time);
      const endH = parseTo24hHour(c.end_time);
      if (startH !== null) {
        if (startH > maxHour) maxHour = startH;
      }
      if (endH !== null) {
        if (endH - 1 > maxHour) maxHour = endH - 1;
      }
    });

    let maxIdx = 0;
    ALL_TIME_SLOTS.forEach((slot, idx) => {
      const slotH = parseTo24hHour(slot);
      if (slotH !== null && slotH <= maxHour) {
        maxIdx = idx;
      }
    });

    return ALL_TIME_SLOTS.slice(0, maxIdx + 1);
  }, [timetable]);

  // Auto-scale text based on how many columns exist
  const autoScale = useMemo(() => {
    const n = activeTimeSlots.length || 6;
    if (n <= 3) return 1.35;
    if (n === 4) return 1.25;
    if (n === 5) return 1.15;
    if (n === 6) return 1.05;
    if (n === 7) return 1.0;
    if (n === 8) return 0.95;
    return 0.9;
  }, [activeTimeSlots.length]);

  return (
    <div className={`border rounded-lg overflow-auto flex-1 min-h-0 flex flex-col transition-colors duration-150 ${
      isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-white/[0.025] border-white/[0.06]'
    }`}>
      <div className="min-w-[700px] flex-1 overflow-y-auto flex flex-col">
        <table className="w-full table-fixed border-collapse flex-1 h-full">
          {/* Head - Transposed: Waktu slots as columns */}
          <thead>
            <tr className={`border-b ${isLight ? 'border-slate-200 bg-slate-50/50' : 'border-white/[0.06]'}`}>
              <th
                className={`px-3 py-2 border-r w-24 ${
                  isLight ? 'border-slate-200' : 'border-white/[0.04]'
                }`}
                style={{ fontSize: `${autoScale * 10}px` }}
              >
              </th>
              {activeTimeSlots.map(slot => (
                <th
                  key={slot}
                  className={`px-3 py-2 text-center font-semibold font-mono tracking-wider border-r ${
                    isLight ? 'text-slate-500 border-slate-200 bg-slate-50/10' : 'text-amber-400/70 border-white/[0.04]'
                  } last:border-r-0`}
                  style={{ fontSize: `${autoScale * 10}px` }}
                >
                  {getSlotLabel(slot)}
                </th>
              ))}
            </tr>
          </thead>

          {/* Body - Transposed: Days as rows, slots aligned using colSpan */}
          <tbody>
            {days.map((d) => {
              const color = getDayColors(d, isLight);
              let skipCount = 0;

              return (
                <tr key={d} className={`border-b last:border-b-0 transition-colors ${
                  isLight 
                    ? 'border-slate-100 hover:bg-slate-50/40' 
                    : 'border-white/[0.03] hover:bg-white/[0.015]'
                }`}>
                  <td
                    className={`px-3 py-1.5 font-bold uppercase border-r text-center w-24 ${
                      isLight ? 'border-slate-200' : 'border-white/[0.04]'
                    }`}
                    style={{ fontSize: `${autoScale * 10}px` }}
                  >
                    <span className="flex items-center justify-center gap-1.5 min-h-[48px]">
                      <span className={color.text}>{t(`days.${d}`) || d}</span>
                    </span>
                  </td>
                  {activeTimeSlots.map((slot) => {
                    if (skipCount > 0) {
                      skipCount--;
                      return null;
                    }

                    const course = getCourseForSlot(d, slot);
                    let colSpan = 1;
                    
                    let durationText = '';
                    if (course) {
                      const startH = parseTo24hHour(course.start_time);
                      const endH = parseTo24hHour(course.end_time);
                      if (startH !== null && endH !== null) {
                        const duration = endH - startH;
                        if (duration > 1) {
                          colSpan = duration;
                        }
                        durationText = getDurationLabel(course.start_time, course.end_time, lang);
                      }
                    }
                    
                    skipCount = colSpan - 1;

                    return (
                      <td 
                        key={slot} 
                        colSpan={colSpan}
                        className={`p-1.5 border-r last:border-r-0 ${
                          isLight ? 'border-slate-100' : 'border-white/[0.03]'
                        }`}
                      >
                        {course ? (
                          <div className={`px-2.5 py-2 rounded-md border h-full flex flex-col justify-between gap-0.5 transition-all hover:brightness-105 ${color.bg} ${color.border}`}>
                            <div className="flex items-center justify-between gap-2 mb-0.5">
                              <div className={`font-bold truncate ${color.text}`} style={{ fontSize: `${autoScale * 12}px` }}>
                                {course.course_id || course.kod_kursus}
                              </div>
                              {durationText && (
                                <div className={`text-[8.5px] font-extrabold uppercase shrink-0 flex items-center justify-center text-center px-1.5 py-0.5 rounded leading-none ${
                                  isLight 
                                    ? 'bg-slate-100 text-slate-600 border border-slate-200/50' 
                                    : 'bg-white/10 text-white/80 border border-white/5'
                                }`} style={{ fontSize: `${autoScale * 8.5}px` }}>
                                  {durationText}
                                </div>
                              )}
                            </div>
                            <div className={`font-medium leading-snug truncate ${
                              isLight ? 'text-slate-700' : 'text-white/80'
                            }`} style={{ fontSize: `${autoScale * 10}px` }}>
                              {course.course_name || course.kursus}
                            </div>
                            <div className={`truncate flex items-center gap-1 ${
                              isLight ? 'text-slate-500' : 'text-white/50'
                            }`} style={{ fontSize: `${autoScale * 10.5}px` }}>
                              <MapPin style={{ width: `${autoScale * 10.5}px`, height: `${autoScale * 10.5}px`, color: '#ed4134' }} className="flex-shrink-0" />
                              <span className="leading-tight">{course.location}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="h-full w-full min-h-[48px]" />
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
