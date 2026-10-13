import { getUsasProxyPath, isAllowedUsasMethod } from '../../../src/shared/lib/usasProxy';

const API_ORIGIN = 'https://mobile.usas.edu.my/umc_v2';
const LOGIN_PATH = '/student/login_student.php';
const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

type PagesContext = {
  request: Request;
  env?: { TURNSTILE_SECRET_KEY?: string };
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

async function verifyTurnstileToken(token: string, secret: string, ip?: string): Promise<{ ok: boolean; codes?: string[] }> {
  if (!token) return { ok: false, codes: ['missing-input-response'] };
  try {
    const form = new FormData();
    form.append('secret', secret);
    form.append('response', token);
    if (ip) form.append('remoteip', ip);

    const res = await fetch(TURNSTILE_VERIFY_URL, { method: 'POST', body: form });
    if (!res.ok) return { ok: false, codes: [`http-${res.status}`] };

    const data = (await res.json()) as { success?: boolean; 'error-codes'?: string[] };
    return {
      ok: data?.success === true,
      codes: Array.isArray(data?.['error-codes']) ? data['error-codes'] : [],
    };
  } catch {
    return { ok: false, codes: ['verification-request-failed'] };
  }
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

  const ip = context.request.headers.get('cf-connecting-ip') || 'unknown';

  // Verify Turnstile on login before proxying upstream; skipped when the secret is unset (local dev).
  if (cleanPath === LOGIN_PATH) {
    const secret = context.env?.TURNSTILE_SECRET_KEY;
    if (secret) {
      const token = context.request.headers.get('x-turnstile-token') || '';
      const verification = await verifyTurnstileToken(token, secret, ip === 'unknown' ? undefined : ip);
      if (!verification.ok) {
        console.warn('usas-proxy captcha rejected', {
          ip,
          path: cleanPath,
          codes: verification.codes,
          hostname: url.hostname,
        });
        return jsonResponse(
          {
            success: false,
            error: 'Pengesahan captcha gagal. Sila cuba lagi.',
            'error-codes': verification.codes,
          },
          403,
        );
      }
    }
  }

  const upstreamUrl = buildUpstreamUrl(context.request);
  if (!upstreamUrl) {
    return jsonResponse({ success: false, error: 'Not found.' }, 404);
  }

  // Never forward the one-time captcha token upstream.
  const upstreamRequest = new Request(upstreamUrl, context.request);
  upstreamRequest.headers.delete('x-turnstile-token');

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
