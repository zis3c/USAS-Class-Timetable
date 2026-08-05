import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/app/providers/AuthProvider';
import { fetchPrayerTimesAPI, MOCK_PRAYER_TIMES } from '@/services/usas/usasApi';
import type { PrayerTimeItem } from '@/shared/types/usas';
import { playClassChime, sendPushNotification } from '@/shared/lib/audioNotifier';
import { Moon, AlertCircle, Bell, BellOff } from 'lucide-react';

type PrayerData = {
  times: PrayerTimeItem[];
  location: string;
};

const NOTIFY_WINDOW_SECONDS = 600;
const PRAYER_NOTIFY_KEY = 'usas_prayer_auto_notify';
const PRAYER_NOTIFY_EVENT = 'usas-prayer-auto-notify-changed';

const parsePrayerTimeToSeconds = (timeStr: string | undefined) => {
  if (!timeStr) return null;
  const raw = String(timeStr).trim();
  const match = raw.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return null;
  let hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);
  const ampm = match[3]?.toUpperCase();
  if (ampm === 'PM' && hour < 12) hour += 12;
  if (ampm === 'AM' && hour === 12) hour = 0;
  return hour * 3600 + minute * 60;
};

export const getLocalDateStamp = (value: Date): string => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const usePrayerAutoNotifySetting = () => {
  const [enabled, setEnabled] = useState(() => {
    try {
      return localStorage.getItem(PRAYER_NOTIFY_KEY) === 'true';
    } catch (e) {
      return false;
    }
  });

  useEffect(() => {
    const syncSetting = () => {
      try {
        setEnabled(localStorage.getItem(PRAYER_NOTIFY_KEY) === 'true');
      } catch (e) {
        setEnabled(false);
      }
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === PRAYER_NOTIFY_KEY) {
        syncSetting();
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener(PRAYER_NOTIFY_EVENT, syncSetting);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(PRAYER_NOTIFY_EVENT, syncSetting);
    };
  }, []);

  const setAutoNotifyEnabled = (nextState: boolean) => {
    setEnabled(nextState);
    try {
      localStorage.setItem(PRAYER_NOTIFY_KEY, String(nextState));
    } catch (e) {}
    window.dispatchEvent(new Event(PRAYER_NOTIFY_EVENT));

    if (nextState && 'Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
  };

  return [enabled, setAutoNotifyEnabled] as const;
};

export default function PrayerTimesWidget() {
  const { session } = useAuth();
  const [prayerData, setPrayerData] = useState<PrayerData>({
    times: MOCK_PRAYER_TIMES,
    location: 'Kuala Kangsar (PRK02)',
  });
  const [autoNotifyEnabled, setAutoNotifyEnabled] = usePrayerAutoNotifySetting();

  useEffect(() => {
    let active = true;
    fetchPrayerTimesAPI(session).then(res => {
      if (active && res?.success && res.times) {
        setPrayerData({ times: res.times, location: res.location || 'Kuala Kangsar (PRK02)' });
      }
    });
    return () => { active = false; };
  }, [session]);

  useEffect(() => {
    // visible widget only shows and controls the setting
  }, [prayerData]);

  const toggleAutoNotify = () => {
    setAutoNotifyEnabled(!autoNotifyEnabled);
  };

  const isFriday = new Date().getDay() === 5; // Friday

  return (
    <div className="glass-card rounded-2xl p-4 border border-amber-500/20 bg-[#0F2148]/70 space-y-3 shadow-lg">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs border-b border-amber-500/10 pb-2">
        <div className="flex items-center gap-2 min-w-0">
          <Moon className="w-4 h-4 text-amber-400" />
          <span className="font-extrabold text-white truncate">Waktu Solat USAS</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-bold text-amber-300 bg-[#070F22] px-2 py-0.5 rounded-full border border-amber-500/20">
            {prayerData.location}
          </span>
          <button
            onClick={toggleAutoNotify}
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 transition-colors ${
              autoNotifyEnabled
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25'
                : 'bg-white/[0.03] text-white/40 border-white/10'
            }`}
            title="Notifikasi waktu solat"
          >
            {autoNotifyEnabled ? <Bell className="w-3 h-3" /> : <BellOff className="w-3 h-3" />}
            <span>{autoNotifyEnabled ? 'Notify ON' : 'Notify OFF'}</span>
          </button>
        </div>
      </div>

      {/* Friday Prayer Break Banner */}
      {isFriday && (
        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-400/30 text-amber-300 text-[11px] font-bold flex flex-col sm:flex-row sm:items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span>Rehat Solat Jumaat: <strong>12:15 PM - 2:30 PM</strong> (Tiada kuliah berlangsung).</span>
        </div>
      )}

      {/* Prayer Times Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-1.5 text-center text-[10px]">
        {prayerData.times.map((p, idx) => (
          <div key={idx} className="bg-[#070F22] p-1.5 rounded-xl border border-amber-500/10">
            <div className="text-slate-400 font-semibold">{p.label}</div>
            <div className="font-black text-amber-300 mt-0.5">{p.content}</div>
          </div>
        ))}
      </div>

    </div>
  );
}
export function PrayerTimesNotifier() {
  const { session } = useAuth();
  const [prayerData, setPrayerData] = useState<PrayerData>({
    times: MOCK_PRAYER_TIMES,
    location: 'Kuala Kangsar (PRK02)',
  });
  const [now, setNow] = useState(new Date());
  const [autoNotifyEnabled] = usePrayerAutoNotifySetting();
  const notifiedRef = useRef<Record<string, boolean>>({});

  useEffect(() => {
    let active = true;
    fetchPrayerTimesAPI(session).then(res => {
      if (active && res?.success && res.times) {
        setPrayerData({ times: res.times, location: res.location || 'Kuala Kangsar (PRK02)' });
      }
    });
    return () => { active = false; };
  }, [session]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!autoNotifyEnabled || prayerData.times.length === 0) return;

    const dayStamp = getLocalDateStamp(now);
    const currentSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

    prayerData.times.forEach((prayer) => {
      const label = prayer.label?.toLowerCase() || '';
      if (!['subuh', 'zohor', 'asar', 'maghrib', 'isyak'].includes(label)) return;

      const prayerSeconds = parsePrayerTimeToSeconds(prayer.content);
      if (prayerSeconds === null) return;

      const diff = prayerSeconds - currentSeconds;
      const notifyKey = `${dayStamp}-${label}`;
      if (diff > 0 && diff <= NOTIFY_WINDOW_SECONDS && !notifiedRef.current[notifyKey]) {
        notifiedRef.current[notifyKey] = true;
        playClassChime();
        sendPushNotification(
          `Waktu Solat USAS: ${prayer.label}`,
          `${prayer.label} masuk dalam ${Math.ceil(diff / 60)} minit di ${prayerData.location}`
        );
      }
    });
  }, [autoNotifyEnabled, now, prayerData]);

  return null;
}





