/**
 * Audio Chime Notifier, Mobile Web Push & PWA Notification App Badge System for USAS Students
 * Generates a clean 3-tone campus chime (C5 -> E5 -> G5) using Web Audio API
 * Manages Mobile App Badge bubble numbers (navigator.setAppBadge)
 */

export function playClassChime(): void {
  try {
    const AudioCtx = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    // 3-tone campus chime sequence: C5 (523.25 Hz) -> E5 (659.25 Hz) -> G5 (783.99 Hz)
    const tones = [523.25, 659.25, 783.99];

    tones.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.15);

      // Volume envelope for smooth chime decay
      gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.15);
      gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + idx * 0.15 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.15 + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + idx * 0.15);
      osc.stop(ctx.currentTime + idx * 0.15 + 0.45);
    });
  } catch (e) {}
}

export function updateAppBadge(count = 1): void {
  try {
    const badgeNavigator = navigator as Navigator & {
      setAppBadge?: (count: number) => Promise<void>;
      clearAppBadge?: () => Promise<void>;
    };
    if ('setAppBadge' in navigator) {
      if (count > 0) {
        badgeNavigator.setAppBadge?.(count).catch(() => {});
      } else {
        badgeNavigator.clearAppBadge?.().catch(() => {});
      }
    }
  } catch (e) {}
}

export function clearAppBadge(): void {
  try {
    const badgeNavigator = navigator as Navigator & {
      clearAppBadge?: () => Promise<void>;
    };
    if ('clearAppBadge' in navigator) {
      badgeNavigator.clearAppBadge?.().catch(() => {});
    }
  } catch (e) {}
}

export function sendPushNotification(title: string, body: string): void {
  // Trigger mobile badge count bubble on device
  updateAppBadge(1);

  if (!('Notification' in window)) return;

  if (Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        icon: '/usas-logo.png',
        badge: '/usas-logo.png',
      } satisfies NotificationOptions);
    } catch (e) {}
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        try {
          new Notification(title, {
            body,
            icon: '/usas-logo.png',
            badge: '/usas-logo.png',
          } satisfies NotificationOptions);
        } catch (e) {}
      }
    });
  }
}
