// shortcut: these QR-only internals avoid bundling other formats; revisit paths on ZXing major upgrades.
import BinaryBitmap from '@zxing/library/esm/core/BinaryBitmap.js';
import DecodeHintType from '@zxing/library/esm/core/DecodeHintType.js';
import HybridBinarizer from '@zxing/library/esm/core/common/HybridBinarizer.js';
import QRCodeReader from '@zxing/library/esm/core/qrcode/QRCodeReader.js';
import RGBLuminanceSource from '@zxing/library/esm/core/RGBLuminanceSource.js';

export function decodeQrWithZxing(imageData: ImageData): string | null {
  const pixels = new Int32Array(imageData.data.buffer, imageData.data.byteOffset, imageData.width * imageData.height);
  const source = new RGBLuminanceSource(pixels, imageData.width, imageData.height);
  const hints = new Map();
  hints.set(DecodeHintType.TRY_HARDER, true);

  for (const luminance of [source, source.invert()]) {
    try {
      return new QRCodeReader().decode(
        new BinaryBitmap(new HybridBinarizer(luminance)),
        hints,
      ).getText();
    } catch {
      // Try the inverted image for light-on-dark QR codes.
    }
  }
  return null;
}
