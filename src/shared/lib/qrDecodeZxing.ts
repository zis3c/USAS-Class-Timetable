import { BrowserQRCodeReader } from '@zxing/library/esm/browser/BrowserQRCodeReader.js';

let reader: BrowserQRCodeReader | null = null;
let readerSize = '';

export function decodeQrWithZxing(img: HTMLImageElement | HTMLVideoElement): string | null {
  const width = 'videoWidth' in img ? img.videoWidth : img.naturalWidth;
  const height = 'videoHeight' in img ? img.videoHeight : img.naturalHeight;
  const size = `${width}x${height}`;
  if (size !== readerSize) {
    reader?.reset();
    reader = new BrowserQRCodeReader();
    readerSize = size;
  }

  const activeReader = reader;
  if (!activeReader) return null;

  try {
    return activeReader.decode(img).getText();
  } catch {
    return null;
  }
}
