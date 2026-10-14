import { BrowserQRCodeReader } from '@zxing/library/esm/browser/BrowserQRCodeReader.js';

export function decodeQrWithZxing(img: HTMLImageElement | HTMLVideoElement): string | null {
  try {
    return new BrowserQRCodeReader().decode(img).getText();
  } catch {
    return null;
  }
}
