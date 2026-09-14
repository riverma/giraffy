// Entangled cards form threads: chains reconstructed at render time from the plain id pointers (spec §5.11).
import type { Card } from './types';
import { matchNeed } from '$lib/data/needs';
import type { NeedMatch } from './cards';

export function threads(cards: Card[]): string[][] {
  const byId = new Map(cards.map((c) => [c.id, c]));
  const seen = new Set<string>();
  const out: string[][] = [];
  for (const c of cards) {
    if (!c.links.length || seen.has(c.id)) continue;
    const chain = [c.id];
    seen.add(c.id);
    let frontier = c.links.map((l) => l.id);
    while (frontier.length) {
      const nid = frontier.pop() as string;
      if (seen.has(nid)) continue;
      const nc = byId.get(nid);
      if (!nc) continue;
      seen.add(nid);
      chain.push(nid);
      frontier = frontier.concat(nc.links.map((l) => l.id));
    }
    if (chain.length > 1) out.push(chain);
  }
  return out;
}

export function threadFor(cards: Card[], id: string): string[] | undefined {
  return threads(cards).find((ch) => ch.includes(id));
}

export interface NeedPair {
  my: string;
  their: string;
}

/** Which of my needs meet which of theirs, from stored pairs or, failing that, by position. */
export function webPairs(chain: Card[]): NeedPair[] {
  const byId = new Map(chain.map((c) => [c.id, c]));
  const myNeeds = [...new Set(chain.filter((c) => c.mine).flatMap((c) => c.needs))];
  const theirNeeds = [...new Set(chain.filter((c) => !c.mine).flatMap((c) => c.needs))];
  const pairs: NeedPair[] = [];
  for (const c of chain) {
    for (const lk of c.links) {
      if (!lk.pairs) continue;
      const t = byId.get(lk.id);
      if (!t) continue;
      for (const [ti, mi] of lk.pairs) {
        const a = c.mine ? c.needs[mi] : t.needs[mi];
        const b = c.mine ? t.needs[ti] : c.needs[ti];
        if (a && b && !pairs.some((p) => p.my === a && p.their === b)) pairs.push({ my: a, their: b });
      }
    }
  }
  if (!pairs.length) {
    const n = Math.min(myNeeds.length, theirNeeds.length);
    for (let i = 0; i < n; i++) pairs.push({ my: myNeeds[i], their: theirNeeds[i] });
  }
  return pairs;
}

export interface RadialNode {
  label: string;
  dot: string;
  x: number;
  y: number;
  needId: string | null;
}
export interface RadialLine {
  x: number;
  y: number;
  w: number;
  a: number;
}

/** The radial needs web: my needs gather left, theirs right, every line meets in the middle. */
export function radialLayout(
  myNeeds: string[],
  theirNeeds: string[],
  myDot: (needId: string | null) => string,
  theirDot: string,
  match: NeedMatch = matchNeed,
  cx = 170,
  cy = 165,
  R = 118
): { nodes: RadialNode[]; lines: RadialLine[] } {
  const nodes: RadialNode[] = [];
  const lines: RadialLine[] = [];
  const place = (needs: string[], centerAngle: number, dot: (id: string | null) => string, link: boolean) => {
    const n = needs.length, gap = 44;
    needs.forEach((label, i) => {
      const a = centerAngle + (i - (n - 1) / 2) * gap;
      const rad = (a * Math.PI) / 180;
      const needId = link ? match(label) : null;
      nodes.push({ label, needId, dot: dot(needId), x: Math.round(cx + R * Math.cos(rad)), y: Math.round(cy + R * Math.sin(rad)) });
      const r0 = 52, r1 = R - 34;
      lines.push({ x: Math.round(cx + r0 * Math.cos(rad)), y: Math.round(cy + r0 * Math.sin(rad)), w: Math.round(r1 - r0), a: Math.round(a) });
    });
  };
  place(myNeeds, 180, myDot, true);
  place(theirNeeds, 0, () => theirDot, false);
  return { nodes, lines };
}
