import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchAcademicCalendarAPI } from '../services/usasApi';
import type { AcademicCalendarItem } from '../types/usas';
import { X, Calendar, CheckCircle2, Clock, RotateCw } from 'lucide-react';

type AcademicCalendarModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function AcademicCalendarModal({ isOpen, onClose }: AcademicCalendarModalProps) {
  const { session } = useAuth();
  const [calendarEvents, setCalendarEvents] = useState<AcademicCalendarItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetchAcademicCalendarAPI(session).then(res => {
        setCalendarEvents(res);
        setLoading(false);
      });
    }
  }, [isOpen, session]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#070F22]/90 backdrop-blur-md">
      
      <div className="glass-card rounded-3xl w-full max-w-2xl border border-amber-500/20 bg-[#0F2148] shadow-2xl p-6 space-y-5 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-400 flex items-center justify-center">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white">Kalendar Akademik USAS</h3>
            <p className="text-xs text-amber-400 font-bold">Tarikh-Tarikh Penting Semester Semasa</p>
          </div>
        </div>

        {/* Events List */}
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400 space-y-2">
            <RotateCw className="w-6 h-6 animate-spin text-amber-400 mx-auto" />
            <div>Memuatkan kalendar akademik USAS...</div>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
            {calendarEvents.map((item, idx) => {
              const isDone = item.status?.toLowerCase().includes('selesai');
              return (
                <div key={idx} className="p-3.5 rounded-2xl bg-[#070F22] border border-amber-500/15 flex items-center justify-between text-xs shadow-md">
                  <div className="space-y-0.5">
                    <div className="font-extrabold text-white text-sm">{item.acara}</div>
                    <div className="text-slate-300 font-semibold flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-amber-400" />
                      <span>{item.tarikh}</span>
                    </div>
                  </div>

                  <div>
                    {isDone ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Selesai
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-400/10 text-amber-300 border border-amber-400/20 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Akan Datang
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-black text-xs"
        >
          Tutup
        </button>

      </div>

    </div>
  );
}
