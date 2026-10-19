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
