// The published templates must themselves be valid gNVC 1.0 cards.
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { parseCard } from '../../src/lib/core/gnvc';

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
