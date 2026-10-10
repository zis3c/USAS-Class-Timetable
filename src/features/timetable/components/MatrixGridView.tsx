import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/app/providers/AuthProvider';
import { useTheme } from '@/app/providers/ThemeProvider';
import { useLanguage } from '@/app/providers/LanguageProvider';
import type { TimetableItem } from '@/shared/types/usas';
import { extractDayName, formatDayDisplay, isSameDay } from '@/shared/lib/dayFormat';
import { buildCourseColorMap, getCourseColorSlot } from '@/shared/lib/courseColors';
import { getOwnRecordValue } from '@/shared/lib/security';
import { buildAdaptiveTimeSlots, formatAdaptiveSlotLabel, getAdaptiveAxisPosition } from '@/shared/lib/adaptiveTimeGrid';
import { MapPin, User, GraduationCap } from 'lucide-react';
import AttendanceMeter from './AttendanceMeter';
import {
  getCourseHighlightKey,
  getShortTimeRange,
  formatTimeFromMinutes,
  parseTimeToMinutes,
} from '@/shared/lib/timetableTime';

type MatrixGridViewProps = {
  timetable?: TimetableItem[];
  days?: string[];
  activeDay?: string;
  activeHighlights?: {
    ongoingKey: string | null;
    upcomingKey: string | null;
  };
};

const getDayColors = (day: string | undefined, isLight: boolean) => {
  const darkColors: Record<string, Record<string, string>> = {
    'ISNIN':  { bg: 'bg-emerald-500/[0.18]', text: 'text-emerald-300 font-bold', dot: 'bg-emerald-400' },
    'SELASA': { bg: 'bg-blue-500/[0.18]',    text: 'text-blue-300 font-bold',    dot: 'bg-blue-400' },
    'RABU':   { bg: 'bg-amber-500/[0.18]',   text: 'text-amber-300 font-bold',   dot: 'bg-amber-400' },
    'KHAMIS': { bg: 'bg-purple-500/[0.18]',  text: 'text-purple-300 font-bold',  dot: 'bg-purple-400' },
    'JUMAAT': { bg: 'bg-rose-500/[0.18]',    text: 'text-rose-300 font-bold',    dot: 'bg-rose-400' },
    'SABTU':  { bg: 'bg-orange-500/[0.18]',  text: 'text-orange-300 font-bold',  dot: 'bg-orange-400' },
    'AHAD':   { bg: 'bg-slate-500/[0.18]',   text: 'text-slate-300 font-bold',   dot: 'bg-slate-400' },
  };

  const lightColors: Record<string, Record<string, string>> = {
    'ISNIN':  { bg: 'bg-emerald-100/70', text: 'text-emerald-800 font-bold', dot: 'bg-emerald-500' },
    'SELASA': { bg: 'bg-blue-100/70',    text: 'text-blue-800 font-bold',    dot: 'bg-blue-500' },
    'RABU':   { bg: 'bg-amber-100/80',   text: 'text-amber-800 font-bold',   dot: 'bg-amber-500' },
    'KHAMIS': { bg: 'bg-purple-100/70',  text: 'text-purple-800 font-bold',  dot: 'bg-purple-500' },
    'JUMAAT': { bg: 'bg-rose-100/70',    text: 'text-rose-800 font-bold',    dot: 'bg-rose-500' },
    'SABTU':  { bg: 'bg-orange-100/70',  text: 'text-orange-800 font-bold',  dot: 'bg-orange-500' },
    'AHAD':   { bg: 'bg-slate-200/70',   text: 'text-slate-800 font-bold',   dot: 'bg-slate-500' },
  };

  const key = extractDayName(day) || 'ISNIN';
  const colors = isLight ? lightColors : darkColors;
  return getOwnRecordValue<Record<string, string>>(colors, key)
    || getOwnRecordValue<Record<string, string>>(colors, 'ISNIN')!;
};

const getDurationLabel = (startTime?: string, endTime?: string, lang?: string) => {
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

export default function MatrixGridView({
  timetable = [],
  days = ['ISNIN', 'SELASA', 'RABU', 'KHAMIS', 'JUMAAT'],
  activeDay = 'ALL',
  activeHighlights,
}: MatrixGridViewProps) {
  const { theme } = useTheme();
  const { timeFormat } = useAuth();
  const { t, lang } = useLanguage();
  const isLight = theme === 'light';
  const [preview, setPreview] = useState<{ course: TimetableItem; x: number; y: number } | null>(null);

  // Stable unique colour per course (shared with the card and export views).
  const courseColorMap = useMemo(() => buildCourseColorMap(timetable), [timetable]);

  useEffect(() => {
    if (!preview) return;
    const close = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && target.closest('[data-preview-card]')) return;
      setPreview(null);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [preview]);

  const showPreview = (course: TimetableItem, element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    const cardWidth = 250;
    const left = Math.min(Math.max(8, rect.left), Math.max(8, window.innerWidth - cardWidth - 8));
    const top = rect.bottom + 8 + 180 > window.innerHeight ? Math.max(8, rect.top - 188) : rect.bottom + 8;
    setPreview({ course, x: left, y: top });
  };

  // Compress empty hours and group dense ranges, while keeping one-hour classes in their own slot.
  const activeTimeSlots = useMemo(() => {
    const ranges = timetable.flatMap((course) => {
      const start = parseTimeToMinutes(course.start_time || course.jadual || '');
      if (start === null) return [];
      const end = parseTimeToMinutes(course.end_time);
      return [{ start, end: end !== null && end > start ? end : start + 60 }];
    });
    return buildAdaptiveTimeSlots(ranges, 8, true);
  }, [timetable]);

  // Keep each slot at its desktop width on small screens; the grid scrolls horizontally.
  const DAY_COL_WIDTH = 92;
  const SLOT_COL_WIDTH = 200;
  const tableMinWidth = DAY_COL_WIDTH + activeTimeSlots.length * SLOT_COL_WIDTH;
  const axisStart = activeTimeSlots[0].start;
  const axisEnd = activeTimeSlots[activeTimeSlots.length - 1].end;
  const axisDuration = activeTimeSlots.length;
  const autoScale = 1;

  const hasDayFilter = Boolean(activeDay) && activeDay.toUpperCase() !== 'ALL';

  return (
    <div className={`border rounded-lg overflow-auto flex-1 min-h-0 flex flex-col transition-colors duration-150 ${
      isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-white/[0.025] border-white/[0.06]'
    }`}>
      <div
        className="matrix-grid-viewport flex-1 overflow-y-auto flex flex-col"
        style={{ minWidth: `${tableMinWidth}px` }}
        onScroll={() => { if (preview) setPreview(null); }}
      >
        <table className="w-full table-fixed border-collapse flex-1 h-auto sm:h-full">
          <colgroup>
            <col style={{ width: `${DAY_COL_WIDTH}px` }} />
            {activeTimeSlots.map((slot) => (
              <col key={slot.start} />
            ))}
          </colgroup>
          {/* Head - Transposed: Time slots as columns */}
          <thead>
            <tr className={`border-b ${isLight ? 'border-slate-200 bg-slate-50/50' : 'border-white/[0.06]'}`}>
              <th
                className={`px-2 sm:px-3 py-1.5 sm:py-2 border-r whitespace-nowrap leading-none ${
                  isLight ? 'border-slate-200' : 'border-white/[0.04]'
                }`}
                style={{ fontSize: `${autoScale * 10}px` }}
              >
              </th>
              {activeTimeSlots.map((slot) => (
                <th
                  key={slot.start}
                  data-matrix-time-slot={formatTimeFromMinutes(slot.start, '24h')}
                  data-matrix-time-range={`${slot.start}-${slot.end}`}
                  className={`px-2 sm:px-3 py-1.5 sm:py-2 text-center font-semibold font-mono tracking-wider border-r whitespace-nowrap leading-none ${
                    isLight ? 'text-slate-500 border-slate-200 bg-slate-50/10' : 'text-amber-400/70 border-white/[0.04]'
                  } last:border-r-0`}
                  style={{ fontSize: `${autoScale * 10}px` }}
                >
                  {formatAdaptiveSlotLabel(slot.start, slot.end, timeFormat)}
                </th>
              ))}
            </tr>
          </thead>

          {/* Body - Transposed: Days as rows, slots aligned using colSpan */}
          <tbody>
            {days.map((d) => {
              const isDimmedRow = hasDayFilter && !isSameDay(d, activeDay);

              return (
                <tr key={d} className={`border-b last:border-b-0 transition-colors ${
                  isLight 
                    ? 'border-slate-100 hover:bg-slate-50/40' 
                    : 'border-white/[0.03] hover:bg-white/[0.015]'
                }`}>
                  <td
                    className={`px-2 sm:px-3 py-1.5 font-bold uppercase border-r text-center transition-all duration-300 ${
                      isLight ? 'border-slate-200' : 'border-white/[0.04]'
                    } ${isDimmedRow ? 'opacity-30 blur-[1px]' : ''}`}
                    style={{ fontSize: `${autoScale * 10}px` }}
                  >
                    <span className="flex items-center justify-center gap-1.5 min-h-[38px] whitespace-nowrap">
                      <span className={isLight ? 'text-slate-600' : 'text-white/70'}>{formatDayDisplay(d, t)}</span>
                    </span>
                  </td>
                  <td colSpan={activeTimeSlots.length} className="relative p-0 min-h-[44px]">
                    <div
                      className={`absolute inset-0 grid ${isLight ? 'divide-x divide-slate-100' : 'divide-x divide-white/[0.03]'}`}
                      style={{ gridTemplateColumns: `repeat(${activeTimeSlots.length}, minmax(0, 1fr))` }}
                      aria-hidden="true"
                    >
                      {activeTimeSlots.map((slot) => <div key={slot.start} />)}
                    </div>
                    {timetable.map((course) => {
                      if (extractDayName(course.day) !== extractDayName(d)) return null;
                      const start = parseTimeToMinutes(course.start_time || course.jadual || '');
                      if (start === null || start < axisStart || start >= axisEnd) return null;
                      const parsedEnd = parseTimeToMinutes(course.end_time);
                      const end = parsedEnd !== null && parsedEnd > start ? parsedEnd : start + 60;
                      const axisPosition = getAdaptiveAxisPosition(start, activeTimeSlots);
                      const axisEndPosition = getAdaptiveAxisPosition(Math.min(end, axisEnd), activeTimeSlots);
                      const position = {
                        left: (axisPosition / axisDuration) * 100,
                        width: ((axisEndPosition - axisPosition) / axisDuration) * 100,
                      };
                      const visualWidth = (position.width / 100) * axisDuration * SLOT_COL_WIDTH;
                      const compact = visualWidth < 150;
                      const courseColor = getDayColors(getCourseColorSlot(courseColorMap, course.course_id || course.kod_kursus), isLight);
                      const courseKey = getCourseHighlightKey(course);
                      const courseStatus = courseKey && activeHighlights
                        ? activeHighlights.ongoingKey === courseKey ? 'ongoing' : activeHighlights.upcomingKey === courseKey ? 'upcoming' : 'idle'
                        : 'idle';
                      const durationText = getDurationLabel(course.start_time, course.end_time, lang);
                      const timeRangeText = getShortTimeRange(course.start_time || course.jadual, course.end_time, timeFormat);
                      const [startTimeLabel, endTimeLabel] = timeRangeText.split('-');
                      const displayTime = (value: string) => value.replace(/:00(?=\s|$)/, '');
                      return (
                        <div
                          key={`${course.course_id || course.kod_kursus}-${start}`}
                          role="button"
                          data-matrix-course-code={course.course_id || course.kod_kursus || ''}
                          data-matrix-course-start={course.start_time || course.jadual || ''}
                          data-matrix-course-time={timeRangeText}
                          data-matrix-course-compact={compact ? 'true' : undefined}
                          tabIndex={0}
                          onClick={(e) => { e.stopPropagation(); showPreview(course, e.currentTarget); }}
                          onMouseEnter={(e) => showPreview(course, e.currentTarget)}
                          onMouseLeave={() => setPreview(null)}
                          onFocus={(e) => showPreview(course, e.currentTarget)}
                          onBlur={() => setPreview(null)}
                          className={`matrix-course-card absolute inset-y-0 z-10 flex flex-col justify-between cursor-pointer outline-none transition-all duration-300 hover:brightness-105 overflow-hidden ${courseColor.bg} ${isDimmedRow ? 'opacity-30 blur-[1.5px]' : ''}`}
                          style={{ left: `${position.left}%`, width: `${position.width}%` }}
                        >
                          <span data-matrix-course-start-label aria-hidden="true" className={`matrix-course-test-label absolute top-1 right-2 z-20 font-mono font-semibold leading-none whitespace-nowrap ${isLight ? 'text-slate-600' : 'text-white/65'}`}>
                            {startTimeLabel}
                          </span>
                          <span data-matrix-course-end-label aria-hidden="true" className={`matrix-course-test-label absolute bottom-1 right-2 z-20 font-mono font-semibold leading-none whitespace-nowrap ${isLight ? 'text-slate-600' : 'text-white/65'}`}>
                            {endTimeLabel}
                          </span>
                          <div className="matrix-course-summary flex items-center justify-between min-w-0 gap-2">
                            <div className={`matrix-course-code font-bold ${courseColor.text} flex items-center min-w-0 gap-1`}>
                              <span data-matrix-course-code-label className="truncate">{course.course_id || course.kod_kursus}</span>
                              <span className={`relative -top-[0.25px] inline-block w-2 h-2 rounded-full flex-shrink-0 ${courseStatus === 'ongoing' ? 'bg-emerald-400 animate-pulse' : courseStatus === 'upcoming' ? 'bg-amber-400 animate-pulse' : 'hidden'}`} aria-hidden="true" />
                            </div>
                            {durationText && <span className={`matrix-course-duration shrink-0 whitespace-nowrap rounded px-0.5 py-px font-extrabold uppercase leading-none ${isLight ? 'bg-slate-100 text-slate-600 border border-slate-200/50' : 'bg-white/10 text-white/80 border border-white/5'}`}>{durationText}</span>}
                          </div>
                          <div className="matrix-course-details mt-0.5 flex min-w-0 flex-col gap-0.5">
                            <div data-matrix-course-title className={`matrix-course-title font-bold ${isLight ? 'text-slate-700' : 'text-white/80'}`}>
                              {course.course_name || course.kursus}
                            </div>
                            {(course.lecturer || course.pensyarah) && (
                              <div data-matrix-course-lecturer className={`matrix-course-lecturer ${isLight ? 'text-slate-500' : 'text-white/55'}`}>
                                {course.lecturer || course.pensyarah}
                              </div>
                            )}
                          </div>
                          <span data-matrix-course-time-label className={`matrix-course-time self-end font-mono font-semibold whitespace-nowrap ${isLight ? 'text-slate-600' : 'text-white/65'}`}>
                            {displayTime(startTimeLabel)}–{displayTime(endTimeLabel)}
                          </span>
                          <span data-matrix-course-location hidden>{course.location}</span>
                        </div>
                      );
                    })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Hover / tap detail card */}
      {preview && (
        <div
          data-preview-card
          onMouseEnter={() => setPreview((prev) => prev)}
          className={`fixed z-[60] w-[250px] rounded-xl border p-3 space-y-1.5 shadow-2xl text-left ${
            isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#0A1428] border-white/10 text-white'
          }`}
          style={{ left: preview.x, top: preview.y }}
        >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className={`text-[10px] font-black tracking-wider ${getDayColors(getCourseColorSlot(courseColorMap, preview.course.course_id || preview.course.kod_kursus), isLight).text}`}>
                  {preview.course.course_id || preview.course.kod_kursus}
                </div>
                <div className={`text-[11px] font-bold leading-snug ${isLight ? 'text-slate-800' : 'text-white/95'}`}>
                  {preview.course.course_name || preview.course.kursus}
                </div>
              </div>
            </div>
            <div className={`text-[10px] font-semibold ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
              {formatDayDisplay(preview.course.day, t)} · {getShortTimeRange(preview.course.start_time || preview.course.jadual, preview.course.end_time, timeFormat).replace('-', ' - ')} · {getDurationLabel(preview.course.start_time, preview.course.end_time, lang)}
            </div>
            <div className={`flex items-center gap-1.5 text-[10.5px] ${isLight ? 'text-slate-600' : 'text-white/70'}`}>
              <User className="w-3 h-3 flex-shrink-0 text-emerald-500" />
              <span className="truncate">{preview.course.lecturer || preview.course.pensyarah || t('lecturers')}</span>
            </div>
            <div className={`flex items-center gap-1.5 text-[10.5px] ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
              <GraduationCap className="w-3 h-3 flex-shrink-0 text-amber-500" />
              <span className="truncate">{t('group')}: {(preview.course.group || preview.course.kumpulan || '').replace(/^GRP/i, 'G') || '—'}</span>
            </div>
            <div className={`flex items-center gap-1.5 text-[10.5px] ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
              <MapPin className="w-3 h-3 flex-shrink-0" style={{ color: '#ed4134' }} />
              <span className="truncate">{preview.course.location || 'TBA'}</span>
            </div>
            <div className="pt-0.5">
              <AttendanceMeter percentStr={preview.course.kehadiran} />
            </div>
        </div>
      )}
    </div>
  );
}
