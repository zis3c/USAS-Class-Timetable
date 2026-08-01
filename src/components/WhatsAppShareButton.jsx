import React, { useState, useMemo } from 'react';
import { MessageCircle, Copy, Check, Send, Smartphone } from 'lucide-react';

function parseTimeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!match) return 0;
  let h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const ampm = match[3]?.toUpperCase();
  if (ampm === 'PM' && h < 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;
  return h * 60 + m;
}

export default function WhatsAppShareButton({ timetable = [], studentName = '', matricNo = '' }) {
  const [copied, setCopied] = useState(false);
  const [showPanel, setShowPanel] = useState(false);

  const dayOrder = ['ISNIN', 'SELASA', 'RABU', 'KHAMIS', 'JUMAAT', 'SABTU', 'AHAD'];

  const formattedText = useMemo(() => {
    if (!timetable || timetable.length === 0) return '';

    const dayGroups = {};
    timetable.forEach(item => {
      const day = item.day?.toUpperCase() || 'LAIN';
      if (!dayGroups[day]) dayGroups[day] = [];
      dayGroups[day].push(item);
    });

    // Sort each day's classes by start time
    Object.values(dayGroups).forEach(classes => {
      classes.sort((a, b) => parseTimeToMinutes(a.start_time) - parseTimeToMinutes(b.start_time));
    });

    let text = `📋 *JADUAL KULIAH SAYA*\n`;
    text += `👤 ${studentName || 'Pelajar USAS'}\n`;
    text += `🎓 No. Matrik: ${matricNo}\n`;
    text += `━━━━━━━━━━━━━━━━━━━━\n\n`;

    dayOrder.forEach(day => {
      if (!dayGroups[day]) return;
      const emoji = {
        'ISNIN': '🟢', 'SELASA': '🔵', 'RABU': '🟡', 'KHAMIS': '🟣', 'JUMAAT': '🔴', 'SABTU': '🟠', 'AHAD': '⚪'
      }[day] || '⬜';

      text += `${emoji} *${day}*\n`;
      dayGroups[day].forEach(c => {
        const time = c.start_time ? `${c.start_time}${c.end_time ? ' - ' + c.end_time : ''}` : 'TBA';
        const code = c.course_id || c.kod_kursus || '';
        const name = c.course_name || c.kursus || '';
        const loc = c.location || '';
        text += `  ⏰ ${time}\n`;
        text += `  📘 ${code}: ${name}\n`;
        if (loc) text += `  📍 ${loc}\n`;
        text += `\n`;
      });
    });

    text += `━━━━━━━━━━━━━━━━━━━━\n`;
    text += `📲 Dijana oleh Portal Jadual USAS`;

    return text;
  }, [timetable, studentName, matricNo]);

  // Compact one-liner format for quick sharing
  const compactText = useMemo(() => {
    if (!timetable || timetable.length === 0) return '';

    const dayGroups = {};
    timetable.forEach(item => {
      const day = item.day?.toUpperCase() || 'LAIN';
      if (!dayGroups[day]) dayGroups[day] = [];
      dayGroups[day].push(item);
    });

    Object.values(dayGroups).forEach(classes => {
      classes.sort((a, b) => parseTimeToMinutes(a.start_time) - parseTimeToMinutes(b.start_time));
    });

    let text = `Jadual Kuliah ${matricNo}: `;
    const parts = [];
    dayOrder.forEach(day => {
      if (!dayGroups[day]) return;
      const items = dayGroups[day].map(c => {
        const t = c.start_time || 'TBA';
        const code = c.course_id || '';
        const loc = c.location || '';
        return `${t} - ${code}${loc ? ' @ ' + loc : ''}`;
      }).join(' | ');
      parts.push(`(${day}): ${items}`);
    });
    text += parts.join(' • ');
    return text;
  }, [timetable, matricNo]);

  const handleCopy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
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

  if (!timetable || timetable.length === 0) return null;

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="w-full py-2 px-3 rounded-xl bg-[#070F22] hover:bg-[#12244c] border border-emerald-500/20 text-emerald-300 text-xs font-bold flex items-center justify-center gap-2 transition-all"
      >
        <MessageCircle className="w-4 h-4 text-emerald-400" />
        <span>Kongsi ke WhatsApp / Telegram</span>
      </button>

      {/* Expanded Share Panel */}
      {showPanel && (
        <div className="mt-2 glass-card rounded-2xl p-4 border border-emerald-500/20 bg-[#0F2148]/95 backdrop-blur-xl space-y-3 shadow-xl z-50 animate-in slide-in-from-top-1">
          
          {/* Preview */}
          <div className="bg-[#070F22] rounded-xl p-3 border border-slate-800 max-h-40 overflow-y-auto no-scrollbar">
            <pre className="text-[10px] text-slate-300 font-mono whitespace-pre-wrap leading-relaxed">
              {formattedText}
            </pre>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleWhatsApp}
              className="py-2.5 px-3 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/30 text-[#25D366] text-xs font-black flex items-center justify-center gap-2 transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              WhatsApp
            </button>
            <button
              onClick={handleTelegram}
              className="py-2.5 px-3 rounded-xl bg-[#0088cc]/15 hover:bg-[#0088cc]/25 border border-[#0088cc]/30 text-[#0088cc] text-xs font-black flex items-center justify-center gap-2 transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              Telegram
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* Copy Full Format */}
            <button
              onClick={() => handleCopy(formattedText)}
              className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                copied
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25'
                  : 'bg-[#070F22] hover:bg-[#12244c] text-amber-300 border-amber-500/20'
              }`}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Disalin!' : 'Salin Penuh'}</span>
            </button>

            {/* Copy Compact 1-liner */}
            <button
              onClick={() => handleCopy(compactText)}
              className="py-2 px-3 rounded-xl bg-[#070F22] hover:bg-[#12244c] border border-amber-500/20 text-amber-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Salin Ringkas</span>
            </button>
          </div>

          {/* Close */}
          <button
            onClick={() => setShowPanel(false)}
            className="w-full py-1.5 text-center text-[10px] text-slate-500 hover:text-slate-300 font-bold transition-colors"
          >
            Tutup Panel Kongsi
          </button>
        </div>
      )}
    </div>
  );
}
