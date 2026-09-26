const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** ISO-8601 UTC, whole seconds. */
export function now(): string {
  return new Date().toISOString().replace(/\.\d+Z$/, 'Z');
}

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/** "8 Jul", in local time. */
export function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.getDate() + ' ' + MONTHS[d.getMonth()];
}

/** "8 Jul · 9:05pm", in local time. */
export function fmtTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  let h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  const ap = h >= 12 ? 'pm' : 'am';
  h = h % 12 || 12;
  return fmtDate(iso) + ' · ' + h + ':' + m + ap;
}

export function uid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  // very old engines only: still unique enough for a device-local id
  let s = '';
  while (s.length < 32) s += Math.random().toString(16).slice(2);
  return s.slice(0, 8) + '-' + s.slice(8, 12) + '-4' + s.slice(13, 16) + '-a' + s.slice(17, 20) + '-' + s.slice(20, 32);
}
