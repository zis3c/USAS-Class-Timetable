import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { X, QrCode, Copy, Check } from 'lucide-react';

export default function QrShareModal({ isOpen, onClose, studentName = 'Pelajar USAS', matricNo = 'M12345' }) {
  const [copied, setCopied] = useState(false);
  const [qrLoaded, setQrLoaded] = useState(false);
  const { theme } = useTheme();
  
  const isLight = theme === 'light';

  const [shouldRender, setShouldRender] = useState(isOpen);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setQrLoaded(false);
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

  const shareUrl = `https://usas.edu.my/timetable?student=${encodeURIComponent(studentName)}&matric=${matricNo}`;
  
  const qrColor = isLight ? '0B1E43' : 'D4AF37';
  const qrBgcolor = isLight ? 'ffffff' : '0B1B3D';
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(shareUrl)}&color=${qrColor}&bgcolor=${qrBgcolor}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md transition-all duration-200 ${
      animate ? 'bg-slate-900/30 opacity-100' : 'bg-slate-900/0 opacity-0 pointer-events-none'
    }`}>
      
      <div className={`rounded-xl w-full max-w-sm border pt-3 px-5 pb-5 space-y-4 relative transition-all duration-200 transform ${
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
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <h3 className={`text-sm font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>Kongsi Jadual Waktu Kuliah</h3>
            <p className={`text-xs font-semibold ${isLight ? 'text-amber-700' : 'text-amber-400'}`}>{studentName} ({matricNo})</p>
          </div>
        </div>

        {/* QR Code Container */}
        <div className="text-center w-full">
          <div className={`p-3.5 rounded-xl border inline-block shadow-inner ${
            isLight ? 'bg-slate-50 border-slate-200/80' : 'bg-white/[0.02] border-white/10'
          }`}>
            <div className="relative w-44 h-44 mx-auto">
              {/* Skeleton loader — shown while image is loading */}
              {!qrLoaded && (
                <div className={`absolute inset-0 rounded-lg flex flex-col items-center justify-center gap-2 animate-pulse ${
                  isLight ? 'bg-slate-100' : 'bg-white/[0.04]'
                }`}>
                  {/* Pulsing grid pattern */}
                  <div className="grid grid-cols-5 gap-1 opacity-30">
                    {Array.from({ length: 25 }).map((_, i) => (
                      <div
                        key={i}
                        className={`w-4 h-4 rounded-[2px] ${
                          [0,1,2,3,4,5,9,10,14,15,19,20,21,22,23,24,7,17].includes(i)
                            ? (isLight ? 'bg-slate-400' : 'bg-amber-400/60')
                            : (isLight ? 'bg-slate-200' : 'bg-white/10')
                        }`}
                      />
                    ))}
                  </div>
                  <span className={`text-[10px] font-semibold ${isLight ? 'text-slate-400' : 'text-white/30'}`}>
                    Menjana QR...
                  </span>
                </div>
              )}

              {/* Actual QR image — hidden until loaded then fades in */}
              <img
                src={qrUrl}
                alt="Timetable QR Code"
                onLoad={() => setQrLoaded(true)}
                className={`w-44 h-44 object-contain rounded-lg shadow transition-opacity duration-300 ${
                  qrLoaded ? 'opacity-100' : 'opacity-0'
                }`}
              />
            </div>
            <p className={`text-[9px] font-medium mt-2 ${isLight ? 'text-slate-500' : 'text-white/30'}`}>Imbas untuk lihat jadual waktu kuliah kelas</p>
          </div>
        </div>

        {/* Copy Share Link */}
        <div className="flex items-center space-x-2">
          <input
            type="text"
            readOnly
            value={shareUrl}
            className={`flex-1 rounded-md px-3 py-2 text-xs font-mono truncate focus:outline-none transition-colors border ${
              isLight 
                ? 'bg-slate-50 border-slate-200 text-slate-700 focus:border-slate-300' 
                : 'bg-white/[0.03] border-white/10 text-white/70 focus:border-white/20'
            }`}
          />
          <button
            onClick={handleCopyLink}
            className={`px-3.5 py-2 rounded-md font-bold text-xs flex items-center gap-1 shadow-md transition-all flex-shrink-0 ${
              isLight 
                ? 'bg-[#0B1E43] hover:bg-[#152e63] text-white shadow-slate-900/10' 
                : 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-amber-400/10'
            }`}
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Disalin' : 'Salin'}</span>
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
