import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { playClassChime, sendPushNotification } from '../utils/audioNotifier';
import { Clock, CheckCircle2, Bell, BellOff, Volume2 } from 'lucide-react';
import type { TimetableItem } from '../types/usas';

type LiveNextClassWidgetProps = {
  timetable?: TimetableItem[];
};

type NextClassItem = TimetableItem & {
  diff?: number;
  endMin?: number;
};

export default function LiveNextClassWidget({ timetable = [] }: LiveNextClassWidgetProps) {
  const { lang, t } = useLanguage();
  const { theme } = useTheme();
  const [now, setNow] = useState(new Date());
  const [autoNotifyEnabled, setAutoNotifyEnabled] = useState(() => {
    try { return localStorage.getItem('usas_auto_notify') === 'true'; } catch (e) { return false; }
  });
  const notifiedRef = useRef<Record<string, boolean>>({});

  const isLight = theme === 'light';

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 20000);
    return () => clearInterval(timer);
  }, []);

  const toggleAutoNotify = () => {
    const nextState = !autoNotifyEnabled;
    setAutoNotifyEnabled(nextState);
    try { localStorage.setItem('usas_auto_notify', String(nextState)); } catch (e) {}
    
    if (nextState) {
      playClassChime();
      if ('Notification' in window && Notification.permission !== 'granted') {
        Notification.requestPermission();
      }
    }
  };

  const dayNames = ['AHAD', 'ISNIN', 'SELASA', 'RABU', 'KHAMIS', 'JUMAAT', 'SABTU'];
  const currentDayName = dayNames[now.getDay()];
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const parseTimeToMinutes = (timeStr: string | undefined) => {
    if (!timeStr) return 0;
    const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (!match) return 0;
    let h = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);
    const ampm = match[3]?.toUpperCase();
    if (ampm === 'PM' && h < 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;
    return h * 60 + m;
  };

  let ongoingClass: NextClassItem | null = null;
  let nextClass: NextClassItem | null = null;
  let minDiff = Infinity;

  if (Array.isArray(timetable) && timetable.length > 0) {
    timetable.forEach((item) => {
      const isToday = item.day?.toUpperCase() === currentDayName;
      if (!isToday) return;

      const startMin = parseTimeToMinutes(item.start_time);
      const endMin = item.end_time ? parseTimeToMinutes(item.end_time) : startMin + 120;

      if (currentMinutes >= startMin && currentMinutes <= endMin) {
        ongoingClass = { ...item, endMin };
      }

      if (startMin > currentMinutes) {
        const diff = startMin - currentMinutes;
        if (diff < minDiff) {
          minDiff = diff;
          nextClass = { ...item, diff };
        }
      }
    });
  }

  useEffect(() => {
    if (autoNotifyEnabled && nextClass && nextClass.diff <= 15 && nextClass.diff > 0) {
      const key = `${nextClass.course_id}-${nextClass.day}-${nextClass.start_time}`;
      if (!notifiedRef.current[key]) {
        notifiedRef.current[key] = true;
        playClassChime();
        sendPushNotification(
          `Peringatan Kuliah USAS: ${nextClass.course_id}`,
          `Kelas ${nextClass.course_name} bermula dalam 15 minit di ${nextClass.location}`
        );
      }
    }
  }, [autoNotifyEnabled, nextClass]);

  if (!timetable || timetable.length === 0) return null;

  // Ultra-compact one-liner when all classes for today are completed
  if (!ongoingClass && !nextClass) {
    return (
      <div className={`py-2 px-3.5 rounded-xl border text-[10px] flex items-center justify-between transition-all duration-350 shadow-sm ${
        isLight 
          ? 'bg-gradient-to-r from-emerald-50/70 to-teal-50/70 border-emerald-100/80 text-emerald-900 shadow-emerald-500/5' 
          : 'bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-emerald-500/20 text-emerald-300 shadow-black/10'
      }`}>
        <div className="flex items-center gap-2.5">
          <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
            isLight ? 'bg-emerald-100 text-emerald-650' : 'bg-emerald-500/20 text-emerald-400'
          }`}>
            <CheckCircle2 className="w-3 h-3" />
          </div>
          <span className="font-semibold tracking-wide">
            {t('noClassRemaining')} ({t(`days.${currentDayName}`) || currentDayName}) • {t('restWell')}
          </span>
        </div>
        <button
          onClick={toggleAutoNotify}
          className={`p-1 rounded-lg transition-all duration-200 flex items-center gap-1 ${
            autoNotifyEnabled 
              ? (isLight 
                  ? 'bg-emerald-100/80 text-emerald-700 hover:bg-emerald-200/80' 
                  : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30') 
              : (isLight 
                  ? 'text-slate-400 hover:text-slate-600 hover:bg-slate-200/50' 
                  : 'text-white/20 hover:text-white/40 hover:bg-white/[0.04]')
          }`}
          title="Mod Peringatan Chime Auto"
        >
          {autoNotifyEnabled ? <Bell className="w-3 h-3 animate-bounce" style={{ animationIterationCount: 2 }} /> : <BellOff className="w-3 h-3" />}
        </button>
      </div>
    );
  }

  const activeCourse = ongoingClass || nextClass;

  return (
    <div className={`py-2 px-3 rounded-lg border flex items-center justify-between gap-3 text-xs transition-colors duration-150 ${
      isLight ? 'bg-white border-slate-200 text-slate-700' : 'bg-white/[0.03] border-white/[0.05] text-slate-100'
    }`}>
      <div className="flex items-center gap-2.5 min-w-0">
        <div className={`w-7 h-7 rounded-md border flex items-center justify-center flex-shrink-0 ${
          ongoingClass 
            ? (isLight 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-600' 
                : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400')
            : (isLight 
                ? 'bg-amber-50 border-amber-200 text-amber-600' 
                : 'bg-amber-400/15 border-amber-400/30 text-amber-400')
        }`}>
          <Clock className="w-3.5 h-3.5" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-[9px] font-bold uppercase tracking-wider ${
              ongoingClass 
                ? (isLight ? 'text-emerald-600' : 'text-emerald-400') 
                : (isLight ? 'text-amber-600' : 'text-amber-400')
            }`}>
              {ongoingClass ? t('ongoingNow') : t('nextClass')}
            </span>
            {nextClass && (
              <span className={`text-[9px] font-bold ${isLight ? 'text-slate-400' : 'text-white/40'}`}>
                {t('in')} {Math.floor(nextClass.diff / 60) > 0 ? `${Math.floor(nextClass.diff / 60)}${lang === 'en' ? 'h' : 'j'} ` : ''}{nextClass.diff % 60}m
              </span>
            )}
          </div>
          <div className={`text-[11px] font-semibold truncate ${isLight ? 'text-slate-800' : 'text-white/90'}`}>
            {activeCourse.course_id}: {activeCourse.course_name} <span className={isLight ? 'text-slate-400 font-normal' : 'text-white/30 font-normal'}>({activeCourse.location})</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button
          onClick={playClassChime}
          className={`p-1 rounded transition-colors text-[9px] font-medium ${
            isLight ? 'text-slate-400 hover:text-amber-600' : 'text-white/30 hover:text-amber-400'
          }`}
          title="Uji Chime"
        >
          <Volume2 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={toggleAutoNotify}
          className={`p-1 rounded transition-colors text-[9px] font-semibold flex items-center gap-1 ${
            autoNotifyEnabled 
              ? (isLight 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 px-2' 
                  : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20 px-2') 
              : (isLight ? 'text-slate-400 hover:text-slate-600' : 'text-white/30 hover:text-white/60')
          }`}
          title="Peringatan Auto 15 Minit"
        >
          {autoNotifyEnabled ? <Bell className="w-3 h-3 text-emerald-500" /> : <BellOff className="w-3 h-3" />}
          {autoNotifyEnabled && <span>Chime ON</span>}
        </button>
      </div>
    </div>
  );
}
