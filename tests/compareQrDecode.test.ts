import { describe, expect, it } from 'vitest';
import QRCode from 'qrcode';
import jsQR from 'jsqr';
import LZString from 'lz-string';
import { compressTimetable, decompressTimetable } from '../src/features/timetable/lib/scheduleMatcher';
import type { TimetableItem } from '../src/shared/types/usas';

// Renders a compare/share QR to the RGBA pixel shape jsQR receives, without a canvas.

function buildPayload(): string {
  const courses: (string | number)[][] = [];
  for (let i = 0; i < 7; i += 1) {
    courses.push(['1', 510 + i * 60, 570 + i * 60, `CSC${2100 + i}3`]);
  }
  const compressed = LZString.compressToEncodedURIComponent(
    JSON.stringify({ n: 'DEMO STUDENT', i: 'AI210042', t: courses }),
  );
  return `https://jadualkelas.zis3c.dev/?compare_schedule=${compressed}`;
}

function renderQr(text: string, invert: boolean, ecLevel: 'L' | 'M' = 'M'): { data: Uint8ClampedArray; width: number; height: number } {
  const qr = QRCode.create(text, { errorCorrectionLevel: ecLevel });
  const size = qr.modules.size;
  const modules = qr.modules.data;
  const scale = 8;
  const quiet = 4;
  const dim = (size + quiet * 2) * scale;

  // Build rows functionally: indexing a typed array by a computed position trips the security lint.
  const pixels = Array.from({ length: dim * dim }).flatMap((_, i) => {
    const x = i % dim;
    const y = Math.floor(i / dim);
    const mx = Math.floor(x / scale) - quiet;
    const my = Math.floor(y / scale) - quiet;
    const inside = mx >= 0 && my >= 0 && mx < size && my < size;
    const dark = (inside ? Boolean(modules[my * size + mx]) : false) !== invert;
    const value = dark ? 0 : 255;
    return [value, value, value, 255];
  });

  return { data: new Uint8ClampedArray(pixels), width: dim, height: dim };
}

const demoCourse = (id: string, day: string, start: string, end: string): TimetableItem => ({
  id, day, course_id: id, course_name: `Course ${id}`, start_time: start, end_time: end,
});

describe('compare QR decoding', () => {
  const payload = buildPayload();

  it('decodes a normal (dark-on-light) QR code', () => {
    const image = renderQr(payload, false);
    const code = jsQR(image.data, image.width, image.height, { inversionAttempts: 'attemptBoth' });
    expect(code?.data).toBe(payload);
  });

  it('decodes an inverted (light-on-dark) QR code', () => {
    const image = renderQr(payload, true);
    const code = jsQR(image.data, image.width, image.height, { inversionAttempts: 'attemptBoth' });
    expect(code?.data).toBe(payload);
  });

  it('regression: the old dontInvert setting misses inverted codes', () => {
    const image = renderQr(payload, true);
    const code = jsQR(image.data, image.width, image.height, { inversionAttempts: 'dontInvert' });
    expect(code).toBeNull();
  });

  it('the decoded payload round-trips back to a compare_schedule value', () => {
    const image = renderQr(payload, true);
    const code = jsQR(image.data, image.width, image.height, { inversionAttempts: 'attemptBoth' });
    const url = new URL(code!.data);
    const compareData = url.searchParams.get('compare_schedule');
    expect(compareData).toBeTruthy();
    const decompressed = LZString.decompressFromEncodedURIComponent(compareData!);
    expect(decompressed).toContain('DEMO STUDENT');
  });
});

describe('raw-payload QR (new format)', () => {
  const timetable: TimetableItem[] = [
    demoCourse('RKS6093', 'ISNIN', '08:00 AM', '10:00 AM'),
    demoCourse('KOM6373', 'SELASA', '02:00 PM', '05:00 PM'),
  ];

  it('round-trips through the QR and decompressTimetable', () => {
    const payload = compressTimetable(timetable, 'DEMO STUDENT', 'AI210042');
    const image = renderQr(payload, false, 'L');
    const code = jsQR(image.data, image.width, image.height, { inversionAttempts: 'attemptBoth' });

    expect(code?.data).toBe(payload);

    const restored = decompressTimetable(code!.data);
    expect(restored).not.toBeNull();
    expect(restored!.studentName).toBe('DEMO STUDENT');
    expect(restored!.studentId).toBe('AI210042');
    expect(restored!.timetable.map((c) => c.course_id)).toEqual(['RKS6093', 'KOM6373']);
  });

  it('the raw payload is not a URL (extractCompareData returns it as-is)', () => {
    const payload = compressTimetable(timetable, 'DEMO STUDENT', 'AI210042');
    expect(() => new URL(payload)).toThrow();
  });
});
