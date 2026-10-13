/** Class-chime and PWA app-badge helpers (Web Audio + navigator.setAppBadge). */

let notificationAudioContext: AudioContext | undefined;

function getNotificationAudioContext(): AudioContext | undefined {
  try {
    const AudioCtx = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return undefined;
    notificationAudioContext ??= new AudioCtx();
    void notificationAudioContext.resume().catch(() => {});
    return notificationAudioContext;
  } catch {
    return undefined;
  }
}

export function playClassChime(): void {
  try {
    const ctx = getNotificationAudioContext();
    if (!ctx) return;

    // Campus chime: C5 -> E5 -> G5.
    const tones = [523.25, 659.25, 783.99];

    tones.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.15);

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

export function playPrayerChime(): void {
  try {
    const ctx = getNotificationAudioContext();
    if (!ctx) return;

    // Prayer tone: A3 -> D4 -> A4, deeper and softer.
    const tones = [220.00, 293.66, 440.00];

    tones.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.4);

      // Slower attack, longer decay for a calm feel.
      gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.4);
      gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + idx * 0.4 + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.4 + 1.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + idx * 0.4);
      osc.stop(ctx.currentTime + idx * 0.4 + 1.5);
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

export function sendPushNotification(title: string, body: string): void {
  updateAppBadge(1);

  if (!('Notification' in window)) return;

  if (Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        icon: '/usas-logo-dark.png',
        badge: '/usas-logo-dark.png',
      } satisfies NotificationOptions);
    } catch (e) {}
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        try {
          new Notification(title, {
            body,
            icon: '/usas-logo-dark.png',
            badge: '/usas-logo-dark.png',
          } satisfies NotificationOptions);
        } catch (e) {}
      }
    });
  }
}
