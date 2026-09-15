// What each need means in the area it sits under (spec §5.5).
//
// Words recur across areas on purpose: "space" under Autonomy is not the "space" under
// Peace. A short gloss keeps that difference visible, so marking a need is a considered
// act rather than a guess at what the word meant here.
//
// Keyed by area name, then by the word exactly as it appears in NEED_CATEGORIES.
//
// Each word belongs to exactly one area. Where two areas once said the same thing twice,
// the vocabulary now says it once; `noRepeatedWords` in the tests holds that line.

import { needIdFor } from './needs';

const MEANINGS: Record<string, Record<string, string>> = {
  'Autonomy': {
    choice: 'having real options, and the room to pick between them',
    dignity: 'being treated as someone whose worth is not in question',
    freedom: 'acting without being controlled or pushed',
    independence: 'standing on your own, without needing permission',
    'self-direction': 'setting your own course, and your own pace',
    space: 'room of your own that nobody else has a claim on',
    spontaneity: 'acting on the moment, with no plan to answer to'
  },

  'Connection': {
    acceptance: 'being taken as you are by someone else',
    affection: 'warmth shown to you, in touch, words, or attention',
    alignment: 'your relationships matching what you actually value',
    appreciation: 'what you give being noticed and valued',
    attentiveness: 'someone fully here with you, not half elsewhere',
    belonging: 'being one of the people here, not a guest',
    care: 'someone tending to how you are',
    closeness: 'being near to someone in heart, not only in the room',
    communication: 'words going back and forth, and landing',
    communion: 'a togetherness that goes deeper than talking',
    community: 'a group you are part of and count on',
    companionship: 'someone alongside you in the ordinary hours',
    compassion: 'kindness meeting suffering, theirs or your own',
    consideration: 'your situation thought about before decisions are made',
    cooperation: 'working with someone rather than against them',
    empathy: 'your experience felt, not just heard',
    friendship: 'a bond chosen freely, on both sides',
    inclusion: 'being brought in rather than left out',
    inspiration: 'being lifted by someone or something outside you',
    intimacy: 'closeness where little is held back',
    love: 'being held in someone’s care, and holding them in yours',
    mutuality: 'giving and receiving running in both directions',
    nurturing: 'being helped to grow, or helping someone grow',
    partnership: 'sharing a life or a task as equals',
    resonance: 'your relationships vibrate at the same frequency as your values, there\'s a deep harmony',
    respect: 'your worth honoured, by others and by you',
    security: 'knowing this bond will hold',
    'shared reality': 'agreeing on what happened, or on what matters',
    stability: 'ground under the relationship that does not shift',
    support: 'someone at your back when you need it',
    'to be heard': 'your words taken in, not merely received',
    'to know and be known': 'the long, slow kind of knowing, both ways',
    'to see and be seen': 'being noticed as you actually are',
    trust: 'being able to rely on what someone says',
    understanding: 'your reasons making sense to someone',
    vulnerability: 'willingness to show your real self',
    warmth: 'kindness you can feel in the room'
  },

  'Honesty': {
    authenticity: 'living and speaking as who you really are',
    awareness: 'noticing what is happening, in you and around you',
    integrity: 'your actions matching what you say you value',
    'self-acceptance': 'being at peace with who you are',
    'self-connection': 'knowing what is going on inside you',
    transparency: 'nothing that matters kept hidden'
  },

  'Meaning': {
    celebration: 'marking what is good, and what was gained',
    challenge: 'something demanding enough to be worth doing',
    clarity: 'seeing a situation plainly',
    competence: 'being good at something that matters',
    contribution: 'your effort making a difference to someone',
    creativity: 'making something that was not there before',
    discovery: 'finding out something you did not know was there',
    effectiveness: 'your effort actually producing the result',
    efficiency: 'getting there without waste',
    growth: 'becoming more than you were',
    insight: 'making sense of how something works',
    integration: 'the parts of your life fitting together',
    intentional: 'living awake rather than on autopilot',
    learning: 'taking in something new',
    mattering: 'your existence counting to someone',
    mourning: 'grieving what was lost, and letting it mean something',
    participation: 'having a hand in what gets decided',
    perspective: 'seeing the shape of the whole, not only this moment',
    progress: 'getting closer to something you are after',
    purpose: 'a reason this is worth doing at all',
    'self-expression': 'making something that carries who you are',
    wholeness: 'living as one piece, so nothing you do contradicts what you value'
  },

  'Peace': {
    balance: 'no part of your life crowding out the rest',
    beauty: 'something worth looking at, listening to, or being near',
    contentment: 'making peace with what is, rather than fighting it',
    ease: 'doing what you do without strain',
    equanimity: 'staying steady while things move around you',
    faith: 'trust that things hold, whatever you place it in',
    harmony: 'parts fitting together without friction',
    hope: 'a future worth expecting',
    order: 'things where they belong, so you can think',
    'peace of mind': 'a mind that nothing is chasing',
    predictability: 'enough sameness to plan around',
    present: 'being fully here for yourself by yourself',
    transcendence: 'feeling part of something larger than yourself'
  },

  'Physical well-being': {
    air: 'air worth breathing',
    comfort: 'not being in pain or strain',
    food: 'enough to eat, and food that suits you',
    'movement / exercise': 'moving your body, and wanting to',
    'rest / sleep': 'real rest, and enough sleep',
    'safety (physical)': 'being out of harm’s way',
    'self-care': 'your body tended to when it needs it',
    'sexual expression': 'your sexuality having somewhere to go',
    shelter: 'somewhere to be that is yours to be in',
    touch: 'being touched, kindly and with consent',
    water: 'enough clean water'
  },

  'Play': {
    adventure: 'something unknown to walk into',
    excitement: 'a lift that quickens you',
    fun: 'doing a thing for no reason but the doing',
    humor: 'laughing, and having something to laugh about',
    joy: 'gladness with nothing asked of it',
    relaxation: 'letting go of effort for a while',
    stimulation: 'enough happening to feel lively'
  }
};

const BY_ID = new Map<string, string>();
for (const [cat, words] of Object.entries(MEANINGS)) {
  for (const [word, meaning] of Object.entries(words)) BY_ID.set(needIdFor(cat, word), meaning);
}

export function needMeaning(id: string | null | undefined): string {
  return (id && BY_ID.get(id)) || '';
}
