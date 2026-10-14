import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import QRCode from 'qrcode';
import { copyTextToClipboard, sanitizeTextForShare, openExternalUrl } from '@/shared/lib/security';
import { decodeQrFromFrame, decodeQrFromImage } from '@/shared/lib/qrDecode';
import { compressTimetable } from '@/features/timetable/lib/scheduleMatcher';
import { buildFullShareText } from '@/features/export/lib/shareText';
import { Camera, ScanLine, Square, X, Upload, FileText, Calendar, ArrowLeft, Copy, Check, Users, Plus, Maximize, Minimize, ZoomIn, ZoomOut, Link2 } from 'lucide-react';
import { useAuth } from '@/app/providers/AuthProvider';
import { formatTimeFromMinutes } from '@/shared/lib/timetableTime';
import { extractDayName } from '@/shared/lib/dayFormat';
import { useLanguage } from '@/app/providers/LanguageProvider';
import { useTheme } from '@/app/providers/ThemeProvider';
import { useModalA11y } from '@/shared/lib/useModalA11y';
import { decompressTimetable, calculateCommonFreeTime, parseTimeStr, reverseDayMap } from '@/features/timetable/lib/scheduleMatcher';
import { getCardColorByScheme } from '@/shared/lib/courseCardColors';
import { playQrScanChime, prepareQrScanAudio } from '@/shared/lib/audioNotifier';
import type { TimetableItem } from '@/shared/types/usas';

type Participant = { id: string; name: string; timetable: TimetableItem[] };
type MergedClass = { startMins: number; endMins: number; code: string; owner: string };
const WEEK_ORDER = ['ISNIN', 'SELASA', 'RABU', 'KHAMIS', 'JUMAAT', 'SABTU', 'AHAD'];
// Friend colours; amber (me) and emerald (common free time) are reserved.
const FRIEND_SCHEMES = ['blue', 'purple', 'rose', 'teal', 'indigo', 'cyan', 'fuchsia', 'lime'];

// Compact clock label; drops trailing ":00" and the space before AM/PM so ranges stay short on mobile.
const formatCompactTime = (minutes: number, timeFormat: '12h' | '24h') =>
  formatTimeFromMinutes(minutes, timeFormat)
    .replace(/:00(?=\s|$)/, '')
    .replace(/\s+([AP]M)$/, '$1');

// 12h reads best as "8AM - 10AM"; 24h stays tight as "8–10".
const formatCompactRange = (startMins: number, endMins: number, timeFormat: '12h' | '24h') =>
  `${formatCompactTime(startMins, timeFormat)}${timeFormat === '12h' ? ' - ' : '–'}${formatCompactTime(endMins, timeFormat)}`;

// Extracts the shared payload from a QR string; accepts the old ?compare_schedule= URL and the raw form.
function extractCompareData(data: string): string | null {
  const trimmed = String(data ?? '').trim();
  if (!trimmed) return null;
  try {
    const param = new URL(trimmed).searchParams.get('compare_schedule');
    return param || null;
  } catch {
    // Not a URL: treat as raw payload.
    return trimmed;
  }
}

type CompareScheduleModalProps = {
  isOpen: boolean;
  onClose: () => void;
  initialSharedData?: string | null;
};

type ScanState = 'idle' | 'scanning' | 'processing' | 'success' | 'error';

export default function CompareScheduleModal({ isOpen, onClose, initialSharedData }: CompareScheduleModalProps) {
  const modalRef = useModalA11y(isOpen, onClose);
  const { timetableData, session, timeFormat } = useAuth();
  const { t } = useLanguage();
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
  const [statusMessage, setStatusMessage] = useState(t('compareScanIdle'));
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [linkInput, setLinkInput] = useState('');
  const [linkError, setLinkError] = useState<'' | 'invalid' | 'self' | 'duplicate'>('');
  const [scanHint, setScanHint] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [maxZoom, setMaxZoom] = useState(4);
  const [supportsNativeZoom, setSupportsNativeZoom] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const mountedRef = useRef(true);
  const activeRef = useRef(false);
  const cameraStartIdRef = useRef(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const loopRef = useRef<number | null>(null);
  const processTimerRef = useRef<number | null>(null);
  const linkErrorTimerRef = useRef<number | null>(null);
  const copiedTimerRef = useRef<number | null>(null);
  const scanStateRef = useRef<ScanState>('idle');
  const prevTabRef = useRef(activeTab);
  const scanAttemptsRef = useRef(0);
  const streamRef = useRef<MediaStream | null>(null);
  const zoomRef = useRef(1);
  const nativeZoomRef = useRef<{ min: number; max: number } | null>(null);
  const [scanNonce, setScanNonce] = useState(0);
  const [scanHintKey, setScanHintKey] = useState('compareScanReady');

  const hasTimetable = myTimetable.length > 0;

  // Free slots shared by the user and every added friend.
  const freeSlots = useMemo(
    () => calculateCommonFreeTime([timetableData?.timetable ?? [], ...participants.map((p) => p.timetable)]),
    [timetableData, participants],
  );

  const mergedByDay = useMemo(() => {
    const groups = new Map<string, MergedClass[]>();
    const add = (items: TimetableItem[], owner: string) => {
      items.forEach((item) => {
        const dayKey = extractDayName(item.day);
        if (!dayKey) return;
        const times = parseTimeStr(`${item.start_time || ''} - ${item.end_time || ''}`);
        if (!times) return;
        const [startMins, endMins] = times;
        if (endMins <= startMins) return;
        const code = item.course_id || item.kod_kursus || 'Class';
        const group = groups.get(dayKey) ?? [];
        group.push({ startMins, endMins, code, owner });
        groups.set(dayKey, group);
      });
    };
    add(timetableData?.timetable ?? [], 'me');
    participants.forEach((p) => add(p.timetable, p.id));
    groups.forEach((group) => group.sort((a, b) => a.startMins - b.startMins));
    return groups;
  }, [timetableData, participants]);

  const ownerScheme = (owner: string): string => {
    if (owner === 'me') return 'amber';
    const index = participants.findIndex((p) => p.id === owner);
    return FRIEND_SCHEMES[(index < 0 ? 0 : index) % FRIEND_SCHEMES.length];
  };
  const ownerName = (owner: string): string => {
    if (owner === 'me') return t('compareYou');
    const name = participants.find((p) => p.id === owner)?.name?.trim();
    return name ? name.split(/\s+/)[0] : t('compareFriend');
  };

  useEffect(() => {
    scanStateRef.current = scanState;
  }, [scanState]);

  const isScanSuccess = (): boolean => scanStateRef.current === 'success';

  // Reset scan state on close or Scan-tab exit so a fresh scan can always start.
  useEffect(() => {
    if (!isOpen) {
      prevTabRef.current = activeTab;
      return;
    }
    if (prevTabRef.current !== activeTab) {
      stopCamera();
      setIsFullscreen(false);
      prevTabRef.current = activeTab;
      setScanState('idle');
      scanStateRef.current = 'idle';
      setStatusMessage(t(scanHintKey));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, isOpen]);

  // Restart the camera whenever add/remove-friend requests a fresh scan, even
  // if the scan state was already 'idle' (so pressing Add Friend always reacts).
  useEffect(() => {
    if (scanNonce === 0) return;
    if (!isOpen || activeTab !== 'scan') return;
    void startCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanNonce]);

  useEffect(() => {
    if (!isOpen) return;
    if (activeTab === 'share') {
      stopCamera();
      if (!hasTimetable) {
        setMyQrUrl('');
        return;
      }
      const safeName = sanitizeTextForShare(timetableData?.studentName || 'Pelajar', 80);
      const data = compressTimetable(myTimetable, safeName, session?.user_id);
      // Raw payload (no URL) with low error correction keeps the QR sparse and easier to scan; the scanner accepts both forms.
      QRCode.toDataURL(data, {
        width: 512, margin: 4, errorCorrectionLevel: 'L',
        color: { dark: isLight ? '#0f172a' : '#ffffff', light: isLight ? '#ffffff' : '#0a1428' }
      }).then(setMyQrUrl).catch(() => setMyQrUrl(''));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, isOpen, isLight, hasTimetable]);

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
      }

      return () => {
        cancelAnimationFrame(raf1);
        cancelAnimationFrame(raf2);
        if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
        if (linkErrorTimerRef.current !== null) clearTimeout(linkErrorTimerRef.current);
        mountedRef.current = false;
        stopCamera();
      };
    } else {
      stopCamera();
      setIsFullscreen(false);
      setAnimate(false);
      const timer = setTimeout(() => setShouldRender(false), 200);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialSharedData]);

  // Fullscreen portals remount the <video> and drop its stream; reattach on toggle.
  useEffect(() => {
    const video = videoRef.current;
    const stream = streamRef.current;
    if (video && stream && video.srcObject !== stream) {
      video.srcObject = stream;
      void video.play().catch(() => {});
    }
  }, [isFullscreen]);

  function addParticipant(data: { studentName: string; studentId: string; timetable: TimetableItem[] }): boolean {
    if (data.studentId && session?.user_id && data.studentId === session.user_id) return false;
    const id = data.studentId || `friend-${Math.random().toString(36).slice(2, 8)}`;
    const entry: Participant = { id, name: (data.studentName || '').trim() || t('compareFriend'), timetable: data.timetable };
    setParticipants((prev) => (prev.some((p) => p.id === id) ? prev.map((p) => (p.id === id ? entry : p)) : [...prev, entry]));
    return true;
  }

  function hasParticipant(data: { studentName: string; studentId: string; timetable: TimetableItem[] }): boolean {
    const studentId = data.studentId?.trim();
    return participants.some((participant) => studentId
      ? participant.id === studentId
      : Boolean(data.studentName?.trim()) && participant.name === data.studentName.trim()
        && JSON.stringify(participant.timetable) === JSON.stringify(data.timetable));
  }

  function processSharedData(compressedData: string) {
    if (processTimerRef.current !== null) window.clearTimeout(processTimerRef.current);
    setScanState('processing');
    setStatusMessage(t('compareScanAnalyzingData'));
    processTimerRef.current = window.setTimeout(() => {
      processTimerRef.current = null;
      if (!mountedRef.current || !isOpen) return;
      const data = decompressTimetable(compressedData);
      if (!data || data.timetable.length === 0) {
        setIsFullscreen(false);
        stopCamera();
        setScanState('error');
        setStatusMessage(t('compareScanInvalidQr'));
        return;
      }
      if (data.studentId && session?.user_id && data.studentId === session.user_id) {
        setIsFullscreen(false);
        setScanState('error');
        setStatusMessage(t('compareScanSelf'));
        stopCamera();
        return;
      }
      if (hasParticipant(data)) {
        setIsFullscreen(false);
        setScanState('error');
        setStatusMessage(t('compareAlreadyAdded'));
        stopCamera();
        return;
      }
      addParticipant(data);
      setIsFullscreen(false);
      setScanState('success');
      scanStateRef.current = 'success';
      stopCamera();
    }, 300);
  }

  function addMoreFriends() {
    stopCamera();
    const hintKey = participants.length > 0 ? 'compareScanAddMore' : 'compareScanReady';
    setScanHintKey(hintKey);
    setStatusMessage(t(hintKey));
    setScanState('idle');
    scanStateRef.current = 'idle';
    setScanNonce((n) => n + 1);
  }

  function stopScanning() {
    stopCamera();
    setScanState('idle');
    scanStateRef.current = 'idle';
    setStatusMessage(t(scanHintKey));
  }

  function showLinkError(error: 'invalid' | 'self' | 'duplicate') {
    if (linkErrorTimerRef.current !== null) clearTimeout(linkErrorTimerRef.current);
    setLinkError(error);
    linkErrorTimerRef.current = window.setTimeout(() => {
      setLinkError('');
      linkErrorTimerRef.current = null;
    }, 3000);
  }

  function removeParticipant(id: string) {
    const next = participants.filter((p) => p.id !== id);
    setParticipants(next);
    if (next.length > 0) return;
    // Back to zero friends: switch the hint back to the first-friend instruction.
    setScanHintKey('compareScanReady');
    setStatusMessage(t('compareScanReady'));
    // Removing the last friend from the results view returns to a live scanner.
    if (scanStateRef.current === 'success') {
      setScanState('idle');
      scanStateRef.current = 'idle';
      setScanNonce((n) => n + 1);
    }
  }

  function addFromLink() {
    const raw = linkInput.trim();
    if (!raw) return;
    const payload = extractCompareData(raw);
    const data = payload ? decompressTimetable(payload) : null;
    if (!data || data.timetable.length === 0) {
      showLinkError('invalid');
      return;
    }
    // Same matric means the link is the user's own schedule.
    if (data.studentId && session?.user_id && data.studentId === session.user_id) {
      showLinkError('self');
      return;
    }
    if (hasParticipant(data)) {
      showLinkError('duplicate');
      return;
    }
    if (!addParticipant(data)) {
      showLinkError('invalid');
      return;
    }
    if (linkErrorTimerRef.current !== null) clearTimeout(linkErrorTimerRef.current);
    linkErrorTimerRef.current = null;
    setLinkInput('');
    setLinkError('');
    stopCamera();
    setScanState('success');
    scanStateRef.current = 'success';
  }

  async function startCamera() {
    if (isScanSuccess()) return;
    // Already scanning; avoid a second stream that leaks the previous one.
    if (activeRef.current) return;
    if (!navigator.mediaDevices?.getUserMedia) {
      setScanState('error');
      setStatusMessage(t('compareScanDenied'));
      return;
    }
    prepareQrScanAudio();
    activeRef.current = true;
    const cameraStartId = ++cameraStartIdRef.current;
    scanAttemptsRef.current = 0;
    setScanHint(false);
    try {
      setScanState('scanning');
      setStatusMessage(t(scanHintKey));
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920, max: 1920 }, height: { ideal: 1080, max: 1080 } },
        audio: false,
      });
      // Abort if unmounted, cancelled (e.g. tab switched while the permission prompt was open), or already captured.
      const video = videoRef.current;
      if (cameraStartId !== cameraStartIdRef.current || !mountedRef.current || !video || !activeRef.current || isScanSuccess()) {
        // Never leave activeRef true; later startCamera() calls would bail and the scanner looks dead.
        if (cameraStartId === cameraStartIdRef.current) activeRef.current = false;
        stream.getTracks().forEach(t => t.stop());
        return;
      }
      streamRef.current = stream;
      setZoom(1);
      zoomRef.current = 1;
      const track = stream.getVideoTracks()[0];
      const caps = track?.getCapabilities?.() as (MediaTrackCapabilities & { zoom?: { min: number; max: number } }) | undefined;
      if (caps?.zoom && typeof caps.zoom.max === 'number' && caps.zoom.max > caps.zoom.min) {
        type ZoomConstraint = MediaTrackConstraintSet & { zoom: number };
        try {
          await track.applyConstraints({ advanced: [{ zoom: caps.zoom.min } as ZoomConstraint] });
          nativeZoomRef.current = caps.zoom;
          setSupportsNativeZoom(true);
          setMaxZoom(Math.max(3, Math.round(caps.zoom.max)));
        } catch {
          nativeZoomRef.current = null;
          setSupportsNativeZoom(false);
          setMaxZoom(4);
        }
      } else {
        nativeZoomRef.current = null;
        setSupportsNativeZoom(false);
        setMaxZoom(4);
      }
      if (cameraStartId !== cameraStartIdRef.current || !activeRef.current || !mountedRef.current) {
        stream.getTracks().forEach(t => t.stop());
        return;
      }
      video.srcObject = stream;
      video.setAttribute('playsinline', 'true');
      video.muted = true;
      await video.play();
      scanLoop();
    } catch (err) {
      if (cameraStartId !== cameraStartIdRef.current) return;
      stopCamera();
      setScanState('error');
      setStatusMessage(t('compareScanDenied'));
    }
  }

  function stopCamera() {
    cameraStartIdRef.current += 1;
    if (processTimerRef.current !== null) {
      clearTimeout(processTimerRef.current);
      processTimerRef.current = null;
    }
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
    const tracked = streamRef.current;
    if (tracked) {
      tracked.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }

  async function scanLoop() {
    if (!activeRef.current || !mountedRef.current || isScanSuccess()) return;
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video && canvas && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && video.videoWidth > 0) {
        scanAttemptsRef.current += 1;
        const zoom = nativeZoomRef.current ? 1 : zoomRef.current;
        const frameData = await decodeQrFromFrame(video, canvas, scanAttemptsRef.current % 5 === 0, zoom);
        if (!activeRef.current || !mountedRef.current) return;
        if (frameData) {
          const compareData = extractCompareData(frameData);
          if (compareData) {
            playQrScanChime();
            processSharedData(compareData);
            return;
          }
          // Non-timetable QR read; surface it so "can't read" is distinct from "wrong QR".
          setStatusMessage(t('compareScanNotTimetable'));
        }
      }
    } catch {
      // Skip bad frame; the loop must never die.
    }
    if (scanAttemptsRef.current === 24) setScanHint(true);
    loopRef.current = window.setTimeout(scanLoop, 180);
  };

  function applyZoom(value: number) {
    const clamped = Math.min(maxZoom, Math.max(1, value));
    setZoom(clamped);
    zoomRef.current = clamped;
    const native = nativeZoomRef.current;
    const track = streamRef.current?.getVideoTracks()[0];
    if (native && track) {
      const ratio = maxZoom > 1 ? (clamped - 1) / (maxZoom - 1) : 0;
      const nativeValue = native.min + (native.max - native.min) * ratio;
      type ZoomConstraint = MediaTrackConstraintSet & { zoom: number };
      track.applyConstraints({ advanced: [{ zoom: nativeValue }] as ZoomConstraint[] }).catch(() => {
        nativeZoomRef.current = null;
        setSupportsNativeZoom(false);
        setMaxZoom(4);
        const fallbackZoom = Math.min(4, clamped);
        zoomRef.current = fallbackZoom;
        setZoom(fallbackZoom);
      });
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    stopCamera();
    try {
      setScanState('processing');
      setStatusMessage(t('compareScanAnalyzingImg'));
      const img = new Image();
      const objUrl = URL.createObjectURL(file);
      let codeData: string | null;
      try {
        await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject; img.src = objUrl; });
        await img.decode();
        codeData = await decodeQrFromImage(img);
      } finally {
        URL.revokeObjectURL(objUrl);
      }
      const compareData = codeData ? extractCompareData(codeData) : null;
      if (compareData) {
        processSharedData(compareData);
        return;
      }
      setScanState('error');
      setStatusMessage(codeData ? t('compareScanNotTimetable') : t('compareScanNoQr'));
    } catch (err) {
      setScanState('error');
      setStatusMessage(t('compareScanReadFail'));
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCopyLink = async () => {
    const safeName = sanitizeTextForShare(timetableData?.studentName || 'Pelajar', 80);
    const data = compressTimetable(myTimetable, safeName, session?.user_id);
    await copyTextToClipboard(`${window.location.origin}/?compare_schedule=${data}`);
    if (!mountedRef.current) return;
    setCopied(true);
    if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
    copiedTimerRef.current = window.setTimeout(() => {
      if (mountedRef.current) setCopied(false);
    }, 2000);
  };

  const handleCopyText = async () => {
    const formattedText = buildFullShareText(myTimetable, timetableData?.studentName || '', session?.user_id || '', timeFormat);
    await copyTextToClipboard(formattedText);
    if (!mountedRef.current) return;
    setCopiedText(true);
    if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
    copiedTimerRef.current = window.setTimeout(() => {
      if (mountedRef.current) setCopiedText(false);
    }, 2000);
  };

  const handleWhatsApp = () => {
    const formattedText = buildFullShareText(myTimetable, timetableData?.studentName || '', session?.user_id || '', timeFormat);
    const encoded = encodeURIComponent(formattedText);
    openExternalUrl(`https://wa.me/?text=${encoded}`);
  };

  const handleTelegram = () => {
    const formattedText = buildFullShareText(myTimetable, timetableData?.studentName || '', session?.user_id || '', timeFormat);
    const encoded = encodeURIComponent(formattedText);
    openExternalUrl(`https://t.me/share/url?url=&text=${encoded}`);
  };

  if (!shouldRender) return null;

  // Short tabs hug content to avoid an empty gap; longer views keep a fixed scrollable height.
  const isCompactTab = activeTab === 'share' || (activeTab === 'scan' && scanState !== 'success');
  const modalHeight = isCompactTab ? 'h-auto max-h-[min(34rem,88vh)]' : 'h-[85vh] sm:h-[34rem] max-h-[800px]';

  const participantsBar = participants.length > 0 ? (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold ${isLight ? 'border-amber-300 bg-amber-100 text-amber-800' : 'border-amber-500/40 bg-amber-500/15 text-amber-300'}`}>
        {t('compareYou')}
      </span>
      {participants.map((p) => {
        const chipColor = getCardColorByScheme(ownerScheme(p.id), isLight);
        return (
          <span key={p.id} className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold ${chipColor.bg} ${chipColor.border} ${chipColor.text}`}>
            <span className="max-w-[96px] truncate">{p.name}</span>
            <button type="button" onClick={() => removeParticipant(p.id)} className="opacity-60 transition-opacity hover:opacity-100" aria-label={p.name}>
              <X className="h-3 w-3" />
            </button>
          </span>
        );
      })}
      <button type="button" onClick={addMoreFriends} className={`inline-flex items-center gap-1 rounded-full border border-dashed px-2.5 py-1 text-[10px] font-bold transition-colors ${isLight ? 'border-slate-300 text-slate-500 hover:bg-slate-50' : 'border-white/20 text-white/60 hover:bg-white/[0.06]'}`}>
        <Plus className="h-3 w-3" /> {t('compareAddFriend')}
      </button>
    </div>
  ) : null;

  // backdrop-blur/transform makes the modal the containing block for `fixed` children, clipping the fullscreen scanner; portal to <body> escapes it.
  const scannerViewport = (
    <div className={isFullscreen
      ? 'fixed inset-0 z-[100] flex items-center justify-center bg-black'
      : `relative w-full max-w-sm shrink-0 overflow-hidden rounded-2xl border ${isLight ? 'border-slate-200 bg-slate-50' : 'border-white/10 bg-black/40'} ${scanState === 'error' ? 'hidden' : ''}`
    }>
      <div className={`relative flex items-center justify-center overflow-hidden bg-black ${isFullscreen ? 'h-full w-full' : 'h-48 w-full sm:h-56'}`}>
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-150 will-change-transform"
          style={supportsNativeZoom ? undefined : { transform: `scale(${zoom})` }}
          playsInline
          muted
        />
        <div className="pointer-events-none absolute inset-0 bg-black/10" />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-4">
          <div className={`rounded-xl border-2 border-dashed border-white/30 ${isFullscreen ? 'h-56 w-56 sm:h-64 sm:w-64' : 'h-32 w-32 sm:h-40 sm:w-40'}`} />
        </div>

        <button
          type="button"
          onClick={() => setIsFullscreen((v) => !v)}
          className="absolute right-2 top-2 z-20 rounded-lg bg-black/50 p-2 text-white/80 backdrop-blur-sm transition-colors hover:bg-black/70 hover:text-white"
          aria-label={isFullscreen ? t('compareExitFullscreen') : t('compareFullscreen')}
        >
          {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
        </button>

        {scanState === 'scanning' && (
          <button
            type="button"
            onClick={stopScanning}
            aria-label={t('compareStopCamera')}
            title={t('compareStopCamera')}
            className="absolute left-2 top-2 z-20 flex h-8 w-8 items-center justify-center rounded-lg bg-rose-600/60 text-white backdrop-blur-sm transition-colors hover:bg-rose-600/80"
          >
            <Square className="h-3 w-3 fill-current" />
          </button>
        )}

        {scanState === 'scanning' && (
          <div className={`absolute left-0 right-0 flex items-center gap-2 px-3 ${isFullscreen ? 'bottom-5' : 'bottom-2'}`}>
            <ZoomOut className="h-4 w-4 flex-shrink-0 text-white/70" />
            <input
              type="range"
              min={1}
              max={maxZoom}
              step={0.1}
              value={zoom}
              onChange={(e) => applyZoom(parseFloat(e.target.value))}
              className="h-1 flex-1 cursor-pointer accent-amber-400"
              aria-label={t('compareZoom')}
            />
            <ZoomIn className="h-4 w-4 flex-shrink-0 text-white/70" />
            <span className="w-8 flex-shrink-0 text-right font-mono text-[10px] text-white/70">{zoom.toFixed(1)}x</span>
          </div>
        )}

        {scanState === 'processing' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          </div>
        )}

        {scanState === 'idle' && (
          <button type="button" onClick={startCamera} className={`absolute inset-0 z-10 flex flex-col items-center justify-center gap-1 px-6 ${isLight ? 'bg-slate-100 text-slate-500' : 'bg-[#0a1428] text-white/60'}`}>
            <Camera className="mb-1 h-9 w-9" />
            <p className={`text-sm font-semibold ${isLight ? 'text-slate-800' : 'text-white'}`}>{t(scanHintKey)}</p>
            <span className={`mt-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold ${isLight ? 'bg-white text-slate-700' : 'bg-white/10 text-white'}`}>{t('compareScanBtn')}</span>
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div ref={modalRef} role="dialog" aria-modal="true" aria-label="Banding Jadual" className={`fixed inset-0 z-[60] flex items-center justify-center p-2.5 sm:p-4 backdrop-blur-md transition-all duration-200 touch-none ${
      animate ? 'bg-slate-900/30 opacity-100' : 'bg-slate-900/0 opacity-0 pointer-events-none'
    }`}>
      <div className="absolute inset-0" onClick={onClose} />

      <div 
        className={`${isFullscreen
          ? 'flex flex-col w-full rounded-2xl border overflow-hidden min-h-0'
          : `relative w-full max-w-2xl ${modalHeight} rounded-2xl border shadow-2xl overflow-hidden flex flex-col transition-all duration-200 ${animate ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`
        } ${
          isLight 
            ? 'bg-white border-slate-200 text-slate-800' 
            : 'bg-[#0A1428]/95 border-white/10 text-white'
        }`}
      >
        <div className={`p-4 sm:p-5 border-b flex justify-between items-center gap-3 flex-shrink-0 ${isLight ? 'bg-slate-50/50 border-slate-200' : 'bg-[#0A1428]/95 border-white/[0.06]'}`}>
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border shadow-sm ${
              isLight ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
            }`}>
              {scanState === 'success' && activeTab === 'scan' ? (
                <button onClick={addMoreFriends} className="p-1 rounded-md transition-colors hover:bg-black/5 dark:hover:bg-white/5" aria-label={t('compareAddFriend')}>
                  <ArrowLeft className="w-5 h-5" />
                </button>
              ) : (
                <FileText className="w-5 h-5" />
              )}
            </div>
            <div className="text-left min-w-0">
              <h3 className={`text-sm sm:text-base font-bold leading-tight truncate ${isLight ? 'text-slate-800' : 'text-white'}`}>
                {t('compareTitle')}
              </h3>
              <p className={`text-[11px] sm:text-xs font-semibold leading-tight truncate ${isLight ? 'text-slate-500' : 'text-white/40'}`}>
                {t('compareDesc')}
              </p>
            </div>
          </div>
          <button onClick={onClose} className={`flex-shrink-0 p-1.5 rounded-md transition-colors ${isLight ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-100' : 'text-white/30 hover:text-white hover:bg-white/[0.06]'}`}>
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
                {t('compareTabScan')}
              </button>
              <button
                onClick={() => setActiveTab('share')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  activeTab === 'share'
                    ? isLight ? 'bg-white text-blue-600 shadow-sm' : 'bg-blue-500/20 text-blue-400'
                    : isLight ? 'text-slate-500 hover:text-slate-700' : 'text-white/40 hover:text-white/70'
                }`}
              >
                {t('compareTabShare')}
              </button>
              <button
                onClick={() => setActiveTab('whatsapp')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  activeTab === 'whatsapp'
                    ? isLight ? 'bg-white text-blue-600 shadow-sm' : 'bg-blue-500/20 text-blue-400'
                    : isLight ? 'text-slate-500 hover:text-slate-700' : 'text-white/40 hover:text-white/70'
                }`}
              >
                {t('compareTabText')}
              </button>
            </div>
          </div>
        )}

        <div className={`overflow-hidden p-4 sm:p-6 flex flex-col ${isCompactTab ? '' : 'flex-1 min-h-0'}`}>
          {activeTab === 'whatsapp' ? (
            <div className="flex flex-col space-y-4 py-2 w-full flex-1 min-h-0">
              <div data-lenis-prevent className={`flex-1 min-h-0 rounded-xl p-3 border overflow-y-auto text-left usas-scrollbar touch-pan-y overscroll-contain ${
                isLight ? 'bg-slate-50 border-slate-200 text-slate-700 font-medium' : 'bg-[#070F22] border-slate-800 text-slate-300'
              }`}>
                <pre className="text-[10px] font-mono whitespace-pre-wrap leading-relaxed">
                  {buildFullShareText(myTimetable, timetableData?.studentName || '', session?.user_id || '', timeFormat)}
                </pre>
              </div>
              <div className="flex justify-end gap-2 shrink-0">
                <button
                  onClick={handleWhatsApp}
                  className={`p-2 rounded-lg border flex items-center justify-center transition-all ${
                    isLight ? 'bg-emerald-50 hover:bg-emerald-100/70 border-emerald-200 text-emerald-800' : 'bg-[#25D366]/15 hover:bg-[#25D366]/25 border-emerald-500/30 text-[#25D366]'
                  }`}
                  title="WhatsApp"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 sm:w-4 sm:h-4"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
                </button>
                <button
                  onClick={handleTelegram}
                  className={`p-2 rounded-lg border flex items-center justify-center transition-all ${
                    isLight ? 'bg-blue-50 hover:bg-blue-100/70 border-blue-200 text-blue-800' : 'bg-[#0088cc]/15 hover:bg-[#0088cc]/25 border-blue-500/30 text-[#0088cc]'
                  }`}
                  title="Telegram"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 sm:w-4 sm:h-4"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.892-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                </button>
                <button
                  onClick={handleCopyText}
                  className={`p-2 rounded-lg border flex items-center justify-center transition-all ${
                    copiedText
                      ? isLight ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      : isLight ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-sm' : 'bg-white/[0.04] hover:bg-white/[0.08] text-white/80 hover:text-white border-white/10'
                  }`}
                  title="Copy Text"
                >
                  {copiedText ? <Check className="w-5 h-5 sm:w-4 sm:h-4" /> : <Copy className="w-5 h-5 sm:w-4 sm:h-4" />}
                </button>
              </div>
            </div>
          ) : activeTab === 'share' ? (
            !hasTimetable ? (
              <div className="flex flex-col items-center justify-center space-y-4 py-8 flex-1 text-center">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center ${isLight ? 'bg-slate-100 text-slate-400' : 'bg-white/[0.04] text-white/40'}`}>
                  <Calendar className="w-7 h-7" />
                </div>
                <p className={`text-sm font-medium max-w-xs ${isLight ? 'text-slate-500' : 'text-white/50'}`}>{t('compareEmptyTimetable')}</p>
              </div>
            ) : (
            <div data-lenis-prevent className="overflow-y-auto usas-scrollbar touch-pan-y overscroll-contain pr-2">
              <div className="flex min-h-full flex-col items-center justify-center gap-4">
                <div className="text-center w-full max-w-sm mx-auto">
                  <div className={`p-3 rounded-xl border inline-block shadow-inner ${isLight ? 'bg-slate-50 border-slate-200/80' : 'bg-white/[0.02] border-white/10'}`}>
                    <div className="relative w-52 h-52 sm:w-56 sm:h-56 mx-auto">
                      {myQrUrl ? (
                        <img src={myQrUrl} alt="QR Code" className="w-full h-full object-contain rounded-lg" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className={`w-8 h-8 border-2 border-t-transparent rounded-full animate-spin ${isLight ? 'border-amber-500' : 'border-amber-400'}`} />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-2.5">
                    <h3 className={`text-sm font-bold truncate ${isLight ? 'text-slate-800' : 'text-white'}`}>{timetableData?.studentName || 'Pelajar'}</h3>
                    <p className={`text-xs font-semibold truncate mt-0.5 ${isLight ? 'text-blue-600' : 'text-blue-400'}`}>{t('compareShowFriend')}</p>
                  </div>
                </div>
                <button
                  onClick={handleCopyLink}
                  className={`w-full max-w-sm flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${
                    copied
                      ? isLight ? 'bg-emerald-100 text-emerald-700' : 'bg-emerald-500/20 text-emerald-400'
                      : isLight ? 'bg-blue-50 hover:bg-blue-100 text-blue-700' : 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-300'
                  }`}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? t('compareLinkCopied') : t('compareCopyLink')}
                </button>
              </div>
            </div>
            )
          ) : scanState !== 'success' ? (
            <div className="flex flex-col overflow-y-auto usas-scrollbar touch-pan-y overscroll-contain pr-2">
              <div className="my-auto flex w-full flex-col items-center gap-3 py-1">
              <canvas ref={canvasRef} className="pointer-events-none absolute -left-[9999px] top-0 h-px w-px opacity-0" aria-hidden="true" />

              {participantsBar}

              {isFullscreen ? createPortal(scannerViewport, document.body) : scannerViewport}

              {scanState === 'error' || linkError ? (
                <div className="flex items-center justify-center gap-2 text-center">
                  <p className="text-xs font-medium text-red-500">{linkError ? t(linkError === 'self' ? 'compareScanSelf' : linkError === 'duplicate' ? 'compareAlreadyAdded' : 'compareLinkInvalid') : statusMessage}</p>
                </div>
              ) : (
                <p className={`text-center text-xs font-medium ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
                  {statusMessage}
                  {scanState === 'scanning' && scanHint && (
                    <span className="mt-0.5 block text-[11px] font-semibold text-amber-500">{t('compareScanHint')}</span>
                  )}
                </p>
              )}

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-center">
                <div className="flex w-full items-center justify-center gap-2 sm:w-auto sm:shrink-0">
                  {scanState === 'error' && (
                    <button onClick={startCamera} className={`flex-1 sm:flex-none whitespace-nowrap px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-white/10 hover:bg-white/20 text-white'}`}>
                      <ScanLine className="w-4 h-4 inline-block mr-1.5" /> {t('compareScanRetry')}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={`flex-1 sm:flex-none whitespace-nowrap px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${isLight ? 'bg-blue-50 hover:bg-blue-100 text-blue-700' : 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-300'}`}
                  >
                    <Upload className="w-4 h-4 inline-block mr-1.5" /> {t('compareUploadBtn')}
                  </button>
                  <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                </div>

                <div className={`mx-auto flex w-full min-w-0 items-center gap-1.5 rounded-xl border p-1 transition-colors sm:mx-0 sm:max-w-sm sm:flex-1 ${isLight ? 'border-slate-200 bg-white focus-within:border-amber-400' : 'border-white/[0.08] bg-white/[0.02] focus-within:border-amber-400/50'}`}>
                  <Link2 className={`ml-1.5 h-3.5 w-3.5 shrink-0 ${isLight ? 'text-slate-400' : 'text-white/30'}`} />
                  <input
                    type="text"
                    value={linkInput}
                    onChange={(e) => {
                      setLinkInput(e.target.value);
                      setLinkError('');
                      if (linkErrorTimerRef.current !== null) clearTimeout(linkErrorTimerRef.current);
                      linkErrorTimerRef.current = null;
                    }}
                    onKeyDown={(e) => { if (e.key === 'Enter') addFromLink(); }}
                    placeholder={t('comparePasteLinkPlaceholder')}
                    className={`inline-input min-w-0 flex-1 bg-transparent px-0.5 py-1 text-[11px] ${isLight ? 'text-slate-800 placeholder-slate-400' : 'text-white placeholder-white/30'}`}
                  />
                  <button type="button" onClick={addFromLink} disabled={!linkInput.trim()} className={`shrink-0 rounded-lg px-3 py-1.5 text-[11px] font-bold transition-colors disabled:opacity-40 ${isLight ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                    {t('compareAdd')}
                  </button>
                </div>
              </div>
              </div>
            </div>
          ) : (
            <div data-lenis-prevent className="flex-1 min-h-0 overflow-y-auto usas-scrollbar touch-pan-y overscroll-contain space-y-4 sm:space-y-5 pr-2 pl-0.5">
              {participantsBar}

              <div className={`p-3 rounded-xl flex items-center gap-3 ${isLight ? 'bg-emerald-50 text-emerald-900 border border-emerald-100' : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'}`}>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/20">
                  <Users className="h-4 w-4 text-emerald-500" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold leading-tight">{t('compareMerged')}</div>
                  <div className="mt-0.5 truncate text-xs opacity-80">
                    {t('compareWith')} <span className="font-bold text-emerald-600 dark:text-emerald-400">{participants.map((p) => p.name).join(', ')}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="flex items-center gap-2 text-sm font-bold">
                  <Calendar className="h-4 w-4 text-emerald-500" /> {t('compareCommonFree')}
                </h3>
                <div className="space-y-1.5">
                  {reverseDayMap.filter(d => d !== 'SABTU' && d !== 'AHAD').map(dayStr => {
                    const daySlots = freeSlots.filter(s => s.dayStr === dayStr);
                    if (daySlots.length === 0) return null;
                    return (
                      <div key={dayStr} className={`flex items-start gap-2 rounded-lg border px-2.5 py-2 sm:gap-3 sm:px-3 ${isLight ? 'bg-white border-slate-200' : 'bg-white/[0.02] border-white/[0.06]'}`}>
                        <span className="w-11 shrink-0 pt-0.5 text-[9px] font-black uppercase tracking-widest opacity-55 sm:w-14 sm:text-[10px]">{dayStr}</span>
                        <div className="flex flex-wrap gap-1.5">
                          {daySlots.map((slot, i) => {
                            const durationH = Math.round(((slot.endMins - slot.startMins) / 60) * 10) / 10;
                            return (
                              <span key={i} className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-semibold sm:text-[11px] ${isLight ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25'}`}>
                                {formatCompactRange(slot.startMins, slot.endMins, timeFormat)}
                                <span className={`rounded px-1 text-[9px] font-black ${isLight ? 'bg-emerald-200 text-emerald-800' : 'bg-emerald-500/30 text-emerald-100'}`}>{durationH}h</span>
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                  {freeSlots.length === 0 && (
                    <div className="py-6 text-center text-xs italic opacity-50">{t('compareNoFree')}</div>
                  )}
                </div>
              </div>

              {/* Colour marks the owner */}
              <div className="space-y-2">
                <h3 className="flex items-center gap-2 text-sm font-bold">
                  <Users className="h-4 w-4 text-amber-500" /> {t('compareClassSchedule')}
                </h3>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-semibold opacity-70">
                  <span className="inline-flex items-center gap-1.5">
                    <span className={`h-2 w-2 rounded-full ${getCardColorByScheme('amber', isLight).dot}`} />
                    {t('compareYou')}
                  </span>
                  {participants.map((p) => (
                    <span key={p.id} className="inline-flex items-center gap-1.5">
                      <span className={`h-2 w-2 rounded-full ${getCardColorByScheme(ownerScheme(p.id), isLight).dot}`} />
                      {p.name.split(/\s+/)[0]}
                    </span>
                  ))}
                </div>
                <div className="space-y-2">
                  {WEEK_ORDER.map(dayStr => {
                    const classes = mergedByDay.get(dayStr);
                    if (!classes || classes.length === 0) return null;
                    return (
                      <div key={dayStr} className={`overflow-hidden rounded-xl border ${isLight ? 'bg-white border-slate-200' : 'bg-white/[0.02] border-white/[0.06]'}`}>
                        <div className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-widest ${isLight ? 'bg-slate-50 text-slate-500' : 'bg-white/[0.02] text-white/50'}`}>{dayStr}</div>
                        <div className="space-y-1.5 p-2">
                          {classes.map((cls, i) => {
                            const cardColor = getCardColorByScheme(ownerScheme(cls.owner), isLight);
                            return (
                              <div
                                key={i}
                                className={`flex items-center gap-2 rounded-lg border border-l-[3px] px-2 py-1.5 shadow-sm sm:gap-2.5 sm:px-2.5 sm:py-2 ${cardColor.bg} ${cardColor.border} ${cardColor.accent}`}
                              >
                                <span className={`shrink-0 font-mono text-[10px] font-semibold tabular-nums sm:text-[11px] ${isLight ? 'text-slate-600' : 'text-white/70'}`}>
                                  {formatCompactRange(cls.startMins, cls.endMins, timeFormat)}
                                </span>
                                <span className={`min-w-0 flex-1 truncate text-[11px] sm:text-xs ${cardColor.text}`}>{cls.code}</span>
                                <span className={`shrink-0 whitespace-nowrap rounded px-1.5 py-0.5 text-[8px] font-extrabold uppercase tracking-wide ${isLight ? 'bg-white/70 text-slate-700' : 'bg-black/25 text-white/80'}`}>
                                  {ownerName(cls.owner)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                  {mergedByDay.size === 0 && (
                    <div className="py-6 text-center text-xs italic opacity-50">{t('compareNoClasses')}</div>
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
