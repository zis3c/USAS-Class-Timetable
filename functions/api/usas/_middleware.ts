const API_ORIGIN = 'https://mobile.usas.edu.my/umc_v2';

function buildUpstreamUrl(request: Request): string {
  const url = new URL(request.url);
  const upstreamPath = url.pathname.replace(/^\/api\/usas/, '');
  const cleanPath = upstreamPath.startsWith('/') ? upstreamPath : `/${upstreamPath}`;
  return `${API_ORIGIN}${cleanPath}${url.search}`;
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

export async function onRequest(context: any) {
  const upstreamUrl = buildUpstreamUrl(context.request);
  const upstreamRequest = new Request(upstreamUrl, context.request);

  try {
    const upstreamResponse = await fetch(upstreamRequest);
    if (upstreamResponse.ok || !wantsHtml(context.request)) {
      const response = new Response(upstreamResponse.body, upstreamResponse);
      response.headers.set('Cache-Control', 'no-store');
      response.headers.set('X-Content-Type-Options', 'nosniff');
      response.headers.set('Referrer-Policy', 'no-referrer');
      return response;
    }

    if (upstreamResponse.status === 502 || upstreamResponse.status === 504) {
      return buildErrorPage(context.request, upstreamResponse.status);
    }

    if (upstreamResponse.status >= 500) {
      return buildErrorPage(context.request, 500);
    }

    return buildErrorPage(context.request, 503);
  } catch {
    if (wantsHtml(context.request)) {
      return buildErrorPage(context.request, 503);
    }

    return new Response(JSON.stringify({
      success: false,
      error: 'Upstream service unavailable.',
    }), {
      status: 503,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store',
        'x-content-type-options': 'nosniff',
      },
    });
  }
}
