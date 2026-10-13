import { createChallenge } from 'altcha-lib';
import { deriveKey } from 'altcha-lib/algorithms/pbkdf2';

// PBKDF2/SHA-256 iterations. High enough to cost bots, fast enough for a login.
const COST = 5000;
const CHALLENGE_TTL_SECONDS = 600;

type PagesContext = {
  request: Request;
  env?: { ALTCHA_HMAC_KEY?: string };
};

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
    },
  });

export async function onRequest(context: PagesContext) {
  if (context.request.method !== 'GET') {
    return json({ error: 'Method not allowed' }, 405);
  }

  const secret = context.env?.ALTCHA_HMAC_KEY;
  if (!secret) {
    return json({ error: 'ALTCHA_HMAC_KEY not configured' }, 503);
  }

  const challenge = await createChallenge({
    algorithm: 'PBKDF2/SHA-256',
    cost: COST,
    deriveKey,
    hmacSignatureSecret: secret,
    expiresAt: Math.floor(Date.now() / 1000) + CHALLENGE_TTL_SECONDS,
  });

  return json(challenge, 200);
}
