// Getting a card out as a file. The browser bits are stubbed, the same way the store's
// tests stub them: what matters is which path is taken and what gets written.
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

type Picked = { name: string; written: string };
let clicked: string[] = [];

beforeAll(() => {
  Object.defineProperty(globalThis, 'window', { value: {}, configurable: true, writable: true });
  Object.defineProperty(globalThis, 'document', {
    value: {
      body: { appendChild() {} },
      createElement: () => ({ href: '', download: '', click() { clicked.push(this.download); }, remove() {} })
    },
    configurable: true,
    writable: true
  });
  Object.defineProperty(URL, 'createObjectURL', { value: () => 'blob:card', configurable: true, writable: true });
  Object.defineProperty(URL, 'revokeObjectURL', { value: () => {}, configurable: true, writable: true });
});

const { canSaveFiles, saveFile } = await import('../../src/lib/share');

function fakePicker(onPick: (p: Picked) => void, refuse = false) {
  return async (opts: { suggestedName: string }) => {
    if (refuse) throw new Error('the person closed the dialog');
    let written = '';
    return {
      async createWritable() {
        return {
          async write(chunk: string) { written += chunk; },
          async close() { onPick({ name: opts.suggestedName, written }); }
        };
      }
    };
  };
}

const win = () => globalThis.window as unknown as Record<string, unknown>;

describe('saving a card as a file', () => {
  beforeEach(() => {
    delete win().showSaveFilePicker;
    clicked = [];
  });

  it('asks where to put it where the browser can', async () => {
    let got: Picked | null = null;
    win().showSaveFilePicker = fakePicker((p) => { got = p; });
    expect(canSaveFiles()).toBe(true);
    expect(await saveFile('maya-request-2026-07-07-abc123.gnvc.yaml', 'gnvc: "1.0"\n')).toBe(true);
    expect(got).toEqual({ name: 'maya-request-2026-07-07-abc123.gnvc.yaml', written: 'gnvc: "1.0"\n' });
    expect(clicked).toEqual([]);
  });

  it('says so when no place was chosen, rather than saving somewhere else', async () => {
    win().showSaveFilePicker = fakePicker(() => {}, true);
    expect(await saveFile('card.gnvc.yaml', 'gnvc: "1.0"\n')).toBe(false);
    expect(clicked).toEqual([]);
  });

  it('falls back to the browser download where there is no picker', async () => {
    expect(canSaveFiles()).toBe(false);
    expect(await saveFile('card.gnvc.yaml', 'gnvc: "1.0"\n')).toBe(true);
    expect(clicked).toEqual(['card.gnvc.yaml']);
  });
});
