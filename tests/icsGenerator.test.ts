import { describe, expect, it } from 'vitest';
import { escapeIcsText, sanitizeFileNameSegment } from '../src/features/export/lib/icsGenerator';

describe('ics generator helpers', () => {
  it('escapes calendar text fields', () => {
    expect(escapeIcsText('Room 1, Block A; Lab\\North\nLine 2')).toBe('Room 1\\, Block A\\; Lab\\\\North\\nLine 2');
  });

  it('sanitizes download names', () => {
    expect(sanitizeFileNameSegment('Aiman / 2026:Timetable*')).toBe('Aiman_2026_Timetable');
    expect(sanitizeFileNameSegment('__proto__')).toBe('proto');
  });
});
