import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/app/providers/AuthProvider';
import { fetchPrayerTimesAPI, MOCK_PRAYER_TIMES } from '@/services/usas/usasApi';
import type { PrayerTimeItem, WaktuSolatPrayer } from '@/shared/types/usas';
import { playPrayerChime, sendPushNotification } from '@/shared/lib/audioNotifier';
import { getLocalDateStamp, pruneDayScopedNotificationKeys } from '@/shared/lib/notificationKeys';

type PrayerData = {
  times: { label: string; timestamp: number }[];
  location: string;
};

const NOTIFY_WINDOW_SECONDS = 600;
const PRAYER_NOTIFY_KEY = 'usas_prayer_auto_notify';
const PRAYER_NOTIFY_EVENT = 'usas-prayer-auto-notify-changed';

// Legacy parser removed since API now uses exact unix timestamps

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
    times: [],
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
      if (active && res?.success && res.data?.prayers) {
        const flatTimes: { label: string; timestamp: number }[] = [];
        res.data.prayers.forEach((p: WaktuSolatPrayer) => {
          flatTimes.push({ label: 'Subuh', timestamp: p.fajr });
          flatTimes.push({ label: 'Zohor', timestamp: p.dhuhr });
          flatTimes.push({ label: 'Asar', timestamp: p.asr });
          flatTimes.push({ label: 'Maghrib', timestamp: p.maghrib });
          flatTimes.push({ label: 'Isyak', timestamp: p.isha });
        });
        flatTimes.sort((a, b) => a.timestamp - b.timestamp);
        setPrayerData({ times: flatTimes, location: res.location });
      }
    });
    return () => { active = false; };
  }, [session]);

  const currentUnix = Math.floor(now.getTime() / 1000);
  
  let nextPrayer = null;
  let diffSeconds = 0;
  
  for (const p of prayerData.times) {
    if (p.timestamp > currentUnix) {
      const date = new Date(p.timestamp * 1000);
      const hours = date.getHours();
      const mins = date.getMinutes();
      const content = `${hours % 12 || 12}:${mins.toString().padStart(2, '0')} ${hours >= 12 ? 'PM' : 'AM'}`;
      
      nextPrayer = { label: p.label, content };
      diffSeconds = p.timestamp - currentUnix;
      break;
    }
  }

  return { nextPrayer, diffSeconds, location: prayerData.location };
}

export function PrayerTimesNotifier() {
  const { session } = useAuth();
  const [prayerData, setPrayerData] = useState<PrayerData>({
    times: [],
    location: 'Kuala Kangsar (PRK02)',
  });
  const [now, setNow] = useState(new Date());
  const [autoNotifyEnabled] = usePrayerAutoNotifySetting();
  const notifiedRef = useRef<Record<string, boolean>>({});
  const activeDayStampRef = useRef('');

  useEffect(() => {
    let active = true;
    fetchPrayerTimesAPI(session).then(res => {
      if (active && res?.success && res.data?.prayers) {
        const flatTimes: { label: string; timestamp: number }[] = [];
        res.data.prayers.forEach((p: WaktuSolatPrayer) => {
          flatTimes.push({ label: 'Subuh', timestamp: p.fajr });
          flatTimes.push({ label: 'Zohor', timestamp: p.dhuhr });
          flatTimes.push({ label: 'Asar', timestamp: p.asr });
          flatTimes.push({ label: 'Maghrib', timestamp: p.maghrib });
          flatTimes.push({ label: 'Isyak', timestamp: p.isha });
        });
        flatTimes.sort((a, b) => a.timestamp - b.timestamp);
        setPrayerData({ times: flatTimes, location: res.location });
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
    const currentUnix = Math.floor(now.getTime() / 1000);

    prayerData.times.forEach((prayer) => {
      const label = prayer.label.toLowerCase();
      
      const diff = prayer.timestamp - currentUnix;
      const notifyKey = `${dayStamp}-${label}-${prayer.timestamp}`;
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
