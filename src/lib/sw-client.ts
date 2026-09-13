// Registers the service worker in production builds and surfaces "a new version is ready".
import { app } from '$lib/store/app.svelte';

export function registerServiceWorker(): void {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register(import.meta.env.BASE_URL + 'sw.js');
      const watch = (w: ServiceWorker | null) => {
        if (!w) return;
        w.addEventListener('statechange', () => {
          if (w.state === 'installed' && navigator.serviceWorker.controller) app.updateReady = true;
        });
      };
      watch(reg.installing);
      reg.addEventListener('updatefound', () => watch(reg.installing));
    } catch (e) {
      console.warn('service worker registration failed', e);
    }
  });
}
