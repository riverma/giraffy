// Day and Night are two aesthetics of one system, chosen by the person in Settings. Night is
// not a dark mode and is deliberately not wired to prefers-color-scheme: nothing here
// changes on its own.
export type Theme = 'day' | 'night';

const KEY = 'giraffy-theme';

/** The last choice, read synchronously so the first paint is already the right aesthetic.
 *  Prefs live in IndexedDB, which is asynchronous; this copy exists only to avoid a flash. */
export function storedTheme(): Theme {
  try { return localStorage.getItem(KEY) === 'night' ? 'night' : 'day'; } catch { return 'day'; }
}

export function applyTheme(t: Theme): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (!root) return;
  root.classList.remove('ahimsa-day', 'ahimsa-night');
  root.classList.add('ahimsa-' + t);
  // the browser bar takes the aesthetic's own flat canvas, read from the token rather than copied
  const bar = getComputedStyle(root).getPropertyValue('--surface-canvas-flat').trim();
  if (bar) document.querySelector('meta[name="theme-color"]')?.setAttribute('content', bar);
  document.querySelector('meta[name="color-scheme"]')?.setAttribute('content', t === 'night' ? 'dark' : 'light');
  try { localStorage.setItem(KEY, t); } catch { /* private window: the pref in IndexedDB still holds */ }
}
