import React from 'react';
import { X, User, Mail, Building, Clock, Copy, Check } from 'lucide-react';

export default function LecturerModal({ lecturerName, isOpen, onClose }) {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen || !lecturerName) return null;

  // Format sample email from lecturer name e.g. "DR. SMITH" -> "smith@usas.edu.my"
  const emailName = lecturerName
    .replace(/^(DR\.|EN\.|PN\.|USTAZ|PM DR\.|PROF\.)\s*/i, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '.');

  const email = `${emailName || 'pensyarah'}@usas.edu.my`;

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#070F22]/90 backdrop-blur-md">
      
      <div className="glass-card rounded-3xl w-full max-w-md border border-amber-500/20 bg-[#0F2148] shadow-2xl p-6 space-y-5 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Profile Avatar & Header */}
        <div className="text-center space-y-2 pt-2">
          <div className="w-16 h-16 rounded-2xl bg-amber-400/10 border border-amber-400/25 flex items-center justify-center text-amber-400 mx-auto shadow-lg">
            <User className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-black text-white leading-tight">{lecturerName}</h3>
          <p className="text-xs font-bold text-amber-400">Pensyarah Universiti Sultan Azlan Shah</p>
        </div>

        {/* Details Grid */}
        <div className="space-y-3 text-xs bg-[#070F22] p-4 rounded-2xl border border-slate-800">
          
          <div className="flex items-center space-x-3">
            <Building className="w-4 h-4 text-sky-400 flex-shrink-0" />
            <div>
              <div className="text-[10px] text-slate-400 font-semibold">Fakulti / Jabatan</div>
              <div className="font-extrabold text-white">Fakulti Teknologi & Sains Maklumat (FTMK)</div>
            </div>
          </div>

          <div className="flex items-center space-x-3 pt-2 border-t border-slate-800">
            <Clock className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <div>
              <div className="text-[10px] text-slate-400 font-semibold">Waktu Konsultasi Pelajar</div>
              <div className="font-extrabold text-white">Selasa & Khamis (02:00 PM - 04:00 PM)</div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-800">
            <div className="flex items-center space-x-3 truncate">
              <Mail className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <div className="truncate">
                <div className="text-[10px] text-slate-400 font-semibold">E-mel Rasmi</div>
                <div className="font-extrabold text-slate-200 truncate">{email}</div>
              </div>
            </div>

            <button
              onClick={handleCopyEmail}
              className="p-2 rounded-xl bg-[#0F2148] hover:bg-[#162e63] text-amber-400 border border-amber-500/20 text-xs font-bold transition-all flex-shrink-0 flex items-center gap-1"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Disalin' : 'Salin'}</span>
            </button>
          </div>

        </div>

        {/* Action Button */}
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
