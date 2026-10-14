import QrScanner from 'qr-scanner';

let qrEngine: ReturnType<typeof QrScanner.createQrEngine> | undefined;
const getQrEngine = () => qrEngine ??= QrScanner.createQrEngine().then((engine) => {
  if (engine instanceof Worker) engine.postMessage({ id: 0, type: 'inversionMode', data: 'both' });
  return engine;
});

/** Nimiq's scanner runs decoding in a worker and uses BarcodeDetector where available. */
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

/** Decode phone photos at bounded sizes, then try a softened center crop for screen moire. */
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

/** Small diagnostic sample for the opt-in on-device QR readout. */
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
    for (let i = 0; i < data.length; i += 4) sum += (data[i] + data[i + 1] + data[i + 2]) / 3;
    return Math.round(sum / (data.length / 4));
  } catch {
    return -2;
  }
}
