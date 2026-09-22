import { describe, expect, test } from 'vitest';
import { coach, RULES } from '$lib/core/rules';
import { FAUX_FEELINGS } from '$lib/data/feelings';

describe('coaching rules', () => {
  test('every word-list rule fires on each of its words and names it', () => {
    for (const [group, rules] of Object.entries(RULES)) {
      for (const r of rules) {
        if (!r.words) continue;
        for (const w of r.words) {
          const out = coach(group as keyof typeof RULES, 'well ' + w + ' then');
          expect(out.map((n) => n.word), group + ':' + r.id + ':' + w).toContain(w);
        }
      }
    }
  });

  test('observation: generalizations, evaluations, and intent', () => {
    expect(coach('observation', 'You always leave the kitchen a mess').map((n) => n.key))
      .toEqual(['observation:gen:always', 'observation:eval:mess']);
    expect(coach('observation', 'When you dismissed me')[0].key).toBe('observation:intent:dismissed');
    expect(coach('observation', 'When I saw the dishes on the counter')).toEqual([]);
  });

  test('feelings: "you" and "I feel that" are thoughts, not feelings', () => {
    expect(coach('feelings', 'I feel that you ignored me').map((n) => n.key)).toEqual(['feelings:you', 'feelings:feelthat']);
    expect(coach('feelings', 'lonely')).toEqual([]);
  });

  test('needs: strategies and other people', () => {
    expect(coach('needs', 'I need you to call').map((n) => n.key)).toEqual(['needs:strategy', 'needs:other']);
    expect(coach('needs', 'connection')).toEqual([]);
  });

  test('request: demands, vagueness, negative starts', () => {
    expect(coach('request', 'You should try harder')[0].key).toBe('request:demand:should');
    expect(coach('request', 'Would you be willing to try harder?')[0].key).toBe('request:vague:try harder');
    expect(coach('request', "Don't leave the dishes")[0].key).toBe('request:neg');
    expect(coach('request', 'Would you be willing to wash the dishes tonight?')).toEqual([]);
  });

  test('word boundaries: "must" does not fire on "mustard"; phrases with apostrophes match', () => {
    expect(coach('request', 'pass the mustard')).toEqual([]);
    expect(coach('request', "if you don't, well")[0].word).toBe("if you don't");
  });

  test('dismissed keys are skipped and at most three nudges show', () => {
    expect(coach('observation', 'always a mess, dismissed', { 'observation:gen:always': true }).map((n) => n.key))
      .toEqual(['observation:eval:mess', 'observation:intent:dismissed']);
    expect(coach('observation', '').length).toBe(0);
    for (const [group, rules] of Object.entries(RULES)) expect(rules.length, group).toBeLessThanOrEqual(3);
  });

  test('faux feelings map to real ones', () => {
    expect(FAUX_FEELINGS.abandoned).toEqual(['scared', 'hurt', 'lonely']);
    expect(Object.keys(FAUX_FEELINGS).length).toBe(18);
  });
});
