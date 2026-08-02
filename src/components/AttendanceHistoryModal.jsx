import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { fetchAttendanceHistoryAPI } from '../services/usasApi';
import { X, CalendarCheck, CheckCircle2, XCircle, RotateCw } from 'lucide-react';

export default function AttendanceHistoryModal({ isOpen, onClose, course }) {
  const { session } = useAuth();
  const { theme } = useTheme();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    if (isOpen && course) {
      setLoading(true);
      // Pass the raw group to the backend API as it expects the database name (e.g. GRP01)
      fetchAttendanceHistoryAPI(session, course.group || 'GRP01').then(res => {
        setHistory(res);
        setLoading(false);
      });
    }
  }, [isOpen, course, session]);

  if (!shouldRender || !course) return null;

  const normalizeGroup = (groupStr) => {
    if (!groupStr) return 'G1';
    return groupStr.replace(/^GRP/i, 'G');
  };

  const groupDisplay = normalizeGroup(course.group || course.kumpulan || 'A');

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md transition-all duration-200 ${
      animate ? 'bg-slate-900/30 opacity-100' : 'bg-slate-900/0 opacity-0 pointer-events-none'
    }`}>
      
      <div className={`rounded-xl w-full max-w-2xl border pt-4 px-6 pb-6 space-y-5 relative transition-all duration-200 transform ${
        animate ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
      } ${
        isLight 
          ? 'bg-white border-slate-200 shadow-xl text-slate-800' 
          : 'bg-[#0A1428]/95 border-white/10 text-white shadow-2xl'
      }`}>
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 p-2 rounded-md transition-colors ${
            isLight ? 'text-slate-400 hover:text-slate-655 hover:bg-slate-100' : 'text-white/30 hover:text-white hover:bg-white/[0.06]'
          }`}
        >
          <X className="w-4 h-4" />
        </button>

        {/* Left-Aligned Icon Modal Header */}
        <div className="flex items-center space-x-3 pt-0">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md border ${
            isLight ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-amber-400/10 border-amber-400/20 text-amber-400'
          }`}>
            <CalendarCheck className="w-5 h-5" />
          </div>
          <div className="text-left">
            <h3 className={`text-base font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>Laporan Kehadiran Mingguan (Week 1 - 14)</h3>
            <p className={`text-xs font-semibold ${isLight ? 'text-amber-750' : 'text-amber-400/90'}`}>
              {course.course_id || course.kod_kursus} ({groupDisplay}): {course.course_name || course.kursus}
            </p>
          </div>
        </div>

        {/* Attendance List (uses themed custom-scrollbar) */}
        {loading ? (
          <div className={`py-12 text-center text-xs space-y-2 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            <RotateCw className={`w-6 h-6 animate-spin mx-auto ${isLight ? 'text-amber-600' : 'text-amber-400'}`} />
            <div>Memuatkan rekod kehadiran USAS...</div>
          </div>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1 usas-scrollbar">
            {history.length === 0 ? (
              <div className={`p-6 text-center text-xs ${isLight ? 'text-slate-400' : 'text-slate-400'}`}>Tiada rekod mingguan dijumpai.</div>
            ) : (
              history.map((h, i) => {
                const isPresent = (h.status_hadir || '').toLowerCase().includes('present') || (h.status_hadir || '').toLowerCase().includes('hadir');
                return (
                  <div key={i} className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                    isLight 
                      ? 'bg-slate-50/50 border-slate-200 hover:bg-slate-50' 
                      : 'bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.04]'
                  }`}>
                    <div className="flex items-center space-x-3 text-left">
                      <span className={`font-bold w-20 ${isLight ? 'text-amber-700' : 'text-amber-400'}`}>{h.minggu || `Minggu ${i+1}`}</span>
                      <span className={`font-medium ${isLight ? 'text-slate-500' : 'text-white/40'}`}>{h.tarikh || '-'}</span>
                    </div>

                    <div className="flex items-center space-x-3 text-right">
                      <span className={`truncate max-w-[150px] ${isLight ? 'text-slate-500' : 'text-white/30'}`}>{h.catatan || 'Scan QR App'}</span>
                      {isPresent ? (
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border flex items-center gap-1 ${
                          isLight 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                            : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                        }`}>
                          <CheckCircle2 className="w-3 h-3" /> Hadir
                        </span>
                      ) : (
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border flex items-center gap-1 ${
                          isLight 
                            ? 'bg-red-50 text-red-700 border-red-200' 
                            : 'bg-red-500/15 text-red-400 border border-red-500/20'
                        }`}>
                          <XCircle className="w-3 h-3" /> Tidak Hadir
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

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
