import { BrowserQRCodeReader } from '@zxing/library/esm/browser/BrowserQRCodeReader.js';
import BarcodeFormat from '@zxing/library/esm/core/BarcodeFormat.js';
import DecodeHintType from '@zxing/library/esm/core/DecodeHintType.js';

const hints = new Map<DecodeHintType, unknown>([
  [DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.QR_CODE]],
  [DecodeHintType.TRY_HARDER, true],
]);

let reader: BrowserQRCodeReader | null = null;
let readerSize = '';

export function decodeQrWithZxing(img: HTMLImageElement | HTMLVideoElement): string | null {
  const width = 'videoWidth' in img ? img.videoWidth : img.naturalWidth;
  const height = 'videoHeight' in img ? img.videoHeight : img.naturalHeight;
  const size = `${width}x${height}`;
  if (size !== readerSize) {
    reader?.reset();
    reader = new BrowserQRCodeReader();
    reader.hints = hints;
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
