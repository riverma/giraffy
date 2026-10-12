// Installing to the home screen, as something the person asks for in Settings.
// The browser fires `beforeinstallprompt` on its own schedule, so it is caught here at
// startup and held until the person presses Install. Nothing is shown because of it.
type InstallEvent = Event & { prompt: () => Promise<void> };

class Install {
  private deferred = $state<InstallEvent | null>(null);
  installed = $state(false);
  readonly ios = typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent);

  get standalone(): boolean {
    return typeof window !== 'undefined' && (window.matchMedia('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true);
  }
  get canPrompt(): boolean { return !!this.deferred; }

  listen(): void {
    if (typeof window === 'undefined') return;
    window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); this.deferred = e as InstallEvent; });
    window.addEventListener('appinstalled', () => { this.installed = true; this.deferred = null; });
  }

  async prompt(): Promise<void> {
    if (!this.deferred) return;
    const d = this.deferred;
    this.deferred = null;
    await d.prompt();
  }
}

export const install = new Install();
