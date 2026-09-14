// Sample cards for the Import screen's "try one" loaders, and a seed data set for tests and the dev demo.
import type { AppData, Card, NeedPerson, TierRecord, Tier } from '$lib/core/types';

const HEAD = ['# A Giraffy card, written with care. Read it top to', '# bottom, or open it at https://giraffy.riverma.com', ''];

export function sampleNewYaml(owner: string): string {
  return [...HEAD, 'from: Noor', 'to: ' + owner,
    'about: "The gallery opening"', '',
    'summary: >', '  When I realised the show opens Friday and three pieces', "  still aren't framed, I felt anxious and a little overwhelmed,", '  because I need support and some ease before the opening.', '  Would you be willing to spend an hour on Thursday framing', '  them with me?', '',
    'observation: >', '  When I realised the show opens Friday and three pieces', "  still aren't framed.", '',
    'feelings:', '  - anxious', '  - overwhelmed', '', 'needs:', '  - support', '  - ease', '',
    'requests:', '  - Would you be willing to spend an hour on Thursday framing them with me?', '',
    'status: shared', 'status_history:', '  - { state: shared, by: Noor, at: 2026-07-11T09:14:00Z }', '',
    'entangled_with: []', '', '# ---- giraffy app-only details ----', 'kind: request', 'id: 7c2f8a10-5b3d-4e91-8a02-1f6c9d4e7b20', 'created: 2026-07-11T09:10:00Z', 'updated: 2026-07-11T09:14:00Z', 'gnvc: "1.0"  # spec: https://w3id.org/gnvc/1.0', ''].join('\n');
}

/** The seed dishes card (c1), coming back from Sam with a yes. */
export function sampleMergeYaml(owner: string): string {
  return ['# ...your dishes card, coming back from Sam...', '', 'from: ' + owner, 'to: Sam', 'about: "Last night\'s dinner dishes"', '',
    'summary: >', '  When I saw the dishes from last night still on the counter', '  this morning, I felt frustrated and a little discouraged,', '  because I need shared care for our home and reliability', '  around agreements. Would you be willing to wash your dishes', '  before bed tonight?', '',
    'observation: >', '  When I saw the dishes from last night still on the counter', '  this morning.', '',
    'feelings:', '  - frustrated', '  - discouraged', '', 'needs:', '  - shared care for our home', '  - reliability around agreements', '',
    'requests:', '  - Would you be willing to wash your dishes before bed tonight?', '',
    'status: yes', 'status_history:', '  - { state: ready, by: ' + owner + ', at: 2026-07-08T18:20:00Z }', '  - { state: shared, by: ' + owner + ', at: 2026-07-08T18:22:00Z }',
    '  - { state: heard, by: Sam, at: 2026-07-08T21:05:00Z }',
    '  - state: yes', '    by: Sam', '    at: 2026-07-10T09:05:00Z', '    note: >', '      Mornings-plan sits well with me. On my closing nights', "      I'll do them with coffee. I'd love to.", '',
    'entangled_with: []', '', 'kind: request', 'id: c1', 'created: 2026-07-08T18:04:00Z', 'updated: 2026-07-10T09:05:00Z', 'gnvc: "1.0"', ''].join('\n');
}

export function sampleEntangledYaml(owner: string): string {
  return ['# A Giraffy card, written with care.', '', 'from: Sam', 'to: ' + owner, 'about: "How we split the chores"', '',
    'summary: >', '  When we sat down to divide the chores last Sunday and I saw', '  how much had drifted onto your list, I felt uneasy and a', '  little defensive, because I need fairness and to contribute', '  my share. Would you be willing to rebuild the list together', '  this weekend?', '',
    'observation: >', '  When we divided the chores last Sunday and most items ended', '  up on your side of the page.', '',
    'feelings:', '  - uneasy', '  - defensive', '', 'needs:', '  - fairness', '  - to contribute', '',
    'requests:', '  - Would you be willing to rebuild the chore list together this weekend?', '',
    'status: shared', 'status_history:', '  - { state: shared, by: Sam, at: 2026-07-11T20:02:00Z }', '',
    '# this card names two of your cards as entangled:', 'entangled_with:', '  - id: c1   # your dishes request', '  - id: c6   # your phones-at-dinner request', '',
    'kind: request', 'id: 4e8b1c73-9a2f-4d60-b1e8-72c05f9a3d14', 'created: 2026-07-11T19:58:00Z', 'updated: 2026-07-11T20:02:00Z', 'gnvc: "1.0"', ''].join('\n');
}

export function seedCards(owner: string): Card[] {
  return [
    {
      id: 'c1', mine: true, kind: 'request', from: owner, to: 'Sam', about: "Last night's dinner dishes",
      observation: 'When I saw the dishes from last night still on the counter this morning.',
      feelings: ['frustrated', 'discouraged'],
      needs: ['shared care for our home', 'reliability around agreements'], needIds: ['connection/cooperation', 'connection/trust'],
      requests: ['Would you be willing to wash your dishes before bed tonight?'],
      summary: 'When I saw the dishes from last night still on the counter this morning, I felt frustrated and a little discouraged, because I need shared care for our home and reliability around agreements. Would you be willing to wash your dishes before bed tonight?',
      status: 'maybe', created: '2026-07-08T18:04:00Z', updated: '2026-07-08T21:40:00Z',
      history: [
        { state: 'ready', by: owner, at: '2026-07-08T18:20:00Z' },
        { state: 'shared', by: owner, at: '2026-07-08T18:22:00Z' },
        { state: 'heard', by: 'Sam', at: '2026-07-08T21:05:00Z', note: "It sounds like you're feeling frustrated and discouraged because you need shared care and reliability around agreements." },
        { state: 'maybe', by: 'Sam', at: '2026-07-08T21:40:00Z', note: "I really do want to help with this, and I'm hitting something on my side. Here's my card about it." }
      ],
      links: [{ id: 'c2', pairs: [[1, 0], [0, 1]] }]
    },
    {
      id: 'c2', mine: false, kind: 'request', from: 'Sam', to: owner, about: 'Evenings after closing shifts',
      observation: 'When I get home after closing the store at 10pm on weeknights.',
      feelings: ['exhausted', 'depleted'],
      needs: ['rest', 'ease in the evenings'],
      requests: ['Would you be willing to try dishes-in-the-morning on my closing nights?'],
      summary: "When I get home after closing the store at 10pm, I'm exhausted and depleted, because I need rest and some ease in my evenings. Would you be willing to try dishes-in-the-morning on my closing nights?",
      status: 'received', created: '2026-07-08T21:38:00Z', updated: '2026-07-08T21:40:00Z',
      history: [{ state: 'shared', by: 'Sam', at: '2026-07-08T21:40:00Z' }],
      links: [{ id: 'c1' }]
    },
    {
      id: 'c3', mine: true, kind: 'gratitude', from: owner, to: 'Priya', about: 'The ride home from the airport',
      observation: 'When you drove an hour on Sunday night to pick me up at the airport.',
      feelings: ['grateful', 'moved'],
      needs: ['support', 'ease'],
      requests: [],
      summary: 'When you drove an hour on Sunday night to pick me up at the airport, I felt grateful and genuinely moved, because it met my need for support and ease at the end of a long trip. Thank you.',
      status: 'celebrated', created: '2026-07-06T09:12:00Z', updated: '2026-07-07T08:30:00Z',
      history: [
        { state: 'ready', by: owner, at: '2026-07-06T09:20:00Z' },
        { state: 'shared', by: owner, at: '2026-07-06T09:21:00Z' },
        { state: 'celebrated', by: 'Priya', at: '2026-07-07T08:30:00Z', note: 'This landed so warmly. Any time.' }
      ],
      links: []
    },
    {
      id: 'c4', mine: true, kind: 'request', from: owner, to: 'Myself', about: 'A hard Tuesday',
      observation: 'When I worked through lunch for the third day this week.',
      feelings: ['depleted', 'overwhelmed'],
      needs: ['rest', 'space'],
      requests: ['Would I be willing to block one quiet hour on Wednesday afternoon?'],
      summary: 'When I worked through lunch for the third day this week, I felt depleted and overwhelmed, because I need rest and a little space that belongs only to me. Would I be willing to block one quiet hour on Wednesday afternoon?',
      status: 'ready', created: '2026-07-07T20:15:00Z', updated: '2026-07-07T20:31:00Z',
      history: [{ state: 'ready', by: owner, at: '2026-07-07T20:31:00Z' }],
      links: []
    },
    {
      id: 'c5', mine: false, kind: 'request', from: 'Dad', to: owner, about: 'Sunday phone calls',
      observation: 'When our last two Sunday calls ended after ten minutes.',
      feelings: ['wistful', 'lonely'],
      needs: ['closeness', 'to be known'],
      requests: ['Would you be willing to set aside a full half hour this Sunday?'],
      summary: 'When our last two Sunday calls ended after ten minutes, I felt wistful and a little lonely, because I need closeness and to be known by you as your life changes. Would you be willing to set aside a full half hour this Sunday?',
      status: 'received', created: '2026-07-09T15:02:00Z', updated: '2026-07-09T15:04:00Z',
      history: [{ state: 'shared', by: 'Dad', at: '2026-07-09T15:04:00Z' }],
      links: []
    },
    {
      id: 'c6', mine: true, kind: 'request', from: owner, to: 'Sam', about: 'Phones at dinner',
      observation: 'When we both had our phones out during dinner on Thursday.',
      feelings: ['lonely', 'wistful'],
      needs: ['connection', 'presence'],
      requests: ['Would you be willing to leave our phones in the other room during dinner this week?'],
      summary: 'When we both had our phones out during dinner on Thursday, I felt lonely and a little wistful, because I need connection and real presence with you. Would you be willing to leave our phones in the other room during dinner this week?',
      status: 'given', created: '2026-06-28T19:40:00Z', updated: '2026-07-03T19:10:00Z',
      history: [
        { state: 'ready', by: owner, at: '2026-06-28T19:55:00Z' },
        { state: 'shared', by: owner, at: '2026-06-28T19:56:00Z' },
        { state: 'yes', by: 'Sam', at: '2026-06-29T08:15:00Z', note: "I'd love this too." },
        { state: 'given', by: 'Sam', at: '2026-07-03T19:10:00Z' }
      ],
      links: []
    }
  ];
}

export function seedTiers(): Record<string, TierRecord> {
  const T = (id: string, tier: Tier, changed: string, was?: Tier): [string, TierRecord] => [id, { tier, changed, was: was ?? null }];
  return Object.fromEntries([
    T('autonomy/choice', 'met', '2026-07-02T08:10:00Z'), T('autonomy/dignity', 'met', '2026-07-02T08:10:00Z'),
    T('autonomy/freedom', 'partly', '2026-07-02T08:11:00Z'), T('autonomy/independence', 'met', '2026-07-02T08:11:00Z'),
    T('autonomy/self-direction', 'partly', '2026-07-02T08:11:00Z'), T('meaning/self-expression', 'partly', '2026-07-02T08:12:00Z'),
    T('autonomy/space', 'unmet', '2026-07-09T22:04:00Z', 'partly'), T('autonomy/spontaneity', 'partly', '2026-07-02T08:12:00Z'),
    T('connection/appreciation', 'partly', '2026-07-02T08:14:00Z'), T('connection/belonging', 'met', '2026-07-02T08:14:00Z'),
    T('connection/care', 'partly', '2026-07-02T08:14:00Z'), T('connection/closeness', 'unmet', '2026-07-06T19:30:00Z', 'partly'),
    T('connection/communication', 'unmet', '2026-07-08T18:00:00Z'), T('connection/community', 'partly', '2026-07-02T08:15:00Z'),
    T('connection/companionship', 'met', '2026-07-02T08:15:00Z'), T('connection/cooperation', 'partly', '2026-07-08T18:01:00Z', 'unmet'),
    T('connection/empathy', 'met', '2026-07-02T08:15:00Z'), T('connection/love', 'met', '2026-07-02T08:15:00Z'),
    T('connection/attentiveness', 'unmet', '2026-07-05T20:40:00Z'), T('connection/support', 'met', '2026-07-04T10:20:00Z', 'partly'),
    T('connection/to-be-heard', 'partly', '2026-07-02T08:16:00Z'), T('connection/trust', 'met', '2026-07-02T08:16:00Z'),
    T('connection/understanding', 'partly', '2026-07-02T08:16:00Z'), T('connection/warmth', 'met', '2026-07-02T08:16:00Z'),
    T('honesty/authenticity', 'met', '2026-07-02T08:17:00Z'), T('honesty/transparency', 'partly', '2026-07-02T08:17:00Z'),
    T('meaning/contribution', 'met', '2026-07-02T08:18:00Z'), T('meaning/creativity', 'partly', '2026-07-02T08:18:00Z'),
    T('meaning/growth', 'met', '2026-07-02T08:18:00Z'), T('meaning/learning', 'met', '2026-07-02T08:18:00Z'),
    T('meaning/purpose', 'partly', '2026-07-02T08:19:00Z'),
    T('peace/beauty', 'met', '2026-07-02T08:20:00Z'), T('peace/ease', 'partly', '2026-07-04T10:21:00Z', 'unmet'),
    T('peace/harmony', 'partly', '2026-07-02T08:20:00Z'), T('peace/order', 'unmet', '2026-07-08T18:02:00Z'),
    T('peace/peace-of-mind', 'partly', '2026-07-02T08:20:00Z'),
    T('physical-well-being/food', 'met', '2026-07-02T08:21:00Z'), T('physical-well-being/movement-exercise', 'partly', '2026-07-02T08:21:00Z'),
    T('physical-well-being/rest-sleep', 'unmet', '2026-07-09T22:03:00Z', 'partly'), T('physical-well-being/safety', 'met', '2026-07-02T08:21:00Z'),
    T('physical-well-being/shelter', 'met', '2026-07-02T08:21:00Z'), T('physical-well-being/touch', 'partly', '2026-07-02T08:22:00Z'),
    T('play/adventure', 'unmet', '2026-07-02T08:23:00Z'), T('play/fun', 'unmet', '2026-07-02T08:23:00Z'),
    T('play/humor', 'met', '2026-07-02T08:23:00Z'), T('play/joy', 'partly', '2026-07-02T08:23:00Z'),
    T('play/relaxation', 'unmet', '2026-07-09T22:05:00Z')
  ]);
}

export function seedNeedPeople(): NeedPerson[] {
  const N = (needId: string, personId: string, created: string): NeedPerson => ({ needId, personId, created });
  return [
    N('connection/closeness', 'dad', '2026-07-06T19:31:00Z'), N('connection/closeness', 'self', '2026-07-06T19:31:00Z'),
    N('connection/communication', 'sam', '2026-07-08T18:03:00Z'),
    N('physical-well-being/rest-sleep', 'sam', '2026-07-09T22:06:00Z'),
    N('peace/ease', 'self', '2026-07-04T10:22:00Z'),
    N('play/fun', 'sam', '2026-07-02T08:24:00Z'), N('play/relaxation', 'self', '2026-07-09T22:06:00Z'),
    N('play/adventure', 'priya', '2026-07-02T08:24:00Z')
  ];
}

export function seedData(owner = 'Maya'): AppData {
  return {
    owner, coaching: true, preamble: true, derivedMethod: 'majority', filter: 'all', sort: 'updated',
    people: [{ id: 'self', name: 'Myself' }, { id: 'sam', name: 'Sam' }, { id: 'priya', name: 'Priya' }, { id: 'dad', name: 'Dad' }],
    cards: seedCards(owner),
    needTiers: seedTiers(),
    catTiers: {},
    needPeople: seedNeedPeople(),
    needNotes: { 'play/relaxation': 'Sunday mornings with no plan at all.' },
    customAreas: [],
    customNeeds: [],
    hiddenNeeds: []
  };
}
