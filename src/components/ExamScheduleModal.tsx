import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { X, Award, MapPin, Calendar, Clock } from 'lucide-react';

export default function ExamScheduleModal({ isOpen, onClose, courses = [] }) {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [shouldRender, setShouldRender] = useState(isOpen);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      const timer = setTimeout(() => setAnimate(true), 10);
      return () => clearTimeout(timer);
    } else {
      setAnimate(false);
      const timer = setTimeout(() => setShouldRender(false), 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!shouldRender) return null;

  // Generate realistic exam schedule dates for enrolled courses
  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() + 14); // 2 weeks from now

  const examList = courses.map((c, i) => {
    const examDate = new Date(baseDate);
    examDate.setDate(baseDate.getDate() + (i * 2));
    const dayStr = examDate.toLocaleDateString('ms-MY', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
    
    // Countdown days
    const diffTime = Math.abs(examDate.getTime() - Date.now());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return {
      id: c.course_id || c.kod_kursus,
      name: c.course_name || c.kursus,
      date: dayStr,
      time: i % 2 === 0 ? '09:00 AM - 12:00 PM' : '02:30 PM - 05:30 PM',
      venue: 'Dewan Besar USAS',
      seatNo: `Meja #${(i + 1) * 12 + 5}`,
      countdownDays: diffDays
    };
  });

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md transition-all duration-200 ${
      animate ? 'bg-slate-900/30 opacity-100' : 'bg-slate-900/0 opacity-0 pointer-events-none'
    }`}>
      
      <div className={`rounded-xl w-full max-w-3xl border pt-4 px-6 pb-6 space-y-5 relative transition-all duration-200 transform ${
        animate ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
      } ${
        isLight 
          ? 'bg-white border-slate-200 shadow-xl text-slate-800' 
          : 'bg-[#0A1428]/95 border-white/10 text-white shadow-2xl'
      }`}>
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 p-2 rounded-md transition-colors ${
            isLight ? 'text-slate-400 hover:text-slate-650 hover:bg-slate-100' : 'text-white/30 hover:text-white hover:bg-white/[0.06]'
          }`}
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${
            isLight ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-amber-400/10 border-amber-400/20 text-amber-400'
          }`}>
            <Award className="w-5 h-5" />
          </div>
          <div className="text-left">
            <h3 className={`text-base font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>Jadual Peperiksaan Akhir USAS</h3>
            <p className={`text-xs font-semibold ${isLight ? 'text-amber-650' : 'text-amber-400/90'}`}>Semakan Tarikh, Dewan Peperiksaan & Nombor Meja</p>
          </div>
        </div>

        {/* Exam Cards List */}
        <div className="space-y-3 max-h-80 overflow-y-auto pr-1 usas-scrollbar">
          {examList.map((e, idx) => (
            <div key={idx} className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm transition-all ${
              isLight 
                ? 'bg-slate-50/50 border-slate-200 hover:bg-slate-50' 
                : 'bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.04]'
            }`}>
              <div className="space-y-1 text-left">
                <div className="flex items-center gap-2">
                  <span className={`font-bold text-xs ${isLight ? 'text-amber-700' : 'text-amber-400'}`}>{e.id}</span>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                    isLight 
                      ? 'bg-amber-50 text-amber-800 border-amber-200' 
                      : 'bg-amber-400/10 text-amber-300 border-amber-400/20'
                  }`}>
                    {e.seatNo}
                  </span>
                </div>
                <h4 className={`text-sm font-semibold ${isLight ? 'text-slate-800' : 'text-white'}`}>{e.name}</h4>
                <div className={`text-xs font-medium flex items-center gap-3 ${isLight ? 'text-slate-400' : 'text-white/40'}`}>
                  <span className="flex items-center gap-1"><Calendar className={`w-3.5 h-3.5 ${isLight ? 'text-amber-655' : 'text-amber-400/70'}`} /> {e.date}</span>
                  <span className="flex items-center gap-1"><Clock className={`w-3.5 h-3.5 ${isLight ? 'text-amber-655' : 'text-amber-400/70'}`} /> {e.time}</span>
                </div>
              </div>

              <div className="text-right flex md:flex-col justify-between items-center md:items-end">
                <div className={`text-xs font-semibold flex items-center gap-1 ${isLight ? 'text-slate-700' : 'text-white/70'}`}>
                  <MapPin className={`w-3.5 h-3.5 ${isLight ? 'text-sky-655' : 'text-sky-400/70'}`} /> {e.venue}
                </div>
                <div className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border mt-1 flex-shrink-0 ${
                  isLight 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                }`}>
                  {e.countdownDays} Hari Lagi
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          className={`w-full py-2.5 rounded-xl font-bold text-xs transition-colors border ${
            isLight 
              ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200' 
              : 'bg-white/[0.04] hover:bg-white/[0.08] text-white/80 hover:text-white border-white/10'
          }`}
        >
          Tutup
        </button>

      </div>

    </div>
  );
}
