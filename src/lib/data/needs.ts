// Needs vocabulary (spec §5.4). A need's identity is (category, word), expressed as a
// slug id, so the order here is presentation only: alphabetical within each category,
// which implies no preference between one need and another.

export interface NeedCategory {
  name: string;
  words: string[];
}

export const NEED_CATEGORIES: NeedCategory[] = [
  { name: 'Autonomy', words: ['choice', 'dignity', 'freedom', 'independence', 'self-direction', 'space', 'spontaneity'] },
  { name: 'Connection', words: ['acceptance', 'affection', 'alignment', 'appreciation', 'attentiveness', 'belonging', 'care', 'closeness', 'communication', 'communion', 'community', 'companionship', 'compassion', 'consideration', 'cooperation', 'empathy', 'friendship', 'inclusion', 'inspiration', 'intimacy', 'love', 'mutuality', 'nurturing', 'partnership', 'resonance', 'respect', 'security', 'shared reality', 'stability', 'support', 'to be heard', 'to know and be known', 'to see and be seen', 'trust', 'understanding', 'vulnerability', 'warmth'] },
  { name: 'Honesty', words: ['authenticity', 'awareness', 'integrity', 'self-acceptance', 'self-connection', 'transparency'] },
  { name: 'Meaning', words: ['celebration', 'challenge', 'clarity', 'competence', 'contribution', 'creativity', 'discovery', 'effectiveness', 'efficiency', 'growth', 'insight', 'integration', 'intentional', 'learning', 'mattering', 'mourning', 'participation', 'perspective', 'progress', 'purpose', 'self-expression', 'wholeness'] },
  { name: 'Peace', words: ['balance', 'beauty', 'contentment', 'ease', 'equanimity', 'faith', 'harmony', 'hope', 'order', 'peace of mind', 'predictability', 'present', 'transcendence'] },
  { name: 'Physical well-being', words: ['air', 'comfort', 'food', 'movement / exercise', 'rest / sleep', 'safety (physical)', 'self-care', 'sexual expression', 'shelter', 'touch', 'water'] },
  { name: 'Play', words: ['adventure', 'excitement', 'fun', 'humor', 'joy', 'relaxation', 'stimulation'] }
];

export interface Need {
  id: string;
  category: string;
  word: string;
  /** Added by the person using the app, rather than shipped in the list above. */
  custom?: true;
  /** Only customs carry their meaning here; shipped ones have it in need-meanings.ts. */
  meaning?: string;
}

export function slug(s: string): string {
  return String(s).toLowerCase().replace(/\(.*?\)/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export function needIdFor(category: string, word: string): string {
  return slug(category) + '/' + slug(word);
}

export const ALL_NEEDS: Need[] = NEED_CATEGORIES.flatMap((c) =>
  c.words.map((word) => ({ id: needIdFor(c.name, word), category: c.name, word }))
);

const BY_ID = new Map(ALL_NEEDS.map((n) => [n.id, n]));

export function needById(id: string | null | undefined): Need | undefined {
  return id ? BY_ID.get(id) : undefined;
}

/** Exact, case-insensitive match against a word or any of its "a / b" halves. Nothing invented. */
export function matchNeed(word: string | null | undefined): string | null {
  const w = String(word ?? '').trim().toLowerCase();
  if (!w) return null;
  const hit = ALL_NEEDS.find((n) =>
    [n.word.toLowerCase(), ...n.word.replace(/\(.*?\)/g, '').split('/').map((a) => a.trim().toLowerCase())].includes(w)
  );
  return hit ? hit.id : null;
}

/** Myself first, then A to Z. */
export function SELF_NAME_SORT(a: { name: string }, b: { name: string }): number {
  return a.name === 'Myself' ? -1 : b.name === 'Myself' ? 1 : a.name.localeCompare(b.name);
}
