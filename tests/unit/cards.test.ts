// Telling apart the three kinds of draft, which look alike until you ask who wrote them down.
import { describe, expect, it } from 'vitest';
import { drafterOf, isGuess, isTheirDraft, statusLabel } from '../../src/lib/core/cards';
import type { Card } from '../../src/lib/core/types';

/** Just the parts these questions are asked of. */
function draft(from: string, by: string): Pick<Card, 'from' | 'status' | 'history' | 'mine' | 'to'> {
  return { from, to: 'somebody', mine: false, status: 'draft', history: [{ state: 'draft', by, at: '2026-09-22T10:00:00Z' }] };
}

describe('a draft, seen from each side', () => {
  it('is a guess when someone other than its author wrote it down', () => {
    // Maya imagines Robin's card: it comes from Robin, but Maya drafted it
    const c = draft('Robin', 'Maya');
    expect(isGuess(c, 'Maya')).toBe(true);
    expect(isTheirDraft(c, 'Maya')).toBe(false);
    expect(statusLabel({ ...c, mine: false })).toBe("Still a guess, in Robin's words");
  });

  it('is simply their own draft once it reaches the person it is about', () => {
    // the same card, now on Robin's device: it is his to finish, not a guess about him
    const c = draft('Robin', 'Maya');
    expect(isGuess(c, 'Robin')).toBe(false);
    expect(isTheirDraft(c, 'Robin')).toBe(false);
  });

  it('is their draft, not a guess, when they wrote it in their own voice and shared it', () => {
    // Maya's own half-written card, sent to Robin to read: from and drafter are both Maya
    const c = draft('Maya', 'Maya');
    expect(isGuess(c, 'Robin')).toBe(false);
    expect(isTheirDraft(c, 'Robin')).toBe(true);
    expect(statusLabel({ ...c, mine: false })).toBe('Still a draft, shared by Maya');
  });

  it('is neither, on the device of the person writing it', () => {
    const c = draft('Maya', 'Maya');
    expect(isGuess(c, 'Maya')).toBe(false);
    expect(isTheirDraft(c, 'Maya')).toBe(false);
  });

  it('reads the drafter off the drafting entry, whatever came after it', () => {
    const c: Pick<Card, 'from' | 'status' | 'history'> = {
      from: 'Robin', status: 'draft',
      history: [
        { state: 'draft', by: 'Maya', at: '2026-09-22T10:00:00Z' },
        { state: 'ready', by: 'Robin', at: '2026-09-23T10:00:00Z' }
      ]
    };
    expect(drafterOf(c)).toBe('Maya');
  });

  it('is none of these once it is a finished card', () => {
    const c = { ...draft('Robin', 'Maya'), status: 'ready' as const };
    expect(isGuess(c, 'Maya')).toBe(false);
    expect(isTheirDraft(c, 'Maya')).toBe(false);
  });
});
