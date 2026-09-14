// The composer's last step: the four parts assembled into one sentence (spec §5.1).
import type { Kind } from './types';

export interface SynthInput {
  kind: Kind;
  observation: string;
  feelings: string[];
  needs: string[];
  request?: string;
}

export function listWords(xs: string[]): string {
  return xs.length <= 1 ? xs.join('') : xs.slice(0, -1).join(', ') + ' and ' + xs[xs.length - 1];
}

export function synthesize(d: SynthInput): string {
  const feel = d.feelings.length ? listWords(d.feelings) : '…';
  const need = d.needs.length ? listWords(d.needs) : '…';
  let obs = (d.observation || '…').trim().replace(/\.$/, '');
  obs = obs.charAt(0).toLowerCase() + obs.slice(1);
  if (/^when /i.test(obs)) obs = obs.slice(5);
  if (d.kind === 'gratitude') return 'When ' + obs + ', I felt ' + feel + ', because it met my need for ' + need + '. Thank you.';
  return ('When ' + obs + ', I felt ' + feel + ', because I need ' + need + '. ' + (d.request ?? '').trim()).trim();
}
