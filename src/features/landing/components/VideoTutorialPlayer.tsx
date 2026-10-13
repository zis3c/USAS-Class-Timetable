import { useEffect, useRef, useState } from 'react';
import { Maximize, Minimize2, Pause, Play, Volume2, VolumeX } from 'lucide-react';
import type { LanguageCode } from '@/shared/types/usas';

type VideoTutorialPlayerProps = {
  src: string;
  poster?: string;
  lang: LanguageCode;
  isLight: boolean;
};

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const total = Math.floor(seconds);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function VideoTutorialPlayer({ src, poster, lang, isLight }: VideoTutorialPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hideControlsTimer = useRef<number | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [isSeeking, setIsSeeking] = useState(false);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const labels = {
    play: lang === 'ms' ? 'Main' : lang === 'zh' ? '播放' : lang === 'ta' ? 'இயக்கு' : 'Play',
    pause: lang === 'ms' ? 'Jeda' : lang === 'zh' ? '暂停' : lang === 'ta' ? 'இடைநிறுத்து' : 'Pause',
    mute: lang === 'ms' ? 'Bisu' : lang === 'zh' ? '静音' : lang === 'ta' ? 'ஒலியடக்கு' : 'Mute',
    unmute: lang === 'ms' ? 'Buka bunyi' : lang === 'zh' ? '取消静音' : lang === 'ta' ? 'ஒலியை இயக்கு' : 'Unmute',
    fullscreen: lang === 'ms' ? 'Skrin penuh' : lang === 'zh' ? '全屏' : lang === 'ta' ? 'முழுத்திரை' : 'Fullscreen',
    seek: lang === 'ms' ? 'Cari' : lang === 'zh' ? '进度' : lang === 'ta' ? 'நிலை' : 'Seek',
  };

  const clearHideTimer = () => {
    if (hideControlsTimer.current !== null) {
      window.clearTimeout(hideControlsTimer.current);
      hideControlsTimer.current = null;
    }
  };

  const scheduleHideControls = () => {
    clearHideTimer();
    hideControlsTimer.current = window.setTimeout(() => {
      // Keep controls visible when paused so users can always resume.
      if (videoRef.current && !videoRef.current.paused) {
        setControlsVisible(false);
      }
    }, 2600);
  };

  useEffect(() => {
    return () => clearHideTimer();
  }, []);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === containerRef.current);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused || video.ended) {
      void video.play().catch(() => {});
    } else {
      video.pause();
    }
    setControlsVisible(true);
    scheduleHideControls();
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (document.fullscreenElement === container) {
      void document.exitFullscreen().catch(() => {});
    } else if (container.requestFullscreen) {
      void container.requestFullscreen().catch(() => {});
    }
  };

  const handleSeek = (event: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    const nextTime = Number(event.target.value);
    setCurrentTime(nextTime);
    if (video) video.currentTime = nextTime;
  };

  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (video) setDuration(video.duration || 0);
  };

  const handleRevealControls = () => {
    setControlsVisible(true);
    scheduleHideControls();
  };

  const shellClass = isLight
    ? 'bg-slate-100/60 border-slate-200'
    : 'bg-black/40 border-white/[0.06] hover:border-white/[0.12]';

  return (
    <div
      ref={containerRef}
      onMouseMove={handleRevealControls}
      onMouseLeave={() => {
        clearHideTimer();
        if (videoRef.current && !videoRef.current.paused) setControlsVisible(false);
      }}
      className={`group rounded-2xl border overflow-hidden shadow-md transition-colors duration-300 relative aspect-[4/3] sm:aspect-video min-h-[220px] sm:min-h-0 ${shellClass}`}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        preload="metadata"
        playsInline
        onClick={togglePlay}
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={(event) => {
          if (!isSeeking) setCurrentTime(event.currentTarget.currentTime);
        }}
        onPlay={() => {
          setIsPlaying(true);
          scheduleHideControls();
        }}
        onPause={() => {
          setIsPlaying(false);
          setControlsVisible(true);
          clearHideTimer();
        }}
        onEnded={() => {
          setIsPlaying(false);
          setControlsVisible(true);
          clearHideTimer();
        }}
        onVolumeChange={(event) => setIsMuted(event.currentTarget.muted)}
        className="h-full w-full object-cover"
      />

      {/* Gradient + badge match the placeholder design. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/60 to-transparent" />

      <div className="pointer-events-none absolute top-3 left-3 z-20 flex items-center gap-2">
        <span className="rounded-md bg-black/50 px-2 py-0.5 text-[8px] font-black tracking-widest text-white/80 backdrop-blur">
          1080P HD
        </span>
      </div>

      {!isPlaying && (
        <div className="pointer-events-none absolute inset-x-0 top-0 bottom-16 z-20 flex items-center justify-center">
          <button
            type="button"
            onClick={togglePlay}
            aria-label={labels.play}
            className="pointer-events-auto h-16 w-16 rounded-full bg-[#0A1428]/80 backdrop-blur border border-white/20 flex items-center justify-center text-amber-400 transition-all duration-300 shadow-xl group-hover:scale-110 group-hover:text-amber-300"
          >
            <Play className="w-6 h-6 fill-amber-400 group-hover:fill-amber-300 translate-x-[1px]" />
          </button>
        </div>
      )}

      <div
        className={`absolute inset-x-0 bottom-0 z-30 px-3 pb-2.5 pt-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent transition-opacity duration-300 ${
          controlsVisible || !isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={currentTime}
          onChange={handleSeek}
          onMouseDown={() => setIsSeeking(true)}
          onMouseUp={() => setIsSeeking(false)}
          onTouchStart={() => setIsSeeking(true)}
          onTouchEnd={() => setIsSeeking(false)}
          aria-label={labels.seek}
          className="video-seek w-full cursor-pointer"
          style={{ ['--seek-progress' as string]: `${progress}%` }}
        />

        <div className="mt-1.5 flex items-center justify-between text-[10px] font-mono text-white/80">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={togglePlay}
              aria-label={isPlaying ? labels.pause : labels.play}
              className="inline-flex h-7 w-7 items-center justify-center rounded-full text-white transition-colors hover:bg-white/15 hover:text-amber-300"
            >
              {isPlaying ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current translate-x-[0.5px]" />}
            </button>
            <button
              type="button"
              onClick={toggleMute}
              aria-label={isMuted ? labels.unmute : labels.mute}
              className="inline-flex h-7 w-7 items-center justify-center rounded-full text-white transition-colors hover:bg-white/15 hover:text-amber-300"
            >
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
            <span className="ml-1 tabular-nums tracking-wide text-white/70">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <button
            type="button"
            onClick={toggleFullscreen}
            aria-label={labels.fullscreen}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full text-white transition-colors hover:bg-white/15 hover:text-amber-300"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
