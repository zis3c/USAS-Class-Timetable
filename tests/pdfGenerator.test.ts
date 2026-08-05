import { describe, expect, it } from 'vitest';
import { sanitizeDownloadFileName } from '../src/features/export/lib/pdfGenerator';

describe('pdf generator helpers', () => {
  it('sanitizes download filenames defensively', () => {
    expect(sanitizeDownloadFileName('Jadual USAS: AI/210042.pdf', 'fallback.pdf')).toBe('Jadual_USAS_AI_210042.pdf');
    expect(sanitizeDownloadFileName('__proto__', 'fallback.pdf')).toBe('proto');
    expect(sanitizeDownloadFileName('   ', 'fallback.pdf')).toBe('fallback.pdf');
  });
});
