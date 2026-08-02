import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { submitFacilityComplaintAPI } from '../services/usasApi';
import { X, Wrench, CheckCircle2, Send, AlertTriangle } from 'lucide-react';

export default function FacilityHelpDeskModal({ isOpen, onClose }) {
  const { session } = useAuth();
  const [lokasi, setLokasi] = useState('Makmal Komputer FTMK (MK3)');
  const [kategori, setKategori] = useState('Penyaman Udara / Aircon');
  const [butiran, setButiran] = useState('');
  const [submittedTicket, setSubmittedTicket] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!butiran.trim()) return;
    setSubmitting(true);
    const res = await submitFacilityComplaintAPI(session, { lokasi, kategori, butiran });
    setSubmitting(false);
    if (res?.success) {
      setSubmittedTicket(res.ticketNo);
    }
  };

  const handleReset = () => {
    setSubmittedTicket(null);
    setButiran('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#070F22]/90 backdrop-blur-md">
      
      <div className="glass-card rounded-3xl w-full max-w-lg border border-amber-500/20 bg-[#0F2148] shadow-2xl p-6 space-y-5 relative">
        <button
          onClick={handleReset}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-400 flex items-center justify-center">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white">Borang Aduan Fasiliti Kampus</h3>
            <p className="text-xs text-amber-400 font-bold">Hantar Aduan Kerosakan Makmal, Dewan & Kediaman</p>
          </div>
        </div>

        {submittedTicket ? (
          <div className="p-6 rounded-2xl bg-[#070F22] border border-emerald-500/30 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h4 className="text-base font-extrabold text-white">Aduan Berjaya Dihantar!</h4>
            <p className="text-xs text-slate-300">
              No. Tiket Aduan Anda: <strong className="text-amber-400 font-black">{submittedTicket}</strong>
            </p>
            <p className="text-[11px] text-slate-400">Pihak pengurusan fasiliti USAS akan mengambil tindakan dalam tempoh 24 jam.</p>
            <button
              onClick={handleReset}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-black text-xs mt-2"
            >
              Selesai
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            
            {/* Lokasi */}
            <div className="space-y-1">
              <label className="font-bold text-slate-300">Lokasi Kerosakan / Fasiliti</label>
              <select
                value={lokasi}
                onChange={(e) => setLokasi(e.target.value)}
                className="w-full bg-[#070F22] border border-amber-500/20 text-white rounded-xl p-2.5 font-bold focus:outline-none"
              >
                <option value="Makmal Komputer FTMK (MK3)">Makmal Komputer FTMK (MK3)</option>
                <option value="Dewan Kuliah 1 (DK1)">Dewan Kuliah 1 (DK1)</option>
                <option value="Dewan Kuliah 2 (DK2)">Dewan Kuliah 2 (DK2)</option>
                <option value="Dewan Besar USAS">Dewan Besar USAS</option>
                <option value="Kolej Kediaman Pelajar">Kolej Kediaman Pelajar</option>
                <option value="Perpustakaan USAS">Perpustakaan USAS</option>
              </select>
            </div>

            {/* Kategori */}
            <div className="space-y-1">
              <label className="font-bold text-slate-300">Kategori Kerosakan</label>
              <select
                value={kategori}
                onChange={(e) => setKategori(e.target.value)}
                className="w-full bg-[#070F22] border border-amber-500/20 text-white rounded-xl p-2.5 font-bold focus:outline-none"
              >
                <option value="Penyaman Udara / Aircon">Penyaman Udara / Aircon</option>
                <option value="Projektor / Skrin Pembentangan">Projektor / Skrin Pembentangan</option>
                <option value="Rangkaian Wi-Fi / Internet">Rangkaian Wi-Fi / Internet</option>
                <option value="Kerusi / Meja Kuliah">Kerusi / Meja Kuliah</option>
                <option value="Komputer / Perkakas Makmal">Komputer / Perkakas Makmal</option>
                <option value="Lain-lain Kerosakan">Lain-lain Kerosakan</option>
              </select>
            </div>

            {/* Butiran */}
            <div className="space-y-1">
              <label className="font-bold text-slate-300">Butiran Kerosakan</label>
              <textarea
                rows={3}
                value={butiran}
                onChange={(e) => setButiran(e.target.value)}
                placeholder="Terangkan masalah atau kerosakan yang dialami..."
                className="w-full bg-[#070F22] border border-amber-500/20 text-white rounded-xl p-2.5 font-medium placeholder-slate-500 focus:outline-none"
                required
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{submitting ? 'Hantar Aduan...' : 'Hantar Aduan Ke Pengurusan USAS'}</span>
            </button>

          </form>
        )}

      </div>

    </div>
  );
}
