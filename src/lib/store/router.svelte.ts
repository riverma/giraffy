// A hash router. Tabs are roots; every push from a root is a step you can come back from.
// `#install` is the launcher's contract: open the install helper, then land on Needs.

export type Screen =
  | 'needs' | 'cards' | 'people' | 'settings' | 'card' | 'thread' | 'person' | 'need'
  | 'compose' | 'checkin' | 'import' | 'restore' | 'about' | 'onboarding';

export interface Route {
  screen: Screen;
  id: string | null;
  path: string;
}

export const TAB_ROOTS: Record<string, string> = { needs: '/needs', cards: '/cards', people: '/people', settings: '/settings' };

const SCREENS = new Set<string>(['needs', 'cards', 'people', 'settings', 'card', 'thread', 'person', 'need', 'compose', 'checkin', 'import', 'restore', 'about', 'onboarding']);

export function parsePath(path: string): Route {
  const clean = path.replace(/^#?\/?/, '');
  const [head, ...rest] = clean.split('/');
  const screen = (SCREENS.has(head) ? head : 'needs') as Screen;
  // a half-typed or truncated link can carry a stray %, and decodeURIComponent throws on it:
  // taking the raw text keeps a bad link from stopping the app from starting at all
  let id: string | null = null;
  if (rest.length) {
    const raw = rest.join('/');
    try { id = decodeURIComponent(raw); } catch { id = raw; }
  }
  return { screen, id, path: '/' + screen + (id ? '/' + encodeURIComponent(id) : '') };
}

class Router {
  route = $state<Route>(parsePath('/needs'));
  /** How many in-app steps sit under the current entry; 0 at a tab root. */
  depth = $state(0);
  /** Set once at startup when the launcher asked for the install helper. */
  installRequested = $state(false);
  private started = false;

  start(): void {
    if (this.started || typeof window === 'undefined') return;
    this.started = true;
    let hash = location.hash;
    if (hash === '#install') {
      this.installRequested = true;
      hash = '#/needs';
    }
    const r = parsePath(hash || '/needs');
    history.replaceState({ d: 0 }, '', '#' + r.path);
    this.route = r;
    this.depth = 0;
    window.addEventListener('popstate', () => {
      this.route = parsePath(location.hash || '/needs');
      const d = (history.state && typeof history.state.d === 'number') ? history.state.d : 0;
      this.depth = d;
    });
  }

  /** The tab a screen belongs to, for the tab bar highlight. */
  get tab(): string {
    const s = this.route.screen;
    if (s === 'card' || s === 'thread' || s === 'import' || s === 'compose') return 'cards';
    if (s === 'person') return 'people';
    if (s === 'about' || s === 'onboarding' || s === 'restore') return 'settings';
    if (s === 'need' || s === 'checkin') return 'needs';
    return s;
  }

  go(path: string): void {
    const r = parsePath(path);
    if (r.path === this.route.path) return;
    this.depth += 1;
    history.pushState({ d: this.depth }, '', '#' + r.path);
    this.route = r;
  }

  replace(path: string, depth = this.depth): void {
    const r = parsePath(path);
    this.depth = depth;
    history.replaceState({ d: depth }, '', '#' + r.path);
    this.route = r;
  }

  /** Switch tabs: a fresh root, no history to walk back through. */
  root(path: string): void {
    this.replace(path, 0);
  }

  /** One step back, or to a sensible root when there is nothing to go back to. */
  back(fallback = '/needs'): void {
    if (this.depth > 0) history.back();
    else this.root(fallback);
  }
}

export const router = new Router();
