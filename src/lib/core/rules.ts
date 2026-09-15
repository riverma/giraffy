// Coaching rules (spec §5.1, §5.16.8): gentle nudges, never blocking. Data-driven so each rule is unit-testable.

export type RuleGroup = 'observation' | 'feelings' | 'needs' | 'request';

export interface Rule {
  id: string;
  /** Any of these words or phrases, matched on word boundaries. */
  words?: string[];
  /** Or one regular expression (case-insensitive). */
  regex?: string;
  /** The thing named in the nudge when a regex matched. */
  word?: string;
  msg: string;
}

export const RULES: Record<RuleGroup, Rule[]> = {
  observation: [
    { id: 'gen', words: ['again', 'all the time', 'always', 'constantly', 'every time', 'never'], msg: 'generalizations invite argument. Can you name one specific time?' },
    { id: 'eval', words: ['careless', 'cold', 'crazy', 'distant', 'disrespectful', 'dramatic', 'inconsiderate', 'irresponsible', 'lazy', 'manipulative', 'mess', 'messy', 'needy', 'ridiculous', 'rude', 'selfish', 'thoughtless', 'toxic', 'unfair'], msg: 'this is an evaluation. What did you actually see or hear?' },
    { id: 'intent', words: ['avoided me', 'deliberately', "didn't care", 'dismissed', "doesn't care", 'ignored', 'on purpose', 'refused to'], msg: 'this describes what you believe their intent was. What did you actually see or hear?' }
  ],
  feelings: [
    { id: 'you', regex: '\\byou\\b', word: 'you', msg: "this step is only about what's alive in you. The other person doesn't appear here." },
    { id: 'feelthat', regex: '\\bi feel (that|like|as if)\\b', word: 'I feel that…', msg: 'this usually introduces a thought, not a feeling. What is the emotion underneath?' }
  ],
  needs: [
    { id: 'strategy', regex: '\\bi need (you|him|her|them)\\b', word: 'I need you to…', msg: 'that is a strategy, one way to meet a need. What is the deeper need it would serve?' },
    { id: 'other', regex: '\\b(you|he|she|they|him|her|them)\\b', word: 'the other person', msg: 'needs are universal and belong to you alone. No other person appears in them.' }
  ],
  request: [
    { id: 'demand', words: ['demand', 'expect you to', 'have to', "if you don't", 'insist', 'must', 'need you to', 'or else', 'require', 'should', "you'd better"], msg: "this may land as a demand. Try 'Would you be willing to…?'" },
    { id: 'vague', words: ['be better', 'be more respectful', 'change your attitude', 'stop being', 'try harder'], msg: 'requests work best when concrete and doable. What specific action would help?' },
    { id: 'neg', regex: "^\\s*(don't|dont|quit|stop)\\b", word: 'a negative start', msg: 'asking for what you do want is easier to say yes to than what you don’t.' }
  ]
};

export interface Nudge {
  /** Dismissal key: `group:rule:word` for word lists, `group:rule` for regexes. */
  key: string;
  word: string;
  msg: string;
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Up to three nudges for a piece of text, skipping any the writer has dismissed. */
export function coach(group: RuleGroup, text: string, dismissed: Record<string, boolean> = {}): Nudge[] {
  if (!text) return [];
  const out: Nudge[] = [];
  const low = text.toLowerCase();
  for (const r of RULES[group]) {
    if (r.words) {
      for (const w of r.words) {
        if (new RegExp('\\b' + escapeRe(w) + '\\b', 'i').test(low)) {
          const key = group + ':' + r.id + ':' + w;
          if (!dismissed[key]) out.push({ key, word: w, msg: r.msg });
          break;
        }
      }
    } else if (r.regex && new RegExp(r.regex, 'i').test(low)) {
      const key = group + ':' + r.id;
      if (!dismissed[key]) out.push({ key, word: r.word ?? r.id, msg: r.msg });
    }
  }
  return out.slice(0, 3);
}
