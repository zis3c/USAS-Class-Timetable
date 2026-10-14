import QrScanner from 'qr-scanner';

// Keep inverted QR support consistent across browsers; recheck this package-private flag on upgrades.
(QrScanner as unknown as { _disableBarcodeDetector: boolean })._disableBarcodeDetector = true;

let qrEngine: ReturnType<typeof QrScanner.createQrEngine> | undefined;
const getQrEngine = () => qrEngine ??= QrScanner.createQrEngine().then((engine) => {
  if (engine instanceof Worker) {
    // Reused workers skip qr-scanner's default both-color image mode; check this message when upgrading the package.
    engine.postMessage({ id: 0, type: 'inversionMode', data: 'both' });
  }
  return engine;
});

export function prepareQrDecoder(): void {
  void getQrEngine().catch(() => {});
}

/** Focus the camera at a preview tap only when its browser and hardware expose point focus. */
export function focusCameraAtPoint(track: MediaStreamTrack, video: HTMLVideoElement, clientX: number, clientY: number, cssZoom: number): void {
  const caps = track.getCapabilities?.() as (MediaTrackCapabilities & { focusMode?: string[]; pointsOfInterest?: unknown }) | undefined;
  const focusMode = caps?.focusMode?.includes('continuous')
    ? 'continuous'
    : caps?.focusMode?.includes('single-shot') ? 'single-shot' : null;
  if (!focusMode || !caps || !('pointsOfInterest' in caps) || !video.videoWidth || !video.videoHeight) return;

  const rect = video.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  const width = rect.width / cssZoom;
  const height = rect.height / cssZoom;
  const left = rect.left + (rect.width - width) / 2;
  const top = rect.top + (rect.height - height) / 2;
  // Map through the preview's CSS zoom and centered object-cover crop to camera coordinates.
  const scale = Math.max(width / video.videoWidth, height / video.videoHeight);
  const x = Math.max(0, Math.min(1, (clientX - left + (video.videoWidth * scale - width) / 2) / (video.videoWidth * scale)));
  const y = Math.max(0, Math.min(1, (clientY - top + (video.videoHeight * scale - height) / 2) / (video.videoHeight * scale)));
  type FocusConstraint = MediaTrackConstraintSet & { focusMode: string; pointsOfInterest: { x: number; y: number }[] };
  void track.applyConstraints({ advanced: [{ focusMode, pointsOfInterest: [{ x, y }] } as FocusConstraint] }).catch(() => {});
}

/** Decode a live frame; callers use a centered crop periodically to retain QR detail on mobile. */
export async function decodeQrFromFrame(video: HTMLVideoElement, canvas: HTMLCanvasElement, scanCenter = false, zoom = 1): Promise<string | null> {
  const width = video.videoWidth;
  const height = video.videoHeight;
  if (!width || !height) return null;
  const side = Math.min(width, height) * (scanCenter ? 0.75 : 1) / Math.max(1, zoom);
  const region = scanCenter
    ? { x: (width - side) / 2, y: (height - side) / 2, width: side, height: side, downScaledWidth: 900, downScaledHeight: 900 }
    : { x: 0, y: 0, width, height, downScaledWidth: Math.round(900 * width / Math.max(width, height)), downScaledHeight: Math.round(900 * height / Math.max(width, height)) };
  try {
    const result = await QrScanner.scanImage(video, {
      qrEngine: getQrEngine(),
      canvas,
      scanRegion: region,
      returnDetailedScanResult: true,
    });
    return result.data;
  } catch {
    return null;
  }
}

async function scanImageSource(source: HTMLCanvasElement | HTMLImageElement): Promise<string | null> {
  try {
    const result = await QrScanner.scanImage(source, {
      qrEngine: getQrEngine(),
      returnDetailedScanResult: true,
    });
    return result.data;
  } catch {
    return null;
  }
}

/** Decode a selected image at bounded sizes, then soften its center crop for screen moire. */
export async function decodeQrFromImage(image: HTMLImageElement): Promise<string | null> {
  const width = image.naturalWidth;
  const height = image.naturalHeight;
  if (!width || !height) return null;
  const canvas = document.createElement('canvas');
  const side = Math.min(width, height) * 0.75;
  const center = { x: (width - side) / 2, y: (height - side) / 2, width: side, height: side };

  for (const limit of [1200, 2000]) {
    const scale = Math.min(1, limit / Math.max(width, height));
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) return null;
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    let code = await scanImageSource(canvas);
    if (code) return code;

    const cropScale = Math.min(1, limit / side);
    canvas.width = Math.max(1, Math.round(side * cropScale));
    canvas.height = canvas.width;
    context.drawImage(image, center.x, center.y, center.width, center.height, 0, 0, canvas.width, canvas.height);
    code = await scanImageSource(canvas);
    if (code) return code;
  }

  try {
    const softened = new Image();
    await new Promise<void>((resolve, reject) => {
      softened.onload = () => resolve();
      softened.onerror = () => reject(new Error('Image conversion failed'));
      softened.src = canvas.toDataURL('image/jpeg', 0.85);
    });
    return scanImageSource(softened);
  } catch {
    return null;
  }
}

/** Return average frame brightness; -1 means no canvas context and -2 means the frame could not be read. */
export function sampleFrameLuminance(video: HTMLVideoElement): number {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return -1;
  try {
    context.drawImage(video, 0, 0, 32, 32);
    context.drawImage(video, 0, 0, 32, 32);
    const data = context.getImageData(0, 0, 32, 32).data;
    let sum = 0;
    let channel = 0;
    let rgbChannels = 0;
    for (const value of data) {
      if (channel !== 3) {
        sum += value;
        rgbChannels += 1;
      }
      channel = (channel + 1) % 4;
    }
    return Math.round(sum / rgbChannels);
  } catch {
    return -2;
  }
}
