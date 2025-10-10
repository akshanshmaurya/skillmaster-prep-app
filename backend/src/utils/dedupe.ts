// Utilities for deduplicating questions by id and normalized text

export function normalizeText(input?: string): string {
  return (input || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^\w\s]/g, "")
    .trim();
}

// Stricter normalizer for prompts: strips numbering, code fences, punctuation, collapses whitespace, lowercases
export function normalizePromptText(input?: string): string {
  return (input ?? "")
    .toString()
    .toLowerCase()
    // strip fenced code blocks
    .replace(/```[\s\S]*?```/g, " ")
    // strip inline code
    .replace(/`[^`]*`/g, " ")
    // drop leading labels like "Q1:", "Question 2 -"
    .replace(/\b(question|q)\s*[:#.-]?\s*\d+\b/gi, " ")
    // remove punctuation
    .replace(/[^\w\s]/g, " ")
    // collapse whitespace
    .replace(/\s+/g, " ")
    .trim();
}

export function questionHashFromText(text?: string): string | null {
  const t = normalizeText(text);
  if (!t) return null;
  let h = 0;
  for (let i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) | 0;
  return String(h);
}

export function dedupeByIdAndText<T>(
  items: T[],
  getId: (item: T) => string | undefined,
  getText: (item: T) => string | undefined,
  opts?: { seenIds?: Iterable<string> }
): T[] {
  const out: T[] = [];
  const idSet = new Set<string>(opts?.seenIds ?? []);
  const textSet = new Set<string>();

  for (const item of items) {
    const id = (getId(item) || "").toString();
    const textKey = normalizeText(getText(item));

    if (id && idSet.has(id)) continue;
    if (textKey && textSet.has(textKey)) continue;

    out.push(item);
    if (id) idSet.add(id);
    if (textKey) textSet.add(textKey);
  }
  return out;
}

// 3-gram Jaccard similarity helper for near-duplicate text detection
function ngrams3(text: string): Set<string> {
  const s = `  ${text}  `;
  const set = new Set<string>();
  for (let i = 0; i < s.length - 2; i++) set.add(s.slice(i, i + 3));
  return set;
}

export function isNearDuplicate(a?: string, b?: string, threshold = 0.88): boolean {
  const A = ngrams3(normalizeText(a));
  const B = ngrams3(normalizeText(b));
  const inter = [...A].filter((x) => B.has(x)).length;
  const union = A.size + B.size - inter;
  const jaccard = union ? inter / union : 0;
  return jaccard >= threshold;
}

export function dedupeByIdAndNearText<T>(
  items: T[],
  getId: (item: T) => string | undefined,
  getText: (item: T) => string | undefined,
  opts?: { seenIds?: Iterable<string>; nearThreshold?: number }
): T[] {
  const out: T[] = [];
  const idSet = new Set<string>(opts?.seenIds ?? []);
  const textSet = new Set<string>();
  const near = opts?.nearThreshold ?? 0.88;

  for (const item of items) {
    const id = (getId(item) || "").toString();
    const rawText = getText(item) || "";
    const textKey = normalizeText(rawText);

    if (id && idSet.has(id)) continue;
    if (textKey && textSet.has(textKey)) continue;
    if (out.some((x) => isNearDuplicate(getText(x), rawText, near))) continue;

    out.push(item);
    if (id) idSet.add(id);
    if (textKey) textSet.add(textKey);
  }
  return out;
}

// --- Performance-optimized greedy dedupe for prompts ---

function makeTrigramSet(text: string): Set<string> {
  const s = text.length < 3 ? text.padEnd(3, ' ') : text;
  const set = new Set<string>();
  for (let i = 0; i <= s.length - 3; i++) set.add(s.slice(i, i + 3));
  return set;
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  let inter = 0;
  const [small, large] = a.size < b.size ? [a, b] : [b, a];
  for (const g of small) if (large.has(g)) inter++;
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}

export type FastPromptDedupeOptions = {
  nearThreshold?: number; // default 0.85
  limit?: number; // stop when reached
};

export function fastPromptDedupe<T>(
  items: T[],
  getPrompt: (t: T) => string,
  opts: FastPromptDedupeOptions = {}
): T[] {
  const near = opts.nearThreshold ?? 0.85;
  const limit = opts.limit ?? Number.MAX_SAFE_INTEGER;

  const seenExact = new Set<string>();
  const accepted: T[] = [];
  const meta: Array<{ grams: Set<string>; len: number }> = [];

  for (const item of items) {
    const norm = normalizePromptText(getPrompt(item));
    if (!norm) continue;
    if (seenExact.has(norm)) continue; // exact normalized dup
    const grams = makeTrigramSet(norm);
    const len = norm.length;

    // Fast length gate: skip compare if lengths differ too much (saves time)
    let isNear = false;
    for (let i = 0; i < meta.length; i++) {
      const other = meta[i];
      const maxLen = Math.max(len, other.len) || 1;
      const lenDiff = Math.abs(len - other.len) / maxLen;
      if (lenDiff > 0.4) continue; // unlikely near-dup, skip expensive check
      const sim = jaccard(grams, other.grams);
      if (sim >= near) {
        isNear = true;
        break;
      }
    }
    if (isNear) continue;

    seenExact.add(norm);
    accepted.push(item);
    meta.push({ grams, len });
    if (accepted.length >= limit) break; // early stop
  }

  return accepted;
}
