import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { playClassChime, sendPushNotification } from '../utils/audioNotifier';
import { Clock, MapPin, CheckCircle2, Bell, BellOff, Volume2 } from 'lucide-react';

export default function LiveNextClassWidget({ timetable = [] }) {
  const { lang } = useLanguage();
  const [now, setNow] = useState(new Date());
  const [autoNotifyEnabled, setAutoNotifyEnabled] = useState(() => {
    try { return localStorage.getItem('usas_auto_notify') === 'true'; } catch (e) { return false; }
  });
  const notifiedRef = useRef({});

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

  const parseTimeToMinutes = (timeStr) => {
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

  let ongoingClass = null;
  let nextClass = null;
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
      <div className="py-1.5 px-3 rounded-lg bg-white/[0.02] border border-white/[0.04] text-[10px] text-white/40 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400/70" />
          <span>Sesi Kuliah Hari Ini Selesai ({currentDayName}) • Selamat berehat!</span>
        </div>
        <button
          onClick={toggleAutoNotify}
          className={`p-1 rounded transition-colors text-[9px] flex items-center gap-1 ${
            autoNotifyEnabled ? 'text-emerald-400' : 'text-white/20 hover:text-white/40'
          }`}
          title="Mod Peringatan Chime Auto"
        >
          {autoNotifyEnabled ? <Bell className="w-3 h-3" /> : <BellOff className="w-3 h-3" />}
        </button>
      </div>
    );
  }

  const activeCourse = ongoingClass || nextClass;

  return (
    <div className="py-2 px-3 rounded-lg bg-white/[0.03] border border-white/[0.05] flex items-center justify-between gap-3 text-xs">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className={`w-7 h-7 rounded-md border flex items-center justify-center flex-shrink-0 ${
          ongoingClass ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' : 'bg-amber-400/15 border-amber-400/30 text-amber-400'
        }`}>
          <Clock className="w-3.5 h-3.5" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-[9px] font-bold uppercase tracking-wider ${ongoingClass ? 'text-emerald-400' : 'text-amber-400'}`}>
              {ongoingClass ? 'Sedang Berlangsung' : 'Seterusnya'}
            </span>
            {nextClass && (
              <span className="text-[9px] font-bold text-amber-400/80">
                dalam {Math.floor(nextClass.diff / 60) > 0 ? `${Math.floor(nextClass.diff / 60)}j ` : ''}{nextClass.diff % 60}m
              </span>
            )}
          </div>
          <div className="text-[11px] font-semibold text-white/90 truncate">
            {activeCourse.course_id}: {activeCourse.course_name} <span className="text-white/30 font-normal">({activeCourse.location})</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button
          onClick={playClassChime}
          className="p-1 rounded text-white/30 hover:text-amber-400 transition-colors text-[9px] font-medium"
          title="Uji Chime"
        >
          <Volume2 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={toggleAutoNotify}
          className={`p-1 rounded transition-colors text-[9px] font-semibold flex items-center gap-1 ${
            autoNotifyEnabled ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20 px-2' : 'text-white/30 hover:text-white/60'
          }`}
          title="Peringatan Auto 15 Minit"
        >
          {autoNotifyEnabled ? <Bell className="w-3 h-3 text-emerald-400" /> : <BellOff className="w-3 h-3" />}
          {autoNotifyEnabled && <span>Chime ON</span>}
        </button>
      </div>
    </div>
  );
}
