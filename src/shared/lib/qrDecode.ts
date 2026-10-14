import jsQR from 'jsqr';

type QrSource = HTMLImageElement | HTMLVideoElement;

function sourceSize(source: QrSource) {
  return source instanceof HTMLVideoElement
    ? { width: source.videoWidth, height: source.videoHeight }
    : { width: source.naturalWidth, height: source.naturalHeight };
}

function scanRegion(
  source: QrSource,
  canvas: HTMLCanvasElement,
  region: { x: number; y: number; width: number; height: number },
  limit: number,
  invert = true,
): string | null {
  const scale = Math.min(1, limit / Math.max(region.width, region.height));
  const width = Math.max(1, Math.round(region.width * scale));
  const height = Math.max(1, Math.round(region.height * scale));
  if (canvas.width !== width) canvas.width = width;
  if (canvas.height !== height) canvas.height = height;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return null;

  try {
    context.drawImage(source, region.x, region.y, region.width, region.height, 0, 0, width, height);
    // WebKit can return the previous or a blank camera frame after the first draw.
    if (source instanceof HTMLVideoElement) {
      context.drawImage(source, region.x, region.y, region.width, region.height, 0, 0, width, height);
    }
    const pixels = context.getImageData(0, 0, width, height);
    return jsQR(pixels.data, width, height, { inversionAttempts: invert ? 'attemptBoth' : 'dontInvert' })?.data ?? null;
  } catch {
    return null;
  }
}

/** Scan one bounded camera region per tick so older iPhones keep receiving fresh frames. */
export function decodeQrFromFrame(video: HTMLVideoElement, canvas: HTMLCanvasElement, scanCenter = false, zoom = 1): string | null {
  const { width, height } = sourceSize(video);
  if (!width || !height) return null;
  const cropWidth = width / Math.max(1, zoom);
  const cropHeight = height / Math.max(1, zoom);
  const side = Math.min(cropWidth, cropHeight) * 0.75;
  const region = scanCenter
    ? { x: (width - side) / 2, y: (height - side) / 2, width: side, height: side }
    : { x: (width - cropWidth) / 2, y: (height - cropHeight) / 2, width: cropWidth, height: cropHeight };
  return scanRegion(video, canvas, region, scanCenter ? 1200 : 960, scanCenter);
}

/** Decode uploads at several useful sizes without sending a full phone photo through the live scanner. */
export async function decodeQrFromImage(image: HTMLImageElement): Promise<string | null> {
  const { width, height } = sourceSize(image);
  if (!width || !height) return null;
  const canvas = document.createElement('canvas');
  const full = { x: 0, y: 0, width, height };
  const side = Math.min(width, height) * 0.75;
  const center = { x: (width - side) / 2, y: (height - side) / 2, width: side, height: side };
  for (const [region, limit] of [[full, 1200], [center, 1200], [full, 2000], [center, 2000]] as const) {
    const code = scanRegion(image, canvas, region, limit);
    if (code) return code;
  }
  // JPEG smoothing can remove display moire from a photo of a QR on another screen.
  try {
    scanRegion(image, canvas, center, 1200);
    const softened = new Image();
    await new Promise<void>((resolve, reject) => {
      softened.onload = () => resolve();
      softened.onerror = () => reject(new Error('JPEG conversion failed'));
      softened.src = canvas.toDataURL('image/jpeg', 0.85);
    });
    const code = scanRegion(softened, canvas, { x: 0, y: 0, width: softened.naturalWidth, height: softened.naturalHeight }, 1200);
    if (code) return code;
  } catch {
    // Keep the original image for the independent decoder below.
  }
  const { decodeQrWithZxing } = await import('./qrDecodeZxing');
  return decodeQrWithZxing(image);
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
