import React from 'react';
import { X, Award, MapPin, Calendar, Clock, AlertCircle } from 'lucide-react';

export default function ExamScheduleModal({ isOpen, onClose, courses = [] }) {
  if (!isOpen) return null;

  // Generate realistic exam schedule dates for enrolled courses
  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() + 14); // 2 weeks from now

  const examList = courses.map((c, i) => {
    const examDate = new Date(baseDate);
    examDate.setDate(baseDate.getDate() + (i * 2));
    const dayStr = examDate.toLocaleDateString('ms-MY', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
    
    // Countdown days
    const diffTime = Math.abs(examDate - new Date());
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#070F22]/90 backdrop-blur-md">
      
      <div className="glass-card rounded-3xl w-full max-w-3xl border border-amber-500/20 bg-[#0F2148] shadow-2xl p-6 space-y-5 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-400 flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white">Jadual Peperiksaan Akhir USAS</h3>
            <p className="text-xs text-amber-400 font-bold">Semakan Tarikh, Dewan Peperiksaan & Nombor Meja</p>
          </div>
        </div>

        {/* Exam Cards List */}
        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
          {examList.map((e, idx) => (
            <div key={idx} className="p-4 rounded-2xl bg-[#070F22] border border-amber-500/15 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-md">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-black text-amber-400 text-xs">{e.id}</span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-400/10 text-amber-300 border border-amber-400/20">
                    {e.seatNo}
                  </span>
                </div>
                <h4 className="text-sm font-extrabold text-white">{e.name}</h4>
                <div className="text-xs text-slate-300 font-semibold flex items-center gap-3">
                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-amber-400" /> {e.date}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-amber-400" /> {e.time}</span>
                </div>
              </div>

              <div className="text-right flex md:flex-col justify-between items-center md:items-end">
                <div className="text-xs text-slate-300 font-bold flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-sky-400" /> {e.venue}
                </div>
                <div className="text-[11px] font-black text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 mt-1">
                  {e.countdownDays} Hari Lagi
                </div>
              </div>
            </div>
          ))}
        </div>

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
