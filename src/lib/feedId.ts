/**
 * Deterministic id from feed URL so "seen" headlines and storage stay aligned across reloads.
 */
export function stableFeedId(url: string): string {
  const trimmed = url.trim();
  try {
    const normalized = new URL(trimmed).href;
    let h = 0;
    for (let i = 0; i < normalized.length; i++) {
      h = Math.imul(31, h) + normalized.charCodeAt(i) | 0;
    }
    return `feed_${(h >>> 0).toString(16)}_${normalized.length}`;
  } catch {
    let h = 0;
    for (let i = 0; i < trimmed.length; i++) {
      h = Math.imul(31, h) + trimmed.charCodeAt(i) | 0;
    }
    return `feed_raw_${(h >>> 0).toString(16)}_${trimmed.length}`;
  }
}
