import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchPrayerTimesAPI, MOCK_PRAYER_TIMES } from '../services/usasApi';
import type { PrayerTimeItem } from '../types/usas';
import { Moon, AlertCircle } from 'lucide-react';

export default function PrayerTimesWidget() {
  const { session } = useAuth();
  const [prayerData, setPrayerData] = useState<{ times: PrayerTimeItem[]; location: string }>({
    times: MOCK_PRAYER_TIMES,
    location: 'Kuala Kangsar (PRK02)',
  });

  useEffect(() => {
    let mounted = true;
    fetchPrayerTimesAPI(session).then(res => {
      if (mounted && res?.success && res.times) {
        setPrayerData({ times: res.times, location: res.location || 'Kuala Kangsar (PRK02)' });
      }
    });
    return () => { mounted = false; };
  }, [session]);

  const isFriday = new Date().getDay() === 5; // Friday

  return (
    <div className="glass-card rounded-2xl p-4 border border-amber-500/20 bg-[#0F2148]/70 space-y-3 shadow-lg">
      
      {/* Header */}
      <div className="flex items-center justify-between text-xs border-b border-amber-500/10 pb-2">
        <div className="flex items-center space-x-2">
          <Moon className="w-4 h-4 text-amber-400" />
          <span className="font-extrabold text-white">Waktu Solat USAS</span>
        </div>
        <span className="text-[10px] font-bold text-amber-300 bg-[#070F22] px-2 py-0.5 rounded-full border border-amber-500/20">
          Kuala Kangsar (PRK02)
        </span>
      </div>

      {/* Friday Prayer Break Banner */}
      {isFriday && (
        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-400/30 text-amber-300 text-[11px] font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span>Rehat Solat Jumaat: <strong>12:15 PM – 2:30 PM</strong> (Tiada kuliah berlangsung).</span>
        </div>
      )}

      {/* Prayer Times Grid */}
      <div className="grid grid-cols-6 gap-1.5 text-center text-[10px]">
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
