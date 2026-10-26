/**
 * Display names for a research project's role and status, shared by the admin
 * table, the add/edit dialog, the public projects page and the exports, so the
 * four can never disagree.
 *
 * Roles are stored as lowercase keys in `partenaire`. Older rows also hold
 * 'beneficiary' and 'coordinator', which are no longer offered for new entries
 * but still display properly.
 *
 * The status is the project group's title ("ONGOING PROJECTS" ...), stored in
 * `title`.
 */

export const PROJECT_ROLES: { value: string; label: string }[] = [
  { value: 'lead',      label: 'Lead' },
  { value: 'partner',   label: 'Partner' },
  { value: 'associate', label: 'Associate Partner' },
  { value: 'principal', label: 'Principal Investigator' },
];

const LEGACY_ROLE_LABELS: Record<string, string> = {
  beneficiary: 'Beneficiary',
  coordinator: 'Coordinator',
};

export function roleLabel(value: string | null | undefined): string {
  if (!value) return '';
  const key = value.trim().toLowerCase();
  return PROJECT_ROLES.find(r => r.value === key)?.label ?? LEGACY_ROLE_LABELS[key] ?? value;
}

/** "SUBMITTED PROJECTS" -> "Submitted". */
export function statusLabel(groupTitle: string | null | undefined): string {
  const word = (groupTitle || '').replace(/\s*PROJECTS?\s*$/i, '').trim().toLowerCase();
  return word ? word.charAt(0).toUpperCase() + word.slice(1) : (groupTitle || '');
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

/**
 * A submission date ("2024-03-14") in every form a search might type it:
 * "2024-03-14 14 Mar 2024 14 March 2024".
 */
export function submissionDateText(date: string | null | undefined): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(date || '');
  if (!m) return date || '';
  const month = MONTHS[Number(m[2]) - 1] || '';
  const day = Number(m[3]);
  return `${m[0]} ${day} ${month.slice(0, 3)} ${m[1]} ${day} ${month} ${m[1]}`;
}

/**
 * A project date as "4 Apr 2024". Older rows only have a year for their start
 * and end, so `year` is shown as-is when there is no full date.
 */
export function projectDate(date: string | null | undefined, year?: number | string | null): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(date || '');
  if (m) return `${Number(m[3])} ${MONTHS[Number(m[2]) - 1].slice(0, 3)} ${m[1]}`;
  return year ? String(year) : '';
}

/**
 * Filter from app-date-filter: "YYYY-MM-DD" with "*" for any part left open
 * ("*-04-*" is April of any year). Each set part must match. A year-only
 * project matches on its year, but never on a month or day, which it lacks.
 * An empty filter matches everything.
 */
export function matchesDate(date: string | null | undefined, year: unknown, filter: unknown): boolean {
  if (filter === null || filter === undefined || filter === '') return true;
  const [fy, fm, fd] = String(filter).split('-');
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(date || '');
  const set = (p: string | undefined) => !!p && p !== '*';
  if (set(fy) && (m ? m[1] : String(year ?? '')) !== fy) return false;
  if (set(fm) && (!m || m[2] !== fm)) return false;
  if (set(fd) && (!m || m[3] !== fd)) return false;
  return true;
}

/** Rejected projects are listed publicly but left out of budget and year totals. */
export function isRejectedStatus(groupTitle: string | null | undefined): boolean {
  return /REJECTED/i.test(groupTitle || '');
}

/** Colour family per status: blue / green / amber / red, grey for anything else. */
export function statusTone(groupTitle: string | null | undefined): 'blue' | 'green' | 'amber' | 'red' | 'grey' {
  const t = (groupTitle || '').toUpperCase();
  if (t.includes('ONGOING')) return 'blue';
  if (t.includes('ACHIEVED')) return 'green';
  if (t.includes('SUBMITTED')) return 'amber';
  if (t.includes('REJECTED')) return 'red';
  return 'grey';
}
