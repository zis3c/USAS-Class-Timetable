import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearPendingCompareData,
  readPendingCompareData,
  savePendingCompareData,
} from '../src/features/sharing/lib/pendingCompare';

function createStorageMock() {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
    setItem: (key: string, value: string) => void store.set(key, String(value)),
    removeItem: (key: string) => void store.delete(key),
    clear: () => store.clear(),
  };
}

describe('pendingCompare', () => {
  beforeEach(() => {
    vi.stubGlobal('sessionStorage', createStorageMock());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('saves and reads a pending compare payload', () => {
    savePendingCompareData('payload-123');
    expect(readPendingCompareData()).toBe('payload-123');
  });

  it('clears a saved payload', () => {
    savePendingCompareData('payload-123');
    clearPendingCompareData();
    expect(readPendingCompareData()).toBeNull();
  });

  it('ignores empty payloads', () => {
    savePendingCompareData('');
    expect(readPendingCompareData()).toBeNull();
  });

  it('returns null when storage access throws', () => {
    vi.stubGlobal('sessionStorage', {
      getItem: () => { throw new Error('denied'); },
      setItem: () => { throw new Error('denied'); },
      removeItem: () => { throw new Error('denied'); },
    });
    expect(() => savePendingCompareData('x')).not.toThrow();
    expect(readPendingCompareData()).toBeNull();
    expect(() => clearPendingCompareData()).not.toThrow();
  });
});
