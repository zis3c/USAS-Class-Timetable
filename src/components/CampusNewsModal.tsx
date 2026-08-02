import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchCampusNewsAPI } from '../services/usasApi';
import type { CampusNewsItem } from '../types/usas';
import { X, Megaphone, Calendar, ChevronRight, RotateCw, Sparkles } from 'lucide-react';

type CampusNewsModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function CampusNewsModal({ isOpen, onClose }: CampusNewsModalProps) {
  const { session } = useAuth();
  const [newsList, setNewsList] = useState<CampusNewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetchCampusNewsAPI(session).then(res => {
        setNewsList(res);
        setLoading(false);
      });
    }
  }, [isOpen, session]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#070F22]/90 backdrop-blur-md">
      
      <div className="glass-card rounded-3xl w-full max-w-2xl border border-amber-500/20 bg-[#0F2148] shadow-2xl p-6 space-y-5 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-400 flex items-center justify-center">
            <Megaphone className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white">Buletin & Pengumuman Kampus USAS</h3>
            <p className="text-xs text-amber-400 font-bold">Hebahan Rasmi Hal Ehwal Pelajar & Akademik</p>
          </div>
        </div>

        {/* News Feed List */}
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400 space-y-2">
            <RotateCw className="w-6 h-6 animate-spin text-amber-400 mx-auto" />
            <div>Memuatkan pengumuman rasmi USAS...</div>
          </div>
        ) : (
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {newsList.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">Tiada pengumuman baharu.</div>
            ) : (
              newsList.map((item, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-[#070F22] border border-amber-500/15 space-y-2 shadow-md hover:border-amber-500/30 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-400/10 text-amber-300 border border-amber-400/20">
                      Pengumuman Rasmi
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-amber-400" /> {item.tarikh}
                    </span>
                  </div>
                  <h4 className="text-sm font-extrabold text-white leading-tight">{item.tajuk}</h4>
                  <p className="text-xs text-slate-300 leading-relaxed font-medium">{item.ringkasan}</p>
                </div>
              ))
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
