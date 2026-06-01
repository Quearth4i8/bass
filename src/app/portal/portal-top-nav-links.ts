/** Shared flat links for public portal top navigation (home + inner pages). */
export interface PortalTopNavLink {
  path: string;
  label: string;
}

export const PORTAL_TOP_NAV_LINKS: PortalTopNavLink[] = [
  { path: 'home', label: 'Home' },
  { path: 'scientific-merit', label: 'Scientific merit' },
  { path: 'objectives', label: 'Objectives' },
  { path: 'partners', label: 'Partners' },
  { path: 'funders',   label: 'Funders' },
  { path: 'team', label: 'Team' },
  { path: 'events', label: 'Events' },
  { path: 'participants', label: 'Participants' },
  { path: 'gallery', label: 'Gallery' },
  { path: 'outputs', label: 'Outputs' },
];
