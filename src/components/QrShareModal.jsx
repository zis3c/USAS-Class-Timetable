import React from 'react';
import { X, QrCode, Copy, Check, Share2, Sparkles } from 'lucide-react';

export default function QrShareModal({ isOpen, onClose, studentName = 'Pelajar USAS', matricNo = 'M12345' }) {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  const shareUrl = `https://usas.edu.my/timetable?student=${encodeURIComponent(studentName)}&matric=${matricNo}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(shareUrl)}&color=D4AF37&bgcolor=0B1B3D`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#070F22]/90 backdrop-blur-md">
      
      <div className="glass-card rounded-3xl w-full max-w-sm border border-amber-500/20 bg-[#0F2148] shadow-2xl p-6 space-y-5 text-center relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="space-y-1 pt-2">
          <div className="w-12 h-12 rounded-2xl bg-amber-400/10 border border-amber-400/25 flex items-center justify-center text-amber-400 mx-auto shadow-lg">
            <QrCode className="w-6 h-6" />
          </div>
          <h3 className="text-base font-black text-white">Kongsi Jadual Waktu Kuliah</h3>
          <p className="text-xs text-amber-400 font-bold">{studentName} ({matricNo})</p>
        </div>

        {/* QR Code Container */}
        <div className="p-4 rounded-2xl bg-[#070F22] border border-amber-500/20 inline-block shadow-inner">
          <img
            src={qrUrl}
            alt="Timetable QR Code"
            className="w-48 h-48 object-contain rounded-xl mx-auto shadow"
          />
          <p className="text-[10px] text-slate-400 font-semibold mt-2">Imbas untuk lihat jadual waktu kuliah kelas</p>
        </div>

        {/* Copy Share Link */}
        <div className="flex items-center space-x-2">
          <input
            type="text"
            readOnly
            value={shareUrl}
            className="flex-1 bg-[#070F22] border border-amber-500/20 rounded-xl px-3 py-2 text-xs text-slate-300 font-mono truncate focus:outline-none"
          />
          <button
            onClick={handleCopyLink}
            className="px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-black text-xs flex items-center gap-1 shadow"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Disalin' : 'Salin'}</span>
          </button>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-[#070F22] border border-slate-800 text-slate-300 font-bold text-xs"
        >
          Tutup
        </button>

      </div>

    </div>
  );
}
