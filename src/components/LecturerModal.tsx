import { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { X, User, Mail, Building, Clock, Copy, Check } from 'lucide-react';

type LecturerModalProps = {
  lecturerName: string | null;
  isOpen: boolean;
  onClose: () => void;
};

export default function LecturerModal({ lecturerName, isOpen, onClose }: LecturerModalProps) {
  const [copied, setCopied] = useState(false);
  const { theme } = useTheme();

  const isLight = theme === 'light';

  const [shouldRender, setShouldRender] = useState(isOpen);
  const [animate, setAnimate] = useState(false);
  // Cache the name so it persists during the exit animation after prop becomes null
  const [cachedName, setCachedName] = useState(lecturerName);

  useEffect(() => {
    if (lecturerName) setCachedName(lecturerName);
  }, [lecturerName]);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      // Double rAF ensures the browser has painted the hidden state (scale-95/opacity-0)
      // before starting the enter animation — fixes skipped transition on first open
      let raf1: number;
      let raf2: number;
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

  if (!shouldRender || !cachedName) return null;

  // Format sample email from lecturer name e.g. "DR. SMITH" -> "smith@usas.edu.my"
  const emailName = cachedName
    .replace(/^(DR\.|EN\.|PN\.|USTAZ|PM DR\.|PROF\.)\s*/i, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '.');

  const email = `${emailName || 'pensyarah'}@usas.edu.my`;

  const handleCopyEmail = () => {
    void navigator.clipboard.writeText(email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md transition-all duration-200 ${
      animate ? 'bg-slate-900/30 opacity-100' : 'bg-slate-900/0 opacity-0 pointer-events-none'
    }`}>
      
      <div className={`rounded-xl w-full max-w-md border pt-4 px-6 pb-6 space-y-5 relative transition-all duration-200 transform ${
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
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md border ${
            isLight ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-amber-400/10 border-amber-400/20 text-amber-400'
          }`}>
            <User className="w-6 h-6" />
          </div>
          <div className="text-left">
            <h3 className={`text-base font-bold leading-tight ${isLight ? 'text-slate-800' : 'text-white'}`}>{cachedName}</h3>
            <p className={`text-xs font-semibold ${isLight ? 'text-slate-500' : 'text-white/40'}`}>Pensyarah Universiti Sultan Azlan Shah</p>
          </div>
        </div>

        {/* Details Grid */}
        <div className={`space-y-3 text-xs p-4 rounded-xl border shadow-inner ${
          isLight ? 'bg-slate-50/50 border-slate-200/80' : 'bg-white/[0.02] border-white/[0.05]'
        }`}>
          
          <div className="flex items-center space-x-3">
            <Building className="w-4 h-4 text-sky-500 flex-shrink-0" />
            <div className="text-left">
              <div className={`text-[10px] font-semibold ${isLight ? 'text-slate-400' : 'text-white/40'}`}>Fakulti / Jabatan</div>
              <div className={`font-semibold ${isLight ? 'text-slate-700' : 'text-white'}`}>Fakulti Teknologi & Sains Maklumat (FTMK)</div>
            </div>
          </div>

          <div className={`flex items-center space-x-3 pt-2 border-t text-left ${isLight ? 'border-slate-200' : 'border-white/[0.05]'}`}>
            <Clock className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            <div>
              <div className={`text-[10px] font-semibold ${isLight ? 'text-slate-400' : 'text-white/40'}`}>Waktu Konsultasi Pelajar</div>
              <div className={`font-semibold ${isLight ? 'text-slate-700' : 'text-white'}`}>Selasa & Khamis (02:00 PM - 04:00 PM)</div>
            </div>
          </div>

          <div className={`flex items-center justify-between pt-2 border-t ${isLight ? 'border-slate-200' : 'border-white/[0.05]'}`}>
            <div className="flex items-center space-x-3 truncate text-left">
              <Mail className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <div className="truncate">
                <div className={`text-[10px] font-semibold ${isLight ? 'text-slate-400' : 'text-white/40'}`}>E-mel Rasmi</div>
                <div className={`font-semibold truncate ${isLight ? 'text-slate-600' : 'text-white/80'}`}>{email}</div>
              </div>
            </div>

            <button
              onClick={handleCopyEmail}
              className={`p-2 rounded-md text-xs font-semibold transition-all flex-shrink-0 flex items-center gap-1 border ${
                isLight 
                  ? 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700' 
                  : 'bg-white/[0.04] hover:bg-white/[0.08] text-amber-400 border-amber-400/20'
              }`}
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Disalin' : 'Salin'}</span>
            </button>
          </div>

        </div>

        {/* Action Button */}
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
