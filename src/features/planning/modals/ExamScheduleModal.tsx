import React, { useState, useEffect } from 'react';
import { useTheme } from '@/app/providers/ThemeProvider';
import { X, FileText, MapPin, Calendar, Clock } from 'lucide-react';

export default function ExamScheduleModal({ isOpen, onClose, courses = [] }) {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [shouldRender, setShouldRender] = useState(isOpen);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      let raf1 = 0;
      let raf2 = 0;
      raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => setAnimate(true));
      });
      return () => {
        cancelAnimationFrame(raf1);
        cancelAnimationFrame(raf2);
      };
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
      
      <div className={`rounded-xl w-full max-w-[92vw] sm:max-w-3xl border pt-4 px-4 sm:px-6 pb-6 relative transition-all duration-200 transform flex flex-col gap-5 min-h-0 max-h-[85dvh] sm:max-h-[90dvh] ${
        animate ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
      } ${
        isLight 
          ? 'bg-white border-slate-200 shadow-xl text-slate-800' 
          : 'bg-[#0A1428]/95 border-white/10 text-white shadow-2xl'
      }`}>
        {/* Modal Header */}
        <div className="flex items-start sm:items-center justify-between gap-3 flex-shrink-0">
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${
              isLight ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-amber-400/10 border-amber-400/20 text-amber-400'
            }`}>
              <FileText className="w-5 h-5" />
            </div>
            <div className="text-left min-w-0">
              <h3 className={`text-sm sm:text-base font-bold truncate ${isLight ? 'text-slate-800' : 'text-white'}`}>Jadual Peperiksaan Akhir USAS</h3>
              <p className={`text-[11px] sm:text-xs font-semibold truncate ${isLight ? 'text-amber-650' : 'text-amber-400/90'}`}>Semakan Tarikh, Dewan Peperiksaan & Nombor Meja</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`flex-shrink-0 p-1.5 rounded-md transition-colors ${
              isLight ? 'text-slate-400 hover:text-slate-600 hover:bg-slate-100' : 'text-white/30 hover:text-white hover:bg-white/[0.06]'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Exam Cards List */}
        <div data-lenis-prevent className="space-y-3 overflow-y-auto flex-1 min-h-0 pr-1 usas-scrollbar touch-pan-y overscroll-contain">
          {examList.map((e, idx) => (
            <div key={idx} className={`p-3 sm:p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-2.5 sm:gap-3 shadow-sm transition-all ${
              isLight 
                ? 'bg-slate-50/50 border-slate-200 hover:bg-slate-50' 
                : 'bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.04]'
            }`}>
              <div className="space-y-1 text-left min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`font-bold text-[11px] sm:text-xs ${isLight ? 'text-amber-700' : 'text-amber-400'}`}>{e.id}</span>
                  <span className={`px-2 py-0.5 rounded-md text-[9px] sm:text-[10px] font-bold border ${
                    isLight 
                      ? 'bg-amber-50 text-amber-800 border-amber-200' 
                      : 'bg-amber-400/10 text-amber-300 border-amber-400/20'
                  }`}>
                    {e.seatNo}
                  </span>
                </div>
                <h4 className={`text-[13px] sm:text-sm font-semibold truncate ${isLight ? 'text-slate-800' : 'text-white'}`}>{e.name}</h4>
                <div className={`text-[11px] sm:text-xs font-medium flex flex-wrap items-center gap-x-2.5 gap-y-1 ${isLight ? 'text-slate-400' : 'text-white/40'}`}>
                  <span className="flex items-center gap-1 min-w-0"><Calendar className={`w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0 ${isLight ? 'text-amber-655' : 'text-amber-400/70'}`} /> <span className="truncate">{e.date}</span></span>
                  <span className="flex items-center gap-1 min-w-0"><Clock className={`w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0 ${isLight ? 'text-amber-655' : 'text-amber-400/70'}`} /> <span className="truncate">{e.time}</span></span>
                </div>
              </div>

              <div className="text-right flex items-center justify-start md:justify-end gap-2.5 mt-2 md:mt-0 flex-shrink-0">
                <div className={`text-[11px] sm:text-xs font-semibold flex items-center gap-1 ${isLight ? 'text-slate-700' : 'text-white/70'}`}>
                  <MapPin className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${isLight ? 'text-sky-655' : 'text-sky-400/70'}`} /> {e.venue}
                </div>
                <div className={`text-[10px] sm:text-[11px] font-semibold px-2 py-1 rounded-full border flex-shrink-0 ${
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



