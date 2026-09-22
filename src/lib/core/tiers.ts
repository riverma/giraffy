// How needs carry a tier (met / partly / unmet), and how an area's colour is worked out (spec §5.16.2).
import type { DerivedMethod, Tier, TierRecord } from './types';
import type { Need } from '$lib/data/needs';

export const TIER_SEQ: (Tier | null)[] = [null, 'met', 'partly', 'unmet'];

export function tierDot(t: Tier | null | undefined): string {
  const dots: Record<Tier, string> = { met: 'var(--bodhi-500)', partly: 'var(--turmeric-500)', unmet: 'var(--clay-500)' };
  return t ? dots[t] : 'var(--neutral-400)';
}

export function tierLabel(t: Tier | null | undefined): string {
  const labels: Record<Tier, string> = { met: 'met', partly: 'partly met', unmet: 'unmet' };
  return t ? labels[t] : 'unexamined';
}

export function tierTitle(t: Tier): string {
  return t.charAt(0).toUpperCase() + t.slice(1);
}

/** The next tier in the tap cycle: unexamined → met → partly → unmet → unexamined. */
export function nextTier(cur: Tier | null): Tier | null {
  return TIER_SEQ[(TIER_SEQ.indexOf(cur) + 1) % TIER_SEQ.length];
}

export function tierRecord(tier: Tier, prev: TierRecord | undefined, at: string): TierRecord {
  return { tier, changed: at, was: prev?.tier ?? null };
}

export interface DerivedMethodDef {
  id: DerivedMethod;
  label: string;
  hint: string;
}

export const DERIVED_METHODS: DerivedMethodDef[] = [
  { id: 'worst', label: 'Most unmet', hint: 'the area takes the colour of its most unmet need' },
  { id: 'majority', label: 'Most common', hint: 'the colour most of its needs share; ties lean toward less met' },
  { id: 'average', label: 'Average', hint: 'met, partly and unmet averaged out and rounded' }
];

export type TierCounts = Record<Tier, number>;

export function deriveTier(counts: TierCounts, rated: number, method: DerivedMethod = 'majority'): Tier {
  if (method === 'worst') return counts.unmet ? 'unmet' : counts.partly ? 'partly' : 'met';
  if (method === 'average') {
    const avg = (counts.met + counts.partly * 2 + counts.unmet * 3) / rated;
    return avg < 1.5 ? 'met' : avg < 2.5 ? 'partly' : 'unmet';
  }
  return (['unmet', 'partly', 'met'] as Tier[]).reduce((a, b) => (counts[b] > counts[a] ? b : a));
}

export interface CatStats {
  leaves: Need[];
  counts: TierCounts;
  rated: number;
  total: number;
  derived: Tier | null;
  felt: Tier | null;
  tier: Tier | null;
}

/** How an area stands, counting only the needs shown in it: hidden ones sit this out. */
export function catStats(
  cat: string,
  leaves: Need[],
  needTiers: Record<string, TierRecord>,
  catTiers: Record<string, Tier>,
  method: DerivedMethod = 'majority'
): CatStats {
  const counts: TierCounts = { met: 0, partly: 0, unmet: 0 };
  let rated = 0;
  for (const n of leaves) {
    const t = needTiers[n.id]?.tier;
    if (t) { counts[t]++; rated++; }
  }
  const derived = rated ? deriveTier(counts, rated, method) : null;
  const felt = catTiers[cat] ?? null;
  return { leaves, counts, rated, total: leaves.length, derived, felt, tier: felt ?? derived };
}

export function pct(st: CatStats, k: Tier): string {
  return (st.rated ? Math.round((st.counts[k] / st.rated) * 100) : 0) + '%';
}

export interface ChipStyle {
  selected: boolean;
  dot: string;
  bg: string;
  color: string;
  shadow: string;
}

/** A chip that carries its tier: tinted when rated, inverted when selected. */
export function chipStyle(selected: boolean, tier: Tier | null | undefined): ChipStyle {
  const dot = tierDot(tier);
  if (selected) return { selected, dot, bg: 'var(--text-heading)', color: 'var(--text-inverse)', shadow: 'none' };
  if (tier) {
    return {
      selected, dot,
      bg: 'color-mix(in srgb, ' + dot + ' 16%, var(--surface-elevated))',
      color: 'var(--text-heading)',
      shadow: 'inset 0 0 0 1px color-mix(in srgb, ' + dot + ' 45%, transparent)'
    };
  }
  return { selected, dot, bg: 'var(--glass-overlay)', color: 'var(--text-heading)', shadow: 'inset 0 0 0 1px var(--border-subtle)' };
}
