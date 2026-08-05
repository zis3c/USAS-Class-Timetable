import React, { useState, useMemo } from 'react';
import { useLanguage } from '@/app/providers/LanguageProvider';
import { useTheme } from '@/app/providers/ThemeProvider';
import { MessageCircle, Copy, Check, Send, Smartphone } from 'lucide-react';
import { buildCompactShareText, buildFullShareText } from '@/features/export/lib/shareText';
import { copyTextToClipboard, openExternalUrl } from '@/shared/lib/security';

export default function WhatsAppShareButton({ timetable = [], studentName = '', matricNo = '' }) {
  const { lang } = useLanguage();
  const { theme } = useTheme();
  const [copied, setCopied] = useState(false);
  const [showPanel, setShowPanel] = useState(false);

  const isLight = theme === 'light';

  const formattedText = useMemo(
    () => buildFullShareText(timetable, studentName, matricNo),
    [timetable, studentName, matricNo]
  );

  const compactText = useMemo(
    () => buildCompactShareText(timetable, matricNo),
    [timetable, matricNo]
  );

  const handleCopy = async (text) => {
    await copyTextToClipboard(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleWhatsApp = () => {
    const encoded = encodeURIComponent(formattedText);
    openExternalUrl(`https://wa.me/?text=${encoded}`);
  };

  const handleTelegram = () => {
    const encoded = encodeURIComponent(formattedText);
    openExternalUrl(`https://t.me/share/url?url=&text=${encoded}`);
  };

  if (!timetable || timetable.length === 0) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setShowPanel(!showPanel)}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-left ${
          isLight
            ? 'hover:bg-slate-50 text-slate-700 hover:text-slate-900'
            : 'hover:bg-white/[0.04] text-white/70 hover:text-white'
        }`}
      >
        <MessageCircle className={`w-4 h-4 ${
          showPanel
            ? 'text-emerald-500'
            : (isLight ? 'text-emerald-600' : 'text-emerald-450')
        }`} />
        <div>
          <div className="text-xs font-semibold">
            {lang === 'ms' ? 'Kongsi ke WhatsApp / Telegram' : 'Share to WhatsApp / Telegram'}
          </div>
          <div className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-white/30'}`}>
            {lang === 'ms' ? 'Hantar jadual format teks ke media sosial' : 'Send text-format timetable to social media'}
          </div>
        </div>
      </button>

      {showPanel && (
        <div className={`mt-2 w-full sm:w-[22rem] max-w-[92vw] border rounded-xl p-4 space-y-3 shadow-xl z-50 animate-in slide-in-from-top-1 ${
          isLight
            ? 'bg-white border-slate-200 text-slate-800'
            : 'border-emerald-500/20 bg-[#0F2148]/95 backdrop-blur-xl text-white/80'
        }`}>
          <div className={`rounded-xl p-3 border max-h-52 overflow-y-auto no-scrollbar ${
            isLight ? 'bg-slate-50 border-slate-200 text-slate-700 font-medium' : 'bg-[#070F22] border-slate-800 text-slate-300'
          }`}>
            <pre className="text-[10px] font-mono whitespace-pre-wrap leading-relaxed">
              {formattedText}
            </pre>
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
              onClick={() => handleCopy(formattedText)}
              className={`py-2 px-3 rounded-md border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                copied
                  ? (isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25')
                  : (isLight ? 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200' : 'bg-[#070F22] hover:bg-[#12244c] text-amber-300 border-amber-500/20')
              }`}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Disalin!' : 'Salin Penuh'}</span>
            </button>

            <button
              onClick={() => handleCopy(compactText)}
              className={`py-2 px-3 rounded-md border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                isLight
                  ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                  : 'bg-[#070F22] hover:bg-[#12244c] border-amber-500/20 text-amber-300'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Salin Ringkas</span>
            </button>
          </div>

          <button
            onClick={() => setShowPanel(false)}
            className={`w-full py-1.5 text-center text-[10px] font-semibold transition-colors ${
              isLight ? 'text-slate-400 hover:text-slate-600' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            Tutup Panel Kongsi
          </button>
        </div>
      )}
    </div>
  );
}





