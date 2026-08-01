import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchAttendanceHistoryAPI } from '../services/usasApi';
import { X, CalendarCheck, CheckCircle2, XCircle, AlertCircle, RotateCw } from 'lucide-react';

export default function AttendanceHistoryModal({ isOpen, onClose, course }) {
  const { session } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && course) {
      setLoading(true);
      fetchAttendanceHistoryAPI(session, course.group || 'GRP01').then(res => {
        setHistory(res);
        setLoading(false);
      });
    }
  }, [isOpen, course, session]);

  if (!isOpen || !course) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#070F22]/90 backdrop-blur-md">
      
      <div className="glass-card rounded-3xl w-full max-w-2xl border border-amber-500/20 bg-[#0F2148] shadow-2xl p-6 space-y-5 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-400 flex items-center justify-center">
            <CalendarCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white">Laporan Kehadiran Mingguan (Week 1 - 14)</h3>
            <p className="text-xs text-amber-400 font-bold">{course.course_id || course.kod_kursus}: {course.course_name || course.kursus}</p>
          </div>
        </div>

        {/* Attendance List */}
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400 space-y-2">
            <RotateCw className="w-6 h-6 animate-spin text-amber-400 mx-auto" />
            <div>Memuatkan rekod kehadiran USAS...</div>
          </div>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {history.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">Tiada rekod mingguan dijumpai.</div>
            ) : (
              history.map((h, i) => {
                const isPresent = (h.status_hadir || '').toLowerCase().includes('present') || (h.status_hadir || '').toLowerCase().includes('hadir');
                return (
                  <div key={i} className="p-3 rounded-xl bg-[#070F22] border border-slate-800 flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-3">
                      <span className="font-black text-amber-400 w-20">{h.minggu || `Minggu ${i+1}`}</span>
                      <span className="text-slate-400 font-medium">{h.tarikh || '-'}</span>
                    </div>

                    <div className="flex items-center space-x-3">
                      <span className="text-slate-400 truncate max-w-[150px]">{h.catatan || 'Scan QR App'}</span>
                      {isPresent ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Hadir
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-red-500/15 text-red-400 border border-red-500/20 flex items-center gap-1">
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
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-black text-xs"
        >
          Tutup
        </button>

      </div>

    </div>
  );
}
