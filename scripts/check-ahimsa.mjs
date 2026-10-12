#!/usr/bin/env node
/* Does Giraffy still follow the Ahimsa Design System it vendors?
   A rule nobody checks is a preference. This is the mechanical half: it cannot say a screen
   is calm, but it can say the vendored stylesheet is untouched, nothing appears unasked, no
   component reaches past the semantic tokens, and every .ah-* class in the markup exists.

   The attention patterns are ported from ahimsa-design's tools/check-attention.mjs. */

import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join } from 'node:path';

const VENDORED = 'src/styles/ahimsa.css';
const EXT = new Set(['.svelte', '.ts', '.css', '.html']);
const fails = [];
const fail = (where, why, line) => fails.push(`${where}  ${why}${line ? '\n      ' + line.trim().slice(0, 110) : ''}`);

/* ---- 1. The vendored copy is the published copy ---- */
const sums = Object.fromEntries(
  readFileSync('src/styles/AHIMSA-CHECKSUMS', 'utf8').trim().split('\n').map((l) => l.trim().split(/\s+/).reverse())
);
const have = createHash('sha256').update(readFileSync(VENDORED)).digest('hex');
if (sums['ahimsa.css'] !== have) {
  fail(VENDORED, 'does not match AHIMSA-CHECKSUMS. Update it by copying a new release from ahimsa-design, not by editing it here.');
}

/* ---- 2. Walk the app's own source ---- */
function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name.startsWith('.')) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (EXT.has(extname(p)) && p !== VENDORED) out.push(p);
  }
  return out;
}
const files = [...walk('src'), 'index.html'];

/* Blank comments and quoted prose but keep line numbers, so a comment that explains why
   something is refused is not read as a use of it. */
function strip(src) {
  const blank = (m) => m.replace(/[^\n]/g, ' ');
  return src
    .replace(/<!--[\s\S]*?-->/g, blank)
    .replace(/\/\*[\s\S]*?\*\//g, blank)
    .replace(/(^|[^:'"\w])\/\/.*$/gm, '$1');
}

const ATTENTION = [
  [/(^|[^\w.])alert\s*\(/, 'alert()'],
  [/(^|[^\w.])confirm\s*\(\s*['"`]/, 'confirm()'],
  [/window\.prompt\s*\(/, 'prompt()'],
  [/addEventListener\s*\(\s*['"]beforeunload|onbeforeunload\s*=/, 'beforeunload'],
  [/new\s+Notification\s*\(|Notification\.requestPermission|\.pushManager\b/, 'notifications / push'],
  [/<[^>]*\saria-live\s*=\s*["']assertive/, 'aria-live="assertive"'],
  [/<[^>]*\srole\s*=\s*["']alert["']/, 'role="alert"'],
  [/<(video|audio|iframe)[^>]*\sautoplay/, 'autoplay'],
  [/<(?:input|textarea|button|select)\b[^>]*\sautofocus\b/, 'autofocus'],
  [/(^|[^\w.])setInterval\s*\(/, 'setInterval'],
  [/<meta[^>]*(maximum-scale|user-scalable\s*=\s*(no|0))/, 'a viewport that disables pinch zoom']
];

const CONFORM = [
  [/var\(--(saffron|turmeric|clay|bodhi|peacock|indigo|monsoon|neutral|periwinkle|amber|rose|terracotta|sage|violet|slate)-\d+\)/, 'a palette step. Components reference semantic tokens only.'],
  [/(^|[^-\w])c-(muted|faint)\b|color:\s*var\(--text-(muted|faint)\)/, '--text-muted / --text-faint are non-text tokens (about 3:1). Set type in --text-secondary.'],
  [/font-size:\s*[\d.]+px/, 'a px font size. Use the rem scale (--size-*) so a browser font setting still works.'],
  [/^(?!.*:focus-visible).*outline:\s*(none|0)\b/, 'suppressed focus. The system draws the ring.'],
  [/^(?!.*theme-color).*(^|[^\w&-])#[0-9a-fA-F]{3,8}\b/, 'a raw hex colour. Use a semantic token.'],
  [/\brgba?\(|\bhsla?\(/, 'a raw colour function. Use a semantic token.'],
  [/<(?!Sheet\b)[a-z][^>]*\stitle=["{]/, 'a title attribute: a hover tooltip, which is refused. Say it in text.'],
  [/role\s*=\s*["']button["']/, 'role="button" on something that is not a button. Use a real <button>.'],
  [/class="[^"]*(?<![\w-])(btn|pill|chip|card|sheet|scrim|toast|field)(?![\w-])|^\s*\.(btn|pill|chip|card|sheet|scrim|toast|field)\b[^-\w]/, 'an old unprefixed design-system class. Use the .ah-* one.'],
  [/--(?:gradient)-[a-z-]+\)/, 'a gradient used directly. Use .ah-surface--<name> so its ink comes with it.'],
  [/<img\b|<Icon\b|emoji/i, 'an image or an icon set. The system has neither; set a glyph in type.'],
  [/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u, 'an emoji or pictograph']
];

for (const f of files) {
  const raw = readFileSync(f, 'utf8');
  const lines = strip(raw).split('\n');
  const rawLines = raw.split('\n');
  /* index.html's boot fallback is deliberately hardcoded: it must hold if the stylesheet is
     the thing that failed to load. */
  const inBootFallback = (i) => f === 'index.html' && /boot-fallback|#app:not/.test(rawLines.slice(Math.max(0, i - 6), i + 1).join('\n'));
  lines.forEach((line, i) => {
    for (const [re, why] of ATTENTION) if (re.test(line)) fail(`${f}:${i + 1}`, 'appears unasked: ' + why, rawLines[i]);
    for (const [re, why] of CONFORM) {
      if (re.test(line) && !inBootFallback(i)) fail(`${f}:${i + 1}`, why, rawLines[i]);
    }
  });
}

/* ---- 3. Every .ah-* class in the markup exists ---- */
const css = readFileSync(VENDORED, 'utf8');
const known = new Set([...css.matchAll(/\.(ah-[a-z0-9_-]+)/g)].map((m) => m[1]));
for (const f of files.filter((x) => x.endsWith('.svelte') || x.endsWith('.html'))) {
  const raw = readFileSync(f, 'utf8');
  for (const m of raw.matchAll(/\b(ah-[a-z0-9_-]+)/g)) {
    if (!known.has(m[1])) fail(f, `.${m[1]} is not in the system. Anything not on the list does not exist.`);
  }
}

console.log(`scanned ${files.length} files`);
if (fails.length) {
  console.error(`\nFAIL — ${fails.length} departure(s) from Ahimsa:`);
  for (const f of [...new Set(fails)]) console.error('   ' + f);
  process.exit(1);
}
console.log('OK — vendored copy intact, nothing appears unasked, nothing reaches past the semantic tokens.');
