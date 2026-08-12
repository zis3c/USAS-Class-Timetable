import React, { useState, useEffect } from 'react';
import { X, Moon, Clock, Calendar as CalendarIcon, MapPin } from 'lucide-react';
import { useAuth } from '@/app/providers/AuthProvider';
import { useLanguage } from '@/app/providers/LanguageProvider';
import { useTheme } from '@/app/providers/ThemeProvider';
import { fetchPrayerTimesAPI } from '@/services/usas/usasApi';
import type { WaktuSolatPrayer } from '@/shared/types/usas';
import { formatCountdown } from '../components/PrayerTimesWidget';

interface PrayerTimesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type FormattedPrayer = {
  id: string;
  label: string;
  unix: number;
  timeStr: string;
  passed: boolean;
  isNext: boolean;
};

export default function PrayerTimesModal({ isOpen, onClose }: PrayerTimesModalProps) {
  const { session } = useAuth();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const isLight = theme === 'light';

  const [prayers, setPrayers] = useState<FormattedPrayer[]>([]);
  const [location, setLocation] = useState('Kuala Kangsar (PRK02)');
  const [now, setNow] = useState(new Date());
  const [loading, setLoading] = useState(true);

  // Update current time every second
  useEffect(() => {
    if (!isOpen) return;
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, [isOpen]);

  // Fetch data
  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    setLoading(true);
    
    fetchPrayerTimesAPI(session).then((res) => {
      if (active && res?.success && res.data?.prayers) {
        setLocation(res.location || 'Kuala Kangsar (PRK02)');
        const todayDate = new Date().getDate();
        
        // Find today's prayer object from the month's array
        const todayPrayers = res.data.prayers.find((p: WaktuSolatPrayer) => p.day === todayDate);
        
        if (todayPrayers) {
          const makeTime = (unix: number) => {
            const date = new Date(unix * 1000);
            const hours = date.getHours();
            const mins = date.getMinutes();
            return `${hours % 12 || 12}:${mins.toString().padStart(2, '0')} ${hours >= 12 ? 'PM' : 'AM'}`;
          };

          const raw = [
            { id: 'imsak', label: 'Imsak', unix: todayPrayers.imsak },
            { id: 'fajr', label: 'Subuh', unix: todayPrayers.fajr },
            { id: 'syuruk', label: 'Syuruk', unix: todayPrayers.syuruk },
            { id: 'dhuha', label: 'Dhuha', unix: todayPrayers.dhuha },
            { id: 'dhuhr', label: 'Zohor', unix: todayPrayers.dhuhr },
            { id: 'asr', label: 'Asar', unix: todayPrayers.asr },
            { id: 'maghrib', label: 'Maghrib', unix: todayPrayers.maghrib },
            { id: 'isha', label: 'Isyak', unix: todayPrayers.isha },
          ];

          // Determine passed and next
          const currentUnix = Math.floor(Date.now() / 1000);
          let foundNext = false;
          
          const formatted = raw.map(p => {
            const passed = p.unix <= currentUnix;
            let isNext = false;
            if (!passed && !foundNext) {
              isNext = true;
              foundNext = true;
            }
            return {
              ...p,
              timeStr: makeTime(p.unix),
              passed,
              isNext,
            };
          });

          setPrayers(formatted);
        }
      }
      setLoading(false);
    });
    return () => { active = false; };
  }, [isOpen, session]);

  // Recalculate passed/next dynamically based on current `now`
  const dynamicPrayers = React.useMemo(() => {
    const currentUnix = Math.floor(now.getTime() / 1000);
    let foundNext = false;
    return prayers.map(p => {
      const passed = p.unix <= currentUnix;
      let isNext = false;
      if (!passed && !foundNext) {
        isNext = true;
        foundNext = true;
      }
      return { ...p, passed, isNext };
    });
  }, [prayers, now]);

  const nextPrayer = dynamicPrayers.find(p => p.isNext);
  const diffSeconds = nextPrayer ? nextPrayer.unix - Math.floor(now.getTime() / 1000) : 0;

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-in fade-in duration-200"
        onClick={onClose}
      />
      
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div 
          className={`w-full max-w-sm rounded-2xl shadow-2xl pointer-events-auto flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 ${
            isLight ? 'bg-white border border-slate-200' : 'bg-[#0A1428] border border-white/[0.08]'
          }`}
        >
          {/* Header */}
          <div className={`flex items-center justify-between p-4 border-b shrink-0 ${
            isLight ? 'border-slate-100' : 'border-white/[0.08]'
          }`}>
            <div className="flex items-center gap-2.5 text-amber-500">
              <div className={`p-1.5 rounded-lg ${isLight ? 'bg-amber-100/50' : 'bg-amber-500/10'}`}>
                <Moon className="w-4 h-4" />
              </div>
              <h2 className={`font-semibold ${isLight ? 'text-slate-800' : 'text-white/90'}`}>
                Waktu Solat
              </h2>
            </div>
            <button 
              onClick={onClose}
              className={`p-1.5 rounded-lg transition-colors ${
                isLight ? 'text-slate-400 hover:bg-slate-100' : 'text-white/40 hover:bg-white/[0.08]'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="overflow-y-auto flex-1 p-4 touch-pan-y usas-scrollbar">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 opacity-50">
                <Clock className={`w-8 h-8 animate-spin ${isLight ? 'text-amber-500' : 'text-amber-400'}`} />
                <span className={`text-sm ${isLight ? 'text-slate-500' : 'text-white/50'}`}>Loading...</span>
              </div>
            ) : (
              <div className="space-y-4">
                
                {/* Hero Countdown */}
                <div className={`rounded-xl p-4 border text-center ${
                  isLight 
                    ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200/50 shadow-sm shadow-amber-900/5' 
                    : 'bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20'
                }`}>
                  <div className={`text-[10px] uppercase tracking-widest font-semibold mb-1 ${
                    isLight ? 'text-amber-600/80' : 'text-amber-400/80'
                  }`}>
                    {nextPrayer ? `Next Prayer: ${nextPrayer.label}` : 'All Prayers Completed'}
                  </div>
                  <div className={`text-3xl font-bold tabular-nums tracking-tight ${
                    isLight ? 'text-amber-700' : 'text-amber-400'
                  }`}>
                    {nextPrayer ? formatCountdown(diffSeconds) : '--:--:--'}
                  </div>
                  <div className={`text-xs mt-1.5 opacity-80 ${isLight ? 'text-amber-700' : 'text-amber-200'}`}>
                    {nextPrayer ? `at ${nextPrayer.timeStr}` : 'Waiting for tomorrow...'}
                  </div>
                </div>

                {/* Info row */}
                <div className={`flex items-center justify-center gap-4 text-[10px] font-medium py-1 ${
                  isLight ? 'text-slate-500' : 'text-white/40'
                }`}>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3 h-3 opacity-70" />
                    <span className="truncate max-w-[120px]">{location}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CalendarIcon className="w-3 h-3 opacity-70" />
                    <span>{now.toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                </div>

                {/* Prayer List */}
                <div className="space-y-2 mt-2">
                  {dynamicPrayers.map((prayer) => (
                    <div 
                      key={prayer.id}
                      className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                        prayer.isNext
                          ? (isLight 
                              ? 'bg-amber-50/80 border-amber-300 shadow-sm' 
                              : 'bg-amber-400/15 border-amber-400/40')
                          : (isLight
                              ? 'bg-white border-slate-100'
                              : 'bg-white/[0.02] border-white/[0.04]')
                      } ${prayer.passed ? 'opacity-50' : 'opacity-100'}`}
                    >
                      <span className={`text-sm font-semibold ${
                        prayer.isNext 
                          ? (isLight ? 'text-amber-700' : 'text-amber-300')
                          : (isLight ? 'text-slate-700' : 'text-white/80')
                      }`}>
                        {prayer.label}
                      </span>
                      <span className={`text-sm tabular-nums font-bold ${
                        prayer.isNext 
                          ? (isLight ? 'text-amber-700' : 'text-amber-300')
                          : (isLight ? 'text-slate-500' : 'text-white/50')
                      }`}>
                        {prayer.timeStr}
                      </span>
                    </div>
                  ))}
                </div>

                <div className={`text-center pt-2 text-[9px] uppercase tracking-widest font-bold ${
                  isLight ? 'text-slate-400' : 'text-white/30'
                }`}>
                  Powered by API Waktu Solat JAKIM
                </div>
                
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
