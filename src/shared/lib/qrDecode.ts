import jsQR from 'jsqr';

async function decodeWithZxing(img: HTMLImageElement | HTMLVideoElement): Promise<string | null> {
  const { decodeQrWithZxing } = await import('./qrDecodeZxing');
  return decodeQrWithZxing(img);
}

/**
 * Decodes the first QR code found in an image or video frame. Tries a few sizes
 * because full-size phone photos can exceed mobile canvas limits and decode
 * blank. Uses its own canvas so a running camera loop can't overwrite the frame
 * mid-decode. Returns the QR payload text, or null if none was found.
 */
export async function decodeQrFromImage(img: HTMLImageElement | HTMLVideoElement, caps: number[] = [1200, 2000, 3000], tryCenterCrop = true): Promise<string | null> {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return null;

  const nativeW = ('videoWidth' in img ? img.videoWidth : img.naturalWidth) || img.width;
  const nativeH = ('videoHeight' in img ? img.videoHeight : img.naturalHeight) || img.height;
  if (!nativeW || !nativeH) return null;

  const longest = Math.max(nativeW, nativeH);
  const attempted = new Set<number>();
  for (const cap of caps) {
    const width = Math.max(1, Math.round(nativeW * Math.min(1, cap / longest)));
    if (attempted.has(width)) continue;
    attempted.add(width);

    const height = Math.max(1, Math.round(nativeH * (width / nativeW)));
    canvas.width = width;
    canvas.height = height;
    context.clearRect(0, 0, width, height);
    context.drawImage(img, 0, 0, width, height);

    let imageData: ImageData;
    try {
      imageData = context.getImageData(0, 0, width, height);
    } catch {
      continue;
    }
    const code = jsQR(imageData.data, width, height, { inversionAttempts: 'attemptBoth' });
    if (code?.data) return code.data;

    context.save();
    context.translate(width, 0);
    context.scale(-1, 1);
    context.drawImage(img, 0, 0, width, height);
    context.restore();
    try {
      imageData = context.getImageData(0, 0, width, height);
    } catch {
      continue;
    }
    const mirroredCode = jsQR(imageData.data, width, height, { inversionAttempts: 'attemptBoth' });
    if (mirroredCode?.data) return mirroredCode.data;
  }

  if (!tryCenterCrop) return decodeWithZxing(img);

  const cropW = Math.round(nativeW / 2);
  const cropH = Math.round(nativeH / 2);
  const cropScale = Math.min(2, 1200 / Math.max(cropW, cropH));
  const cropWidth = Math.max(1, Math.round(cropW * cropScale));
  const cropHeight = Math.max(1, Math.round(cropH * cropScale));
  const cropCanvas = document.createElement('canvas');
  cropCanvas.width = cropWidth;
  cropCanvas.height = cropHeight;
  const cropContext = cropCanvas.getContext('2d');
  if (!cropContext) return decodeWithZxing(img);
  cropContext.imageSmoothingEnabled = false;
  cropContext.drawImage(img, (nativeW - cropW) / 2, (nativeH - cropH) / 2, cropW, cropH, 0, 0, cropWidth, cropHeight);
  try {
    const cropData = cropContext.getImageData(0, 0, cropWidth, cropHeight);
    const cropCode = jsQR(cropData.data, cropWidth, cropHeight, { inversionAttempts: 'attemptBoth' });
    if (cropCode?.data) return cropCode.data;

    // JPEG re-encoding softens screen moiré that can hide dense QR modules in camera photos.
    const softened = new Image();
    // iOS Safari rejects decode() on large images; wait for load instead.
    await new Promise<void>((resolve, reject) => {
      softened.onload = () => resolve();
      softened.onerror = () => reject(new Error('soften failed'));
      softened.src = cropCanvas.toDataURL('image/jpeg', 0.85);
    });
    const softenedCode = await decodeQrFromImage(softened, [1200], false);
    if (softenedCode) return softenedCode;
  } catch {
    // Let the ZXing fallback try the original image if this crop is unreadable.
  }

  return decodeWithZxing(img);
}

/** Keeps the live pass sharp, with the heavier photo decoders retried periodically. */
export async function decodeQrFromFrame(video: HTMLVideoElement, canvas: HTMLCanvasElement, tryHarder = false, zoom = 1): Promise<string | null> {
  const width = video.videoWidth;
  const height = video.videoHeight;
  if (!width || !height) return null;

  const cropWidth = Math.max(1, Math.round(width / zoom));
  const cropHeight = Math.max(1, Math.round(height / zoom));
  const x = (width - cropWidth) / 2;
  const y = (height - cropHeight) / 2;
  const scale = Math.min(1, 1920 / Math.max(cropWidth, cropHeight));
  const frameWidth = Math.max(1, Math.round(cropWidth * scale));
  const frameHeight = Math.max(1, Math.round(cropHeight * scale));
  if (canvas.width !== frameWidth) canvas.width = frameWidth;
  if (canvas.height !== frameHeight) canvas.height = frameHeight;

  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return null;
  // iOS Safari can hand back a blank/black first frame for a camera video draw; a
  // second draw paints the current frame (WebKit bug 217578). Cheap and harmless elsewhere.
  context.drawImage(video, x, y, cropWidth, cropHeight, 0, 0, frameWidth, frameHeight);
  context.drawImage(video, x, y, cropWidth, cropHeight, 0, 0, frameWidth, frameHeight);
  let imageData: ImageData;
  try {
    imageData = context.getImageData(0, 0, frameWidth, frameHeight);
  } catch {
    return tryHarder ? decodeQrFromImage(video) : null;
  }
  const code = jsQR(imageData.data, frameWidth, frameHeight, { inversionAttempts: 'attemptBoth' });
  if (code?.data) return code.data;

  return tryHarder ? decodeQrFromImage(video) : null;
}

/** Rough mean luminance (0-255) of a downscaled camera frame, for on-device debugging. */
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
