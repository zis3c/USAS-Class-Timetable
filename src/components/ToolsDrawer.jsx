import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import WhatsAppShareButton from './WhatsAppShareButton';
import { exportTimetableICS } from '../utils/icsGenerator';
import { 
  X, Download, Award, QrCode, CalendarPlus, 
  GraduationCap
} from 'lucide-react';

export default function ToolsDrawer({ isOpen, onClose, onOpenPdf, onOpenExam, onOpenQr }) {
  const { session, timetableData } = useAuth();
  const { lang, t } = useLanguage();

  const allCourses = timetableData?.timetable || [];

  const handleExportICS = () => {
    exportTimetableICS(allCourses, timetableData?.studentName || session?.user_id);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-fade-in" onClick={onClose} />

      {/* Drawer Panel */}
      <div className="fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-[#0A1428] border-l border-white/[0.06] z-50 flex flex-col shadow-2xl animate-slide-in-right">
        
        {/* Header */}
        <div className="h-12 flex items-center justify-between px-4 border-b border-white/[0.04]">
          <h2 className="text-xs font-bold text-white/80">{t('toolsAndExport')}</h2>
          <button onClick={onClose} className="p-1 rounded text-white/30 hover:text-white/60 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Student Info (compact) */}
        {session && (
          <div className="px-4 py-3 border-b border-white/[0.04]">
            <div className="flex items-center gap-3">
              <img src="/usas-logo.png" alt="USAS" className="w-8 h-8 object-contain opacity-60" />
              <div>
                <p className="text-xs font-semibold text-white/80">{timetableData?.studentName || session.user_id}</p>
                <p className="text-[10px] text-white/30 flex items-center gap-1">
                  <GraduationCap className="w-3 h-3" />
                  {session.user_id} • {allCourses.length} {t('sessions').toLowerCase()}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          
          <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest px-2 pt-2 pb-1">{t('exportSection')}</p>
          
          <button
            onClick={onOpenPdf}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/[0.04] text-white/70 hover:text-white transition-colors text-left"
          >
            <Download className="w-4 h-4 text-amber-400/70" />
            <div>
              <div className="text-xs font-semibold">{t('exportPdfTitle')}</div>
              <div className="text-[10px] text-white/30">{t('exportPdfDesc')}</div>
            </div>
          </button>

          <button
            onClick={handleExportICS}
            disabled={allCourses.length === 0}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/[0.04] text-white/70 hover:text-white transition-colors text-left disabled:opacity-30"
          >
            <CalendarPlus className="w-4 h-4 text-blue-400/70" />
            <div>
              <div className="text-xs font-semibold">{t('syncCalTitle')}</div>
              <div className="text-[10px] text-white/30">{t('syncCalDesc')}</div>
            </div>
          </button>

          <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest px-2 pt-3 pb-1">{t('shareSection')}</p>

          <button
            onClick={onOpenQr}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/[0.04] text-white/70 hover:text-white transition-colors text-left"
          >
            <QrCode className="w-4 h-4 text-purple-400/70" />
            <div>
              <div className="text-xs font-semibold">{t('shareQrTitle')}</div>
              <div className="text-[10px] text-white/30">{t('shareQrDesc')}</div>
            </div>
          </button>

          <div className="px-0">
            <WhatsAppShareButton 
              timetable={allCourses}
              studentName={timetableData?.studentName || ''}
              matricNo={session?.user_id || ''}
            />
          </div>

          <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest px-2 pt-3 pb-1">{t('academicSection')}</p>

          <button
            onClick={onOpenExam}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/[0.04] text-white/70 hover:text-white transition-colors text-left"
          >
            <Award className="w-4 h-4 text-amber-400/70" />
            <div>
              <div className="text-xs font-semibold">{t('examTitle')}</div>
              <div className="text-[10px] text-white/30">{t('examDesc')}</div>
            </div>
          </button>

        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-white/[0.04] text-center">
          <p className="text-[9px] text-white/15 font-medium">{t('universityName')} • Portal v2.0</p>
        </div>
      </div>
    </>
  );
}
