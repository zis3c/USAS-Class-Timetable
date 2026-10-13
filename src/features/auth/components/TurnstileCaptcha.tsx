import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement | string,
        options: {
          sitekey: string;
          theme?: 'light' | 'dark' | 'auto';
          callback?: (token: string) => void;
          'expired-callback'?: () => void;
          'error-callback'?: () => void;
          'timeout-callback'?: () => void;
          size?: 'normal' | 'compact' | 'flexible';
          appearance?: 'always' | 'execute' | 'interaction-only';
          retry?: 'auto' | 'never';
          'refresh-expired'?: 'auto' | 'manual' | 'never';
        }
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
    onloadTurnstileCallback?: () => void;
  }
}

interface TurnstileCaptchaProps {
  onVerify: (token: string) => void;
  onExpire?: () => void;
  onError?: () => void;
  theme?: 'light' | 'dark' | 'auto';
  siteKey?: string;
  className?: string;
  size?: 'normal' | 'compact' | 'flexible';
  // 'always' keeps the widget visible; 'interaction-only' can leave users stuck
  // with a "complete the captcha" prompt when no widget renders.
  appearance?: 'always' | 'execute' | 'interaction-only';
}

export default function TurnstileCaptcha({
  onVerify,
  onExpire,
  onError,
  theme = 'auto',
  siteKey,
  className = '',
  size = 'flexible',
  appearance = 'always',
}: TurnstileCaptchaProps) {
  // Never fall back to Cloudflare's always-pass test key in production: a missing
  // site key must fail closed, not silently disable the check.
  const resolvedSiteKey = siteKey
    || import.meta.env.VITE_TURNSTILE_SITE_KEY
    || (import.meta.env.DEV ? '1x00000000000000000000AA' : '');
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const onVerifyRef = useRef(onVerify);
  const onExpireRef = useRef(onExpire);
  const onErrorRef = useRef(onError);
  // Theme fixed at mount; re-rendering on theme change would restart the challenge.
  const themeRef = useRef(theme);
  const [isScriptReady, setIsScriptReady] = useState(() => typeof window !== 'undefined' && !!window.turnstile);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (window.turnstile) {
      setIsScriptReady(true);
      return;
    }

    const scriptId = 'cloudflare-turnstile-script';
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        setIsScriptReady(true);
      };
      document.head.appendChild(script);
    } else {
      const checkInterval = setInterval(() => {
        if (window.turnstile) {
          setIsScriptReady(true);
          clearInterval(checkInterval);
        }
      }, 50);
      return () => clearInterval(checkInterval);
    }
  }, []);

  useEffect(() => { onVerifyRef.current = onVerify; }, [onVerify]);
  useEffect(() => { onExpireRef.current = onExpire; }, [onExpire]);
  useEffect(() => { onErrorRef.current = onError; }, [onError]);

  useEffect(() => {
    if (!isScriptReady || !containerRef.current || !window.turnstile) return;
    if (!resolvedSiteKey) {
      onErrorRef.current?.();
      return;
    }

    if (widgetIdRef.current) {
      try {
        window.turnstile.remove(widgetIdRef.current);
      } catch {
      }
      widgetIdRef.current = null;
    }

    try {
      const widgetId = window.turnstile.render(containerRef.current, {
        sitekey: resolvedSiteKey,
        theme: themeRef.current,
        size,
        appearance,
        retry: 'auto',
        'refresh-expired': 'auto',
        callback: (token: string) => {
          onVerifyRef.current(token);
        },
        'expired-callback': () => {
          onExpireRef.current?.();
        },
        'error-callback': () => {
          onErrorRef.current?.();
        },
      });
      widgetIdRef.current = widgetId;
    } catch (err) {
      console.warn('Turnstile render warning:', err);
    }

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
        }
        widgetIdRef.current = null;
      }
    };
  }, [isScriptReady, resolvedSiteKey, size, appearance]);

  return (
    <div className={`w-full flex items-center justify-center my-1.5 min-h-[65px] ${className || ''}`}>
      <div ref={containerRef} />
    </div>
  );
}
