/**
 * Accent- and case-insensitive text matching for search bars,
 * so "BECHIR", "bechir" and "Béchir" all match each other.
 */
export function normalizeSearch(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

export function matchesSearch(value: unknown, term: unknown): boolean {
  const needle = normalizeSearch(term);
  if (!needle) return true;
  return normalizeSearch(value).includes(needle);
}
