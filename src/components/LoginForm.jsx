import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, User, Sparkles, ShieldCheck, ArrowRight, AlertCircle, GraduationCap } from 'lucide-react';

export default function LoginForm() {
  const { login, loading, error, setError } = useAuth();
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [isFocused, setIsFocused] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId.trim() || !password.trim()) {
      setError('Sila masukkan No. Matrik dan Kata Laluan anda.');
      return;
    }
    await login(userId.trim(), password);
  };

  const handleDemoClick = async () => {
    await login('AI210042', 'demo123', true);
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center p-4 relative overflow-hidden bg-[#070F22]">
      
      {/* Background Ambient Orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-500/[0.06] rounded-full blur-[100px] pointer-events-none animate-fade-in" />
      <div className="absolute bottom-1/4 left-1/3 w-[400px] h-[400px] bg-blue-600/[0.04] rounded-full blur-[80px] pointer-events-none animate-fade-in" />
      <div className="absolute top-1/2 right-1/4 w-[300px] h-[300px] bg-amber-400/[0.03] rounded-full blur-[60px] pointer-events-none animate-fade-in" />
      
      {/* Subtle Grid Pattern */}
      <div className="absolute inset-0 bg-grid-pattern pointer-events-none" />

      <div className="w-full max-w-sm relative z-10 animate-fade-in-up">
        
        {/* Header Branding */}
        <div className="text-center mb-6 space-y-2">
          <div className="inline-flex items-center justify-center p-4 rounded-2xl bg-gradient-to-br from-[#0F2148]/90 to-[#0a1638]/90 border border-amber-500/15 shadow-2xl shadow-amber-500/10 mb-3 relative">
            <img 
              src="/usas-logo.png" 
              alt="USAS Emblem" 
              className="w-16 h-16 object-contain drop-shadow-[0_4px_16px_rgba(212,175,55,0.35)]" 
            />
            {/* Subtle ring glow */}
            <div className="absolute inset-0 rounded-2xl border border-amber-400/10 animate-pulse" style={{ animationDuration: '3s' }} />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight">
            UNIVERSITI SULTAN<br />AZLAN SHAH
          </h2>
          <div className="flex items-center justify-center gap-2">
            <div className="h-px w-8 bg-gradient-to-r from-transparent to-amber-400/40" />
            <p className="text-xs font-semibold text-amber-400/90 flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5" />
              Sistem Jadual Waktu Kuliah Pelajar
            </p>
            <div className="h-px w-8 bg-gradient-to-l from-transparent to-amber-400/40" />
          </div>
        </div>

        {/* Form Card */}
        <div className="glass-card rounded-2xl p-6 shadow-2xl animate-fade-in-up stagger-2">
          
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-2.5 animate-fade-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-400" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Matric Number */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                Nombor Matrik Pelajar
              </label>
              <div className="relative group">
                <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors ${
                  isFocused === 'userId' ? 'text-amber-400' : 'text-amber-400/50'
                }`}>
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  onFocus={() => setIsFocused('userId')}
                  onBlur={() => setIsFocused(null)}
                  placeholder="Contoh: AI210042 / I24107504"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#070F22] border border-white/[0.06] text-white placeholder-slate-600 focus:outline-none focus:border-amber-400/40 transition-all text-xs font-medium"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                Kata Laluan Portal
              </label>
              <div className="relative group">
                <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors ${
                  isFocused === 'password' ? 'text-amber-400' : 'text-amber-400/50'
                }`}>
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setIsFocused('password')}
                  onBlur={() => setIsFocused(null)}
                  placeholder="Kata laluan akaun anda"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#070F22] border border-white/[0.06] text-white placeholder-slate-600 focus:outline-none focus:border-amber-400/40 transition-all text-xs font-medium"
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-glow w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Mengesahkan...</span>
                </>
              ) : (
                <>
                  <span>Log Masuk Pelajar</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-5 flex items-center gap-3">
            <div className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent flex-1" />
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Atau</span>
            <div className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent flex-1" />
          </div>

          {/* Demo Mode */}
          <button
            onClick={handleDemoClick}
            disabled={loading}
            type="button"
            className="w-full py-2.5 px-4 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] text-amber-300 text-xs font-bold flex items-center justify-center gap-2 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Pratonton Pantas (Mod Demo)</span>
          </button>

          {/* Privacy */}
          <div className="mt-5 p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04] text-[10px] text-slate-500 flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500/70 flex-shrink-0" />
            <span>Sesi anda dilindungi dengan penyulitan memori selamat bagi akaun pelajar USAS.</span>
          </div>

        </div>

      </div>
    </div>
  );
}
