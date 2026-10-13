import { getUsasProxyPath, isAllowedUsasMethod } from '../../../src/shared/lib/usasProxy';
import { verifySolution, type Challenge, type Solution } from 'altcha-lib';
import { deriveKey } from 'altcha-lib/algorithms/pbkdf2';

const API_ORIGIN = 'https://mobile.usas.edu.my/umc_v2';
const LOGIN_PATH = '/student/login_student.php';
const MAX_BODY_BYTES = 64 * 1024;
// Client-supplied network/proxy headers are dropped before forwarding so they
// cannot spoof the upstream caller identity.
const STRIPPED_UPSTREAM_HEADERS = [
  'x-altcha',
  'cf-connecting-ip',
  'cf-connecting-ipv6',
  'cf-ipcountry',
  'cf-ray',
  'x-forwarded-for',
  'x-forwarded-proto',
  'x-forwarded-host',
  'x-real-ip',
  'forwarded',
];

type PagesContext = {
  request: Request;
  env?: { ALTCHA_HMAC_KEY?: string };
};

function buildUpstreamUrl(request: Request): string | null {
  const url = new URL(request.url);
  const cleanPath = getUsasProxyPath(url.pathname);
  if (!cleanPath) return null;
  return `${API_ORIGIN}${cleanPath}${url.search}`;
}

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
    },
  });
}

async function buildErrorPage(request: Request, status: 500 | 502 | 503 | 504): Promise<Response> {
  const pageUrl = new URL(`/${status}.html`, request.url);
  const pageResponse = await fetch(pageUrl);
  const html = await pageResponse.text();
  return new Response(html, {
    status,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
      'referrer-policy': 'no-referrer',
    },
  });
}

function wantsHtml(request: Request): boolean {
  const accept = request.headers.get('accept') || '';
  return accept.includes('text/html');
}

export async function onRequest(context: PagesContext) {
  if (!isAllowedUsasMethod(context.request.method)) {
    return jsonResponse({ success: false, error: 'Method not allowed.' }, 405);
  }

  const url = new URL(context.request.url);
  const cleanPath = getUsasProxyPath(url.pathname);
  if (!cleanPath) {
    return jsonResponse({ success: false, error: 'Not found.' }, 404);
  }

  if (Number(context.request.headers.get('content-length') || '0') > MAX_BODY_BYTES) {
    return jsonResponse({ success: false, error: 'Payload too large.' }, 413);
  }

  // Verify the ALTCHA proof-of-work on login before proxying upstream.
  if (cleanPath === LOGIN_PATH) {
    const secret = context.env?.ALTCHA_HMAC_KEY;
    if (secret) {
      let verified: boolean;
      try {
        const token = context.request.headers.get('x-altcha') || '';
        const decoded = JSON.parse(atob(token)) as { challenge: Challenge; solution: Solution };
        const result = await verifySolution({
          challenge: decoded.challenge,
          solution: decoded.solution,
          deriveKey,
          hmacSignatureSecret: secret,
        });
        verified = result.verified === true;
      } catch {
        verified = false;
      }
      if (!verified) {
        return jsonResponse({ success: false, error: 'Pengesahan keselamatan gagal. Sila cuba lagi.' }, 403);
      }
    }
  }

  const upstreamUrl = buildUpstreamUrl(context.request);
  if (!upstreamUrl) {
    return jsonResponse({ success: false, error: 'Not found.' }, 404);
  }

  const upstreamRequest = new Request(upstreamUrl, context.request);
  for (const header of STRIPPED_UPSTREAM_HEADERS) {
    upstreamRequest.headers.delete(header);
  }

  try {
    const upstreamResponse = await fetch(upstreamRequest);
    if (upstreamResponse.ok || !wantsHtml(context.request)) {
      if (upstreamResponse.status >= 500) {
        console.warn('usas-proxy upstream error', { path: cleanPath, status: upstreamResponse.status });
      }
      const response = new Response(upstreamResponse.body, upstreamResponse);
      response.headers.set('Cache-Control', 'no-store');
      response.headers.set('X-Content-Type-Options', 'nosniff');
      response.headers.set('Referrer-Policy', 'no-referrer');
      return response;
    }

    if (upstreamResponse.status === 502 || upstreamResponse.status === 504) {
      console.warn('usas-proxy upstream gateway error', { path: cleanPath, status: upstreamResponse.status });
      return buildErrorPage(context.request, upstreamResponse.status);
    }

    if (upstreamResponse.status >= 500) {
      console.warn('usas-proxy upstream server error', { path: cleanPath, status: upstreamResponse.status });
      return buildErrorPage(context.request, 500);
    }

    return buildErrorPage(context.request, 503);
  } catch {
    console.warn('usas-proxy upstream unavailable', { path: cleanPath });
    if (wantsHtml(context.request)) {
      return buildErrorPage(context.request, 503);
    }

    return jsonResponse({ success: false, error: 'Upstream service unavailable.' }, 503);
  }
}
