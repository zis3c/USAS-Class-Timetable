const CHALLENGE_TTL_MS = 10 * 60 * 1000;

export class AltchaReplayGuard {
  constructor(state) {
    this.state = state;
  }

  async fetch(request) {
    if (request.method !== 'POST' || new URL(request.url).pathname !== '/claim') {
      return new Response('Not found', { status: 404 });
    }

    let signature;
    try {
      ({ signature } = await request.json());
    } catch {
      return Response.json({ accepted: false }, { status: 400 });
    }
    if (typeof signature !== 'string' || signature.length > 256) {
      return Response.json({ accepted: false }, { status: 400 });
    }

    const key = `challenge:${signature}`;
    const expiresAt = Date.now() + CHALLENGE_TTL_MS;
    const accepted = await this.state.storage.transaction(async (storage) => {
      if (await storage.get(key)) return false;
      await storage.put(key, expiresAt);
      return true;
    });

    if (accepted) {
      const alarm = await this.state.storage.getAlarm();
      if (alarm === null || expiresAt < alarm) await this.state.storage.setAlarm(expiresAt);
    }
    return Response.json({ accepted });
  }

  async alarm() {
    const now = Date.now();
    const entries = await this.state.storage.list({ prefix: 'challenge:' });
    let nextExpiry = Infinity;
    for (const [key, expiresAt] of entries) {
      if (expiresAt <= now) await this.state.storage.delete(key);
      else nextExpiry = Math.min(nextExpiry, expiresAt);
    }
    if (Number.isFinite(nextExpiry)) await this.state.storage.setAlarm(nextExpiry);
  }
}

export default {
  fetch() {
    return new Response('Not found', { status: 404 });
  },
};
