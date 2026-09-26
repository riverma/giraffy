// The published templates must themselves be valid gNVC 1.0 cards.
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { parseCard } from '../../src/lib/core/gnvc';
import { synthesize } from '../../src/lib/core/synthesize';

describe('spec templates', () => {
  it.each([
    ['spec/templates/request.gnvc.yaml', 'request', 1],
    ['spec/templates/gratitude.gnvc.yaml', 'gratitude', 0]
  ])('%s parses and validates', (file, kind, requests) => {
    const { card } = parseCard(readFileSync(file, 'utf8'), 'Your name');
    expect(card.kind).toBe(kind);
    expect(card.requests).toHaveLength(requests);
    expect(card.needs.length).toBeGreaterThan(0);
    expect(card.history).toHaveLength(1);
  });
});

describe('the sentence, while parts of it are still missing', () => {
  it('does not put a full stop against the ellipsis standing in for a need', () => {
    const s = synthesize({ kind: 'request', observation: 'the rota went up', feelings: ['weary'], needs: [], request: '' });
    expect(s).toContain('because I need …');
    expect(s).not.toContain('….');
    expect(s).not.toMatch(/\.\.\./);
  });

  it('reads as a whole sentence once every part is there', () => {
    const s = synthesize({ kind: 'request', observation: 'the rota went up', feelings: ['weary'], needs: ['rest'], request: 'Would you ask first?' });
    expect(s).toBe('When the rota went up, I felt weary, because I need rest. Would you ask first?');
  });

  it('keeps the thanks on a gratitude card with parts missing', () => {
    const s = synthesize({ kind: 'gratitude', observation: '', feelings: [], needs: [] });
    expect(s).toContain('Thank you.');
    expect(s).not.toContain('….');
  });
});
