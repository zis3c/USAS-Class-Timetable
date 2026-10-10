import { useEffect, useRef, useState, type RefObject } from 'react';
import type { ExportTheme, WallpaperPreset } from '../lib/wallpaperExportHelpers';

type WallpaperBackgroundOptions = {
  wallpaperRef: RefObject<HTMLDivElement | null>;
  exportMode: 'FORMAL_A4' | 'WALLPAPER';
  exportTheme: ExportTheme;
  wallpaperPreset: WallpaperPreset;
  wallpaperTopAdjustment: number;
  wallpaperBottomAdjustment: number;
  wallpaperBackgroundBlur: number;
  daysList: string[];
};

export function useWallpaperBackground({
  wallpaperRef, exportMode, exportTheme, wallpaperPreset,
  wallpaperTopAdjustment, wallpaperBottomAdjustment, wallpaperBackgroundBlur, daysList,
}: WallpaperBackgroundOptions) {
  const [wallpaperBackground, setWallpaperBackground] = useState('');
  const [wallpaperBackgroundBlurred, setWallpaperBackgroundBlurred] = useState('');
  const [wallpaperBackgroundName, setWallpaperBackgroundName] = useState('');
  const [wallpaperBackgroundError, setWallpaperBackgroundError] = useState('');
  const [brightDayLabels, setBrightDayLabels] = useState<Set<number>>(() => new Set());
  const wallpaperBackgroundInputRef = useRef<HTMLInputElement>(null);
  const wallpaperBackgroundUrlsRef = useRef<string[]>([]);
  // Keep the decoded source image so the blur can be re-rendered without
  // re-reading the file the user picked.
  const sourceImageRef = useRef<HTMLImageElement | null>(null);
  const lastBlurRef = useRef(wallpaperBackgroundBlur);

  useEffect(() => () => {
    wallpaperBackgroundUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  // Renders the source image onto a canvas with a Gaussian blur whose radius is
  // expressed in the wallpaper's on-screen pixels (blurStrength px), then returns
  // an object URL. html2canvas strips CSS filters on export, so the blur must be
  // baked into the bitmap the preview uses.
  const renderBlurredUrl = async (image: HTMLImageElement, blurStrength: number): Promise<string | null> => {
    const maxDimension = Math.max(image.naturalWidth, image.naturalHeight);
    const blurScale = Math.min(1, 2048 / maxDimension);
    const blurWidth = Math.max(1, Math.round(image.naturalWidth * blurScale));
    const blurHeight = Math.max(1, Math.round(image.naturalHeight * blurScale));
    const blurProbe = document.createElement('canvas');
    blurProbe.width = blurProbe.height = 5;
    const probeContext = blurProbe.getContext('2d');
    let supportsCanvasBlur = false;
    if (probeContext) {
      probeContext.filter = 'blur(1px)';
      probeContext.fillStyle = '#000';
      probeContext.fillRect(2, 2, 1, 1);
      supportsCanvasBlur = probeContext.getImageData(1, 2, 1, 1).data[3] > 0;
    }
    blurProbe.width = blurProbe.height = 0;

    const root = wallpaperRef.current;
    const rootWidth = root?.offsetWidth || blurWidth;
    const rootHeight = root?.offsetHeight || blurHeight;
    const scale = Math.max(rootWidth / blurWidth, rootHeight / blurHeight) || 1;
    const blurRadius = Math.max(0, Math.min(64, blurStrength / scale));
    const pad = Math.ceil(blurRadius * 2);
    const canvas = document.createElement('canvas');
    canvas.width = blurWidth;
    canvas.height = blurHeight;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas unavailable');
    if (supportsCanvasBlur && blurRadius > 0) context.filter = `blur(${blurRadius}px)`;
    context.drawImage(image, -pad, -pad, blurWidth + pad * 2, blurHeight + pad * 2);

    let blob: Blob | null;
    if (!supportsCanvasBlur) {
      const imageData = canvas.toDataURL('image/png');
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${blurWidth}" height="${blurHeight}" viewBox="0 0 ${blurWidth} ${blurHeight}"><defs><filter id="blur" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="${blurRadius}"/></filter></defs><image href="${imageData}" width="100%" height="100%" filter="url(#blur)"/></svg>`;
      blob = new Blob([svg], { type: 'image/svg+xml' });
    } else {
      blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
    }
    canvas.width = 0;
    canvas.height = 0;
    if (!blob) throw new Error('Could not encode wallpaper background.');
    return URL.createObjectURL(blob);
  };

  const loadWallpaperBackground = async (file?: File) => {
    setWallpaperBackgroundError('');
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setWallpaperBackgroundError('wallpaperImageLoadFailed');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setWallpaperBackgroundError('wallpaperImageTooLarge');
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    let blurredUrl = '';
    try {
      const image = new Image();
      image.src = objectUrl;
      await image.decode();

      blurredUrl = (await renderBlurredUrl(image, wallpaperBackgroundBlur)) || '';
      if (!blurredUrl) throw new Error('Could not render wallpaper blur.');

      wallpaperBackgroundUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      wallpaperBackgroundUrlsRef.current = [objectUrl, blurredUrl];
      lastBlurRef.current = wallpaperBackgroundBlur;
      sourceImageRef.current = image;
      setWallpaperBackground(objectUrl);
      setWallpaperBackgroundBlurred(blurredUrl);
      setWallpaperBackgroundName(file.name);
    } catch {
      setWallpaperBackgroundError('wallpaperImageLoadFailed');
      URL.revokeObjectURL(objectUrl);
      if (blurredUrl) URL.revokeObjectURL(blurredUrl);
    }
  };

  // Re-render the blur whenever the slider changes, without reloading the file.
  useEffect(() => {
    const image = sourceImageRef.current;
    if (!image || !wallpaperBackground) {
      lastBlurRef.current = wallpaperBackgroundBlur;
      return;
    }
    if (lastBlurRef.current === wallpaperBackgroundBlur) return;

    const handle = window.setTimeout(() => {
      lastBlurRef.current = wallpaperBackgroundBlur;
      void (async () => {
        try {
          const nextUrl = await renderBlurredUrl(image, wallpaperBackgroundBlur);
          if (!nextUrl) return;
          const previous = wallpaperBackgroundBlurred;
          wallpaperBackgroundUrlsRef.current = wallpaperBackgroundUrlsRef.current.filter((url) => url !== previous);
          wallpaperBackgroundUrlsRef.current.push(nextUrl);
          if (previous) URL.revokeObjectURL(previous);
          setWallpaperBackgroundBlurred(nextUrl);
        } catch {
          // Keep the previous blurred image if re-rendering fails.
        }
      })();
    }, 80);
    return () => window.clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallpaperBackgroundBlur, wallpaperBackground]);


  useEffect(() => {
    setBrightDayLabels(new Set());
    if (!wallpaperBackground || exportMode !== 'WALLPAPER') return;

    let cancelled = false;
    const frame = requestAnimationFrame(() => {
      void (async () => {
        const root = wallpaperRef.current;
        if (!root) return;

        const image = new Image();
        image.src = wallpaperBackground;
        try {
          await image.decode();
          if (cancelled) return;

          const rootWidth = root.offsetWidth;
          const rootHeight = root.offsetHeight;
          const coverScale = Math.max(rootWidth / image.naturalWidth, rootHeight / image.naturalHeight);
          const imageLeft = (rootWidth - image.naturalWidth * coverScale) / 2;
          const imageTop = (rootHeight - image.naturalHeight * coverScale) / 2;
          const canvas = document.createElement('canvas');
          canvas.width = canvas.height = 1;
          const context = canvas.getContext('2d', { willReadFrequently: true });
          if (!context) return;

          const rootRect = root.getBoundingClientRect();
          const labels = [...root.querySelectorAll<HTMLElement>('[data-wallpaper-day-label]')];
          const bright = new Set<number>();
          const baseLuminosity = exportTheme === 'light' ? 248 : exportTheme === 'oled' ? 9 : exportTheme === 'emerald' ? 14 : exportTheme === 'warm' ? 34 : 10;
          const glassLuminosity = exportTheme === 'light' ? 255 : 0;

          labels.forEach((label) => {
            const bounds = label.getBoundingClientRect();
            const x = ((bounds.left + bounds.width / 2 - rootRect.left) / rootRect.width) * rootWidth;
            const y = ((bounds.top + bounds.height / 2 - rootRect.top) / rootRect.height) * rootHeight;
            const sourceX = Math.max(0, Math.min(image.naturalWidth - 1, Math.round((x - imageLeft) / coverScale) - 16));
            const sourceY = Math.max(0, Math.min(image.naturalHeight - 1, Math.round((y - imageTop) / coverScale) - 16));
            const sampleSize = Math.min(32, image.naturalWidth - sourceX, image.naturalHeight - sourceY);
            context.clearRect(0, 0, 1, 1);
            context.drawImage(image, sourceX, sourceY, sampleSize, sampleSize, 0, 0, 1, 1);
            const [red, green, blue, alpha] = context.getImageData(0, 0, 1, 1).data;
            const opacity = alpha / 255;
            const imageLuminosity = (red * 0.2126 + green * 0.7152 + blue * 0.0722) * opacity + baseLuminosity * (1 - opacity);
            const visibleLuminosity = imageLuminosity * 0.58 + glassLuminosity * 0.42;
            if (visibleLuminosity >= 105) bright.add(Number(label.dataset.wallpaperDayLabel));
          });

          canvas.width = canvas.height = 0;
          if (!cancelled) setBrightDayLabels(bright);
        } catch {
          if (!cancelled) setBrightDayLabels(new Set());
        }
      })();
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, [wallpaperBackground, exportMode, exportTheme, wallpaperPreset, wallpaperTopAdjustment, wallpaperBottomAdjustment, daysList, wallpaperRef]);


  const clearWallpaperBackground = () => {
    wallpaperBackgroundUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    wallpaperBackgroundUrlsRef.current = [];
    sourceImageRef.current = null;
    setWallpaperBackground('');
    setWallpaperBackgroundBlurred('');
    setWallpaperBackgroundName('');
    setWallpaperBackgroundError('');
  };

  return {
    wallpaperBackground,
    wallpaperBackgroundBlurred,
    wallpaperBackgroundName,
    wallpaperBackgroundError,
    brightDayLabels,
    wallpaperBackgroundInputRef,
    loadWallpaperBackground,
    clearWallpaperBackground,
  };
}
