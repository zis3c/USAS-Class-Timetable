import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { 
  X, Download, Award, QrCode, 
  GraduationCap, LogOut, Sun, Moon, MessageCircle, Calculator
} from 'lucide-react';

export default function ToolsDrawer({ isOpen, onClose, onOpenPdf, onOpenExam, onOpenQr, onOpenWhatsApp, onOpenGpa }) {
  const { session, timetableData, logout } = useAuth();
  const { lang, t } = useLanguage();
  const { theme, changeTheme, THEMES } = useTheme();

  const allCourses = timetableData?.timetable || [];
  const isLight = theme === 'light';

  const handleToggleTheme = () => {
    changeTheme(theme === THEMES.LIGHT ? THEMES.NAVY : THEMES.LIGHT);
  };

  const [shouldRender, setShouldRender] = useState(isOpen);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setAnimate(false);
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
      const t = setTimeout(() => setShouldRender(false), 250);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  if (!shouldRender) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-50 transition-opacity duration-250 ${animate ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className={`fixed top-0 right-0 h-full w-80 max-w-[85vw] border-l z-50 flex flex-col shadow-2xl transition-all duration-250 ease-in-out ${animate ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'} ${
        isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#0A1428] border-white/[0.06] text-white/80'
      }`}>
        
        {/* Header */}
        <div className={`h-11 flex items-center justify-between px-4 border-b ${
          isLight ? 'border-slate-200' : 'border-white/[0.06]'
        }`}>
          <div className={`text-[9px] font-semibold uppercase tracking-[0.22em] ${
            isLight ? 'text-slate-400' : 'text-white/25'
          }`}>
            {t('toolsAndExport')}
          </div>
          <button 
            onClick={onClose} 
            className={`p-1 rounded-md transition-colors ${
              isLight ? 'text-slate-400 hover:text-slate-650 hover:bg-slate-100' : 'text-white/30 hover:text-white hover:bg-white/[0.06]'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Student Info */}
        {session && (
          <div className={`px-4 py-3 border-b ${isLight ? 'bg-slate-50/50 border-slate-200' : 'border-white/[0.06]'}`}>
            <div className="flex items-center gap-3">
              <img src="/usas-logo.png" alt="USAS" className="w-7 h-7 object-contain" />
              <div>
                <p className={`text-xs font-semibold ${isLight ? 'text-slate-800' : 'text-white/80'}`}>{timetableData?.studentName || session.user_id}</p>
                <p className={`text-[10px] flex items-center gap-1 ${isLight ? 'text-slate-500' : 'text-white/30'}`}>
                  <GraduationCap className="w-3 h-3" />
                  {session.user_id} • {allCourses.length} {t('sessions').toLowerCase()}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action List */}
        <div data-lenis-prevent className="flex-1 overflow-y-auto p-3 space-y-0.5 usas-scrollbar touch-pan-y overscroll-contain">
          
          {/* Export Section */}
          <p className={`text-[9px] font-semibold uppercase tracking-widest px-2 pt-2 pb-1 ${
            isLight ? 'text-slate-400' : 'text-white/20'
          }`}>{t('exportSection')}</p>
          
          <button
            onClick={onOpenPdf}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-left ${
              isLight ? 'hover:bg-slate-50 text-slate-700 hover:text-slate-900' : 'hover:bg-white/[0.04] text-white/70 hover:text-white'
            }`}
          >
            <Download className={`w-4 h-4 ${isLight ? 'text-amber-600' : 'text-amber-400/60'}`} />
            <div>
              <div className="text-xs font-semibold">{t('exportPdfTitle')}</div>
              <div className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-white/25'}`}>{t('exportPdfDesc')}</div>
            </div>
          </button>

          {/* Share Section */}
          <p className={`text-[9px] font-semibold uppercase tracking-widest px-2 pt-3 pb-1 ${
            isLight ? 'text-slate-400' : 'text-white/20'
          }`}>{t('shareSection')}</p>

          <button
            onClick={onOpenQr}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-left ${
              isLight ? 'hover:bg-slate-50 text-slate-700 hover:text-slate-900' : 'hover:bg-white/[0.04] text-white/70 hover:text-white'
            }`}
          >
            <QrCode className={`w-4 h-4 ${isLight ? 'text-purple-600' : 'text-purple-400/60'}`} />
            <div>
              <div className="text-xs font-semibold">{t('shareQrTitle')}</div>
              <div className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-white/25'}`}>{t('shareQrDesc')}</div>
            </div>
          </button>

          <button
            onClick={onOpenWhatsApp}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-left ${
              isLight ? 'hover:bg-slate-50 text-slate-700 hover:text-slate-900' : 'hover:bg-white/[0.04] text-white/70 hover:text-white'
            }`}
          >
            <MessageCircle className={`w-4 h-4 ${isLight ? 'text-emerald-600' : 'text-emerald-400/70'}`} />
            <div>
              <div className="text-xs font-semibold">
                {lang === 'ms' ? 'Kongsi ke WhatsApp / Telegram' : 'Share to WhatsApp / Telegram'}
              </div>
              <div className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-white/30'}`}>
                {lang === 'ms' ? 'Hantar jadual format teks ke media sosial' : 'Send text-format timetable to social media'}
              </div>
            </div>
          </button>

          {/* Academic Section */}
          <p className={`text-[9px] font-semibold uppercase tracking-widest px-2 pt-3 pb-1 ${
            isLight ? 'text-slate-400' : 'text-white/20'
          }`}>{t('academicSection')}</p>

          <button
            onClick={onOpenExam}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-left ${
              isLight ? 'hover:bg-slate-50 text-slate-700 hover:text-slate-900' : 'hover:bg-white/[0.04] text-white/70 hover:text-white'
            }`}
          >
            <Award className={`w-4 h-4 ${isLight ? 'text-amber-600' : 'text-amber-400/60'}`} />
            <div>
              <div className="text-xs font-semibold">{t('examTitle')}</div>
              <div className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-white/25'}`}>{t('examDesc')}</div>
            </div>
          </button>

          <button
            onClick={onOpenGpa}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-left ${
              isLight ? 'hover:bg-slate-50 text-slate-700 hover:text-slate-900' : 'hover:bg-white/[0.04] text-white/70 hover:text-white'
            }`}
          >
            <Calculator className={`w-4 h-4 ${isLight ? 'text-blue-600' : 'text-blue-400/70'}`} />
            <div>
              <div className="text-xs font-semibold">{t('gpaBtn')}</div>
              <div className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-white/25'}`}>
                {lang === 'ms' ? 'Kira anggaran GPA & sasaran keputusan semester' : 'Estimate GPA & academic semester target goals'}
              </div>
            </div>
          </button>

          {/* Preferences Section */}
          <p className={`text-[9px] font-semibold uppercase tracking-widest px-2 pt-3 pb-1 ${
            isLight ? 'text-slate-400' : 'text-white/20'
          }`}>{lang === 'ms' ? 'PREFERENSI' : 'PREFERENCES'}</p>

          <div className={`flex items-center justify-between px-3 py-2.5 rounded-md ${
            isLight ? 'text-slate-700' : 'text-white/70'
          }`}>
            <span className="text-xs font-semibold flex items-center gap-2">
              {isLight ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-amber-400" />}
              {theme === THEMES.LIGHT ? t('themeLight') : t('themeDark')}
            </span>
            <button
              onClick={handleToggleTheme}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                isLight ? 'bg-slate-200' : 'bg-amber-400'
              }`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                  isLight ? 'translate-x-[3px]' : 'translate-x-[18px]'
                }`}
              />
            </button>
          </div>

          {/* Account Section */}
          <p className={`text-[9px] font-semibold uppercase tracking-widest px-2 pt-3 pb-1 ${
            isLight ? 'text-slate-400' : 'text-white/20'
          }`}>{lang === 'ms' ? 'AKAUN' : 'ACCOUNT'}</p>

          <button
            onClick={() => {
              logout();
              onClose();
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-left ${
              isLight ? 'hover:bg-red-50 text-slate-700 hover:text-red-600' : 'hover:bg-red-955 bg-transparent text-white/70 hover:text-red-400'
            }`}
          >
            <LogOut className="w-4 h-4 text-red-500/80 flex-shrink-0" />
            <div>
              <div className="text-xs font-semibold">{lang === 'ms' ? 'Log Keluar' : 'Log Out'}</div>
              <div className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-white/25'}`}>
                {lang === 'ms' ? 'Tamatkan sesi aktif portal' : 'End your active portal session'}
              </div>
            </div>
          </button>

        </div>
      </div>
    </>
  );
}
