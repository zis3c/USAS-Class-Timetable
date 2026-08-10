import { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import QRCode from 'qrcode';
import { copyTextToClipboard, sanitizeTextForShare, openExternalUrl } from '@/shared/lib/security';
import { compressTimetable } from '@/features/timetable/lib/scheduleMatcher';
import { buildFullShareText } from '@/features/export/lib/shareText';
import { Camera, QrCode, ScanLine, X, Upload, FileText, Calendar, AlertTriangle, ArrowLeft, Copy, Check, MessageCircle, Users } from 'lucide-react';
import { useAuth } from '@/app/providers/AuthProvider';
import { useLanguage } from '@/app/providers/LanguageProvider';
import { useTheme } from '@/app/providers/ThemeProvider';
import { decompressTimetable, calculateOverlappingFreeTime, reverseDayMap, type FreeSlot } from '@/features/timetable/lib/scheduleMatcher';
import type { TimetableItem } from '@/shared/types/usas';

type CompareScheduleModalProps = {
  isOpen: boolean;
  onClose: () => void;
  initialSharedData?: string | null;
};

type ScanState = 'idle' | 'scanning' | 'processing' | 'success' | 'error';

export default function CompareScheduleModal({ isOpen, onClose, initialSharedData }: CompareScheduleModalProps) {
  const { timetableData, session } = useAuth();
  const { lang, t } = useLanguage();
  const { theme } = useTheme();

  const isLight = theme === 'light';
  const myTimetable = timetableData?.timetable || [];

  const [shouldRender, setShouldRender] = useState(isOpen);
  const [animate, setAnimate] = useState(false);
  const [activeTab, setActiveTab] = useState<'scan' | 'share' | 'whatsapp'>('scan');
  const [copied, setCopied] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [myQrUrl, setMyQrUrl] = useState('');
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [statusMessage, setStatusMessage] = useState('Open camera and scan a friend\'s Timetable QR code.');
  const [friendData, setFriendData] = useState<{ studentName: string; timetable: TimetableItem[] } | null>(null);
  const [freeSlots, setFreeSlots] = useState<FreeSlot[]>([]);

  const mountedRef = useRef(true);
  const activeRef = useRef(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const loopRef = useRef<number | null>(null);
  const copiedTimerRef = useRef<number | null>(null);

  // Generate QR
  useEffect(() => {
    if (activeTab === 'share' && isOpen) {
      stopCamera();
      const safeName = sanitizeTextForShare(timetableData?.studentName || 'Pelajar', 80);
      const data = compressTimetable(myTimetable, safeName);
      const url = `${window.location.origin}/?compare_schedule=${data}`;
      QRCode.toDataURL(url, {
        width: 250, margin: 2,
        color: { dark: isLight ? '#0f172a' : '#ffffff', light: isLight ? '#ffffff' : '#0a1428' }
      }).then(setMyQrUrl).catch(() => setMyQrUrl(''));
    } else if (activeTab === 'scan' && isOpen && scanState !== 'success') {
      startCamera();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, isOpen, isLight]);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      mountedRef.current = true;
      let raf1 = 0;
      let raf2 = 0;
      raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => setAnimate(true));
      });
      
      if (initialSharedData) {
        setActiveTab('scan');
        processSharedData(initialSharedData);
      } else {
        setActiveTab('share');
        setScanState('idle');
        setFriendData(null);
      }

      return () => {
        cancelAnimationFrame(raf1);
        cancelAnimationFrame(raf2);
        if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
      };
    } else {
      stopCamera();
      setAnimate(false);
      const timer = setTimeout(() => setShouldRender(false), 200);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialSharedData]);

  function processSharedData(compressedData: string) {
    setScanState('processing');
    setStatusMessage('Analyzing timetable data...');
    setTimeout(() => {
      if (!mountedRef.current) return;
      const data = decompressTimetable(compressedData);
      if (data && data.timetable.length > 0) {
        setFriendData(data);
        setFreeSlots(calculateOverlappingFreeTime(myTimetable, data.timetable));
        setScanState('success');
        stopCamera();
      } else {
        setScanState('error');
        setStatusMessage('Invalid or corrupted timetable QR code.');
      }
    }, 400);
  };

  async function startCamera() {
    if (scanState === 'success') return;
    try {
      setScanState('scanning');
      setStatusMessage('Camera ready. Point it at the QR code.');
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (!mountedRef.current) {
        stream.getTracks().forEach(t => t.stop());
        return;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        activeRef.current = true;
        scanLoop();
      }
    } catch (err) {
      setScanState('error');
      setStatusMessage('Camera access denied or unavailable.');
    }
  };

  function stopCamera() {
    activeRef.current = false;
    if (loopRef.current !== null) {
      clearTimeout(loopRef.current);
      loopRef.current = null;
    }
    const video = videoRef.current;
    if (video) {
      video.pause();
      const stream = video.srcObject as MediaStream;
      stream?.getTracks().forEach(t => t.stop());
      video.srcObject = null;
    }
  };

  function scanLoop() {
    if (!activeRef.current || !mountedRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
      const context = canvas.getContext('2d', { willReadFrequently: true });
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'dontInvert' });
        
        if (code?.data) {
          try {
            const url = new URL(code.data);
            const compareData = url.searchParams.get('compare_schedule');
            if (compareData) {
              processSharedData(compareData);
              return;
            }
          } catch {} // Not a valid URL, ignore
        }
      }
    }
    loopRef.current = window.setTimeout(scanLoop, 300);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    stopCamera();
    try {
      setScanState('processing');
      setStatusMessage('Analyzing image...');
      const img = new Image();
      const objUrl = URL.createObjectURL(file);
      await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject; img.src = objUrl; });
      const canvas = canvasRef.current;
      if (!canvas) return;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      if (!context) return;
      canvas.width = img.width;
      canvas.height = img.height;
      context.drawImage(img, 0, 0);
      URL.revokeObjectURL(objUrl);
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'dontInvert' });
      
      if (code?.data) {
        try {
          const url = new URL(code.data);
          const compareData = url.searchParams.get('compare_schedule');
          if (compareData) {
            processSharedData(compareData);
            return;
          }
        } catch {} // Not a valid URL
      }
      setScanState('error');
      setStatusMessage('No valid Timetable QR code found in image.');
    } catch (err) {
      setScanState('error');
      setStatusMessage('Failed to read image.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCopyLink = async () => {
    const safeName = sanitizeTextForShare(timetableData?.studentName || 'Pelajar', 80);
    const data = compressTimetable(myTimetable, safeName);
    await copyTextToClipboard(`${window.location.origin}/?compare_schedule=${data}`);
    if (!mountedRef.current) return;
    setCopied(true);
    if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
    copiedTimerRef.current = window.setTimeout(() => {
      if (mountedRef.current) setCopied(false);
    }, 2000);
  };

  const handleCopyText = async () => {
    const formattedText = buildFullShareText(myTimetable, timetableData?.studentName || '', session?.user_id || '');
    await copyTextToClipboard(formattedText);
    if (!mountedRef.current) return;
    setCopiedText(true);
    if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
    copiedTimerRef.current = window.setTimeout(() => {
      if (mountedRef.current) setCopiedText(false);
    }, 2000);
  };

  const handleWhatsApp = () => {
    const formattedText = buildFullShareText(myTimetable, timetableData?.studentName || '', session?.user_id || '');
    const encoded = encodeURIComponent(formattedText);
    openExternalUrl(`https://wa.me/?text=${encoded}`);
  };

  const handleTelegram = () => {
    const formattedText = buildFullShareText(myTimetable, timetableData?.studentName || '', session?.user_id || '');
    const encoded = encodeURIComponent(formattedText);
    openExternalUrl(`https://t.me/share/url?url=&text=${encoded}`);
  };

  if (!shouldRender) return null;

  return (
    <div className={`fixed inset-0 z-[60] flex items-center justify-center p-4 backdrop-blur-md transition-all duration-200 touch-none ${
      animate ? 'bg-slate-900/30 opacity-100' : 'bg-slate-900/0 opacity-0 pointer-events-none'
    }`}>
      <div className="absolute inset-0" onClick={onClose} />

      <div 
        className={`relative w-full max-w-2xl h-[85vh] sm:h-[34rem] max-h-[800px] rounded-2xl border shadow-2xl overflow-hidden flex flex-col transform transition-all duration-200 ${
          animate ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        } ${
          isLight 
            ? 'bg-white border-slate-200 text-slate-800' 
            : 'bg-[#0A1428]/95 border-white/10 text-white'
        }`}
      >
        {/* Header */}
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b shrink-0 ${
          isLight ? 'border-slate-200 bg-slate-50/50' : 'border-white/[0.06] bg-[#0A1428]/95'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border shadow-sm ${
              isLight ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
            }`}>
              {scanState === 'success' && activeTab === 'scan' ? (
                <button onClick={() => { setFriendData(null); startCamera(); }} className="p-1 rounded-md transition-colors hover:bg-black/5 dark:hover:bg-white/5">
                  <ArrowLeft className="w-5 h-5" />
                </button>
              ) : (
                <FileText className="w-5 h-5" />
              )}
            </div>
            <div className="text-left min-w-0 pr-4">
              <h3 className={`text-base font-bold truncate ${isLight ? 'text-slate-800' : 'text-white'}`}>
                {lang === 'ms' ? 'Banding / Kongsi Jadual' : 'Compare / Share Schedule'}
              </h3>
              <p className={`text-xs font-semibold truncate ${isLight ? 'text-amber-600' : 'text-amber-400/80'}`}>
                {lang === 'ms' ? 'Imbas QR kawan atau kongsi jadual anda' : 'Scan friend\'s QR or share your schedule'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className={`absolute top-4 right-4 sm:relative sm:top-0 sm:right-0 p-2 rounded-md transition-colors ${isLight ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-100' : 'text-white/30 hover:text-white hover:bg-white/[0.06]'}`}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {scanState !== 'success' && (
          <div className={`flex w-full p-2 border-b ${isLight ? 'bg-white border-slate-200' : 'bg-[#060E1F] border-white/10'}`}>
            <div className={`flex w-full p-1 rounded-lg ${isLight ? 'bg-slate-100' : 'bg-black/40'}`}>
              <button
                onClick={() => setActiveTab('scan')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  activeTab === 'scan'
                    ? isLight ? 'bg-white text-blue-600 shadow-sm' : 'bg-blue-500/20 text-blue-400'
                    : isLight ? 'text-slate-500 hover:text-slate-700' : 'text-white/40 hover:text-white/70'
                }`}
              >
                Scan Friend
              </button>
              <button
                onClick={() => setActiveTab('share')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  activeTab === 'share'
                    ? isLight ? 'bg-white text-blue-600 shadow-sm' : 'bg-blue-500/20 text-blue-400'
                    : isLight ? 'text-slate-500 hover:text-slate-700' : 'text-white/40 hover:text-white/70'
                }`}
              >
                My QR Code
              </button>
              <button
                onClick={() => setActiveTab('whatsapp')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  activeTab === 'whatsapp'
                    ? isLight ? 'bg-white text-blue-600 shadow-sm' : 'bg-blue-500/20 text-blue-400'
                    : isLight ? 'text-slate-500 hover:text-slate-700' : 'text-white/40 hover:text-white/70'
                }`}
              >
                Share Text
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-hidden p-4 sm:p-6 flex flex-col min-h-0">
          {activeTab === 'whatsapp' ? (
            <div className="flex flex-col space-y-4 py-2 w-full flex-1 min-h-0">
              <div data-lenis-prevent className={`flex-1 min-h-0 rounded-xl p-3 border overflow-y-auto text-left usas-scrollbar touch-pan-y overscroll-contain ${
                isLight ? 'bg-slate-50 border-slate-200 text-slate-700 font-medium' : 'bg-[#070F22] border-slate-800 text-slate-300'
              }`}>
                <pre className="text-[10px] font-mono whitespace-pre-wrap leading-relaxed">
                  {buildFullShareText(myTimetable, timetableData?.studentName || '', session?.user_id || '')}
                </pre>
              </div>
              <div className="grid grid-cols-3 gap-2 shrink-0">
                <button
                  onClick={handleWhatsApp}
                  className={`py-2.5 px-2 rounded-lg border text-xs font-semibold flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all ${
                    isLight ? 'bg-emerald-50 hover:bg-emerald-100/70 border-emerald-200 text-emerald-800' : 'bg-[#25D366]/15 hover:bg-[#25D366]/25 border-emerald-500/30 text-[#25D366]'
                  }`}
                >
                  <MessageCircle className="w-4 h-4 sm:w-3.5 sm:h-3.5" /> <span>WhatsApp</span>
                </button>
                <button
                  onClick={handleTelegram}
                  className={`py-2.5 px-2 rounded-lg border text-xs font-semibold flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all ${
                    isLight ? 'bg-blue-50 hover:bg-blue-100/70 border-blue-200 text-blue-800' : 'bg-[#0088cc]/15 hover:bg-[#0088cc]/25 border-blue-500/30 text-[#0088cc]'
                  }`}
                >
                  <MessageCircle className="w-4 h-4 sm:w-3.5 sm:h-3.5" /> <span>Telegram</span>
                </button>
                <button
                  onClick={handleCopyText}
                  className={`py-2.5 px-2 rounded-lg border text-xs font-semibold flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all ${
                    copiedText
                      ? isLight ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      : isLight ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-sm' : 'bg-white/[0.04] hover:bg-white/[0.08] text-white/80 hover:text-white border-white/10'
                  }`}
                >
                  {copiedText ? <Check className="w-4 h-4 sm:w-3.5 sm:h-3.5" /> : <Copy className="w-4 h-4 sm:w-3.5 sm:h-3.5" />}
                  <span>{copiedText ? 'Copied' : 'Copy Text'}</span>
                </button>
              </div>
            </div>
          ) : activeTab === 'share' ? (
            <div className="flex flex-col items-center justify-center space-y-6 py-4 flex-1">
              <div className="text-center w-full max-w-sm mx-auto">
                <div className={`p-3.5 rounded-xl border inline-block shadow-inner ${isLight ? 'bg-slate-50 border-slate-200/80' : 'bg-white/[0.02] border-white/10'}`}>
                  <div className="relative w-44 h-44 mx-auto">
                    {myQrUrl ? (
                      <img src={myQrUrl} alt="QR Code" className="w-full h-full object-contain rounded-lg" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className={`w-8 h-8 border-2 border-t-transparent rounded-full animate-spin ${isLight ? 'border-amber-500' : 'border-amber-400'}`} />
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-4">
                  <h3 className={`text-sm font-bold truncate ${isLight ? 'text-slate-800' : 'text-white'}`}>{timetableData?.studentName || 'Pelajar'}</h3>
                  <p className={`text-xs font-semibold truncate mt-1 ${isLight ? 'text-blue-600' : 'text-blue-400'}`}>Show this to a friend to compare schedules</p>
                </div>
              </div>
              <button
                onClick={handleCopyLink}
                className={`w-full max-w-sm flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${
                  copied
                    ? isLight ? 'bg-emerald-100 text-emerald-700' : 'bg-emerald-500/20 text-emerald-400'
                    : isLight ? 'bg-blue-50 hover:bg-blue-100 text-blue-700' : 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-300'
                }`}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Link Copied!' : 'Copy Link Instead'}
              </button>
            </div>
          ) : scanState !== 'success' ? (
            <div className="flex flex-col items-center justify-center space-y-6 py-2 flex-1">
              {/* Scanner UI */}
              <div className="relative w-full max-w-sm h-64 rounded-2xl overflow-hidden bg-black flex items-center justify-center shadow-inner">
                <canvas ref={canvasRef} className="hidden" />
                <video ref={videoRef} className="absolute inset-0 h-full w-full object-cover" playsInline />
                
                {scanState === 'scanning' && (
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute inset-[15%] border-2 border-blue-500/50 rounded-xl" />
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-blue-400 shadow-[0_0_8px_2px_rgba(59,130,246,0.5)] animate-bounce" />
                  </div>
                )}
                
                {scanState === 'processing' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}

                {(scanState === 'error' || scanState === 'idle') && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white/50 bg-[#0a1428]">
                    {scanState === 'error' ? <AlertTriangle className="w-10 h-10 mb-2 text-red-400" /> : <Camera className="w-10 h-10 mb-2" />}
                    <p className="text-sm font-medium">{scanState === 'error' ? 'Scan Failed' : 'Camera Ready'}</p>
                  </div>
                )}
              </div>

              <div className="text-center space-y-3 max-w-sm mx-auto">
                <p className={`text-sm font-medium ${scanState === 'error' ? 'text-red-500' : isLight ? 'text-slate-600' : 'text-white/60'}`}>{statusMessage}</p>
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button onClick={startCamera} className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-colors ${isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-white/10 hover:bg-white/20 text-white'}`}>
                    <ScanLine className="w-4 h-4 inline-block mr-1.5" /> Scan QR Code
                  </button>
                  <label className={`px-4 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${isLight ? 'bg-blue-50 hover:bg-blue-100 text-blue-700' : 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-300'}`}>
                    <Upload className="w-4 h-4 inline-block mr-1.5" /> Upload Image
                    <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                  </label>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Success Result View */}
              <div className={`p-4 rounded-xl flex items-center gap-4 ${isLight ? 'bg-emerald-50 text-emerald-900 border border-emerald-100' : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'}`}>
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                  <Users className="w-6 h-6 text-emerald-500" />
                </div>
                <div>
                  <div className="font-bold text-base">Timetables Merged Successfully</div>
                  <div className="text-sm opacity-80 mt-0.5">Comparing your schedule with <span className="font-bold text-emerald-600 dark:text-emerald-400">{friendData?.studentName}</span></div>
                </div>
              </div>

              {/* Free Time Grid */}
              <div className="space-y-4">
                <h3 className="font-bold flex items-center gap-2 text-lg">
                  <Calendar className="w-5 h-5 text-blue-500" /> Common Free Time
                </h3>
                
                <div className="space-y-3">
                  {reverseDayMap.filter(d => d !== 'SABTU' && d !== 'AHAD').map(dayStr => {
                    const daySlots = freeSlots.filter(s => s.dayStr === dayStr);
                    if (daySlots.length === 0) return null;
                    
                    const formatTime = (mins: number) => {
                      const h = Math.floor(mins / 60);
                      const m = mins % 60;
                      return `${h === 12 ? 12 : h % 12}:${m.toString().padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
                    };

                    return (
                      <div key={dayStr} className={`p-4 rounded-xl border ${isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#0f172a] border-white/10 shadow-lg'}`}>
                        <div className="text-sm font-bold mb-3 opacity-60 uppercase tracking-widest">{dayStr}</div>
                        <div className="flex flex-wrap gap-2">
                          {daySlots.map((slot, i) => {
                            const durationH = Math.round(((slot.endMins - slot.startMins) / 60) * 10) / 10;
                            return (
                              <div key={i} className={`px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 ${isLight ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-blue-500/15 text-blue-300 border border-blue-500/30'}`}>
                                <span>{formatTime(slot.startMins)} - {formatTime(slot.endMins)}</span>
                                <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${isLight ? 'bg-blue-200 text-blue-800' : 'bg-blue-500/30 text-blue-100'}`}>{durationH}h</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                  {freeSlots.length === 0 && (
                    <div className="text-center py-8 text-sm opacity-50 italic">
                      No overlapping free time found during standard hours (8am - 5pm).
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
