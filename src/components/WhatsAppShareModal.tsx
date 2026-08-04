import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { X, Send, Copy, Check, Smartphone, MessageCircle } from 'lucide-react';
import { buildCompactShareText, buildFullShareText } from '../utils/shareText';

export default function WhatsAppShareModal({ isOpen, onClose, timetable = [], studentName = '', matricNo = '' }) {
  const { lang } = useLanguage();
  const { theme } = useTheme();

  const [copiedFull, setCopiedFull] = useState(false);
  const [copiedCompact, setCopiedCompact] = useState(false);
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [animate, setAnimate] = useState(false);

  const isLight = theme === 'light';

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
    }

    setAnimate(false);
    const timer = setTimeout(() => setShouldRender(false), 200);
    return () => clearTimeout(timer);
  }, [isOpen]);

  const formattedText = useMemo(
    () => buildFullShareText(timetable, studentName, matricNo),
    [timetable, studentName, matricNo]
  );

  const compactText = useMemo(
    () => buildCompactShareText(timetable, matricNo),
    [timetable, matricNo]
  );

  if (!shouldRender) return null;

  const handleCopy = async (text, mode) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (e) {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }

    if (mode === 'full') {
      setCopiedFull(true);
      setTimeout(() => setCopiedFull(false), 2000);
    } else {
      setCopiedCompact(true);
      setTimeout(() => setCopiedCompact(false), 2000);
    }
  };

  const handleWhatsApp = () => {
    const encoded = encodeURIComponent(formattedText);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  const handleTelegram = () => {
    const encoded = encodeURIComponent(formattedText);
    window.open(`https://t.me/share/url?url=&text=${encoded}`, '_blank');
  };

  return (
    <div data-lenis-prevent className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md transition-all duration-200 touch-pan-y overscroll-contain ${
      animate ? 'bg-slate-900/30 opacity-100' : 'bg-slate-900/0 opacity-0 pointer-events-none'
    }`}>
      <div className={`rounded-xl w-full max-w-[92vw] sm:max-w-2xl max-h-[90dvh] overflow-y-auto border pt-3 px-4 sm:px-5 pb-5 space-y-4 relative transition-all duration-200 transform min-h-0 ${
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

        <div className="flex items-center gap-3 pt-0 min-w-0">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md border ${
            isLight ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
          }`}>
            <MessageCircle className="w-5 h-5" />
          </div>
          <div className="text-left min-w-0">
            <h3 className={`text-sm font-bold truncate ${isLight ? 'text-slate-800' : 'text-white'}`}>
              {lang === 'ms' ? 'Kongsi ke WhatsApp / Telegram' : 'Share to WhatsApp / Telegram'}
            </h3>
            <p className={`text-xs font-semibold truncate ${isLight ? 'text-slate-500' : 'text-white/40'}`}>
              {studentName} ({matricNo})
            </p>
          </div>
        </div>

        <div data-lenis-prevent className={`rounded-xl p-3 border max-h-52 overflow-y-auto text-left usas-scrollbar touch-pan-y overscroll-contain ${
          isLight ? 'bg-slate-50 border-slate-200 text-slate-700 font-medium' : 'bg-[#070F22] border-slate-800 text-slate-300'
        }`}>
          <pre className="text-[10px] font-mono whitespace-pre-wrap leading-relaxed">{formattedText}</pre>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            onClick={handleWhatsApp}
            className={`py-2.5 px-3 rounded-md border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              isLight
                ? 'bg-emerald-50 hover:bg-emerald-100/70 border-emerald-200 text-emerald-800'
                : 'bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/30 text-[#25D366]'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            WhatsApp
          </button>

          <button
            onClick={handleTelegram}
            className={`py-2.5 px-3 rounded-md border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              isLight
                ? 'bg-sky-50 hover:bg-sky-100/70 border-sky-200 text-sky-800'
                : 'bg-[#0088cc]/15 hover:bg-[#0088cc]/25 border border-[#0088cc]/30 text-[#0088cc]'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            Telegram
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            onClick={() => handleCopy(formattedText, 'full')}
            className={`py-2 px-3 rounded-md border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              copiedFull
                ? (isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25')
                : (isLight ? 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200' : 'bg-[#070F22] hover:bg-[#12244c] text-amber-300 border-amber-500/20')
            }`}
          >
            {copiedFull ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedFull ? 'Disalin!' : 'Salin Penuh'}</span>
          </button>

          <button
            onClick={() => handleCopy(compactText, 'compact')}
            className={`py-2 px-3 rounded-md border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              copiedCompact
                ? (isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25')
                : (isLight ? 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200' : 'bg-[#070F22] hover:bg-[#12244c] text-amber-300 border-amber-500/20')
            }`}
          >
            {copiedCompact ? <Check className="w-3.5 h-3.5" /> : <Smartphone className="w-3.5 h-3.5" />}
            <span>{copiedCompact ? 'Disalin!' : 'Salin Ringkas'}</span>
          </button>
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
