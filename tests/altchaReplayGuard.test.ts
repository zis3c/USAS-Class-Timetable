import { afterEach, describe, expect, it, vi } from 'vitest';
import { AltchaReplayGuard } from '../cloudflare/altcha-replay-guard/src/index.js';

class MemoryStorage {
  values = new Map<string, number>();
  alarmAt: number | null = null;

  async transaction<T>(run: (storage: this) => Promise<T>) {
    return run(this);
  }

  async get(key: string) {
    return this.values.get(key);
  }

  async put(key: string, value: number) {
    this.values.set(key, value);
  }

  async getAlarm() {
    return this.alarmAt;
  }

  async setAlarm(at: number) {
    this.alarmAt = at;
  }

  async list({ prefix }: { prefix: string }) {
    return new Map([...this.values].filter(([key]) => key.startsWith(prefix)));
  }

  async delete(key: string) {
    return this.values.delete(key);
  }
}

afterEach(() => vi.restoreAllMocks());

describe('ALTCHA replay guard', () => {
  it('accepts a signed challenge once, rejects replay, then expires it', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(1_000);
    const storage = new MemoryStorage();
    const guard = new AltchaReplayGuard({ storage });
    const request = () => new Request('https://guard/claim', {
      method: 'POST',
      body: JSON.stringify({ signature: 'signed-challenge' }),
    });

    expect(await (await guard.fetch(request())).json()).toEqual({ accepted: true });
    expect(await (await guard.fetch(request())).json()).toEqual({ accepted: false });

    vi.spyOn(Date, 'now').mockReturnValue(601_001);
    await guard.alarm();
    expect(storage.values.size).toBe(0);
  });
});
