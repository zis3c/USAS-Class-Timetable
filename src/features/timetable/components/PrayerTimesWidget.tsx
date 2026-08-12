import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/app/providers/AuthProvider';
import { fetchPrayerTimesAPI, MOCK_PRAYER_TIMES } from '@/services/usas/usasApi';
import type { PrayerTimeItem } from '@/shared/types/usas';
import { playPrayerChime, sendPushNotification } from '@/shared/lib/audioNotifier';
import { getLocalDateStamp, pruneDayScopedNotificationKeys } from '@/shared/lib/notificationKeys';

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

export const formatCountdown = (diffSeconds: number) => {
  const h = Math.floor(diffSeconds / 3600);
  const m = Math.floor((diffSeconds % 3600) / 60);
  const s = diffSeconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

export const usePrayerAutoNotifySetting = () => {
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

export function useNextPrayer() {
  const { session } = useAuth();
  const [prayerData, setPrayerData] = useState<PrayerData>({
    times: MOCK_PRAYER_TIMES,
    location: 'Kuala Kangsar (PRK02)',
  });
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let active = true;
    fetchPrayerTimesAPI(session).then(res => {
      if (active && res?.success && res.times) {
        setPrayerData({ times: res.times, location: res.location || 'Kuala Kangsar (PRK02)' });
      }
    });
    return () => { active = false; };
  }, [session]);

  const currentSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  
  let nextPrayer = null;
  let diffSeconds = 0;
  
  for (const p of prayerData.times) {
    const pSecs = parsePrayerTimeToSeconds(p.content);
    if (pSecs && pSecs > currentSeconds) {
      nextPrayer = p;
      diffSeconds = pSecs - currentSeconds;
      break;
    }
  }
  
  // If no next prayer today, show Subuh for tomorrow
  if (!nextPrayer && prayerData.times.length > 0) {
    nextPrayer = prayerData.times[0];
    const pSecs = parsePrayerTimeToSeconds(nextPrayer.content) || 0;
    diffSeconds = (24 * 3600 - currentSeconds) + pSecs;
  }

  return { nextPrayer, diffSeconds, location: prayerData.location };
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
  const activeDayStampRef = useRef('');

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
    const dayStamp = getLocalDateStamp(now);
    if (activeDayStampRef.current === dayStamp) return;
    activeDayStampRef.current = dayStamp;
    notifiedRef.current = pruneDayScopedNotificationKeys(notifiedRef.current, now);
  }, [now]);

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
        playPrayerChime();
        sendPushNotification(
          `Waktu Solat USAS: ${prayer.label}`,
          `${prayer.label} masuk dalam ${Math.ceil(diff / 60)} minit di ${prayerData.location}`
        );
      }
    });
  }, [autoNotifyEnabled, now, prayerData]);

  return null;
}
