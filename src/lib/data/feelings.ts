// Feelings vocabulary (spec §5.3). Families are alphabetized. Words are UI conveniences, never a format limit.

export type FeelingHalf = 'unmet' | 'met';

export interface FeelingFamily {
  name: string;
  words: string[];
}

export const FEELINGS: Record<FeelingHalf, FeelingFamily[]> = {
  unmet: [
    { name: 'Angry', words: ['annoyed', 'bitter', 'exasperated', 'furious', 'indignant', 'irate', 'irritated', 'resentful'] },
    { name: 'Confused', words: ['ambivalent', 'baffled', 'hesitant', 'lost', 'perplexed', 'puzzled', 'torn'] },
    { name: 'Embarrassed', words: ['ashamed', 'flustered', 'guilty', 'mortified', 'regretful', 'self-conscious'] },
    { name: 'Longing', words: ['envious', 'homesick', 'nostalgic', 'pining', 'yearning'] },
    { name: 'Sad', words: ['disappointed', 'discouraged', 'gloomy', 'grieving', 'heavy-hearted', 'hopeless', 'hurt', 'lonely', 'wistful'] },
    { name: 'Scared', words: ['afraid', 'anxious', 'dread', 'insecure', 'mistrustful', 'panicked', 'terrified', 'wary', 'worried'] },
    { name: 'Tense', words: ['burnt out', 'edgy', 'frazzled', 'irritable', 'jittery', 'overwhelmed', 'restless', 'stressed'] },
    { name: 'Tired', words: ['depleted', 'drained', 'exhausted', 'listless', 'numb', 'weary'] }
  ],
  met: [
    { name: 'Glad', words: ['delighted', 'ecstatic', 'elated', 'happy', 'joyful', 'pleased', 'tickled'] },
    { name: 'Grateful', words: ['appreciative', 'moved', 'thankful', 'touched'] },
    { name: 'Hopeful', words: ['confident', 'encouraged', 'expectant', 'optimistic'] },
    { name: 'Interested', words: ['absorbed', 'curious', 'eager', 'enchanted', 'engaged', 'fascinated', 'inspired'] },
    { name: 'Loving', words: ['affectionate', 'compassionate', 'friendly', 'open-hearted', 'tender', 'warm'] },
    { name: 'Peaceful', words: ['at ease', 'calm', 'centered', 'content', 'fulfilled', 'relaxed', 'satisfied', 'serene'] },
    { name: 'Playful', words: ['adventurous', 'alive', 'energetic', 'giddy', 'invigorated', 'refreshed'] },
    { name: 'Proud', words: ['accomplished', 'confident', 'empowered'] }
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
