import React, { useMemo } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { AlertTriangle, Zap } from 'lucide-react';

const CAMPUS_WALK_TIMES = {
  'MAKMAL': { 'DK': 3, 'DEWAN BESAR': 7, 'FTMK': 1, 'BILIK MESYUARAT': 2, 'PERPUSTAKAAN': 4, 'DEFAULT': 5 },
  'DK':     { 'MAKMAL': 3, 'DEWAN BESAR': 5, 'FTMK': 4, 'BILIK MESYUARAT': 4, 'PERPUSTAKAAN': 2, 'DEFAULT': 4 },
  'DEWAN BESAR': { 'MAKMAL': 7, 'DK': 5, 'FTMK': 6, 'BILIK MESYUARAT': 6, 'PERPUSTAKAAN': 5, 'DEFAULT': 6 },
  'FTMK':   { 'MAKMAL': 1, 'DK': 4, 'DEWAN BESAR': 6, 'BILIK MESYUARAT': 1, 'PERPUSTAKAAN': 3, 'DEFAULT': 4 },
  'BILIK MESYUARAT': { 'MAKMAL': 2, 'DK': 4, 'DEWAN BESAR': 6, 'FTMK': 1, 'PERPUSTAKAAN': 3, 'DEFAULT': 4 },
};

function categorizeVenue(location) {
  if (!location) return 'DEFAULT';
  const u = location.toUpperCase();
  if (u.includes('MAKMAL') || u.includes('MK') || u.includes('LAB') || u.includes('CSL')) return 'MAKMAL';
  if (u.includes('DEWAN KULIAH') || u.includes('DK')) return 'DK';
  if (u.includes('DEWAN BESAR')) return 'DEWAN BESAR';
  if (u.includes('BILIK MESYUARAT')) return 'BILIK MESYUARAT';
  if (u.includes('FTMK')) return 'FTMK';
  return 'DEFAULT';
}

function getWalkTime(venueA, venueB) {
  const catA = categorizeVenue(venueA);
  const catB = categorizeVenue(venueB);
  if (catA === catB) return 0;
  return CAMPUS_WALK_TIMES[catA]?.[catB] || CAMPUS_WALK_TIMES[catB]?.[catA] || 5;
}

function parseTimeToMinutes(timeStr) {
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

export default function ScheduleClashDetector({ timetable = [] }) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const isLight = theme === 'light';

  const alerts = useMemo(() => {
    if (!timetable || timetable.length < 2) return [];

    const dayGroups = {};
    timetable.forEach(item => {
      const day = item.day?.toUpperCase();
      if (!day) return;
      if (!dayGroups[day]) dayGroups[day] = [];
      dayGroups[day].push(item);
    });

    const results = [];

    Object.keys(dayGroups).forEach(day => {
      const classes = dayGroups[day]
        .map(c => ({
          ...c,
          startMin: parseTimeToMinutes(c.start_time),
          endMin: c.end_time ? parseTimeToMinutes(c.end_time) : parseTimeToMinutes(c.start_time) + 120
        }))
        .sort((a, b) => a.startMin - b.startMin);

      for (let i = 0; i < classes.length - 1; i++) {
        const current = classes[i];
        const next = classes[i + 1];
        const gapMinutes = next.startMin - current.endMin;
        const walkTimeNeeded = getWalkTime(current.location, next.location);
        const isSameVenueCategory = categorizeVenue(current.location) === categorizeVenue(next.location);

        if (gapMinutes < 0) {
          results.push({
            type: 'clash',
            day,
            from: current,
            to: next,
            gapMinutes,
            walkTimeNeeded,
            message: `Pertindihan jadual! ${current.course_id} & ${next.course_id} bertindih ${Math.abs(gapMinutes)} minit.`
          });
        } else if (gapMinutes < walkTimeNeeded && !isSameVenueCategory) {
          results.push({
            type: 'tight',
            day,
            from: current,
            to: next,
            gapMinutes,
            walkTimeNeeded,
            message: `Rehat ketat! Hanya ${gapMinutes} minit antara kelas tetapi perlu ~${walkTimeNeeded} minit berjalan.`
          });
        }
      }
    });

    return results;
  }, [timetable]);

  // Hide completely when zero clashes/warnings exist
  if (alerts.length === 0) {
    return null;
  }

  return (
    <div className="space-y-1.5 animate-fade-in">
      {alerts.map((alert, idx) => {
        const isClash = alert.type === 'clash';

        return (
          <div
            key={idx}
            className={`py-1.5 px-3 rounded-lg border flex items-center justify-between text-[10px] transition-colors duration-150 ${
              isClash 
                ? (isLight ? 'border-red-200 bg-red-50 text-red-700' : 'border-red-500/30 bg-red-500/10 text-red-300')
                : (isLight ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-amber-500/30 bg-amber-500/10 text-amber-300')
            }`}
          >
            <div className="flex items-center gap-2 truncate">
              {isClash 
                ? <AlertTriangle className={`w-3.5 h-3.5 flex-shrink-0 ${isLight ? 'text-red-650' : 'text-red-400'}`} /> 
                : <Zap className={`w-3.5 h-3.5 flex-shrink-0 ${isLight ? 'text-amber-600' : 'text-amber-400'}`} />}
              <span className="font-bold uppercase tracking-wider">{t(`days.${alert.day?.toUpperCase()}`) || alert.day}:</span>
              <span className="truncate">{alert.from.course_id} → {alert.to.course_id}</span>
            </div>
            <div className="flex items-center gap-2 font-bold flex-shrink-0">
              {isClash ? `${t('clashDetected')} ${Math.abs(alert.gapMinutes)}m` : `${t('restTime')}: ${alert.gapMinutes}m (~${alert.walkTimeNeeded}m ${t('walkTimeNeeded')})`}
            </div>
          </div>
        );
      })}
    </div>
  );
}
