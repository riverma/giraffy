// Feelings vocabulary (spec §5.3). Families are alphabetized; each carries a
// colour token for its dot. Words are UI conveniences, never a format limit.

export type FeelingHalf = 'unmet' | 'met';

export interface FeelingFamily {
  name: string;
  color: string;
  words: string[];
}

export const FEELINGS: Record<FeelingHalf, FeelingFamily[]> = {
  unmet: [
    { name: 'Angry', color: 'var(--clay-500)', words: ['annoyed', 'bitter', 'exasperated', 'furious', 'indignant', 'irate', 'irritated', 'resentful'] },
    { name: 'Confused', color: 'var(--monsoon-400)', words: ['ambivalent', 'baffled', 'hesitant', 'lost', 'perplexed', 'puzzled', 'torn'] },
    { name: 'Embarrassed', color: 'var(--turmeric-500)', words: ['ashamed', 'flustered', 'guilty', 'mortified', 'regretful', 'self-conscious'] },
    { name: 'Longing', color: 'var(--indigo-400)', words: ['envious', 'homesick', 'nostalgic', 'pining', 'yearning'] },
    { name: 'Sad', color: 'var(--monsoon-500)', words: ['disappointed', 'discouraged', 'gloomy', 'grieving', 'heavy-hearted', 'hopeless', 'hurt', 'lonely', 'wistful'] },
    { name: 'Scared', color: 'var(--peacock-500)', words: ['afraid', 'anxious', 'dread', 'insecure', 'mistrustful', 'panicked', 'terrified', 'wary', 'worried'] },
    { name: 'Tense', color: 'var(--saffron-500)', words: ['burnt out', 'edgy', 'frazzled', 'irritable', 'jittery', 'overwhelmed', 'restless', 'stressed'] },
    { name: 'Tired', color: 'var(--neutral-500)', words: ['depleted', 'drained', 'exhausted', 'listless', 'numb', 'weary'] }
  ],
  met: [
    { name: 'Glad', color: 'var(--turmeric-500)', words: ['delighted', 'ecstatic', 'elated', 'happy', 'joyful', 'pleased', 'tickled'] },
    { name: 'Grateful', color: 'var(--saffron-500)', words: ['appreciative', 'moved', 'thankful', 'touched'] },
    { name: 'Hopeful', color: 'var(--bodhi-400)', words: ['confident', 'encouraged', 'expectant', 'optimistic'] },
    { name: 'Interested', color: 'var(--peacock-500)', words: ['absorbed', 'curious', 'eager', 'enchanted', 'engaged', 'fascinated', 'inspired'] },
    { name: 'Loving', color: 'var(--clay-400)', words: ['affectionate', 'compassionate', 'friendly', 'open-hearted', 'tender', 'warm'] },
    { name: 'Peaceful', color: 'var(--monsoon-400)', words: ['at ease', 'calm', 'centered', 'content', 'fulfilled', 'relaxed', 'satisfied', 'serene'] },
    { name: 'Playful', color: 'var(--bodhi-500)', words: ['adventurous', 'alive', 'energetic', 'giddy', 'invigorated', 'refreshed'] },
    { name: 'Proud', color: 'var(--indigo-400)', words: ['accomplished', 'confident', 'empowered'] }
  ]
};

/** Faux feelings: thoughts about the other person dressed as feelings (§5.2). */
export const FAUX_FEELINGS: Record<string, string[]> = {
  abandoned: ['scared', 'hurt', 'lonely'], attacked: ['scared', 'angry'], betrayed: ['hurt', 'scared', 'angry'],
  blamed: ['scared', 'hurt'], criticized: ['hurt', 'anxious'], dismissed: ['hurt', 'frustrated', 'sad'],
  disrespected: ['hurt', 'angry'], ignored: ['hurt', 'lonely', 'sad'], insulted: ['hurt', 'angry'],
  judged: ['anxious', 'hurt'], manipulated: ['angry', 'wary'], misunderstood: ['frustrated', 'lonely'],
  neglected: ['lonely', 'sad'], pressured: ['anxious', 'overwhelmed', 'resentful'], rejected: ['hurt', 'sad', 'scared'],
  unappreciated: ['sad', 'discouraged', 'lonely'], unheard: ['frustrated', 'lonely'], unseen: ['sad', 'lonely']
};
