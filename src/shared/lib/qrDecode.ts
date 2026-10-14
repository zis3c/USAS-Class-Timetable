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
export async function decodeQrFromImage(img: HTMLImageElement | HTMLVideoElement, caps: number[] = [1200, 2000, 3000]): Promise<string | null> {
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

  return decodeWithZxing(img);
}
